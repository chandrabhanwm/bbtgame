@echo off
REM Double-click this file to check your changes in the browser instantly,
REM with no build and no deploy step.
REM
REM It starts Vite's dev server, which watches every file you edit and
REM hot-reloads the browser automatically -- this is the loop to use while
REM working, saving Vercel for when you actually want a shareable public link.

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: npm was not found on this computer.
  echo Install Node.js from https://nodejs.org ^(it includes npm^), then try again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First run -- installing dependencies ^(only happens once^)...
  call npm install
  if errorlevel 1 (
    echo.
    echo ERROR: npm install failed -- see the messages above for why.
    echo.
    pause
    exit /b 1
  )
)

start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"
call npm run dev

echo.
echo The dev server stopped. If that's unexpected, scroll up to see why.
pause
