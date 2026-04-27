# tempmail-tg

A Telegram bot that generates disposable email addresses and forwards incoming mail to the user in real time.

## Features

- Creates a temporary email address via [mail.tm](https://mail.tm) on demand
- Listens for new messages and pushes them to Telegram instantly
- Listener auto-stops after 5 minutes to avoid runaway polling
- Manual inbox check via a button
- Stores each user's active email and token in a local SQLite database

## Stack

| Layer | Library |
|---|---|
| Telegram bot | [aiogram 3](https://docs.aiogram.dev/) |
| Temp mail API | [mailtm](https://pypi.org/project/mailtm/) + direct REST calls |
| Database | aiosqlite (SQLite) |
| Config | python-dotenv |

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

## Project Structure

```
tempmail-tg/
├── bot.py                  # Telegram handlers and entry point
├── services/
│   └── email_provider.py   # mail.tm integration and background listener
├── database/
│   └── db.py               # aiosqlite CRUD helpers
├── requirements.txt
└── .env                    # not committed
```

## Requirements

See `requirements.txt`. Key packages: `aiogram`, `aiosqlite`, `mailtm`, `requests`, `python-dotenv`.
