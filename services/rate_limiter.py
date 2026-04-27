import time


class RateLimiter:
    def __init__(self):
        self._last_called: dict[str, dict[int, float]] = {}

    def is_allowed(self, action: str, user_id: int, cooldown: float) -> tuple[bool, float]:
        """Returns (allowed, seconds_remaining)."""
        now = time.monotonic()
        bucket = self._last_called.setdefault(action, {})
        last = bucket.get(user_id, 0.0)
        remaining = cooldown - (now - last)
        if remaining > 0:
            return False, remaining
        bucket[user_id] = now
        return True, 0.0
