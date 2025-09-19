@echo off
echo ========================================
echo    Appointza Android Signing Setup
echo ========================================
echo.

echo This script will set up everything needed for Android app signing.
echo.

echo Step 1: Generating keystore...
call generate-keystore.bat

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 2: Building signed APK...
    call build-signed-apk.bat
) else (
    echo.
    echo Keystore generation failed. Please fix the issues and try again.
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Your signed APK should be ready at:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
pause
