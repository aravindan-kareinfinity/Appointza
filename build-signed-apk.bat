@echo off
echo ========================================
echo    Appointza Signed APK Builder
echo ========================================
echo.

REM Check if keystore exists
if not exist "android\app\appointza-release-key.jks" (
    echo ERROR: Keystore file not found!
    echo Please run generate-keystore.bat first to create the keystore.
    echo.
    pause
    exit /b 1
)

echo Building signed APK for Appointza...
echo.

REM Navigate to android directory
cd android

REM Clean previous builds
echo Cleaning previous builds...
call gradlew clean

REM Build signed release APK
echo Building signed release APK...
call gradlew assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    SUCCESS! Signed APK Created
    echo ========================================
    echo.
    echo APK Location: android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo You can now install this APK on Android devices or upload to Google Play Store.
    echo.
    echo Keystore Details:
    echo - File: appointza-release-key.jks
    echo - Alias: appointza-key
    echo - Password: AravindanAppointza@1977MS
    echo.
) else (
    echo.
    echo ========================================
    echo    ERROR! Build Failed
    echo ========================================
    echo.
    echo Please check the error messages above and try again.
    echo Make sure all dependencies are installed correctly.
    echo.
)

echo Press any key to exit...
pause > nul
