import asyncio
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from services.email_provider import EmailProvider
from database.db import Database
from dotenv import load_dotenv


# loading config
load_dotenv()
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher()


# class initialization
provider = EmailProvider()
db = Database()

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Get Email")],
            [KeyboardButton(text="Check Inbox")],
        ],
        resize_keyboard=True,
        persistant=True
    )
    await message.answer("Hey! Don't want to share your personal email?\nI've got something for you.", reply_markup=keyboard)


@dp.message(F.text == "Get Email")
async def generate_email(message: types.Message):
    email, token = provider.create_email()
    if email and token:
        await db.add_or_update_user(message.from_user.id, message.from_user.username, email, token)
        provider.start_listener(token, bot, message.from_user.id, asyncio.get_event_loop())
        await message.answer(f"Your new email: {email}")
    else:
        await message.answer("Please try again in a moment.")

@dp.message(F.text == "Check Inbox")
async def check_email(message: types.Message):
    user = await db.get_user_by_telegram_id(message.from_user.id)
    if user:
        messages = provider.get_messages_sync(user['token'])

        if messages:
            for msg in messages:
                sender = msg.get('from', {}).get('address', 'Unknown')
                subject = msg.get('subject', 'No subject')
                intro = msg.get('intro', '')

                await message.answer(f"From: {sender}\nSubject: {subject}\n\n{intro}")
        else:
            await message.answer("No messages yet.")
    else:
        await message.answer("Create an email first.")



async def main():
    await db.create_tables()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())