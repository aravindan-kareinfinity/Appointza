import { Alert } from 'react-native';

export class NotificationHandler {
  private static instance: NotificationHandler;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): NotificationHandler {
    if (!NotificationHandler.instance) {
      NotificationHandler.instance = new NotificationHandler();
    }
    return NotificationHandler.instance;
  }

  // Safe notification display
  showNotification(title: string, body: string, onPress?: () => void) {
    try {
      // Prevent multiple alerts at once
      if (this.isProcessing) {
        console.log('📱 Notification already being processed, skipping...');
        return;
      }

      this.isProcessing = true;

      // Use setTimeout to ensure UI is ready
      setTimeout(() => {
        try {
          Alert.alert(
            title || 'Notification',
            body || 'You have a new notification',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  try {
                    if (onPress) {
                      onPress();
                    }
                  } catch (error) {
                    console.error('❌ Error in notification onPress:', error);
                  } finally {
                    this.isProcessing = false;
                  }
                }
              }
            ],
            { 
              cancelable: true,
              onDismiss: () => {
                this.isProcessing = false;
              }
            }
          );
        } catch (error) {
          console.error('❌ Error showing notification alert:', error);
          this.isProcessing = false;
        }
      }, 200);
    } catch (error) {
      console.error('❌ Error in showNotification:', error);
      this.isProcessing = false;
    }
  }

  // Handle notification data safely
  handleNotificationData(data: any) {
    try {
      console.log('📱 Processing notification data:', data);
      
      if (!data || typeof data !== 'object') {
        console.log('📱 Invalid notification data');
        return;
      }

      const type = data.type;
      if (!type) {
        console.log('📱 No notification type found');
        return;
      }

      // Handle different notification types
      switch (type) {
        case 'appointment_success':
          console.log('📱 Appointment success notification');
          break;
        case 'payment_success':
          console.log('📱 Payment success notification');
          break;
        case 'appointment_reminder':
          console.log('📱 Appointment reminder notification');
          break;
        case 'appointment_cancelled':
          console.log('📱 Appointment cancelled notification');
          break;
        case 'test_notification':
        case 'test_notification_admin':
        case 'dummy_notification':
        case 'dummy_notification_admin':
          console.log('📱 Test notification');
          break;
        default:
          console.log('📱 Unknown notification type:', type);
      }
    } catch (error) {
      console.error('❌ Error handling notification data:', error);
    }
  }

  // Reset processing state
  reset() {
    this.isProcessing = false;
  }
}
