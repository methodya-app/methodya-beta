@echo off
setlocal enabledelayedexpansion
title METHODYA - Entorno local

echo ============================================
echo   METHODYA - Iniciar entorno local de pruebas
echo ============================================
echo.

REM Se posiciona en la carpeta donde esta este .bat (raiz del repo)
cd /d "%~dp0"

REM --- 1) Verificar / iniciar Docker Desktop --------------------------------
echo [1/5] Verificando Docker...
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready

echo       Docker no esta corriendo. Intentando iniciar Docker Desktop...
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
) else (
    echo       No se encontro Docker Desktop en la ruta por defecto.
    echo       Inicialo manualmente si el paso siguiente no avanza.
)
echo       Esperando a que Docker este listo (puede tardar uno o dos minutos)...

:wait_docker
"%SystemRoot%\System32\timeout.exe" /t 3 /nobreak >nul
docker info >nul 2>&1
if errorlevel 1 goto wait_docker

:docker_ready
echo       Docker OK.
echo.

REM --- 2) Instalar dependencias si hace falta -------------------------------
if not exist "%~dp0node_modules" (
    echo       Instalando dependencias del backend...
    call npm install
)
if not exist "%~dp0web\node_modules" (
    echo       Instalando dependencias del frontend...
    pushd "%~dp0web"
    call npm install
    popd
)

REM --- 3) Levantar Supabase local --------------------------------------------
echo [2/5] Levantando Supabase local...
call npx supabase start
if errorlevel 1 (
    echo       ERROR al iniciar Supabase. Revisa el mensaje anterior.
    pause
    exit /b 1
)
echo.

REM --- 4) Levantar MongoDB local ----------------------------------------------
echo [3/5] Levantando MongoDB local (docker compose)...
docker compose up -d
if errorlevel 1 (
    echo       ERROR al iniciar MongoDB. Revisa el mensaje anterior.
    pause
    exit /b 1
)
echo.

REM --- 5) Levantar backend (dev-server.js) en su propia ventana ---------------
echo [4/5] Backend...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo       Ya hay algo escuchando en el puerto 3000, no se vuelve a iniciar.
) else (
    echo       Levantando backend en http://localhost:3000 ...
    start "METHODYA - Backend (API)" cmd /k "cd /d "%~dp0" && npm run dev"
)
echo.

REM --- 6) Levantar frontend (Vite) en su propia ventana ------------------------
echo [5/5] Frontend...
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo       Ya hay algo escuchando en el puerto 5173, no se vuelve a iniciar.
) else (
    echo       Levantando frontend en http://localhost:5173 ...
    start "METHODYA - Frontend (Web)" cmd /k "cd /d "%~dp0web" && npm run dev"
)
echo.

echo ============================================
echo Entorno local iniciado:
echo   Frontend:        http://localhost:5173
echo   Backend API:     http://localhost:3000
echo   Supabase Studio: http://localhost:54323
echo   Mongo Express:   http://localhost:8081
echo ============================================
echo.

"%SystemRoot%\System32\timeout.exe" /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo Puedes cerrar esta ventana; el backend y el frontend siguen
echo corriendo en sus propias ventanas (ci??rralas para detenerlos).
pause
endlocal
