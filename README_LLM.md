# Pip + LLM: the AI part of the app

This branch contains the working AI part of the app: **Pip, the waiter, tells the restaurant story
"The secret message", reacts to what the child chooses and explains the hidden meaning.**
It runs completely on your own laptop (localhost). No internet or API key needed.
**Everyone in the team can run it:** download this branch and follow section 2 on your own computer (Mac or Windows).

---

## 1. What it does

1. The child presses **"Let's go!"** on the child login screen and the story starts.
2. **Pip (the waiter)** greets the child and describes the first table: *"Hi Dan, I'm Pip, the waiter! Will you be my helper today?…"*
3. A customer says something indirect: *"We've been looking at the menu for quite a while."*
4. The child picks one of three pictures.
   - Doesn't fit yet → Pip asks a thinking question: *"Hmm, you think I should bring the bill now? Would Mike be happy?"*
   - Second try → Pip gives a clue.
   - Right (or after the 3rd try) → Pip explains what the customer really meant and what he does now.
5. "Continue" → Pip thanks the child and walks to the next table. 3 tables, then a goodbye.

Works in **English and Italian**. Pip's words are written by the AI, read aloud by the browser's voice.

---

## 2. Run it on your laptop

### First time only
> **Mac:** use the **Terminal** app. **Windows:** use **PowerShell** (Start menu → type "PowerShell").
> All commands below are the same on both, unless it says otherwise.

1. Install **Ollama** from https://ollama.com and open it.
   You'll see a llama icon: Mac in the menu bar at the top, Windows in the taskbar near the clock.
2. Download the AI model (about 2 GB):
   ```
   ollama pull qwen2.5:3b
   ```
3. Install **uv** (runs the Python backend), then close and reopen Terminal / PowerShell:
   - Mac / Linux (Terminal):
     ```
     curl -LsSf https://astral.sh/uv/install.sh | sh
     ```
   - Windows (PowerShell):
     ```
     powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
     ```
4. Install **Node.js** (the **LTS** version) from https://nodejs.org (runs the React frontend).
   Windows: keep the default options in the installer, then close and reopen PowerShell.
5. Install the project's packages:
   ```
   cd backend
   uv sync
   cd ../frontend
   npm install
   ```

If your laptop is slow (Pip takes very long to answer), use the smaller model: `ollama pull qwen2.5:1.5b`
and start the backend with `LLM_MODEL=qwen2.5:1.5b` (see Settings below).

### Every time
Open Ollama, then open **two** Terminal / PowerShell windows and go to the project folder in both
(tip: type `cd ` with a space, drag the project folder into the window, press Enter):

