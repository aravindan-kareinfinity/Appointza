import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import type { SavedPlace } from '../types/place';

const STORAGE_KEY = 'savedPlaces';

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setPlaces(raw ? JSON.parse(raw) : []);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback(async (next: SavedPlace[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPlaces(next);
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(() => {
      void load();
    });
    return unsubscribe;
  }, [load]);

  return { places, loading, load, persist };
}
