"""
Pip's voice: everything that talks to the LLM lives here.

Pip PLAYS A CHARACTER inside the story (set by "pip_role" in the story file, e.g. the waiter at the
restaurant; a single scene can override it, e.g. Pip as one of the customers). Pip speaks in first person
and the child is Pip's helper: together they figure out what the other characters really mean.

Pip's jobs (from the tutors' feedback):
  1. Storyteller  - introduces the story and links the scenes ("Oh look, another table needs me!")
  2. Explainer    - after the answer, says what the customer really meant and what Pip does now
  3. Motivator    - thanks the child, encourages, gives clues; never says "wrong" or "mistake"

What Pip does NOT do: decide if an answer is correct. The story JSON says which option is correct and
routers/story.py checks it in code. The LLM only gets the correct answer when it may explain it.

How we keep a small model on track:
  - instructions are short plain sentences, not code
  - every job comes with one full example conversation from a DIFFERENT story (the toy shop),
    so the model copies the style but not the content
  - check_speech() throws away answers that invent dialogue, give the answer away or are too long;
    the model gets one more try, then Pip uses a prepared sentence

The LLM runs locally in Ollama (https://ollama.com). If Ollama is not running, every function returns
a prepared sentence instead, so the game never freezes.

Settings (environment variables / .env):
    OLLAMA_HOST       default http://localhost:11434 (in Docker: http://ollama:11434)
    LLM_MODEL         default qwen2.5:3b (fast enough on a MacBook Air)
    LLM_THINK         optional "false" for models that "think" before answering (e.g. Qwen) -> faster
    LLM_TIMEOUT       seconds to wait for the model, default 60
"""

import json
import os
import re

from ollama import Client
from pydantic import BaseModel

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:3b")
LLM_THINK = os.getenv("LLM_THINK")            # None = don't send the option at all
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "60"))

LANGUAGES = {"en": "English", "it": "Italian"}

_client = Client(host=OLLAMA_HOST, timeout=LLM_TIMEOUT)


class PipSays(BaseModel):
    """The only thing the LLM is allowed to return."""
    speech: str


def system_prompt(lang: str, pip_name: str, role: str) -> str:
    return f"""You are {pip_name}. In this story you are {role}. You talk to a child aged 6 to 10 who is your helper.
You always speak as {pip_name} in first person ("I", "me", "my"). You never speak as another character.
The other characters sometimes say things in an indirect way, and the child helps you understand what they really want.

Rules:
- Speak {LANGUAGES[lang]} only.
- Short, simple, warm sentences for a small child. Respect the maximum number of sentences.
- Never invent words for other characters. Never use quotation marks.
- Never describe anyone solving the problem, unless you are told what you do now.
- Never say "wrong", "mistake", "incorrect" or "bad".
- Only talk about the story. No emojis. Your words are read aloud.
Answer with JSON: {{"speech": "what you say"}}"""


