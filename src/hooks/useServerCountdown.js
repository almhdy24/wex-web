import { useState, useEffect } from 'react';
import { getServerTimeOffset } from '../api/client';

export function useServerCountdown(lockExpiresAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockExpiresAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const offset = getServerTimeOffset();
  const currentTime = now + offset;
  const expiresAt = lockExpiresAt ? new Date(lockExpiresAt).getTime() : 0;
  const secondsRemaining = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));

  return {
    secondsRemaining,
    isExpired: expiresAt > 0 && secondsRemaining <= 0,
    serverTimeOffset: offset,
  };
}
