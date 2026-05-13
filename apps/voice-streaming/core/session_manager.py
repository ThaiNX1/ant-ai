"""Session management for authenticated SSRC sessions."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class SessionMetadata:
    """Optional metadata attached to an SSRC session."""

    voice_config: Optional[str] = None
    session_timeout: Optional[int] = None
    ai_model: Optional[str] = None


@dataclass
class SessionRecord:
    """Tracks the state of a single authenticated SSRC session."""

    ssrc: int
    created_at: float
    last_activity: float
    client_addr: Optional[Tuple[str, int]] = None
    metadata: Optional[SessionMetadata] = None
    ai_session_started: bool = False
    ws_session: Any = None  # aiohttp.ClientWebSocketResponse for BE tts-stream
    stt_client: Any = None  # SttStreamClient for per-SSRC STT streaming
    stt_transcript_task: Any = None  # asyncio.Task for per-SSRC transcript loop


class SessionManager:
    """In-memory store of authenticated SSRC sessions.

    Sessions are keyed by SSRC (32-bit unsigned int).  The manager
    provides O(1) authentication checks and periodic idle-session
    cleanup.
    """

    def __init__(self, default_idle_timeout: int = 60) -> None:
        self._sessions: Dict[int, SessionRecord] = {}
        self._default_idle_timeout = default_idle_timeout

    def register(
        self,
        ssrc: int,
        metadata: Optional[SessionMetadata] = None,
    ) -> SessionRecord:
        """Create or replace a session for *ssrc*.

        Returns the newly created :class:`SessionRecord`.
        """
        now = time.monotonic()
        record = SessionRecord(
            ssrc=ssrc,
            created_at=now,
            last_activity=now,
            metadata=metadata,
        )
        self._sessions[ssrc] = record
        return record

    def deregister(self, ssrc: int) -> bool:
        """Remove the session for *ssrc*.

        Returns ``True`` if the session existed, ``False`` otherwise.
        """
        return self._sessions.pop(ssrc, None) is not None

    def is_authenticated(self, ssrc: int) -> bool:
        """Return ``True`` if *ssrc* has an active session (O(1) lookup)."""
        return ssrc in self._sessions

    def get_session(self, ssrc: int) -> Optional[SessionRecord]:
        """Return the :class:`SessionRecord` for *ssrc*, or ``None``."""
        return self._sessions.get(ssrc)

    def update_activity(
        self,
        ssrc: int,
        client_addr: Tuple[str, int],
    ) -> None:
        """Refresh *last_activity* and store the latest *client_addr*."""
        session = self._sessions.get(ssrc)
        if session is not None:
            session.last_activity = time.monotonic()
            session.client_addr = client_addr

    def get_active_count(self) -> int:
        """Return the number of currently active sessions."""
        return len(self._sessions)

    def cleanup_idle_sessions(self) -> List[int]:
        """Remove sessions that have exceeded their idle timeout.

        Uses ``metadata.session_timeout`` when set, otherwise falls
        back to ``default_idle_timeout``.

        Returns a list of expired SSRCs that were removed.
        """
        now = time.monotonic()
        expired: List[int] = []

        for ssrc, record in list(self._sessions.items()):
            timeout = self._default_idle_timeout
            if record.metadata and record.metadata.session_timeout is not None:
                timeout = record.metadata.session_timeout

            if now - record.last_activity > timeout:
                expired.append(ssrc)

        for ssrc in expired:
            del self._sessions[ssrc]

        return expired
