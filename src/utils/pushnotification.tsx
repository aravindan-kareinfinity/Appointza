import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidColor } from '@notifee/react-native';
import { Alert } from 'react-native';

type NotificationData = {
  [key: string]: string | number | boolean;
};

class PushNotificationService {
  private static instance: PushNotificationService;
  private defaultChannelId = 'default_channel';

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // ==================== Initialization ====================
  async initialize(): Promise<void> {
    try {
      console.log('[FCM] Initializing push notifications...');
      
      // 1. Request permissions
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        console.warn('[FCM] Notification permission denied');
        return;
      }

      // 2. Create notification channel (Android)
      await this.createDefaultChannel();

      // 3. Get/refresh FCM token
      await this.getToken();

      // 4. Setup all listeners
      this.setupListeners();

      console.log('[FCM] Initialization complete');
    } catch (error) {
      console.error('[FCM] Initialization failed:', error);
    }
  }

  // ==================== Permission Handling ====================
  async requestUserPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // No special permission needed for older Android
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('[FCM] Permission error:', error);
      return false;
    }
  }

  // ==================== Token Management ====================
  async getToken(): Promise<string | null> {
    try {
      // Check if we have a stored token
      const storedToken = await AsyncStorage.getItem('fcm_token');
      if (storedToken) return storedToken;

      // Get new FCM token
      const token = await messaging().getToken();
      
      if (!token) {
        console.warn('[FCM] Empty token received');
        return null;
      }

      console.log('[FCM] New token:', token);
      await AsyncStorage.setItem('fcm_token', token);
      await this.sendTokenToServer(token);
      return token;
    } catch (error) {
      console.error('[FCM] Token error:', error);
      return null;
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // TODO: Implement your server synchronization logic here
      console.log('[FCM] Token ready for server:', token);
      // Example: await api.updateFcmToken(token);
    } catch (error) {
      console.error('[FCM] Server sync error:', error);
    }
  }

  // ==================== Channel Setup (Android) ====================
  async createDefaultChannel(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      await notifee.createChannel({
        id: this.defaultChannelId,
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: AndroidColor.RED,
      });
      return true;
    } catch (error) {
      console.error('[FCM] Channel creation error:', error);
      return false;
    }
  }

  // ==================== Notification Listeners ====================
  private setupListeners(): void {
    // Token refresh listener
    messaging().onTokenRefresh(async (newToken: string) => {
      console.log('[FCM] Token refreshed:', newToken);
      await AsyncStorage.setItem('fcm_token', newToken);
      await this.sendTokenToServer(newToken);
    });

    // Foreground messages
    messaging().onMessage(async (remoteMessage: { notification: { title: any; body: any; }; data: NotificationData | undefined; }) => {
      console.log('[FCM] Foreground message:', remoteMessage);
      this.displayNotification(
        remoteMessage.notification?.title || 'New message',
        remoteMessage.notification?.body || '',
        remoteMessage.data
      );
    });

    // Background/quit state messages
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('[FCM] Background message:', remoteMessage);
      // You can perform background tasks here
    });

    // Notification opened handler
    messaging().getInitialNotification().then((remoteMessage: any) => {
      if (remoteMessage) {
        console.log('[FCM] Launch notification:', remoteMessage);
        this.handleNotificationOpen(remoteMessage);
      }
    });

    // Notifee foreground handler (optional)
    notifee.onForegroundEvent(({ type, detail }: { type: string; detail: notifee.EventDetail }) => {
      if (type === 'press' && detail.notification) {
        this.handleNotificationOpen({
          data: detail.notification.data as NotificationData
        } as FirebaseMessagingTypes.RemoteMessage);
      }
    });
  }

  // ==================== Notification Display ====================
  async displayNotification(
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<void> {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: this.defaultChannelId,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_notification', // Make sure this resource exists
          color: '#FF0000', // Red accent color
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
    } catch (error) {
      console.error('[FCM] Notification display error:', error);
    }
  }

  // ==================== Notification Handling ====================
  private handleNotificationOpen(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    // TODO: Implement your navigation logic based on notification data
    console.log('[FCM] Handling notification open:', remoteMessage.data);
    
    // Example: Navigate to specific screen based on data
    // const { screen, id } = remoteMessage.data || {};
    // navigation.navigate(screen, { id });
  }

  // ==================== Utility Methods ====================
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem('fcm_token');
      console.log('[FCM] Token deleted');
    } catch (error) {
      console.error('[FCM] Token deletion error:', error);
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      return await messaging().hasPermission();
    } catch (error) {
      console.error('[FCM] Permission check error:', error);
      return false;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await notifee.getBadgeCount();
    } catch (error) {
      console.error('[FCM] Badge count error:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await notifee.setBadgeCount(count);
    } catch (error) {
      console.error('[FCM] Set badge error:', error);
    }
  }
}

export default PushNotificationService;