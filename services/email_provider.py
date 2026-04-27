from mailtm import Email
import time
import threading
import asyncio
import requests

class EmailProvider:
    def __init__(self):
        pass


    def create_email(self):
        email = Email()
        time.sleep(0.5)
        email.register()
        return email.address, email.token


    def get_messages_sync(self, token):
        try:
            headers = {"Authorization": f"Bearer {token}"}
            # Делаем прямой запрос к API по документации
            response = requests.get("https://api.mail.tm/messages", headers=headers)
            response.raise_for_status()
            
            data = response.json()
            # Mail.tm хранит массив писем в ключе 'hydra:member'
            return data.get("hydra:member", [])
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return []



    def start_listener(self, token, bot, tg_id, loop):
        def listener(message):
            subject = message.get('subject', 'no subject')
            content = message.get('text', 'empty mail') or message.get('html') or 'empty content'
            sender_data = message.get('from', {})
            sender = sender_data.get('address', 'unknown sender')
            
            text = f"from: {sender}\nsubject: {subject}\n\n{content}"
            
            asyncio.run_coroutine_threadsafe(
                bot.send_message(tg_id, text), 
                loop
            )

        def run():
            try:
                account = Email()
                account.token = token
                account.start(listener, interval=5)
            except Exception as e:
                print(f"Listener crash: {e}")

        threading.Thread(target=run, daemon=True).start()
        