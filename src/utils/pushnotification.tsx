// import firebase from '@react-native-firebase/app';
// import messaging from '@react-native-firebase/messaging';
// import PushNotification, {Importance} from 'react-native-push-notification';
// import {Platform} from 'react-native';
// import {CommonActions, NavigatorScreenParams, useNavigation} from '@react-navigation/native';
// import { navigationRef } from '../appstack.navigation';

// const createdChannelId = Math.random().toString(36).substring(7);

// class PushNotificationUtils {
//   TAG: string = 'PushNotificationUtils';
//   lastmsgid: number = 0;
//    navigation = useNavigation<['navigation']>();
//   registerPushNotification = (props: any) => {
//     PushNotification.configure({
//       onRegister: token => {
//         console.log('TOKEN:', token);
//         // this.createChannel(createdChannelId);
//         // this.showNotifications(createdChannelId, {
//         //     message: "message - notification",
//         //     title: "title - notification"
//         // });
//       },
//       onNotification: (notification: any) => {
//         console.log('NOTIFICATION: test', notification, notification.body);

//         const clicked = notification.userInteraction;
//         if (clicked) {
//           navigationRef.current?.navigate('Chat');
//           if (Platform.OS === 'ios') {
//             PushNotification.cancelLocalNotification(notification.data.id);
//           } else {
//             PushNotification.cancelLocalNotification(notification.id);
//           }
//         } else {
//           this.createChannel(createdChannelId);
//           this.showNotifications(createdChannelId, notification);
//         }
//       },

//       onAction: function (notification: { action: any; }) {
//         console.log('ACTION:', notification.action);
//         console.log('NOTIFICATION:', notification);
//       },
//       onRegistrationError: function (err: { message: any; }) {
//         console.error(err.message, err);
//       },
//       permissions: {
//         alert: true,
//         badge: true,
//         sound: true,
//       },

//       popInitialNotification: true,
//       requestPermissions: Platform.OS === 'ios',
//     });
//   };
//   createChannel = (channelId: string) => {
//     PushNotification.createChannel(
//       {
//         channelId: channelId,
//         channelName: 'My Channel',
//         playSound: true,
//         soundName: 'default',
//         importance: Importance.HIGH,
//         vibrate: true,
//       },
//       created => {
//         console.log('created channel ', created);
//       },
//     );
//   };

//   showNotifications = (channelId: string, notification: any) => {
//     console.log(' show notification -- entered', notification);
//     try {
//       if (notification && notification != '') {
//         console.log(' show notification -- notification', notification);
//         PushNotification.localNotification({
//           channelId: channelId,
//           title: notification.title,
//           message: notification.message,
//           vibrate: true,
//           vibration: 300,
//           largeIcon: 'ic_launcher',
//           // largeIconUrl: require('../../assets/logo.png'),
//           smallIcon: 'ic_notification',
//         });
//         console.log(' show notification -- notification', notification);
//       }
//     } catch (error) {
//       console.log(' show notification error -- ', error);
//     }
//   };

//   getPushNotificationToken = async (): Promise<string> => {
//     console.log('asdfghjkl;fdsdfghjiop[poiuydfghjkl');

//     var result: string = '';
//     try {
//       result = await new Promise((resolve, reject) => {
//         // var firebaseConfig = {
//         //     apiKey: "",
//         //     authDomain: "",
//         //     projectId: "",
//         //     storageBucket: "",
//         //     messagingSenderId: "",
//         //     appId: "",
//         //     measurementId: ""
//         // };

//         // firebase.initializeApp(firebaseConfig);
//         messaging()
//           .getToken()
//           .then((token: any) => {
//             console.log('getPushNotificationToken token ', token);
//             this.createChannel(createdChannelId);
//             // this.showNotifications(createdChannelId, {
//             //   title: 'title-notification',
//             //   message: 'message-notification',
//             // });

//             resolve(token);
//           })
//           .catch(e => {
//             reject(e);
//           });
//       });
//     } catch (error) {
//       console.log(`${this.TAG}:getPushNotificationToken:error=>`, error);
//     }
//     return result;
//   };
// }

// export const pushnotification_utils = new PushNotificationUtils();
