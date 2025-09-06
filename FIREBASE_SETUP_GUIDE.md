# Firebase Push Notifications Setup Guide for Appointza

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in your React Native Appointza app.

## Prerequisites

- Firebase project created
- React Native app with the following dependencies already installed:
  - `@react-native-firebase/app`
  - `@react-native-firebase/messaging`
  - `@notifee/react-native`

## Step 1: Firebase Console Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Follow the setup wizard

### 1.2 Add Android App
1. In Firebase Console, click "Add app" and select Android
2. Enter package name: `com.appointza`
3. Download `google-services.json` file
4. Replace the placeholder file at `android/app/google-services.json` with your actual file

### 1.3 Add iOS App (if needed)
1. In Firebase Console, click "Add app" and select iOS
2. Enter bundle ID: `com.appointza` (or your iOS bundle ID)
3. Download `GoogleService-Info.plist` file
4. Add it to your iOS project at `ios/Appointza/GoogleService-Info.plist`

### 1.4 Enable Cloud Messaging
1. In Firebase Console, go to "Cloud Messaging"
2. Enable the service if not already enabled

## Step 2: Android Configuration

### 2.1 Update google-services.json
Replace the placeholder content in `android/app/google-services.json` with your actual Firebase configuration:

```json
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "YOUR_PROJECT_ID",
    "storage_bucket": "YOUR_STORAGE_BUCKET"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_MOBILE_SDK_APP_ID",
        "android_client_info": {
          "package_name": "com.appointza"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "YOUR_ACTUAL_API_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

### 2.2 Update build.gradle
Ensure your `android/app/build.gradle` has the Google services plugin:

```gradle
apply plugin: "com.google.gms.google-services"
```

### 2.3 Update project-level build.gradle
In `android/build.gradle`, ensure you have:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

## Step 3: iOS Configuration (if applicable)

### 3.1 Add GoogleService-Info.plist
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project at `ios/Appointza/GoogleService-Info.plist`
3. Make sure it's added to the Xcode project

### 3.2 Update AppDelegate
In `ios/Appointza/AppDelegate.mm` or `AppDelegate.swift`, add:

```swift
import Firebase

// In application:didFinishLaunchingWithOptions:
FirebaseApp.configure()
```

## Step 4: Testing the Implementation

### 4.1 Test Token Generation
The app will automatically request permissions and generate FCM tokens when:
1. User requests OTP (initializes push notifications)
2. User logs in (saves token to server)

### 4.2 Test Notifications
You can test notifications using:

1. **Firebase Console**: Send test messages from Cloud Messaging section
2. **Server Integration**: Send notifications from your backend using FCM tokens
3. **Local Testing**: Use the `sendTestNotification()` method in the service

### 4.3 Debug Logs
Check console logs for:
- `✅ Firebase messaging permission granted`
- `✅ FCM Token obtained: [token]`
- `✅ Firebase push token saved successfully to server`

## Step 5: Server Integration

### 5.1 Backend API
Your server should have an endpoint to save FCM tokens:

```
POST /api/Users/UpdatePushToken
{
  "UserId": 123,
  "PushToken": "fcm_token_here"
}
```

### 5.2 Sending Notifications
Use FCM REST API or Admin SDK to send notifications:

```javascript
// Example using Firebase Admin SDK
const admin = require('firebase-admin');

const message = {
  notification: {
    title: 'Appointment Reminder',
    body: 'Your appointment is in 30 minutes'
  },
  data: {
    type: 'appointment_reminder',
    appointmentId: '123'
  },
  token: 'fcm_token_here'
};

admin.messaging().send(message);
```

## Step 6: Notification Types

The app handles these notification types:

- `appointment_success` - Appointment booking confirmed
- `appointment_reminder` - Appointment reminder
- `payment_success` - Payment completed
- `booking_confirmed` - Booking confirmed
- `booking_cancelled` - Booking cancelled
- `test` - Test notifications

## Step 7: Troubleshooting

### Common Issues:

1. **Token not generated**:
   - Check if permissions are granted
   - Verify google-services.json is correct
   - Check network connectivity

2. **Notifications not received**:
   - Verify FCM token is saved to server
   - Check notification payload format
   - Ensure app is not in battery optimization

3. **Permission denied**:
   - User needs to manually enable notifications in device settings
   - Check if app has notification permissions

### Debug Commands:

```javascript
// Check notification settings
const settings = await pushNotificationService.getNotificationSettings();

// Send test notification
await pushNotificationService.sendTestNotification();

// Check if notifications are enabled
const enabled = await pushNotificationService.areNotificationsEnabled();
```

## Step 8: Production Considerations

1. **Security**: Never expose FCM server key in client code
2. **Token Refresh**: Handle token refresh events
3. **Error Handling**: Implement proper error handling for network issues
4. **Analytics**: Track notification delivery and engagement
5. **Testing**: Test on both Android and iOS devices

## Support

For issues with this implementation:
1. Check Firebase Console for delivery reports
2. Review device logs for error messages
3. Verify all configuration files are correct
4. Test with Firebase Console test messaging feature

---

**Note**: This implementation uses both Firebase Cloud Messaging and Notifee for a complete push notification solution with local notification display capabilities.
