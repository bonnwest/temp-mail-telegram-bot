# tempmail-tg

A Telegram bot that generates disposable email addresses and forwards incoming mail to the user in real time. Also ships with a static web app that provides the same live inbox experience — no Telegram required.

**[Try the live demo →](https://bonnwest.github.io/temp-mail-telegram-bot/)** · **[Open in Telegram →](https://t.me/anonybox_bot)**

## Features

- Creates a temporary email address via [mail.tm](https://mail.tm) on demand
- Listens for new messages and pushes them to Telegram instantly
- Listener auto-stops after 5 minutes to avoid runaway polling
- Manual inbox check via a button
- Stores each user's active email and token in a local SQLite database
- Static web app with a live inbox — fully functional, no backend needed

## Stack

| Layer | Library / Tech |
|---|---|
| Telegram bot | [aiogram 3](https://docs.aiogram.dev/) |
| Temp mail API | [mailtm](https://pypi.org/project/mailtm/) + direct REST calls |
| Database | aiosqlite (SQLite) |
| Config | python-dotenv |
| Web app | Vanilla HTML / CSS / JS (GitHub Pages) |

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/bonnwest/temp-mail-telegram-bot
   cd tempmail-tg
   ```

2. **Create a virtual environment and install dependencies**

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   TELEGRAM_TOKEN=your_bot_token_here
   ```

4. **Run the bot**

   ```bash
   python bot.py
   ```

## Usage

| Button | Action |
|---|---|
| `Get Email` | Generate a new temporary email address |
| `Check Inbox` | Manually fetch messages from the current inbox |

When a new email is generated the bot starts a background listener that polls for incoming messages every 5 seconds. The listener stops automatically after **5 minutes**.

## Web App

The `web/` folder is a self-contained static site that replicates the bot experience in the browser. It calls the `mail.tm` REST API directly from the client — no server, no build step.

**To run locally:**

```bash
cd web && python -m http.server 8080
# open http://localhost:8080
```

**To deploy on GitHub Pages:**

1. Push the repo to GitHub
2. Go to **Settings → Pages → Source** → branch `main`, folder `/web`
3. Your site will be live at `https://<username>.github.io/<repo-name>/`

The web app shares the same rate limit logic as the bot (5-min cooldown for new email, 30-sec cooldown for inbox check) and requires zero changes to `bot.py`.

## Project Structure

```
tempmail-tg/
├── bot.py                  # Telegram handlers and entry point
├── services/
│   └── email_provider.py   # mail.tm integration and background listener
├── database/
│   └── db.py               # aiosqlite CRUD helpers
├── web/
│   ├── index.html          # landing page + live demo
│   ├── style.css           # dark theme
│   └── script.js           # mail.tm API calls, polling, UI logic
├── requirements.txt
└── .env                    # not committed
```

## Requirements

See `requirements.txt`. Key packages: `aiogram`, `aiosqlite`, `mailtm`, `requests`, `python-dotenv`.