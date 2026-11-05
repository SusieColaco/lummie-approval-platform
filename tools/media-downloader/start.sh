#!/usr/bin/env bash
# Instala (na primeira vez) e abre a interface web do LUMMIE Media Downloader.
# Use --lan para o modo celular (aceita aparelhos da mesma rede Wi-Fi).
set -e
cd "$(dirname "$0")"
if ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg não encontrado. Mac: brew install ffmpeg | Ubuntu: sudo apt install ffmpeg"; exit 1
fi
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -e ".[transcribe]"
# no Mac, impede o computador de suspender enquanto a ferramenta está aberta
if command -v caffeinate >/dev/null; then
  exec caffeinate -i lummie-dl-web "$@"
fi
exec lummie-dl-web "$@"
