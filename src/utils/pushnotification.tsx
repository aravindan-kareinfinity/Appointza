import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import PushNotification, {Importance} from 'react-native-push-notification';
import {Platform} from 'react-native';
import {navigationRef} from '../appstack.navigation';
import {CommonActions, NavigatorScreenParams} from '@react-navigation/native';
import {HomeTabParamList} from '../hometab.navigation';

const createdChannelId = Math.random().toString(36).substring(7);

class PushNotificationUtils {
  TAG: string = 'PushNotificationUtils';
  lastmsgid: number = 0;

  registerPushNotification = (props: any) => {
    try {
      console.log('🔔 Registering push notifications...');
      PushNotification.configure({
        onRegister: token => {
          console.log('🔔 Push notification token received:', token);
          try {
            this.createChannel(createdChannelId);
            console.log('✅ Notification channel created');
    } catch (error) {
            console.error('❌ Error creating notification channel:', error);
          }
        },
        onNotification: (notification: any) => {
          console.log('🔔 NOTIFICATION: received', {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            userInteraction: notification.userInteraction,
            platform: Platform.OS
          });

          try {
            const clicked = notification.userInteraction;
            if (clicked) {
              console.log('🔔 NOTIFICATION: clicked, handling navigation');
              
              // Add delay to ensure app is fully loaded
              setTimeout(() => {
                try {
                  console.log('🔔 NOTIFICATION: checking navigation ref...', {
                    hasRef: !!navigationRef,
                    hasCurrent: !!(navigationRef && navigationRef.current)
                  });
                  
                  // Safe navigation check
                  if (navigationRef && navigationRef.current) {
                    console.log('🔔 NOTIFICATION: navigating to HomeTab...');
                    navigationRef.current.navigate('HomeTab');
                    console.log('✅ NOTIFICATION: navigated to HomeTab successfully');
                    
                    // Cancel notification after handling
                    try {
                      if (Platform.OS === 'ios') {
                        PushNotification.cancelLocalNotification(notification.data?.id);
                      } else {
                        PushNotification.cancelLocalNotification(notification.id);
                      }
                      console.log('🔔 NOTIFICATION: cancelled successfully');
                    } catch (cancelError) {
                      console.error('❌ Error cancelling notification:', cancelError);
                    }
                  } else {
                    console.warn('⚠️ Navigation ref not available, will retry in 2 seconds');
                    // Retry after a longer delay
                    setTimeout(() => {
                      console.log('🔔 NOTIFICATION: retrying navigation...');
                      if (navigationRef && navigationRef.current) {
                        navigationRef.current.navigate('HomeTab');
                        console.log('✅ NOTIFICATION: retry navigation successful');
                      } else {
                        console.error('❌ NOTIFICATION: retry navigation failed - ref still not available');
                      }
                    }, 2000);
                  }
                } catch (navError: any) {
                  console.error('❌ Navigation error:', navError);
                  console.error('❌ Navigation error stack:', navError?.stack);
                }
              }, 500);
            } else {
              console.log('🔔 NOTIFICATION: not clicked, showing notification');
              this.createChannel(createdChannelId);
              this.showNotifications(createdChannelId, notification);
            }
          } catch (error: any) {
            console.error('❌ Error handling notification:', error);
            console.error('❌ Error stack:', error?.stack);
          }
        },

        onAction: function (notification) {
          console.log('ACTION:', notification.action);
          console.log('NOTIFICATION:', notification);
        },
        onRegistrationError: function (err) {
          console.error(err.message, err);
        },
        permissions: {
            alert: true,
            badge: true,
            sound: true,
          },

        popInitialNotification: true,
        requestPermissions: Platform.OS === 'ios',
      });
    } catch (error) {
      console.error('Push notification configuration error:', error);
    }
  };

  createChannel = (channelId: string) => {
    try {
      PushNotification.createChannel(
        {
          channelId: channelId,
          channelName: 'My Channel',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        created => {
          console.log('created channel ', created);
        },
      );
    } catch (error) {
      console.error('Channel creation error:', error);
    }
  };

  showNotifications = (channelId: string, notification: any) => {
    console.log(' show notification -- entered', notification);
    try {
      if (notification && notification != '') {
        console.log(' show notification -- notification', notification);
        
        // Safe notification data extraction
        const title = notification.title || notification.data?.title || 'Notification';
        const message = notification.message || notification.body || notification.data?.body || 'New message';
        
        // Create notification with proper data handling
        const notificationData = {
          channelId: channelId,
          title: title,
          message: message,
          vibrate: true,
          vibration: 300,
          largeIcon: 'ic_launcher',
          smallIcon: 'ic_notification',
          playSound: true,
          soundName: 'default',
          // Add data for handling when notification is pressed
          userInfo: {
            id: notification.id || Date.now().toString(),
            data: notification.data || {},
            type: notification.type || 'default'
          }
        };
        
        PushNotification.localNotification(notificationData);
        console.log(' show notification -- notification sent', notification);
      }
    } catch (error) {
      console.log(' show notification error -- ', error);
    }
  };

  getPushNotificationToken = async (): Promise<string> => {
    console.log('Getting push notification token...');

    var result: string = '';
    try {
      result = await new Promise((resolve, reject) => {
        // var firebaseConfig = {
        //     apiKey: "",
        //     authDomain: "",
        //     projectId: "",
        //     storageBucket: "",
        //     messagingSenderId: "",
        //     appId: "",
        //     measurementId: ""
        // };

        // firebase.initializeApp(firebaseConfig);
        messaging()
          .getToken()
          .then((token: any) => {
            console.log('getPushNotificationToken token ', token);
            this.createChannel(createdChannelId);
            // this.showNotifications(createdChannelId, {
            //   title: 'title-notification',
            //   message: 'message-notification',
            // });

            resolve(token);
          })
          .catch(e => {
            reject(e);
          });
      });
    } catch (error) {
      console.log(`${this.TAG}:getPushNotificationToken:error=>`, error);
    }
    return result;
  };
}

export const pushnotification_utils = new PushNotificationUtils();