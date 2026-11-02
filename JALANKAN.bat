@echo off
title Basreng Ibu A3
cd /d "%~dp0"
if not exist node_modules (
  echo Memasang dependensi, tunggu sebentar...
  call npm install
)
start "" http://localhost:5173
call npm run dev -- --port 5173 --strictPort --host 127.0.0.1
pause
