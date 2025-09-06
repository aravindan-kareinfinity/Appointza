import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class PushNotificationService {
  private http: AxiosHelperUtils;
  private baseurl: string;
  private pushToken: string | null = null;

  constructor() {
    this.http = new AxiosHelperUtils();
    this.baseurl = environment.baseurl + '/api/Users';
  }

  // Request permission for push notifications
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      } else {
        console.log('Permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save push token to server
  async savePushToken(userId: number, token: string): Promise<boolean> {
    try {
      const response = await this.http.post<{ success: boolean }>(
        this.baseurl + '/UpdatePushToken',
        {
          UserId: userId,
          PushToken: token,
        }
      );
      return response.success;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  // Initialize push notifications
  async initialize(): Promise<string | null> {
    try {
      console.log('🚀 Initializing Firebase push notifications...');
      
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('❌ Push notification permission denied');
        return null;
      }

      console.log('✅ Push notification permission granted');

      // Get FCM token
      const token = await this.getToken();
      if (!token) {
        console.log('❌ Failed to get FCM token');
        return null;
      }

      console.log('✅ FCM token obtained:', token);

      // Set up message handlers
      this.setupMessageHandlers();

      return token;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return null;
    }
  }

  // Setup message handlers
  private setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived!', remoteMessage);
      
      // Show local notification for foreground messages
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || 'You have a new notification',
          [{ text: 'OK' }]
        );
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app was opened by a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  // Handle notification press
  private handleNotificationPress(remoteMessage: any) {
    const data = remoteMessage.data;
    if (data) {
      // Handle different notification types
      switch (data.type) {
        case 'appointment_success':
          // Navigate to appointment details or success screen
          console.log('Appointment success notification pressed');
          break;
        case 'payment_success':
          // Navigate to payment success screen
          console.log('Payment success notification pressed');
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    }
  }

  // Subscribe to topic (optional)
  async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  // Unsubscribe from topic (optional)
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }
}