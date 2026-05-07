@echo off
title The Souls Grail

echo.
echo  ✦ THE SOULS GRAIL - Iniciando...
echo.

:: Backend
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn main:app --reload"

:: Esperar 2 segundos para que el backend arranque
timeout /t 2 /nobreak > nul

:: Frontend
start "Frontend - Next.js" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  ✦ Backend corriendo en http://localhost:8000
echo  ✦ Frontend corriendo en http://localhost:3000
echo.

:: Abrir el navegador después de 4 segundos
timeout /t 4 /nobreak > nul
start http://localhost:3000

exit