# ---------- one example conversation per job, from a different story (the toy shop) ----------
EXAMPLES = {
    "intro": (
        "Start the story. Greet the child, say who you are, and ask the child to be your helper today. "
        "Then say what you see. End by saying we should listen to what the customer says to you. Maximum 4 sentences.\n"
        "Place: the toy shop\nWhat you see: Anna is standing next to the teddy bears and looking at the price.\nCustomer: Anna",
        "Hi friend, I'm Pip and today I work in the toy shop! Will you be my helper? "
        "Look, Anna is standing next to the teddy bears and looking at the price. Let's listen to what she says to me.",
    ),
    "next": (
        "Continue the story. Thank your helper for the last help, then notice someone new who needs you. "
        "Say what you see. End by saying we should listen to what the customer says to you. Maximum 3 sentences.\n"
        "What happened before: Pip wrapped the teddy bear and Anna went home happy.\n"
        "What you see now: A boy is standing at the puzzle shelf. The puzzle box is too high for him.\nCustomer: Leo",
        "Thanks to you, Anna went home with her teddy bear! Oh, look, Leo is standing at the puzzle shelf "
        "and the box is very high. Let's listen to what he says to me.",
    ),
    "correct": (
        "Your helper gave you the right idea. Talk to your helper with \"you\". Thank them happily, say what the customer really meant, "
        "and say what you do now. Maximum 3 sentences.\n"
        "Customer: Anna\nAnna said to you: This teddy bear is so soft.\n"
        "You did your helper's idea, and then: Anna smiles.\n"
        "What Anna really meant: I would like to buy this teddy bear.\n"
        "What you do now: Pip wraps the teddy bear for Anna.",
        "Yes, thank you, helper! Anna wasn't only talking about how soft it is, she wanted to buy the teddy bear. "
        "I'm wrapping it for her right now!",
    ),
    "retry": (
        "Your helper's idea does not fit yet. You already did it and saw how the customer reacted. "
        "Talk to your helper with \"you\": notice the customer's reaction kindly, then ask ONE simple question "
        "about what the customer really wants. Do not give the answer. Maximum 2 sentences.\n"
        "Customer: Anna\nAnna said to you: This teddy bear is so soft.\n"
        "You did your helper's idea, and then: Anna looks sad.\n"
        "Your helper's idea: Pip puts the teddy bear back on the shelf.",
        "Oh, Anna looks sad now. Why do you think she told me the teddy bear is so soft? What could she want?",
    ),
    "hint": (
        "Your helper tried again and it still does not fit. Talk to your helper with \"you\". Encourage them and give the clue in your own words. "
        "Do not give the answer. Maximum 2 sentences.\n"
        "Customer: Anna\nAnna said to you: This teddy bear is so soft.\n"
        "You did your helper's idea, and then: Anna looks confused.\nClue: Anna keeps hugging the teddy bear.",
        "You're thinking so hard, thank you! Here's a clue: Anna keeps hugging the teddy bear, what could she want?",
    ),
    "reveal": (
        "Your helper tried many times. Talk to your helper with \"you\". Say kindly that we figured it out together, say what the customer really meant "
        "and what you do now, and thank them for trying so hard. Maximum 3 sentences.\n"
        "Customer: Anna\nAnna said to you: This teddy bear is so soft.\n"
        "You did your helper's idea, and then: Anna looks confused.\n"
        "What Anna really meant: I would like to buy this teddy bear.\nWhat you do now: Pip wraps the teddy bear for Anna.",
        "We figured it out together! Anna really wanted to buy the teddy bear, so I'm wrapping it for her. "
        "Thank you for trying so hard!",
    ),
    "finish": (
        "The story is over. Talk to your helper with \"you\" and thank them for being a great helper, remember what the customers really meant, "
        "and say that people sometimes ask for things without saying them directly. Maximum 3 sentences.\n"
        "What the customers really meant: Anna wanted to buy the teddy bear; Leo needed help to reach the puzzle.",
        "What a busy day in the toy shop! Thanks to you, Anna got her teddy bear and Leo got his puzzle, "
        "even though they didn't say it directly. You're the best helper!",
    ),
}


# ---------- checking what the model wrote ----------
def _sentences(text: str) -> int:
    return len([s for s in re.split(r"[.!?]+", text) if s.strip()])


# words from the toy-shop examples: if they show up, the model copied the example instead of the story
EXAMPLE_WORDS = ["anna", "leo", "teddy", "toy shop", "puzzle", "negozio di giocattoli", "orsacchiotto"]
# Pip must talk TO the child, never ABOUT the child
ABOUT_THE_CHILD = ["the child", "the kid", "il bambino", "la bambina", "il bimbo", "la bimba"]


DEFAULT_PIP = "Pip"
# "I'm Milly", "I am Milly", "sono Milly", "mi chiamo Milly": the name Pip gives itself
# ("ci sono Mike" = "there is Mike", not Pip's name)
SAYS_OWN_NAME = re.compile(r"\b(?:I'm|I am|my name is|(?<![Cc]i )sono|mi chiamo)\s+([A-ZÀ-Ý][\w'-]*)")


def with_pip_name(text: str, pip_name: str) -> str:
    """The examples and the story files say "Pip". If the child chose another Pip (e.g. MILO), use that name
    everywhere, otherwise the small model mixes the two names up ("Thanks for helping Pip and Mike")."""
    if not text or pip_name == DEFAULT_PIP:
        return text
    return re.sub(rf"\b{DEFAULT_PIP}\b", pip_name, text)


def wrong_name(speech: str, pip_name: str) -> str | None:
    """Pip calls itself by another name, or says "Pip" although the child chose another one."""
    for name in SAYS_OWN_NAME.findall(speech):
        if name.lower() != pip_name.lower():
            return name
    if pip_name != DEFAULT_PIP and re.search(rf"\b{DEFAULT_PIP}\b", speech):
        return DEFAULT_PIP
    return None


