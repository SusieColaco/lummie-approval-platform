@echo off
REM Instala (na primeira vez) e abre a interface web do LUMMIE Media Downloader.
cd /d "%~dp0"
where ffmpeg >nul 2>nul || (echo ffmpeg nao encontrado. Instale com: winget install Gyan.FFmpeg & pause & exit /b 1)
if not exist .venv ( python -m venv .venv )
call .venv\Scripts\activate.bat
pip install -q -e ".[transcribe]"
lummie-dl-web
pause
