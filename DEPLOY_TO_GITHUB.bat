@echo off
echo ========================================
echo   GITHUB PAGES DEPLOYMENT HELPER
echo ========================================
echo.
echo This will help you prepare files for GitHub
echo.
echo STEP 1: Create a GitHub account at github.com
echo STEP 2: Create a new repository (make it PUBLIC)
echo STEP 3: Upload these files to your repository
echo STEP 4: Enable GitHub Pages in repository settings
echo.
echo ========================================
echo   FILES TO UPLOAD:
echo ========================================
echo.
dir /b *.html *.js *.css *.json *.md 2>nul
echo.
echo ========================================
echo.
echo After uploading, your app will be at:
echo   https://YOUR_USERNAME.github.io/REPO_NAME/
echo.
echo Press any key to open GitHub in browser...
pause >nul
start https://github.com/new

