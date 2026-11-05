"""
Linha de comando.

Exemplos:
  lummie-dl "https://www.youtube.com/watch?v=..."                      # MP4 na melhor qualidade
  lummie-dl URL --quality 1080                                        # limita a 1080p
  lummie-dl URL --audio --audio-format wav                            # só o áudio
  lummie-dl URL --start 01:10 --end 02:30                             # só um trecho
  lummie-dl URL --transcribe --language pt                            # baixa e transcreve
  lummie-dl URL --info                                                # só mostra os dados
  lummie-dl URL --cookies-browser chrome                              # Instagram com login
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .core import (
    DEFAULT_OUTPUT_DIR,
    DownloadError,
    DownloadRequest,
    download,
    fetch_info,
    parse_timestamp,
)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="lummie-dl",
        description="Baixa vídeos (MP4) ou áudio do Instagram, YouTube e TikTok, recorta trechos e transcreve.",
    )
    p.add_argument("url", help="link do vídeo (Instagram, YouTube, TikTok…)")
    p.add_argument("--info", action="store_true", help="só mostra título, duração e resoluções disponíveis")
    p.add_argument("--audio", action="store_true", help="baixa só o áudio")
    p.add_argument("--audio-format", choices=["mp3", "wav", "m4a"], default="mp3")
    p.add_argument("--quality", choices=["best", "2160", "1440", "1080", "720", "480"], default="best",
                   help="resolução máxima do vídeo (padrão: best)")
    p.add_argument("--start", help="início do trecho (ex.: 90, 1:30 ou 00:01:30)")
    p.add_argument("--end", help="fim do trecho (ex.: 150, 2:30 ou 00:02:30)")
    p.add_argument("--transcribe", action="store_true", help="transcreve o áudio (gera .txt, .srt e .json)")
    p.add_argument("--timestamps", action="store_true", help="mostra a transcrição na tela com minutagem [hh:mm:ss]")
    p.add_argument("--language", help="idioma da transcrição (pt, en…). Padrão: detectar")
    p.add_argument("--model", choices=["tiny", "base", "small", "medium", "large-v3"], default="small",
                   help="modelo Whisper (maior = mais preciso e mais lento)")
    p.add_argument("--out", type=Path, default=DEFAULT_OUTPUT_DIR, help=f"pasta de saída (padrão: {DEFAULT_OUTPUT_DIR})")
    p.add_argument("--cookies-browser", help="usa cookies de um navegador logado: chrome, firefox, safari, edge, brave")
    p.add_argument("--cookies-file", help="arquivo cookies.txt exportado do navegador")
    p.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return p


def _print_progress(stage: str, frac: float, msg: str) -> None:
    bar = ""
    if frac >= 0:
        filled = int(frac * 24)
        bar = "[" + "█" * filled + "·" * (24 - filled) + f"] {frac * 100:5.1f}%  "
    sys.stderr.write(f"\r\033[K{bar}{msg}")
    sys.stderr.flush()
    if stage == "done":
        sys.stderr.write("\n")


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        if args.info:
            info = fetch_info(args.url, args.cookies_browser, args.cookies_file)
            d = info.to_dict()
            print(f"Título:     {d['title']}")
            print(f"Plataforma: {d['platform']}")
            print(f"Autor:      {d['uploader'] or '-'}")
            print(f"Duração:    {d['duration_label'] or '-'}")
            print(f"Resoluções: {', '.join(f'{h}p' for h in d['heights']) or '-'}")
            return 0

        req = DownloadRequest(
            url=args.url,
            mode="audio" if args.audio else "video",
            quality=args.quality,
            audio_format=args.audio_format,
            start=parse_timestamp(args.start),
            end=parse_timestamp(args.end),
            transcribe=args.transcribe,
            language=args.language,
            whisper_model=args.model,
            output_dir=args.out,
            cookies_browser=args.cookies_browser,
            cookies_file=args.cookies_file,
        )
        result = download(req, progress=_print_progress)
    except (DownloadError, ValueError) as exc:
        sys.stderr.write(f"\nErro: {exc}\n")
        return 1
    except KeyboardInterrupt:
        sys.stderr.write("\nCancelado.\n")
        return 130

    print(f"\nArquivo:      {result.media_path}")
    if result.transcript_txt:
        print(f"Transcrição:  {result.transcript_txt}")
        print(f"C/ minutagem: {result.transcript_timed_txt}")
        print(f"Legenda SRT:  {result.transcript_srt}")
        print(f"Idioma:       {result.transcript_language or '-'}")
        print("\n--- Transcrição ---")
        print(result.transcript_timed_text if args.timestamps else result.transcript_text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
