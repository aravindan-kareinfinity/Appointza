import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import { PushNotificationService } from '../services/pushnotification.service';
import { NotificationHandler } from '../utils/notificationHandler';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const pushNotificationService = new PushNotificationService();
  const notificationHandler = NotificationHandler.getInstance();

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      console.log('🚀 Initializing push notifications...');
      
      // Request permission
      const hasPermission = await pushNotificationService.requestPermission();
      if (!hasPermission) {
        console.log('❌ Push notification permission denied');
        return;
      }

      // Get FCM token
      const token = await pushNotificationService.getToken();
      if (!token) {
        console.log('❌ Failed to get FCM token');
        return;
      }

      setPushToken(token);
      console.log('✅ FCM token obtained:', token);

      // Setup message handlers
      setupMessageHandlers();

      setIsInitialized(true);
      console.log('✅ Push notifications initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };

  const setupMessageHandlers = () => {
    try {
      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        try {
          console.log('📱 Message handled in the background!', remoteMessage);
          
          // Show notification when app is in background
          if (remoteMessage.notification) {
            // Use react-native-push-notification for background notifications
            const { pushnotification_utils } = await import('../utils/pushnotification');
            pushnotification_utils.createChannel('background_channel');
            pushnotification_utils.showNotifications('background_channel', {
              title: remoteMessage.notification.title || 'Notification',
              message: remoteMessage.notification.body || 'You have a new notification',
              data: remoteMessage.data
            });
          }
        } catch (error) {
          console.error('❌ Error in background message handler:', error);
        }
      });

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        try {
          console.log('📱 A new FCM message arrived!', remoteMessage);
          
          // Show local notification for foreground messages
          if (remoteMessage.notification) {
            notificationHandler.showNotification(
              remoteMessage.notification.title || 'Notification',
              remoteMessage.notification.body || 'You have a new notification',
              () => handleNotificationPress(remoteMessage)
            );
          }
        } catch (error) {
          console.error('❌ Error in foreground message handler:', error);
        }
      });

      // Handle notification opened app
      messaging().onNotificationOpenedApp((remoteMessage) => {
        try {
          console.log('📱 Notification caused app to open from background state:', remoteMessage);
          setTimeout(() => {
            handleNotificationPress(remoteMessage);
          }, 500);
        } catch (error) {
          console.error('❌ Error handling notification opened app:', error);
        }
      });

      // Check if app was opened by a notification
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          try {
            if (remoteMessage) {
              console.log('📱 Notification caused app to open from quit state:', remoteMessage);
              setTimeout(() => {
                handleNotificationPress(remoteMessage);
              }, 1000);
            }
          } catch (error) {
            console.error('❌ Error handling initial notification:', error);
          }
        })
        .catch((error) => {
          console.error('❌ Error getting initial notification:', error);
        });
    } catch (error) {
      console.error('❌ Error setting up message handlers:', error);
    }
  };

  const handleNotificationPress = (remoteMessage: any) => {
    try {
      console.log('📱 Handling notification press:', {
        hasData: !!remoteMessage?.data,
        dataKeys: remoteMessage?.data ? Object.keys(remoteMessage.data) : [],
        notification: remoteMessage?.notification,
        messageId: remoteMessage?.messageId
      });
      
      // Add delay to ensure app is fully loaded
      setTimeout(() => {
        try {
          console.log('📱 Processing notification data after delay...');
          const data = remoteMessage?.data;
          if (data) {
            console.log('📱 Notification data found:', data);
            // Use the safer notification handler
            notificationHandler.handleNotificationData(data);
            console.log('✅ Notification data processed successfully');
          } else {
            console.log('📱 No data in notification, but notification exists');
          }
        } catch (innerError) {
          console.error('❌ Error in delayed notification handling:', innerError);
          console.error('❌ Inner error stack:', innerError.stack);
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Error handling notification press:', error);
      console.error('❌ Error stack:', error.stack);
    }
  };

  const savePushToken = async (userId: number) => {
    if (!pushToken) {
      console.log('❌ No push token available to save');
      return false;
    }

    try {
      const success = await pushNotificationService.savePushToken(userId, pushToken);
      if (success) {
        console.log('✅ Push token saved successfully');
      } else {
        console.log('❌ Failed to save push token');
      }
      return success;
    } catch (error) {
      console.error('❌ Error saving push token:', error);
      return false;
    }
  };

  return {
    isInitialized,
    pushToken,
    savePushToken,
    initializePushNotifications
  };
};
