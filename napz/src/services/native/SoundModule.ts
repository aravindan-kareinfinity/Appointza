import { NativeModules } from 'react-native';

const { SoundModule } = NativeModules;

if (!SoundModule) {
  console.warn('SoundModule is not available');
}

export const SoundAPI = {
  playSound: (soundFilePath: string): Promise<string> => {
    return SoundModule?.playSound(soundFilePath) ?? Promise.reject('SoundModule not available');
  },

  stopSound: (): Promise<string> => {
    return SoundModule?.stopSound() ?? Promise.reject('SoundModule not available');
  },

  vibrate: (duration: number): Promise<string> => {
    return SoundModule?.vibrate(duration) ?? Promise.reject('SoundModule not available');
  },
};
