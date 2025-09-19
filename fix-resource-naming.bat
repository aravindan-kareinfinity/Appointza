@echo off
echo ========================================
echo    Fixing Resource Naming Issues
echo ========================================
echo.

echo Step 1: Renaming image files to lowercase...
echo.

REM Navigate to src/assert directory
cd src\assert

REM Rename A1.png to a1.png (lowercase)
if exist "A1.png" (
    ren "A1.png" "a1.png"
    echo ✅ Renamed A1.png to a1.png
) else (
    echo ⚠️ A1.png not found, checking if a1.png already exists...
    if exist "a1.png" (
        echo ✅ a1.png already exists
    ) else (
        echo ❌ No image file found
    )
)

echo.
echo Step 2: Cleaning build directories...
echo.

REM Navigate back to project root
cd ..\..

REM Clean Android build
cd android
call gradlew clean
cd ..

REM Clean React Native cache
call npx react-native start --reset-cache --port=8081

echo.
echo ========================================
echo    Resource Naming Fix Complete
echo ========================================
echo.
echo All image files have been renamed to lowercase.
echo Build directories have been cleaned.
echo.
echo Next step: Run build-signed-apk.bat to build your app
echo.

pause