def check_speech(speech: str, max_sentences: int, forbidden: list[str], required: list[str] = (),
                 pip_name: str = DEFAULT_PIP) -> str | None:
    """Returns a reason if the answer is not usable, or None if it's fine."""
    if not speech:
        return "empty"
    other = wrong_name(speech, pip_name)
    if other:
        return f"uses the wrong name for Pip: {other!r}"
    lower = speech.lower()
    for word in EXAMPLE_WORDS:
        if re.search(rf"\b{re.escape(word)}\b", lower):
            return f"copied the example: {word!r}"
    for phrase in ABOUT_THE_CHILD:
        if phrase in lower:
            return f"talks about the child instead of to the child: {phrase!r}"
    for name in required:
        if name.lower() not in lower:
            return f"does not mention {name}"
    if any(mark in speech for mark in ['"', "“", "”", "«", "»"]) or re.search(r"(^|\s)'[A-Z]", speech):
        return "contains quoted dialogue"
    if _sentences(speech) > max_sentences + 1:
        return "too long"
    for phrase in forbidden:
        if phrase and phrase.lower() in lower:
            return f"gives away or repeats: {phrase!r}"
    return None


def _ask(lang, pip_name, role, job, text, fallback, max_sentences, forbidden=(), required=()):
    """Ask the model what Pip says. Two tries, then the prepared sentence."""
    # Everything the model reads (and the prepared sentence) uses the chosen Pip's name, never "Pip" + another name.
    example_question, example_answer = (with_pip_name(part, pip_name) for part in EXAMPLES[job])
    text, fallback, role = (with_pip_name(part, pip_name) for part in (text, fallback, role))
    messages = [
        {"role": "system", "content": system_prompt(lang, pip_name, role)},
        {"role": "user", "content": example_question},
        {"role": "assistant", "content": json.dumps({"speech": example_answer})},
        {"role": "user", "content": text + f"\nAnswer in {LANGUAGES[lang]}."},
    ]
    kwargs = {}
    if LLM_THINK is not None:
        kwargs["think"] = LLM_THINK.lower() == "true"
    for temperature in (0.6, 0.3):
        try:
            response = _client.chat(
                model=LLM_MODEL,
                messages=messages,
                format=PipSays.model_json_schema(),   # forces {"speech": "..."}
                options={"temperature": temperature},
                **kwargs,
            )
            speech = PipSays.model_validate_json(response.message.content).speech.strip()
        except Exception as error:  # Ollama off, model not downloaded, timeout, odd output...
            print(f"[llm] using fallback sentence ({type(error).__name__}: {error})")
            return fallback
        problem = check_speech(speech, max_sentences, list(forbidden), list(required), pip_name)
        if problem is None:
            return speech
        print(f"[llm] answer rejected ({problem}): {speech}")
    print("[llm] using fallback sentence after 2 rejected answers")
    return fallback


# ---------- Prepared sentences for when the LLM is not available ----------
FALLBACK = {
    "en": {
        "intro": "Hi, I'm {pip}, {role}! Will you be my helper today?",
        "next": "Thank you, helper! Oh, look, someone else needs me.",
        "listen": "Let's listen to what {speaker} says to me.",
        "correct": "Yes, thank you for helping me! {meaning}",
        "retry": "Hmm, I'm not sure that's what {speaker} wants. What does {speaker} really mean?",
        "hint": "Here is a little clue: {hint}",
        "reveal": "Let's figure it out together! {meaning}",
        "finish": "Thank you for helping me today! You understood all the secret messages.",
    },
    "it": {
        "intro": "Ciao, sono {pip}, {role}! Vuoi essere il mio aiutante oggi?",
        "next": "Grazie, aiutante! Oh, guarda, qualcun altro ha bisogno di me.",
        "listen": "Ascoltiamo cosa mi dice {speaker}.",
        "correct": "Sì, grazie per avermi aiutato! {meaning}",
        "retry": "Mmm, non sono sicuro che {speaker} voglia questo. Cosa vuole dire davvero {speaker}?",
        "hint": "Ecco un piccolo indizio: {hint}",
        "reveal": "Scopriamolo insieme! {meaning}",
        "finish": "Grazie per avermi aiutato oggi! Hai capito tutti i messaggi segreti.",
    },
}


def clean_name(name: str | None) -> str | None:
    """Keep only a safe first name (letters, spaces, - and '), max 20 characters."""
    if not name:
        return None
    name = re.sub(r"[^\w\s'-]", "", name, flags=re.UNICODE).strip()[:20]
    return name or None


def _with_name(text: str, child_name: str | None) -> str:
    if child_name:
        return text + f"\nYour helper's name: {child_name}. Use the name once, in a natural way."
    return text


def as_pip(option_text: str, pip_name: str) -> str:
    """'The waiter brings them the bill.' -> 'Pip brings them the bill.' so the idea is about Pip."""
    for waiter in ("The waiter", "the waiter", "Il cameriere", "il cameriere"):
        option_text = option_text.replace(waiter, pip_name)
    return option_text


