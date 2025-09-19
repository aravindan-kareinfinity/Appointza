# Android App Signing Setup for Appointza

This guide contains everything you need to sign your Appointza Android app for release.

## 🔑 Keystore Information

- **Keystore File:** `appointza-release-key.jks`
- **Alias:** `appointza-key`
- **Keystore Password:** `AravindanAppointza@1977MS`
- **Key Password:** `AravindanAppointza@1977MS`
- **Developer:** Appointza Developer
- **Organization:** Appointza Technologies
- **Location:** Cuddalore, Tamil Nadu, India

## 📁 Files Created

1. **`keystore-config.txt`** - Contains all keystore configuration details
2. **`generate-keystore.bat`** - Automated keystore generation script
3. **`generate-keystore-manual.bat`** - Manual keystore generation script
4. **`build-signed-apk.bat`** - Script to build signed APK
5. **`setup-android-signing.bat`** - Complete setup script (runs everything)
6. **`android/gradle.properties`** - Updated with keystore configuration
7. **`android/app/build.gradle`** - Updated with signing configuration

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the complete setup
setup-android-signing.bat
```

### Option 2: Step by Step
```bash
# Step 1: Generate keystore
generate-keystore.bat

# Step 2: Build signed APK
build-signed-apk.bat
```

### Option 3: Manual Keystore Generation
```bash
# If you prefer to enter details manually
generate-keystore-manual.bat
```

## 📱 Output

After successful build, your signed APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## ⚠️ Important Security Notes

1. **Keep keystore secure** - Never commit `appointza-release-key.jks` to version control
2. **Remember passwords** - You'll need them for all future app updates
3. **Backup keystore** - Store it in a secure location
4. **Same keystore** - Use the same keystore for all updates to the same app

## 🔧 Manual Commands

If you prefer to run commands manually:

### Generate Keystore
```bash
cd android/app
keytool -genkeypair -v -keystore appointza-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias appointza-key -storepass AravindanAppointza@1977MS -keypass AravindanAppointza@1977MS -dname "CN=Appointza Developer, OU=Development, O=Appointza Technologies, L=cuddalore, ST=tamilnadu, C=IN"
```

### Build Signed APK
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## 🐛 Troubleshooting

### Common Issues:
1. **Java not found** - Make sure Java JDK is installed
2. **Keytool not found** - Add Java bin directory to PATH
3. **Permission denied** - Run as administrator on Windows
4. **Build failed** - Check that all dependencies are installed

### Verification:
To verify your keystore was created correctly:
```bash
keytool -list -v -keystore android/app/appointza-release-key.jks -alias appointza-key
```

## 📞 Support

If you encounter any issues, check:
1. Java JDK is installed and accessible
2. Android SDK is properly configured
3. All file paths are correct
4. Keystore file exists before building

---

**Remember:** Keep your keystore file and passwords secure! You'll need them for every app update.
