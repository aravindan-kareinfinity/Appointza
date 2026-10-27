import { useCallback, useEffect, useState } from 'react';
import { hasValidSession } from '../services/firebase/hasValidSession';

export function useAuthSession() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const refresh = useCallback(async () => {
    const ok = await hasValidSession();
    setSignedIn(ok);
    return ok;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  return { ready, signedIn, refresh };
}
