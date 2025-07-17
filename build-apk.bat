@echo off
echo Building Appointza Release APK...

REM Clean the project
cd android
call gradlew clean

REM Build release APK
call gradlew assembleRelease --no-daemon

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! APK built successfully!
    echo APK location: android\app\build\outputs\apk\release\app-release.apk
    echo.
    dir android\app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo BUILD FAILED! Trying alternative approach...
    echo.
    
    REM Try building with debug keystore
    echo Trying with debug configuration...
    call gradlew assembleDebug --no-daemon
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo SUCCESS! Debug APK built successfully!
        echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
        echo.
        dir android\app\build\outputs\apk\debug\app-debug.apk
    ) else (
        echo.
        echo ALL BUILD ATTEMPTS FAILED!
        echo Please check the error messages above.
    )
)

pause 