from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Dict


class IdempotencyStore:
    def __init__(self) -> None:
        self._store: Dict[str, datetime] = {}

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def cleanup(self) -> None:
        now = self._now()
        expired = [k for k, exp in self._store.items() if exp <= now]
        for k in expired:
            self._store.pop(k, None)

    def has(self, key: str) -> bool:
        self.cleanup()
        exp = self._store.get(key)
        return bool(exp and exp > self._now())

    def mark(self, key: str, ttl_seconds: int = 300) -> None:
        self._store[key] = self._now() + timedelta(seconds=ttl_seconds)
        self.cleanup()

    def check_and_mark(self, key: str, ttl_seconds: int = 300) -> bool:
        if self.has(key):
            return False
        self.mark(key, ttl_seconds)
        return True

    def clear(self) -> None:
        self._store.clear()


store = IdempotencyStore()