**Window 1, backend (Pip's brain):**
```
cd backend
uv run uvicorn main:app --reload
```

**Window 2, frontend (the screens):**
```
cd frontend
npm run dev
```

Open **http://localhost:5173** → **My Pip** → **Let's go!**
Italian: **http://localhost:5173/?lang=it**

To stop: press **Ctrl + C** in both windows (on Mac and Windows).

**Voice in Italian:** the browser needs an Italian voice. Mac: System Settings → Accessibility → Spoken Content →
System voice → Manage Voices → Italian. Windows: Settings → Time & language → Speech → Add voices → Italian
(or use **Microsoft Edge**, which has Italian voices built in).

---

## 3. How it works

### No training, only instructions
We don't train a model. We use an **already trained open-source model** (Qwen 2.5, 3B) running in
**Ollama** on the laptop, and we **steer it with text**: who Pip is, what to do and an example of a good answer.
This is called **prompting**.

```
Child clicks → React (frontend) → FastAPI (backend, Python) → Ollama → LLM
Pip speaks   ← browser voice     ← backend checks the answer ← text
```

### A conversation with an LLM in Python
An LLM has no memory: every time, we send the **whole conversation as a list of messages**.

```python
from ollama import chat

messages = [
    {"role": "system", "content": "You are Pip, a friendly waiter. Short sentences for children."},  # rules
    {"role": "user", "content": "Hello Pip!"},                                                         # question
]
response = chat(model="qwen2.5:3b", messages=messages)
print(response.message.content)   # → "Hi there, friend! Welcome to my restaurant!"
```

To continue the conversation, add the answer as `{"role": "assistant", ...}`, then the next `user` message,
and send the whole list again.

👉 **Try it:** `backend/tools/chat_with_pip.py` is a tiny interactive chat with Pip in Terminal / PowerShell:
```
cd backend
uv run python tools/chat_with_pip.py
```

### What the game adds to make a small model reliable (`backend/services/llm_service.py`)
1. **System prompt:** Pip plays the waiter, speaks in first person to the child, never says "wrong", never invents what customers say, never gives the answer away.
2. **One example conversation:** before the real question we show one good example from a *different* story (a toy shop). Small models copy examples better than they follow rules.
3. **Facts come from the story file, not the AI:** `backend/data/stories/the_secret_message.json` contains the scenes, what customers say, the right answer, the hidden meaning and the clue. **The code decides if an answer is right**, never the AI.
4. **Fixed answer format:** the AI must reply as `{"speech": "..."}` so Python can always read it.
5. **Safety check:** an answer is thrown away and asked again if it invents dialogue, is too long, gives the answer away, copies the example or talks *about* "the child". After 2 bad tries (or if Ollama is off/slow) Pip uses a prepared sentence, so the game never breaks.

---

## 4. The files

| File | What it is |
|---|---|
| `backend/services/llm_service.py` | **The AI part:** Pip's instructions, examples, the call to Ollama, the safety check, backup sentences |
| `backend/routers/story.py` | The backend API the screens call (load story, Pip narrates, check answer, finish) |
| `backend/data/stories/the_secret_message.json` | The restaurant story in English + Italian. New stories = new file like this, no code changes |
| `backend/tools/chat_with_pip.py` | Practice script: chat with Pip in Terminal / PowerShell |
| `backend/main.py` | Changed: switches on the story API + "Let's go!" → story navigation |
| `frontend/src/components/StoryPlay.jsx` | The story screen: shows Pip's words, reads them aloud, picture buttons |
| `frontend/src/App.jsx`, `ChildLogin.jsx` | Changed: "Let's go!" opens the story screen |
| `frontend/public/resources/stories/the_secret_message/` | The 12 story pictures from Figma |
| `requirements.txt`, `backend/pyproject.toml` | Changed: added the `ollama` package |

### The backend API (test page: http://localhost:8000/docs)
| URL | What it does |
|---|---|
| `POST /api/register` | Register a therapist using the registration form fields |
| `POST /api/children` | Create a mock child profile and generate a login code |
| `GET /api/children` | List the prepared mock children |
| `GET /api/children/{child_id}` | Get a child profile |
| `PUT /api/children/{child_id}` | Update a child's focus, support level and weekly goal |
| `GET /api/children/{child_id}/progress` | Get a child's activity progress |
| `POST /api/auth/child-login` | Validate a child login code and return the child profile |
| `GET /api/stories/the_secret_message?language=en` | The story and pictures (without the right answers) |
| `POST /api/stories/the_secret_message/narrate` | Pip describes a table |
| `POST /api/stories/the_secret_message/answer` | Checks the child's choice; Pip reacts |
| `POST /api/stories/the_secret_message/finish` | Pip says goodbye |

Therapist and child profiles use in-memory mock data only. Changes made through these endpoints are lost when the backend restarts; they are not connected to MySQL or intended for real personal data.

### Settings
- Model: `qwen2.5:3b` by default. To use another one, start the backend like this:
  - Mac: `LLM_MODEL=qwen2.5:1.5b uv run uvicorn main:app --reload`
  - Windows (PowerShell): `$env:LLM_MODEL="qwen2.5:1.5b"; uv run uvicorn main:app --reload`
  (bigger models like `qwen2.5:7b` were too slow on a MacBook Air).

---

## 5. Not done yet (next steps)
- **Child's name and answers in MySQL:** right now the name is fixed to "Dan" (`frontend/src/App.jsx`) and answers are saved to `backend/data/answer_log.jsonl`. When MySQL is connected: look up the name from the login code, and save answers in the database for the therapist dashboard (`save_answer()` in `backend/routers/story.py`).
- **Pip GIFs:** export `pip_idle.gif` and `pip_talking.gif` from Figma into `frontend/public/resources/`. The screen switches to the talking GIF while Pip speaks.
- **Design:** `StoryPlay.jsx` works but looks plain: restyle it like the Figma story screens.
- **Italian:** the AI makes small grammar mistakes in Italian; an Italian speaker should check.

## 6. Moving it to main
This branch was made from `main` as it was on 14 November. To bring it into `main`, open a **Pull Request**
from this branch on GitHub. If `main.py`, `App.jsx` or `ChildLogin.jsx` changed on main in the meantime,
GitHub will show the differences: keep both changes. The lines this branch adds are small (see the table above).

## 7. If something goes wrong
| Message | Fix |
|---|---|
| `ollama` / `uv` / `npm` "not found" or "not recognized" | The program isn't installed, or the window was open during installation: close and reopen Terminal / PowerShell |
| `Failed to spawn: uvicorn` | You're in the wrong folder: `cd` into the `backend` folder first |
| `Address already in use` | The backend is already running in another window: use that one, or close it with Ctrl + C |
| Pip always says the same simple sentences | The AI didn't answer (look for `[llm]` lines in the backend window): open Ollama, check `ollama pull qwen2.5:3b` finished, or use the smaller model if it's too slow |
| Windows: "running scripts is disabled on this system" | Run once in PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, answer Y |
