# Pip – Personalized Pragmatic App

**Little steps, big things.** Pip is a web app where children aged 6 to 10 practise *pragmatic language*:
understanding what people really mean when they don't say it directly ("We've been looking at the menu for quite a
while" → *we're ready to order*). The child plays short stories with Pip, a friendly character whose words are
written by a language model (LLM) running locally. Their therapist follows each child's progress on a dashboard.

Course project for **Advanced User Interfaces**, MSc in Computer Science and Engineering,
**Politecnico di Milano**, A.Y. 2026/2027.

> **Status: research prototype.** It runs on a laptop (localhost), has not been secured for real personal data,
> and is **not a medical device**: it has not been clinically validated and does not replace a therapist.

## Contents

1. [Features](#1-features)
2. [Tech stack and architecture](#2-tech-stack-and-architecture)
3. [Getting started](#3-getting-started)
4. [Configuration](#4-configuration)
5. [How the exercises work (Pip and the LLM)](#5-how-the-exercises-work-pip-and-the-llm)
6. [Data and privacy](#6-data-and-privacy)
7. [Project structure](#7-project-structure)
8. [Backend API](#8-backend-api)
9. [Tests and code quality](#9-tests-and-code-quality)
10. [Development conventions](#10-development-conventions)
11. [Known limitations and roadmap](#11-known-limitations-and-roadmap)
12. [Troubleshooting](#12-troubleshooting)
13. [Team](#13-team)
14. [License](#14-license)
15. [Acknowledgements and third-party components](#15-acknowledgements-and-third-party-components)

---

## 1. Features

| Who                 | What they can do                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Therapist** | Creates an account (email + password), adds children and gets a **login code** for each one (like `PIP742`). The dashboard shows this week's activity for the whole practice, every child's card, a page per child (this week, all-time progress, first-try rate per scene, recent choices with what Pip said) and the activities with their exercises. The therapist sets each child's **support level** and **weekly goal**, and can issue a new login code. |
| **Child**     | Logs in with the code (no email, no password), picks a nickname and **their Pip**, sees their home page (week, level, badges) and plays the story. At the end a **"Great job"** screen shows what they discovered, the XP earned and any new badges.                                                                                                                                                                                                                   |
| **Settings**  | Language (**English / Italian**), Pip's voice on/off, and a **pause for the grown-up** on/off. Not available during a story, so nothing changes in the middle of a game.                                                                                                                                                                                                                                                                                               |

Progress is built from what the child actually did: XP and levels, badges, practice days and time, and how often the
hidden meaning was found on the first try. The tone is "small steps, not scores": Pip never says "wrong".

Days and weeks (practice days, streaks, "this week") are counted in **Italian time** (`Europe/Rome`).

## 2. Tech stack and architecture

| Part     | Technology                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 19, Vite 8, plain CSS (one file per screen), ESLint                                                           |
| Backend  | Python 3.13+, FastAPI, Uvicorn, managed with [uv](https://docs.astral.sh/uv/)                                        |
| Database | SQLite (built into Python, one file: `backend/data/pip.db`, created automatically)                                |
| LLM      | [Ollama](https://ollama.com) running **Qwen 2.5 (3B)** on the laptop: no API key, no internet while playing    |
| Voice    | [Piper](https://github.com/OHF-Voice/piper1-gpl) (free, local), optionally ElevenLabs, otherwise the browser's voice |
| Design   | Figma (screens implemented page by page from the design)                                                            |

```text
            Browser (React, http://localhost:5173)
                 │  fetch + "Authorization: Bearer <token>"
                 ▼
            FastAPI backend (http://localhost:8000)
     ┌───────────┼──────────────┬──────────────────┐
     ▼           ▼              ▼                  ▼
  accounts    progress       stories            voice (TTS)
     │           │              │                  │
     └─────► SQLite ◄───────────┤                  ├─► Piper (local) / ElevenLabs (optional)
                                ▼
                         Ollama → Qwen 2.5 (local LLM)
```

The **code** decides whether an answer is right, using the story file. The LLM only writes what Pip says
(see [section 5](#5-how-the-exercises-work-pip-and-the-llm)).

## 3. Getting started

> **Mac:** use the **Terminal** app. **Windows:** use **PowerShell**. The commands are the same on both unless noted.

### Prerequisites (first time only)

1. **Ollama**: install it from [https://ollama.com](https://ollama.com) and open it. Then download the model (about 2 GB):

   ```bash
   ollama pull qwen2.5:3b
   ```

   On a slow laptop use the smaller model instead: `ollama pull qwen2.5:1.5b` (see `LLM_MODEL` in [section 4](#4-configuration)).
2. **uv** (runs the Python backend). Then close and reopen the terminal:

   - Mac / Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
3. **Node.js 22 LTS** or newer from [https://nodejs.org](https://nodejs.org) (older versions can't run the linter).
4. Install the project's packages:

   ```bash
   cd backend
   uv sync --extra voice      # --extra voice adds the free Piper voice
   cd ../frontend
   npm install
   ```

### Run it (every time)

Open Ollama, then two terminals in the project folder:

```bash
# Terminal 1: backend
cd backend
uv run uvicorn main:app --reload
```

```bash
# Terminal 2: frontend
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**. To stop, press **Ctrl + C** in both terminals.

### First steps

The database starts empty.

1. **Log-in** → *Create a therapist account* → add a child → note the login code.
2. **Log out** → **My Pip** → type the code → choose a nickname and a Pip → **Let's explore**.
3. Log in as the therapist again to see the statistics.

Italian: choose it in **Settings** before playing. For the browser's voice in Italian, install an Italian system voice
(Mac: System Settings → Accessibility → Spoken Content → System voice → Manage Voices; Windows: Settings → Time &
language → Speech → Add voices), or use Microsoft Edge.

## 4. Configuration

All settings are optional. Put them in a file **`backend/.env`** (one `NAME=value` per line) or set them in the
terminal before starting the backend. **Never commit `.env`** (it is in `.gitignore`).

| Variable                                                                        | Default                                         | What it does                                                            |
| ------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `PIP_DB_PATH`                                                                 | `backend/data/pip.db`                         | Where the SQLite database is saved                                      |
| `APP_TIMEZONE`                                                                | `Europe/Rome`                                 | Time zone used to count days and weeks                                  |
| `OLLAMA_HOST`                                                                 | `http://localhost:11434`                      | Where Ollama runs                                                       |
| `LLM_MODEL`                                                                   | `qwen2.5:3b`                                  | Ollama model for Pip (e.g. `qwen2.5:1.5b` on slow laptops)            |
| `LLM_THINK`                                                                   | *(not sent)*                                  | `false` for models that "think" before answering, to make them faster |
| `LLM_TIMEOUT`                                                                 | `60`                                          | Seconds to wait for the model before Pip uses a prepared sentence       |
| `ELEVENLABS_API_KEY`                                                          | *(none)*                                      | Turns on ElevenLabs voices (your own key)                               |
| `ELEVENLABS_VOICE_ID`, `ELEVENLABS_CUSTOMER_VOICE_ID`, `ELEVENLABS_MODEL` | built-in                                        | ElevenLabs voices for Pip and the customers, and the model              |
| `PIPER_VOICE_EN`, `PIPER_VOICE_IT`                                          | `en_US-lessac-medium`, `it_IT-paola-medium` | Pip's Piper voices                                                      |
| `PIPER_CUSTOMER_VOICE_EN`, `PIPER_CUSTOMER_VOICE_IT`                        | `en_US-ryan-medium`, `it_IT-riccardo-x_low` | The customers' Piper voices                                             |
| `VITE_API_URL` *(frontend)*                                                 | `http://localhost:8000`                       | Where the frontend finds the backend                                    |

The backend only accepts requests from `http://localhost:5173` (CORS, in `backend/main.py`).

**Pip's voice** is chosen automatically, in this order:

1. **ElevenLabs**, only if you add your own key. Free plan: about 10 minutes of speech a month, non-commercial use,
   and ElevenLabs must be credited (the story screen shows it).
2. **Piper**, the standard for everyone. The voices are downloaded the first time Pip speaks (about 60 MB each,
   saved in `backend/data/piper_voices/`). After that it works offline. Listen to others at
   [https://rhasspy.github.io/piper-samples/](https://rhasspy.github.io/piper-samples/).
3. **The browser's voice**, if neither works. The game never breaks.

Generated audio is cached in `backend/data/tts_cache/`, so each sentence is generated only once.

## 5. How the exercises work (Pip and the LLM)

> This describes the **current** exercise, "The secret message" (category *Hidden requests*). The exercises and
> their screens are going to be redesigned.

### The story

1. The child presses **Let's explore** and the story starts at a restaurant.
2. **Pip, the waiter** (speech bubble on the left), greets the child and describes the first table:
   *"Hi Dan, I'm Pip, the waiter! Will you be my helper today?…"*
3. **A customer** (bubble on the right) says something indirect: *"We've been looking at the menu for quite a while."*
4. The child picks one of three pictures. Then:
   - **Pip does that action** (*"▶ Pip brings them the bill."*),
   - **the customer reacts** with a face and a sentence (*😕 "The bill? But we haven't eaten anything yet!"*),
   - **Pip reacts** (written by the LLM):
     - 1st choice that doesn't fit → a guiding question, then a **pause, "Let's talk about it together"**, so the
       therapist or grown-up can talk it through with the child (with a clue and the hidden meaning for the adult),
     - 2nd → a clue,
     - right answer, or after the 3rd try → Pip explains what the customer really meant and what he does now.
5. **Continue** → Pip thanks the child and walks to the next table. After 3 tables come a goodbye and the
   **"Great job"** screen.

### What the LLM does, and what it doesn't

Pip has three jobs, defined with the course tutors: **storyteller** (introduces and links the scenes), **explainer**
(says what the customer really meant) and **motivator** (thanks, encourages, gives clues, never says "wrong").

The LLM **never decides if an answer is right**. The story file (`backend/data/stories/the_secret_message.json`)
holds the scenes, what the customers say, the right answer, the hidden meaning, the clue and each option's reaction.
The backend checks the answer in code. The correct answer never reaches the browser before the child chooses.

### No training, only prompting

The model is not trained or fine-tuned: we use an already trained open model (Qwen 2.5, 3B) and steer it with text.
To make a small model reliable, `backend/services/llm_service.py`:

1. **System prompt**: Pip plays a character (the story's `pip_role`), speaks in first person to the child, never
   says "wrong", never invents what customers say and never gives the answer away.
2. **One example conversation** from a *different* story (a toy shop): small models copy examples better than they
   follow rules, and a different story keeps them from copying the content.
3. **Fixed answer format**: the model must reply `{"speech": "..."}`, so Python can always read it.
4. **Safety check**: an answer is thrown away and asked again if it invents dialogue, is too long, gives the answer
   away, copies the example or talks *about* "the child".
5. **Fallback**: after 2 bad tries, or if Ollama is off or too slow, Pip uses a prepared sentence. The game never
   freezes.

To try the LLM on its own, `backend/tools/chat_with_pip.py` is a small chat with Pip in the terminal:
`cd backend && uv run python tools/chat_with_pip.py`.

### Adding a story

A new story is a new JSON file in `backend/data/stories/`, with the same structure as `the_secret_message.json`.
Text can be a plain string or `{"en": "...", "it": "..."}`. The story's `category` links it to an activity on the
therapist's Activities page (`frontend/src/data/activities.js`). Pictures go in
`frontend/public/resources/stories/<story_id>/`.

## 6. Data and privacy

The app handles data about children, so it keeps as little as possible and keeps it on the laptop.

| Table                        | What it holds                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `therapists`               | Name, display name, professional role, practice, registration number, email, password **hash** (PBKDF2, never the password) |
| `children`                 | First name or nickname, age, optional parent email, login code, chosen nickname and Pip, support level and weekly goal            |
| `tokens`                   | Who is logged in (a random key per login)                                                                                         |
| `story_runs`, `attempts` | Each play-through and each picture the child chose, with what Pip said                                                            |

- The database is **one local file**, `backend/data/pip.db`, and is in `.gitignore`. **Never force-add it.** To back it
  up, stop the backend and copy the file; to start from zero, stop the backend and delete it.
- The **LLM runs locally**: the child's choices and name are never sent to an online AI service.
- **Guests** (nobody logged in, or the therapist's "Preview exercise") play without saving anything.
- **ElevenLabs** is the only online service, and only if you add a key: it receives Pip's sentences, which can
  include the child's nickname. Piper keeps everything on the laptop.
- The fonts are currently loaded from Google Fonts.
- This is a prototype: it is not ready for real children's data (see [section 11](#11-known-limitations-and-roadmap)).
  A real deployment would need, among other things, GDPR compliance, stored parental consent and a way to delete
  accounts.

## 7. Project structure

```text
backend/
  main.py                 FastAPI app: loads .env, creates the database, registers the routers
  database.py             SQLite schema and connection (tables listed in section 6)
  routers/                HTTP endpoints: accounts.py, story.py, tts.py
  services/
    accounts.py           therapists, children, login codes, tokens
    progress.py           XP, levels, badges, weeks, the therapist's statistics
    llm_service.py        everything that talks to the LLM: prompts, examples, checks, fallbacks
  data/stories/           one JSON file per story
  tests/                  pytest tests for accounts and progress
  tools/chat_with_pip.py  practice chat with Pip in the terminal
frontend/
  public/resources/       images and icons exported from Figma, one folder per screen
  src/
    App.jsx               which screen is shown, who is logged in, the settings
    api.js                calls to the backend, login and settings saved in the browser
    components/           React components (.jsx only): screens, shared layouts, illustrations
    styles/               one CSS file per screen or shared layout
    utils/                helpers and hooks without UI
    data/                 fixed lists: activity categories, the Pips
```

## 8. Backend API

Interactive documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)** (while the backend runs).
After logging in, send the token as `Authorization: Bearer <token>`. `language` is `en` or `it`.

| Method and URL                               | Who       | What it does                                                                   |
| -------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `POST /api/therapists/register`            | anyone    | Create a therapist account → token                                            |
| `POST /api/therapists/login`               | anyone    | Email + password → token                                                      |
| `POST /api/children/login`                 | anyone    | Child's code (e.g. `PIP742`) → token                                        |
| `GET /api/me`                              | logged in | Who is logged in (for a child, also their progress and therapist)              |
| `POST /api/logout`                         | logged in | Ends this login                                                                |
| `GET /api/children`                        | therapist | This week's numbers and every child with their statistics                      |
| `POST /api/children`                       | therapist | Add a child → their login code                                                |
| `GET /api/children/{id}`                   | therapist | One child's statistics in detail                                               |
| `POST /api/children/{id}/reset-code`       | therapist | New login code (the old one stops working)                                     |
| `PUT /api/children/{id}/plan`              | therapist | Support level and weekly goal                                                  |
| `GET /api/progress`                        | child     | XP, level, badges, this week                                                   |
| `PUT /api/profile`                         | child     | Nickname and chosen Pip                                                        |
| `GET /api/stories`                         | therapist | Every story with its exercises and hidden meanings (Activities page)           |
| `GET /api/stories/{story_id}`              | anyone    | The story and its scenes, **without** the right answers                  |
| `POST /api/stories/{story_id}/start`       | child     | Starts a play-through, so its answers are saved together                       |
| `POST /api/stories/{story_id}/narrate`     | anyone    | Pip describes a scene                                                          |
| `POST /api/stories/{story_id}/check`       | anyone    | Right or not, Pip's action and the customer's reaction (no LLM, nothing saved) |
| `POST /api/stories/{story_id}/answer`      | anyone    | The same plus Pip's sentence (LLM); saved for logged-in children               |
| `POST /api/stories/{story_id}/finish`      | anyone    | Pip's goodbye and the results ("Great job" screen)                             |
| `POST /api/tts` · `GET /api/tts/status` | anyone    | A sentence as audio · which voice is in use                                   |

## 9. Tests and code quality

```bash
cd backend
uv run pytest                 # tests of accounts and progress (each test uses its own temporary database)
uvx ruff check .              # Python linter

cd frontend
npm run lint                  # ESLint (needs Node.js 20.19+ or 22+)
npm run build                 # production build in frontend/dist/
```

The tests never touch `data/pip.db`, and they fix "today" to a known date so they give the same result any day.

## 10. Development conventions

- **Design:** screens follow the Figma design exactly. Behaviour the design doesn't cover (empty states, errors) is
  added with the design's colours and fonts.
- **Frontend files:** `components/` contains only `.jsx`. Each screen's CSS goes in `styles/`, helpers without UI in
  `utils/`. Redesigned screens use plain CSS classes with a per-screen prefix, sized from the Figma frame.
- **Backend:** routers only handle HTTP (input, output, who may call it). The logic and the SQL live in `services/`.
  Lists shared with the frontend (Pip ids, support levels) are defined in both places, with a comment pointing to
  the other.
- **Language:** code, comments and the UI text are in English. The child's screens and the story are also in Italian.
- **Git:** each person works on their own branch and merges into `main` through a pull request.

## 11. Known limitations and roadmap

#### Exercises

- The exercises and their screens are being redesigned (format, categories and the LLM's role).
- Only *Hidden requests* has exercises. *Metonymies*, *Truth and lies* and *Metaphors* are shown on the Activities
  page but are empty.
- Activities is read-only: *Add exercise*, *Save changes*, reordering and the support selector are not built yet.
- Pip's GIFs and the action animations are not exported yet (the story file has an empty `animation` field per option).
- The LLM makes small grammar mistakes in Italian; a native speaker should review its sentences.

#### App

- There are no page URLs: the browser's Back button leaves the app, and reloading opens the start screen.
- The child's home, Settings, the story and "Great job" screens still have the old design.
- The therapist's pages are only in English.
- "Forgot password", "About" and "Help" are not built yet.

#### Security and privacy (needed before any real use)

- There is no limit on login attempts. With 1000 possible child codes, a code can be guessed.
- Login tokens don't expire.
- Parental consent is asked for but not stored, and children or accounts can't be deleted.
- The fonts are loaded from Google's servers instead of from the app.

## 12. Troubleshooting

| Message                                                          | Fix                                                                                                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ollama` / `uv` / `npm` "not found" or "not recognized"    | Not installed, or the terminal was open during the installation: close and reopen it                                                                            |
| `Failed to spawn: uvicorn`                                     | Wrong folder: `cd backend` first                                                                                                                              |
| `Address already in use`                                       | The backend is already running in another terminal: use that one, or stop it with Ctrl + C                                                                      |
| Pip always says the same simple sentences                        | The LLM didn't answer (look for `[llm]` lines in the backend terminal): open Ollama, check that `ollama pull qwen2.5:3b` finished, or use the smaller model |
| `npm run lint` fails with `util.styleText is not a function` | Node.js is too old: install Node.js 22 LTS                                                                                                                      |
| "Could not connect to the server" in the app                     | The backend isn't running, or the frontend isn't on `http://localhost:5173`                                                                                   |
| Windows: "running scripts is disabled on this system"            | Run once in PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, answer `Y`                                                                   |

## 13. Team

Advanced User Interfaces, MSc in Computer Science and Engineering and MSc in Design and Engineering, Politecnico di Milano, A.Y. 2026/2027.

| Name                         | Role                    | Study                         |
| ---------------------------- | ----------------------- | ----------------------------- |
| Alba Bertoa Lema             | Frontend & Backend      | MSc in Computer Science       |
| Ann-Kristin Friedrich        | LLM & UX Design         | MSc in Computer Science       |
| Giovanni Gelli Losi          | Animations & UX Design | MSc in Design and Engineering |
| Daniel Sanabria Salamanqués | Frontend & Backend      | MSc in Computer Science       |

Course instructors and tutors: *to be completed*.

## 14. Acknowledgements and third-party components

| Component                                                                   | License                   | Notes                                                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Qwen 2.5 3B](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct) (default LLM) | Qwen Research License     | Research and evaluation only, no commercial use. Qwen 2.5 1.5B and 7B are Apache-2.0 if that is ever needed                                                                                    |
| [Ollama](https://ollama.com)                                                 | MIT                       | Runs the LLM locally                                                                                                                                                                           |
| [Piper](https://github.com/OHF-Voice/piper1-gpl) (`piper-tts`, optional)   | GPL-3.0                   | Local text-to-speech                                                                                                                                                                           |
| [Piper voices](https://huggingface.co/rhasspy/piper-voices)                  | Per voice                 | Each voice has a `MODEL_CARD` with its dataset's license. `en_US-lessac` is trained on the Blizzard 2013 dataset, for non-commercial research; check each voice before publishing anything |
| [ElevenLabs](https://elevenlabs.io) (optional)                               | Commercial service        | Free plan: non-commercial use, attribution required                                                                                                                                            |
| React, Vite, FastAPI, Pydantic                                              | MIT                       |                                                                                                                                                                                                |
| Uvicorn                                                                     | BSD-3-Clause              |                                                                                                                                                                                                |
| Fonts Alexandria and Gasoek One                                             | SIL Open Font License 1.1 | Loaded from Google Fonts                                                                                                                                                                       |
| Illustrations and screen design                                             | Their authors             | Figma design by the project's designers                                                                                                                                                        |

Thanks to the course instructors and tutors for their feedback on Pip's role in the exercises.
