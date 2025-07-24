@echo off
echo Cleaning Android build...
cd android
call gradlew clean
echo.
echo Building Android APK...
call gradlew assembleDebug
echo.
echo Build completed! Check android/app/build/outputs/apk/debug/ for the APK file.
pause 