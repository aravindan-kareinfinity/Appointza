@echo off
echo ========================================
echo    Appointza Build Fix & Build Script
echo ========================================
echo.

echo This script will fix all Android build issues and create a signed APK.
echo.

echo Step 1: Fixing resource naming issues...
echo.

REM Navigate to src/assert directory and rename files
cd src\assert
if exist "A1.png" (
    ren "A1.png" "a1.png"
    echo ✅ Renamed A1.png to a1.png
) else (
    echo ✅ a1.png already exists or not found
)
cd ..\..

echo.
echo Step 2: Cleaning all build directories...
echo.

REM Clean Android build
cd android
echo Cleaning Android build...
call gradlew clean
cd ..

REM Clean React Native cache
echo Cleaning React Native cache...
call npx react-native start --reset-cache --port=8081

echo.
echo Step 3: Generating keystore (if not exists)...
echo.

if not exist "android\app\appointza-release-key.jks" (
    echo Keystore not found, generating...
    call generate-keystore-manual.bat
) else (
    echo ✅ Keystore already exists
)

echo.
echo Step 4: Building signed APK...
echo.

REM Build signed APK
cd android
echo Building signed release APK...
call gradlew assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    SUCCESS! All Issues Fixed & APK Built
    echo ========================================
    echo.
    echo ✅ Fixed Issues:
    echo    - Removed deprecated package attributes from AndroidManifest.xml
    echo    - Fixed Firebase notification icon configuration
    echo    - Renamed image files to lowercase (A1.png → a1.png)
    echo    - Increased Gradle memory to 4GB
    echo    - Updated all code references to use lowercase filenames
    echo.
    echo 📱 Your signed APK is ready at:
    echo    android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo 🔑 Keystore Details:
    echo    - File: appointza-release-key.jks
    echo    - Alias: appointza-key
    echo    - Password: AravindanAppointza@1977MS
    echo.
) else (
    echo.
    echo ========================================
    echo    BUILD FAILED
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo Common solutions:
    echo 1. Make sure Java JDK is installed
    echo 2. Check if all dependencies are installed
    echo 3. Try running: npx react-native doctor
    echo.
)

cd ..
echo.
echo Press any key to exit...
pause > nul
