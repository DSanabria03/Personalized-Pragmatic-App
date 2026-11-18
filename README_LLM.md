# Pip + LLM: the AI part of the app

This branch contains the working AI part of the app: **Pip, the waiter, tells the restaurant story
"The secret message", reacts to what the child chooses and explains the hidden meaning.**
It runs completely on your own laptop (localhost). No internet or API key needed.
**Everyone in the team can run it:** download this branch and follow section 2 on your own computer (Mac or Windows).

---

## 0. The whole app in short

| Who | What they do |
|---|---|
| **Therapist** | Creates an account (email + password), adds children, gets a **login code** for each child (like `PIP742`), and sees each child's **statistics** on the dashboard. |
| **Child** | Logs in with the code, sees their home page (week, level, badges), plays the story with Pip, and gets a **"Great job" screen** with their results. |
| **Settings** | Language (English / Italian), Pip's voice on/off, pause for the grown-up on/off. Opened from "Settings" at the top; **not available during a story**. |

Everything the child does is saved, so the statistics are real: XP and level, badges, practice days and time,
how often the hidden meaning was found on the first try (per scene), and the recent choices with what Pip said.

**Try it:** start the app (section 2) → **Log-in** → *Create a therapist account* → add a child → note the code
→ **Log out** → **My Pip** → type the code → *Let's explore*. Afterwards log in as the therapist again to see the statistics.

## 1. What it does

1. The child logs in with their code, and on their home page presses **"Let's explore"**: the story starts.
2. **Pip (the waiter, speech bubble on the left)** greets the child and describes the first table:
   *"Hi Dan, I'm Pip, the waiter! Will you be my helper today?…"*
3. **A customer (speech bubble on the right)** says something indirect: *"We've been looking at the menu for quite a while."*
4. The child picks one of three pictures. Then:
   - **Pip does that action** (the picture with a line like *"▶ Pip brings them the bill."*; later a GIF),
   - **the customer reacts** with a face and a sentence (*😕 "The bill? But we haven't eaten anything yet!"*),
   - **Pip reacts** (written by the AI):
     - 1st choice that doesn't fit → a guiding question, then **a pause "Let's talk about it together"**, so the
       therapist / grown-up can talk it through with the child (with a clue and the hidden meaning for the adult),
     - 2nd → a clue,
     - right (or after the 3rd try) → Pip explains what the customer really meant and what he does now.
5. "Continue" → Pip thanks the child and walks to the next table. 3 tables, then a goodbye and the
   **"Great job" screen** with the results (messages found, first tries, XP, level, new badges).

