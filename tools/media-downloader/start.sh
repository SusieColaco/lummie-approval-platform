#!/usr/bin/env bash
# Instala (na primeira vez) e abre a interface web do LUMMIE Media Downloader.
set -e
cd "$(dirname "$0")"
if ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg não encontrado. Mac: brew install ffmpeg | Ubuntu: sudo apt install ffmpeg"; exit 1
fi
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -e ".[transcribe]"
lummie-dl-web
