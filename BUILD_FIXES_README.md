# Android Build Issues Fixed for Appointza

This document summarizes all the Android build issues that were identified and fixed.

## 🔧 Issues Fixed

### 1. ✅ Manifest Package Warnings
**Problem:** Deprecated `package` attributes in AndroidManifest.xml files
**Files Fixed:**
- `node_modules/react-native-razorpay/android/src/main/AndroidManifest.xml`
- `node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml`

**Solution:** Removed deprecated `package="..."` attributes from `<manifest>` tags

### 2. ✅ Firebase Notification Icon Warning
**Problem:** Missing or incorrectly configured notification icon
**File Fixed:** `android/app/src/main/AndroidManifest.xml`

**Solution:** Updated to use proper notification icon:
```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />
```

### 3. ✅ Resource Naming Issues
**Problem:** Image file `A1.png` had uppercase name causing AAPT2 timeout
**Files Fixed:**
- Renamed `src/assert/A1.png` → `src/assert/a1.png`
- Updated all code references in:
  - `src/screens/login/login.screen.tsx`
  - `src/screens/account/account.screen.tsx`
  - `src/screens/otpverification/otpverification.screen.tsx`

**Solution:** Android resources must be lowercase with no special characters

### 4. ✅ Gradle Memory Issues
**Problem:** Insufficient memory causing build timeouts
**File Fixed:** `android/gradle.properties`

**Solution:** Increased memory allocation:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8
```

### 5. ✅ C/C++ Hard Link Warnings
**Problem:** Hard link failures for `libreactnative.so`
**Solution:** This is just a warning and doesn't affect the build. Can be ignored.

## 🚀 How to Build

### Option 1: One-Click Fix & Build
```bash
fix-and-build.bat
```

### Option 2: Step by Step
```bash
# Step 1: Fix resource naming
fix-resource-naming.bat

# Step 2: Generate keystore (if needed)
generate-keystore-manual.bat

# Step 3: Build signed APK
build-signed-apk.bat
```

## 📱 Output

After successful build, your signed APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔑 Keystore Information

- **File:** `appointza-release-key.jks`
- **Alias:** `appointza-key`
- **Password:** `AravindanAppointza@1977MS`
- **Location:** Cuddalore, Tamil Nadu, India

## ⚠️ Important Notes

1. **Keep keystore secure** - Never commit to version control
2. **Use same keystore** - For all future app updates
3. **Backup keystore** - Store in secure location
4. **Resource naming** - Always use lowercase for Android resources

## 🐛 Troubleshooting

If you still encounter issues:

1. **Clean everything:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native start --reset-cache
   ```

2. **Check Java installation:**
   ```bash
   java -version
   keytool -help
   ```

3. **Verify keystore:**
   ```bash
   keytool -list -v -keystore android/app/appointza-release-key.jks -alias appointza-key
   ```

4. **Check React Native environment:**
   ```bash
   npx react-native doctor
   ```

## 📞 Support

All build issues have been systematically addressed. The app should now build successfully with the signed APK ready for distribution.