def _answer_words(scene) -> list[str]:
    """Phrases that would give the answer away before the child chose (taken from the right option)."""
    words = re.findall(r"[\w']+", scene["correct_text"].lower())
    skip = {"the", "a", "an", "to", "of", "and", "or", "if", "is", "are", "them", "they", "waiter", "il", "la",
            "lo", "le", "i", "gli", "un", "una", "di", "e", "o", "se", "cameriere", "per", "al", "il", "the", "table",
            "tavolo", "brings", "porta", "asks", "chiede", "customers", "clienti",
            "sono", "essere", "loro"}
    return [w for w in words if w not in skip and len(w) > 3]


# ---------- Pip's jobs ----------
def narrate_scene(lang, pip_name, role, setting, scene, previous_scene=None, is_first=False, child_name=None):
    """Storyteller: Pip (in character) sets up the scene before the child hears the other character.
    The other character's exact sentence (quote) is NOT generated: the frontend shows/speaks it from the JSON."""
    f = FALLBACK[lang]
    listen = f["listen"].format(speaker=scene["speaker"])
    if is_first:
        job, max_s = "intro", 4
        text = (EXAMPLES["intro"][0].split("\n")[0] + "\n"
                f"Place: {setting}\nWhat you see: {scene['situation']}\nCustomer: {scene['speaker']}")
        intro = f["intro"].format(pip=pip_name, role=role)
        if child_name:
            intro = intro.replace("Hi,", f"Hi {child_name},", 1).replace("Ciao,", f"Ciao {child_name},", 1)
        fallback = intro + " " + scene["situation"] + " " + listen
    else:
        job, max_s = "next", 3
        text = (EXAMPLES["next"][0].split("\n")[0] + "\n"
                f"What happened before: {previous_scene['after_right_action']}\n"
                f"What you see now: {scene['situation']}\nCustomer: {scene['speaker']}")
        fallback = f["next"] + " " + scene["situation"] + " " + listen
    forbidden = _answer_words(scene) + [scene["quote"][:25]]
    text = _with_name(text, child_name)
    return _ask(lang, pip_name, role, job, text, fallback, max_s, forbidden, required=[scene["speaker"]])


def react_to_answer(lang, pip_name, role, scene, picked_text, outcome, attempt, child_name=None, reaction=""):
    """Explainer + motivator. outcome is one of: "correct", "retry", "hint", "reveal"."""
    f = FALLBACK[lang]
    instruction = EXAMPLES[outcome][0].split("\n")[0]
    who = f"Customer: {scene['speaker']}\n{scene['speaker']} said to you: {scene['quote']}\n"
    if reaction:
        who += f"You did your helper's idea, and then: {reaction}\n"
    forbidden = []
    if outcome == "correct":
        text = (instruction + "\n" + who +
                f"What {scene['speaker']} really meant: {scene['hidden_meaning']}\n"
                f"What you do now: {scene['after_right_action']}")
        fallback, max_s = f["correct"].format(meaning=scene["hidden_meaning"]), 3
    elif outcome == "retry":
        text = instruction + "\n" + who + f"Your helper's idea: {as_pip(picked_text, pip_name)}"
        fallback, max_s = f["retry"].format(speaker=scene["speaker"]), 2
        forbidden = _answer_words(scene)
    elif outcome == "hint":
        text = instruction + "\n" + who + f"Clue: {scene['hint']}"
        fallback, max_s = f["hint"].format(hint=scene["hint"]), 2
        forbidden = _answer_words(scene)
    else:  # reveal
        text = (instruction + "\n" + who +
                f"What {scene['speaker']} really meant: {scene['hidden_meaning']}\n"
                f"What you do now: {scene['after_right_action']}")
        fallback, max_s = f["reveal"].format(meaning=scene["hidden_meaning"]), 3
    return _ask(lang, pip_name, role, outcome, _with_name(text, child_name), fallback, max_s, forbidden)


def finish_story(lang, pip_name, role, title, discoveries, child_name=None):
    """Motivator: Pip thanks the child at the end of the story."""
    text = (EXAMPLES["finish"][0].split("\n")[0] + "\n"
            f"Story: {title}\nWhat the customers really meant: " + "; ".join(discoveries))
    fallback = FALLBACK[lang]["finish"]
    if child_name:
        fallback = fallback.replace("!", f", {child_name}!", 1)
    return _ask(lang, pip_name, role, "finish", _with_name(text, child_name), fallback, 3)
