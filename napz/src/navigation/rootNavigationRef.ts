import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

/** Name of the screen at the root stack (GoogleAuth or Main). */
export function getRootStackRouteName(): string | undefined {
  const state = rootNavigationRef.getRootState();
  if (!state?.routes?.length) return undefined;
  return state.routes[state.index ?? 0]?.name as string | undefined;
}

export function resetToGoogleAuth() {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'GoogleAuth' }] })
    );
  }
}

export function resetToMain() {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  }
}
