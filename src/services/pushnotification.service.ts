import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushnotification_utils } from '../utils/pushnotification';

class PushNotificationService {
  private static instance: PushNotificationService;
  private mockToken: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async requestUserPermission(): Promise<boolean> {
    try {
      // Request notification permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs notification permission to send you updates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled by react-native-push-notification
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      // Check if we have a stored token
      const storedToken = await AsyncStorage.getItem('pushNotificationToken');
      if (storedToken) {
        return storedToken;
      }

      // Get new token from push notification utils
      const token = await pushnotification_utils.getPushNotificationToken();
      if (token) {
        // Store the token for future use
        await AsyncStorage.setItem('pushNotificationToken', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting push notification token:', error);
      return null;
    }
  }

  async initializePushNotifications(): Promise<void> {
    try {
      console.log('Initializing push notifications...');
      
      // Request permissions
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return;
      }

      // Register push notifications
      pushnotification_utils.registerPushNotification({});

      // Get and store token
      const token = await this.getToken();
      if (token) {
        console.log('Push notification token obtained:', token);
        // You can send this token to your backend here
        // await this.sendTokenToBackend(token);
      }

      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  // Method to send local notification
  sendLocalNotification(title: string, message: string, data?: any): void {
    try {
      pushnotification_utils.sendLocalNotification(title, message, data);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Method to schedule local notification
  scheduleLocalNotification(title: string, message: string, date: Date, data?: any): void {
    try {
      pushnotification_utils.scheduleLocalNotification(title, message, date, data);
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  // Method to cancel all notifications
  cancelAllNotifications(): void {
    try {
      pushnotification_utils.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Method to cancel specific notification
  cancelNotification(id: string): void {
    try {
      pushnotification_utils.cancelNotification(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Method to send token to backend (placeholder for future implementation)
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // TODO: Implement sending token to your backend
      console.log('Token ready to be sent to backend:', token);
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  }
}

export default PushNotificationService; 