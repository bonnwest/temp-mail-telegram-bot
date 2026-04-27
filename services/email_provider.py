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



    LISTENER_TIMEOUT = 5 * 60  # stop polling after 5 minutes
    POLL_INTERVAL = 10          # seconds between each check

    def start_listener(self, token, bot, tg_id, loop):
        def send(message):
            subject = message.get('subject', 'no subject')
            content = message.get('text', 'empty mail') or message.get('html') or 'empty content'
            sender = message.get('from', {}).get('address', 'unknown sender')
            text = f"from: {sender}\nsubject: {subject}\n\n{content}"
            asyncio.run_coroutine_threadsafe(bot.send_message(tg_id, text), loop)

        def run():
            stop = threading.Event()
            threading.Timer(self.LISTENER_TIMEOUT, stop.set).start()
            seen_ids: set = set()
            headers = {"Authorization": f"Bearer {token}"}

            while not stop.is_set():
                try:
                    response = requests.get("https://api.mail.tm/messages", headers=headers, timeout=10)
                    response.raise_for_status()
                    for msg in response.json().get("hydra:member", []):
                        msg_id = msg.get("id") or msg.get("@id")
                        if msg_id and msg_id not in seen_ids:
                            seen_ids.add(msg_id)
                            send(msg)
                except Exception as e:
                    print(f"Listener error: {e}")

                stop.wait(self.POLL_INTERVAL)

        threading.Thread(target=run, daemon=True).start()
        