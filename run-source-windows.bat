@echo off
REM ── AI Ensemble — Run from Source (Windows) ──
REM Ports: Debug=60416 | Inspect=57514 | Fallback=56897

setlocal

set APP_NAME=ai-ensemble
set ELECTRON_DEBUG_PORT=60416
set ELECTRON_INSPECT_PORT=57514
set ELECTRON_PORT=56897
set SCRIPT_DIR=%~dp0

REM ── Install deps if missing ──
if not exist "%SCRIPT_DIR%node_modules" (
    echo [*] Installing dependencies...
    cd /d "%SCRIPT_DIR%" && npm install
)

REM ── Launch ──
echo [*] Starting %APP_NAME% from source...
echo     Debug port: %ELECTRON_DEBUG_PORT%
echo     Inspect port: %ELECTRON_INSPECT_PORT%

cd /d "%SCRIPT_DIR%"
set NODE_ENV=development
npx electron . --no-sandbox --remote-debugging-port=%ELECTRON_DEBUG_PORT% --inspect=%ELECTRON_INSPECT_PORT% %*

endlocal
