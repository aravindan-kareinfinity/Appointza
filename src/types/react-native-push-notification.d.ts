declare module 'react-native-push-notification' {
  export enum Importance {
    NONE = 0,
    MIN = 1,
    LOW = 2,
    DEFAULT = 3,
    HIGH = 4,
    MAX = 5,
  }

  interface PushNotificationObject {
    id?: string;
    title?: string;
    message?: string;
    userInteraction?: boolean;
    data?: {
      id?: string;
    };
  }

  interface PushNotificationStatic {
    configure(options: {
      onRegister?: (token: string) => void;
      onNotification?: (notification: PushNotificationObject) => void;
      onAction?: (notification: { action: string }) => void;
      onRegistrationError?: (error: { message: string }) => void;
      permissions?: {
        alert?: boolean;
        badge?: boolean;
        sound?: boolean;
      };
      popInitialNotification?: boolean;
      requestPermissions?: boolean;
    }): void;
    createChannel(
      channel: {
        channelId: string;
        channelName: string;
        playSound?: boolean;
        soundName?: string;
        importance?: Importance;
        vibrate?: boolean;
      },
      callback?: (created: boolean) => void
    ): void;
    localNotification(notification: {
      channelId: string;
      title: string;
      message: string;
      vibrate?: boolean;
      vibration?: number;
      largeIcon?: string;
      smallIcon?: string;
    }): void;
    cancelLocalNotification(id: string): void;
  }

  const PushNotification: PushNotificationStatic;
  export default PushNotification;
} 