The bubble of whoever is speaking lights up. Language, voice and the pause are chosen in **Settings** before playing.
Pip's words are written by the AI and read aloud (free Piper voice, ElevenLabs, or the browser's voice; see section 2).

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
5. Install the project's packages (including Pip's free voice):
   ```
   cd backend
   uv sync --extra voice
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

### Pip's voice
Pip's voice works in this order, automatically:
1. **ElevenLabs** (very natural, online) – only if *you* add your own key (see below).
2. **Piper** (free, open source, runs on the laptop, no account) – **the standard voice for everyone.**
3. **The browser's voice** – if neither is installed, or something goes wrong. The game never breaks.

**Install the free Piper voice (once):**
```
cd backend
uv sync --extra voice
```
The first time Pip speaks, the voices are downloaded automatically (about 60 MB each, needs internet once,
saved in `backend/data/piper_voices/`). After that it works offline. Voices: English `en_US-lessac-medium`
(Pip) and `en_US-ryan-medium` (customers), Italian `it_IT-paola-medium` (Pip) and `it_IT-riccardo-x_low`
(customers). Listen to others at https://rhasspy.github.io/piper-samples/ and change them in `backend/.env`
(see `.env.example`). Check each voice's licence on its page before publishing anything.

(The project uses Python 3.13, set in `backend/.python-version`; uv downloads it automatically.)

**Optional: ElevenLabs instead (even more natural)**
1. Make a free account at https://elevenlabs.io and create an **API key** (Developers → API Keys, with "Text to Speech").
2. In the `backend` folder: copy `.env.example` to a new file **`.env`** and paste the key after `ELEVENLABS_API_KEY=`
   (Mac Terminal: `cp .env.example .env` then `open -e .env`).
3. Restart the backend. "Voice: ElevenLabs" appears under the story screen.
- **Never upload `.env` to GitHub** (it's in `.gitignore`); each person uses their own key.
- Free plan: about 10 minutes of speech per month, non-commercial use only, ElevenLabs must be credited (the
  screen shows it). Sentences are saved after the first time (`backend/data/tts_cache/`) to save credits.
- Pip's sentences (not the child's data) are sent to ElevenLabs online. If it fails, Piper takes over.

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
| `backend/routers/story.py` | The story API (load story, start, Pip narrates, check answer, finish + results) |
| `backend/data/stories/the_secret_message.json` | The restaurant story in English + Italian: scenes, options, right answer, hidden meaning, clue, and each option's customer **reaction** and `animation` (empty for now: put Pip's GIF path here later). New stories = new file like this |
| `backend/database.py` | **The database** (SQLite, built into Python, file `backend/data/pip.db`, created automatically): therapists, children, logins, story runs, every answer |
| `backend/services/accounts.py` | Therapist accounts (passwords stored as secure hashes), child accounts with login codes, who is logged in |
| `backend/services/progress.py` | **Statistics:** XP, levels, badges, the week, the therapist's overview and per-child details |
| `backend/routers/accounts.py` | The accounts + statistics API |
| `backend/routers/tts.py` | Pip's voice: Piper (free, local) or ElevenLabs (optional), returns the audio |
| `backend/tools/chat_with_pip.py` | Practice script: chat with Pip in Terminal / PowerShell |
| `backend/main.py` | Changed: creates the database and switches on the new APIs |
| `backend/.env.example` | Template for your private settings (voices, ElevenLabs key); copy it to `backend/.env` |
| `backend/.python-version` | Makes uv use Python 3.13 (needed for the Piper voice) |
| `frontend/src/App.jsx` | Changed: all screens, who is logged in, the settings |
| `frontend/src/api.js` | Talking to the backend, remembering the login and the settings (in the browser) |
| `frontend/src/components/StoryPlay.jsx` | The story screen: speech bubbles, pictures, Pip's action + customer reaction, pause for the grown-up, voice |
| `frontend/src/components/StoryDone.jsx` | The "Great job" screen with the results, XP, level and new badges |
| `frontend/src/components/ChildHome.jsx` | The child's home page: week, today's adventure, level, badges |
| `frontend/src/components/TherapistDashboard.jsx` | The therapist's dashboard: this week, all children with codes, one child's details |
| `frontend/src/components/Settings.jsx` | The settings screen |
| `frontend/src/components/Progress.jsx` | Level bar and badges (used on several screens) |
| `TherapistLogin.jsx`, `TherapistRegister.jsx`, `AddChild.jsx`, `ChildCode.jsx`, `ChildLogin.jsx`, `Home.jsx` | Daniel's screens, now connected to the real accounts (same look) |
| `frontend/public/resources/stories/the_secret_message/` | The 12 story pictures from Figma |

### The backend API (test page: http://localhost:8000/docs)
| URL | What it does |
|---|---|
| `GET /api/stories/the_secret_message?language=en` | The story and pictures (without the right answers) |
| `POST /api/stories/the_secret_message/narrate` | Pip describes a table |
| `POST /api/stories/the_secret_message/answer` | Checks the child's choice; Pip reacts |
| `POST /api/stories/the_secret_message/finish` | Pip says goodbye |
| `POST /api/tts` | Turns a sentence into speech (Piper or ElevenLabs) |
| `POST /api/therapists/register`, `/api/therapists/login` | Therapist account → login token |
| `POST /api/children/login` | Child logs in with their code → login token |
| `GET /api/children`, `POST /api/children`, `GET /api/children/{id}` | Therapist: overview, add a child (makes the code), one child's statistics |
| `GET /api/me`, `GET /api/progress` | Who is logged in, the child's progress |
| `POST /api/stories/the_secret_message/start` | A logged-in child starts playing (answers are then saved) |

### Settings
- Model: `qwen2.5:3b` by default. To use another one, start the backend like this:
  - Mac: `LLM_MODEL=qwen2.5:1.5b uv run uvicorn main:app --reload`
  - Windows (PowerShell): `$env:LLM_MODEL="qwen2.5:1.5b"; uv run uvicorn main:app --reload`
  (bigger models like `qwen2.5:7b` were too slow on a MacBook Air).

---

## 5. Not done yet (next steps)
- **Pip GIFs:** export `pip_idle.gif` and `pip_talking.gif` from Figma into `frontend/public/resources/`: they replace the "Pip" circle, and the talking one plays while Pip speaks.
- **Action animations:** for each option in the story file, set `"animation": "/resources/stories/the_secret_message/<file>.gif"`; it is shown instead of the still picture when Pip does that action (adjust `ACTION_MS` in `StoryPlay.jsx` to the GIF's length).
- **Reactions:** the customers' reactions in the story file are a first draft: please check them (and the new picture options from Gaia).
- **Design:** the new screens use the app's colours but are simpler than Figma: restyle as you like (the logic can stay).
- **Italian:** the AI makes small grammar mistakes in Italian; an Italian speaker should check.
- **MySQL (optional):** the app uses SQLite (no installation, works for everyone). To use MySQL instead, only
  `backend/database.py` and the SQL in `services/accounts.py` / `services/progress.py` need to change.
- **Privacy:** `backend/data/pip.db` contains children's names and results: it stays on the laptop and is in `.gitignore`.
  "Forgot password" is not built yet.

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
