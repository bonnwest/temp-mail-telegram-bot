import aiosqlite
from datetime import datetime

class Database:
    def __init__(self, db_path='database/tempmail.db'):
        self.db_path = db_path

    async def create_tables(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    telegram_id INTEGER PRIMARY KEY,
                    telegram_username TEXT,
                    email TEXT,
                    token TEXT,
                    created_at TEXT
                )
            ''')
            await db.commit()

    async def add_or_update_user(self, telegram_id, telegram_username, email, token):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT OR REPLACE INTO users (telegram_id, telegram_username, email, token, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (telegram_id, telegram_username, email, token, datetime.utcnow().isoformat()))
            await db.commit()

    async def get_user_by_telegram_id(self, telegram_id):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                'SELECT email, token, created_at FROM users WHERE telegram_id = ?', 
                (telegram_id,)
            ) as cursor:
                return await cursor.fetchone()


    async def delete_user_by_telegram_id(self, telegram_id):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                DELETE FROM users WHERE telegram_id = ?
            ''', (telegram_id,))
            await db.commit()