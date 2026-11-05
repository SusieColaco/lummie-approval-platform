"""
Núcleo da ferramenta: análise da URL, download (vídeo MP4 ou só áudio),
recorte de trecho e transcrição.

Tudo aqui é independente da interface (CLI ou web).
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

import yt_dlp

ProgressCallback = Callable[[str, float, str], None]
"""Recebe (etapa, progresso 0..1 ou -1 se desconhecido, mensagem)."""

DEFAULT_OUTPUT_DIR = Path(
    os.environ.get("LUMMIE_DL_OUT", Path.home() / "Downloads" / "Lummie Downloads")
)

AUDIO_FORMATS = {"mp3", "wav", "m4a"}
VIDEO_QUALITIES = {"best", "2160", "1440", "1080", "720", "480"}
WHISPER_MODELS = {"tiny", "base", "small", "medium", "large-v3"}


class DownloadError(RuntimeError):
    pass


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #

def parse_timestamp(value: str | float | int | None) -> Optional[float]:
    """Aceita segundos ("95", 95, 95.5), "mm:ss" ou "hh:mm:ss(.ms)". Retorna segundos."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    if re.fullmatch(r"\d+(\.\d+)?", text):
        return float(text)
    parts = text.split(":")
    if not 2 <= len(parts) <= 3 or not all(re.fullmatch(r"\d+(\.\d+)?", p) for p in parts):
        raise ValueError(f"Tempo inválido: {value!r}. Use segundos, mm:ss ou hh:mm:ss.")
    parts = [float(p) for p in parts]
    while len(parts) < 3:
        parts.insert(0, 0.0)
    h, m, s = parts
    return h * 3600 + m * 60 + s


def format_timestamp(seconds: float, srt: bool = False) -> str:
    seconds = max(0.0, float(seconds))
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    if srt:
        ms = int(round((s - int(s)) * 1000))
        return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def _ffmpeg_path() -> str:
    path = shutil.which("ffmpeg")
    if not path:
        raise DownloadError(
            "ffmpeg não encontrado. Instale o ffmpeg e garanta que ele esteja no PATH."
        )
    return path


def _ffprobe_duration(path: Path) -> Optional[float]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return None
    try:
        out = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return float(out)
    except Exception:
        return None


def _base_ydl_opts(cookies_browser: Optional[str], cookies_file: Optional[str]) -> dict:
    opts: dict = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": True,
        "windowsfilenames": True,
        "retries": 3,
        "fragment_retries": 3,
    }
    if cookies_file:
        opts["cookiefile"] = cookies_file
    elif cookies_browser:
        opts["cookiesfrombrowser"] = (cookies_browser,)
    return opts


# --------------------------------------------------------------------------- #
# Análise da URL
# --------------------------------------------------------------------------- #

@dataclass
class MediaInfo:
    url: str
    id: str
    title: str
    platform: str
    uploader: Optional[str]
    duration: Optional[float]
    thumbnail: Optional[str]
    heights: list[int] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "id": self.id,
            "title": self.title,
            "platform": self.platform,
            "uploader": self.uploader,
            "duration": self.duration,
            "duration_label": format_timestamp(self.duration)[:8] if self.duration else None,
            "thumbnail": self.thumbnail,
            "heights": self.heights,
        }


def fetch_info(
    url: str,
    cookies_browser: Optional[str] = None,
    cookies_file: Optional[str] = None,
) -> MediaInfo:
    """Lê título, duração, miniatura e resoluções disponíveis sem baixar nada."""
    opts = _base_ydl_opts(cookies_browser, cookies_file)
    opts["skip_download"] = True
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise DownloadError(_friendly_error(str(exc))) from exc

    if info.get("_type") == "playlist" and info.get("entries"):
        info = next(e for e in info["entries"] if e)

    heights = sorted(
        {int(f["height"]) for f in info.get("formats", []) if f.get("height")},
        reverse=True,
    )
    return MediaInfo(
        url=url,
        id=str(info.get("id", "")),
        title=info.get("title") or "video",
        platform=str(info.get("extractor_key") or info.get("extractor") or "?"),
        uploader=info.get("uploader") or info.get("channel"),
        duration=float(info["duration"]) if info.get("duration") else None,
        thumbnail=info.get("thumbnail"),
        heights=heights,
    )


def _friendly_error(message: str) -> str:
    low = message.lower()
    if "login" in low or "cookies" in low or "rate-limit" in low or "not available" in low and "instagram" in low:
        return (
            "A plataforma pediu login para acessar esse conteúdo. "
            "Use a opção de cookies do navegador (ex.: chrome, firefox, safari) "
            "com uma sessão já logada. Detalhe: " + message
        )
    if "private" in low:
        return "Esse conteúdo é privado e não pode ser baixado. Detalhe: " + message
    if "unsupported url" in low:
        return "URL não suportada. Confira se é um link de vídeo do Instagram, YouTube ou TikTok."
    return message


# --------------------------------------------------------------------------- #
# Download
# --------------------------------------------------------------------------- #

@dataclass
class DownloadRequest:
    url: str
    mode: str = "video"            # "video" | "audio"
    quality: str = "best"          # "best" | "2160" | "1440" | "1080" | "720" | "480"
    audio_format: str = "mp3"      # "mp3" | "wav" | "m4a"
    start: Optional[float] = None  # segundos
    end: Optional[float] = None    # segundos
    transcribe: bool = False
    language: Optional[str] = None # "pt", "en"... None = detectar
    whisper_model: str = "small"
    output_dir: Path = DEFAULT_OUTPUT_DIR
    cookies_browser: Optional[str] = None
    cookies_file: Optional[str] = None

    def validate(self) -> None:
        if self.mode not in {"video", "audio"}:
            raise ValueError("mode deve ser 'video' ou 'audio'")
        if self.quality not in VIDEO_QUALITIES:
            raise ValueError(f"quality deve ser uma de {sorted(VIDEO_QUALITIES)}")
        if self.audio_format not in AUDIO_FORMATS:
            raise ValueError(f"audio_format deve ser um de {sorted(AUDIO_FORMATS)}")
        if self.whisper_model not in WHISPER_MODELS:
            raise ValueError(f"whisper_model deve ser um de {sorted(WHISPER_MODELS)}")
        if self.start is not None and self.start < 0:
            raise ValueError("start não pode ser negativo")
        if self.start is not None and self.end is not None and self.end <= self.start:
            raise ValueError("end precisa ser maior que start")


@dataclass
class DownloadResult:
    media_path: Path
    info: MediaInfo
    transcript_txt: Optional[Path] = None
    transcript_timed_txt: Optional[Path] = None
    transcript_srt: Optional[Path] = None
    transcript_json: Optional[Path] = None
    transcript_text: Optional[str] = None
    transcript_timed_text: Optional[str] = None
    transcript_language: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "media_path": str(self.media_path),
            "media_name": self.media_path.name,
            "info": self.info.to_dict(),
            "transcript_txt": str(self.transcript_txt) if self.transcript_txt else None,
            "transcript_timed_txt": str(self.transcript_timed_txt) if self.transcript_timed_txt else None,
            "transcript_srt": str(self.transcript_srt) if self.transcript_srt else None,
            "transcript_json": str(self.transcript_json) if self.transcript_json else None,
            "transcript_text": self.transcript_text,
            "transcript_timed_text": self.transcript_timed_text,
            "transcript_language": self.transcript_language,
        }


def _video_format_string(quality: str) -> str:
    h = "" if quality == "best" else f"[height<={quality}]"
    # 1) H.264 em MP4 (abre em qualquer editor) 2) melhor vídeo + áudio 3) fallback
    return (
        f"bestvideo{h}[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]"
        f"/bestvideo{h}[ext=mp4]+bestaudio[ext=m4a]"
        f"/bestvideo{h}+bestaudio"
        f"/best{h}/best"
    )


def _safe_stem(title: str, max_len: int = 80) -> str:
    stem = re.sub(r'[\\/:*?"<>|\r\n\t]+', " ", title).strip()
    stem = re.sub(r"\s+", " ", stem)
    return (stem[:max_len].rstrip() or "video")


def download(req: DownloadRequest, progress: Optional[ProgressCallback] = None) -> DownloadResult:
    """Executa o fluxo completo: baixar → (recortar) → (transcrever)."""
    req.validate()
    notify = progress or (lambda stage, frac, msg: None)
    _ffmpeg_path()

    notify("info", -1, "Analisando o link…")
    info = fetch_info(req.url, req.cookies_browser, req.cookies_file)

    if info.duration and req.start is not None and req.start >= info.duration:
        raise ValueError(
            f"O início ({format_timestamp(req.start)[:8]}) está depois do fim do vídeo "
            f"({format_timestamp(info.duration)[:8]})."
        )

    output_dir = Path(req.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Início em 0 e fim no final do vídeo não são corte: evita re-codificar à toa.
    start = req.start if req.start and req.start > 0.05 else None
    end = req.end
    if end is not None and info.duration and end >= info.duration - 0.05:
        end = None
    req.start, req.end = start, end

    wants_cut = req.start is not None or req.end is not None
    stem = _safe_stem(info.title)
    if wants_cut:
        s = format_timestamp(req.start or 0)[:8].replace(":", ".")
        end_ref = req.end if req.end is not None else info.duration
        e = format_timestamp(end_ref)[:8].replace(":", ".") if end_ref else "fim"
        stem = f"{stem} [{s}-{e}]"

    with tempfile.TemporaryDirectory(prefix="lummie_dl_") as tmp:
        tmp_dir = Path(tmp)
        raw_path = _download_media(req, info, tmp_dir, notify)

        if wants_cut:
            notify("cut", -1, "Recortando o trecho…")
            cut_path = tmp_dir / f"cut{raw_path.suffix}"
            _cut_media(raw_path, cut_path, req.start, req.end, req.mode, req.audio_format)
            raw_path = cut_path

        final_ext = raw_path.suffix
        final_path = _unique_path(output_dir / f"{stem}{final_ext}")
        shutil.move(str(raw_path), final_path)

    result = DownloadResult(media_path=final_path, info=info)

    if req.transcribe:
        notify("transcribe", 0.0, "Transcrevendo o áudio…")
        tr = transcribe(final_path, language=req.language, model_size=req.whisper_model, progress=notify)
        base = final_path.with_suffix("")
        result.transcript_txt = Path(f"{base}.txt")
        result.transcript_timed_txt = Path(f"{base}.minutagem.txt")
        result.transcript_srt = Path(f"{base}.srt")
        result.transcript_json = Path(f"{base}.transcricao.json")
        result.transcript_txt.write_text(tr["text"], encoding="utf-8")
        result.transcript_timed_txt.write_text(tr["timed_text"], encoding="utf-8")
        result.transcript_srt.write_text(tr["srt"], encoding="utf-8")
        result.transcript_json.write_text(json.dumps(tr["segments"], ensure_ascii=False, indent=2), encoding="utf-8")
        result.transcript_text = tr["text"]
        result.transcript_timed_text = tr["timed_text"]
        result.transcript_language = tr["language"]

    notify("done", 1.0, "Pronto.")
    return result


def _unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    for i in range(2, 1000):
        candidate = path.with_name(f"{path.stem} ({i}){path.suffix}")
        if not candidate.exists():
            return candidate
    raise DownloadError("Não consegui criar um nome de arquivo único na pasta de saída.")


def _download_media(req: DownloadRequest, info: MediaInfo, tmp_dir: Path, notify: ProgressCallback) -> Path:
    opts = _base_ydl_opts(req.cookies_browser, req.cookies_file)
    opts["outtmpl"] = str(tmp_dir / "source.%(ext)s")

    def hook(d: dict) -> None:
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            done = d.get("downloaded_bytes") or 0
            frac = (done / total) if total else -1
            speed = d.get("_speed_str") or ""
            notify("download", frac, f"Baixando… {speed}".strip())
        elif d.get("status") == "finished":
            notify("download", 1.0, "Download concluído, processando…")

    opts["progress_hooks"] = [hook]

    if req.mode == "audio":
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": req.audio_format,
            "preferredquality": "0",
        }]
        expected_ext = req.audio_format
    else:
        opts["format"] = _video_format_string(req.quality)
        opts["merge_output_format"] = "mp4"
        opts["postprocessors"] = [{"key": "FFmpegVideoRemuxer", "preferedformat": "mp4"}]
        expected_ext = "mp4"

    notify("download", 0.0, "Iniciando download…")
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([req.url])
    except yt_dlp.utils.DownloadError as exc:
        raise DownloadError(_friendly_error(str(exc))) from exc

    candidates = sorted(tmp_dir.glob("source.*"), key=lambda p: p.stat().st_size, reverse=True)
    preferred = [p for p in candidates if p.suffix.lstrip(".") == expected_ext]
    if preferred:
        return preferred[0]
    if candidates:
        return candidates[0]
    raise DownloadError("O download terminou mas nenhum arquivo foi gerado.")


def _cut_media(
    src: Path,
    dst: Path,
    start: Optional[float],
    end: Optional[float],
    mode: str,
    audio_format: str,
) -> None:
    """Recorte exato (re-encode). Só o trecho é processado, então é rápido mesmo em vídeos longos."""
    ffmpeg = _ffmpeg_path()
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error"]
    if start:
        cmd += ["-ss", f"{start:.3f}"]
    cmd += ["-i", str(src)]
    if end is not None:
        cmd += ["-t", f"{end - (start or 0):.3f}"]

    if mode == "video":
        cmd += [
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        ]
    else:
        codec = {"mp3": ["-c:a", "libmp3lame", "-q:a", "0"],
                 "wav": ["-c:a", "pcm_s16le"],
                 "m4a": ["-c:a", "aac", "-b:a", "256k"]}[audio_format]
        cmd += ["-vn", *codec]
    cmd.append(str(dst))

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not dst.exists():
        raise DownloadError(f"Falha ao recortar o trecho com ffmpeg: {proc.stderr.strip()[-800:]}")
    cut_duration = _ffprobe_duration(dst)
    if cut_duration is None or cut_duration < 0.05:
        raise ValueError(
            f"O trecho ({format_timestamp(start or 0)[:8]} até "
            f"{format_timestamp(end)[:8] if end is not None else 'o fim'}) está fora da duração do vídeo."
        )


# --------------------------------------------------------------------------- #
# Prévia para o editor de trecho
# --------------------------------------------------------------------------- #

PREVIEW_DIR = Path(tempfile.gettempdir()) / "lummie_dl_previews"
PREVIEW_MAX_HEIGHT = 480
FILMSTRIP_HEIGHT = 64


@dataclass
class PreviewResult:
    key: str
    video_path: Path
    filmstrip_path: Optional[Path]
    duration: float
    width: int
    height: int
    fps: float

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "duration": self.duration,
            "width": self.width,
            "height": self.height,
            "fps": self.fps,
            "video_url": f"/api/previews/{self.key}/video",
            "filmstrip_url": f"/api/previews/{self.key}/filmstrip" if self.filmstrip_path else None,
        }


def preview_key(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]


def cleanup_previews(max_age_hours: float = 24) -> None:
    """Apaga prévias antigas da pasta temporária."""
    if not PREVIEW_DIR.exists():
        return
    limit = time.time() - max_age_hours * 3600
    for d in PREVIEW_DIR.iterdir():
        try:
            if d.is_dir() and d.stat().st_mtime < limit:
                shutil.rmtree(d, ignore_errors=True)
        except OSError:
            pass


def _ffprobe_streams(path: Path) -> dict:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise DownloadError("ffprobe não encontrado. Ele vem junto com o ffmpeg.")
    out = subprocess.run(
        [ffprobe, "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def _parse_fps(value: str | None) -> float:
    try:
        num, den = (value or "0/1").split("/")
        fps = float(num) / float(den)
        return fps if 1 <= fps <= 120 else 30.0
    except (ValueError, ZeroDivisionError):
        return 30.0


def make_preview(
    url: str,
    cookies_browser: Optional[str] = None,
    cookies_file: Optional[str] = None,
    progress: Optional[ProgressCallback] = None,
) -> PreviewResult:
    """Baixa uma versão leve (até 480p, H.264/AAC) só para o player do editor, e gera a tira de miniaturas."""
    notify = progress or (lambda stage, frac, msg: None)
    _ffmpeg_path()

    key = preview_key(url)
    work = PREVIEW_DIR / key
    meta_path = work / "meta.json"
    video_path = work / "preview.mp4"
    strip_path = work / "filmstrip.jpg"

    if meta_path.exists() and video_path.exists():
        meta = json.loads(meta_path.read_text())
        os.utime(work)
        return PreviewResult(key, video_path, strip_path if strip_path.exists() else None, **meta)

    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True, exist_ok=True)

    h = PREVIEW_MAX_HEIGHT
    opts = _base_ydl_opts(cookies_browser, cookies_file)
    opts["outtmpl"] = str(work / "source.%(ext)s")
    opts["merge_output_format"] = "mp4"
    opts["format"] = (
        f"bestvideo[height<={h}][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]"
        f"/best[height<={h}][ext=mp4]"
        f"/bestvideo[height<={h}]+bestaudio"
        f"/best[height<={h}]/best"
    )

    def hook(d: dict) -> None:
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            frac = ((d.get("downloaded_bytes") or 0) / total) if total else -1
            notify("preview", frac, "Baixando a prévia…")

    opts["progress_hooks"] = [hook]
    notify("preview", -1, "Baixando a prévia…")
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
    except yt_dlp.utils.DownloadError as exc:
        shutil.rmtree(work, ignore_errors=True)
        raise DownloadError(_friendly_error(str(exc))) from exc

    sources = sorted(work.glob("source.*"), key=lambda p: p.stat().st_size, reverse=True)
    if not sources:
        shutil.rmtree(work, ignore_errors=True)
        raise DownloadError("A prévia não foi gerada.")
    source = sources[0]

    notify("preview", -1, "Preparando a prévia…")
    probe = _ffprobe_streams(source)
    vstream = next((s for s in probe["streams"] if s.get("codec_type") == "video"), None)
    astream = next((s for s in probe["streams"] if s.get("codec_type") == "audio"), None)
    if not vstream:
        shutil.rmtree(work, ignore_errors=True)
        raise DownloadError("Esse link não tem vídeo para mostrar na prévia.")

    compatible = (
        vstream.get("codec_name") == "h264"
        and vstream.get("pix_fmt", "yuv420p") == "yuv420p"
        and int(vstream.get("height") or 0) <= h
        and (astream is None or astream.get("codec_name") == "aac")
    )
    cmd = [_ffmpeg_path(), "-y", "-hide_banner", "-loglevel", "error", "-i", str(source)]
    if compatible:
        cmd += ["-c", "copy"]
    else:
        cmd += [
            "-vf", f"scale=-2:'min({h},ih)'",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
        ]
    cmd += ["-movflags", "+faststart", str(video_path)]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not video_path.exists():
        shutil.rmtree(work, ignore_errors=True)
        raise DownloadError(f"Falha ao preparar a prévia: {proc.stderr.strip()[-600:]}")
    source.unlink(missing_ok=True)

    final = _ffprobe_streams(video_path)
    v = next(s for s in final["streams"] if s.get("codec_type") == "video")
    duration = float(final["format"].get("duration") or v.get("duration") or 0)
    width, height = int(v.get("width") or 0), int(v.get("height") or 0)
    fps = _parse_fps(v.get("avg_frame_rate") or v.get("r_frame_rate"))
    if duration <= 0:
        shutil.rmtree(work, ignore_errors=True)
        raise DownloadError("Não consegui ler a duração do vídeo.")

    notify("preview", -1, "Gerando as miniaturas da linha do tempo…")
    made_strip = _build_filmstrip(video_path, strip_path, duration, width, height)

    meta = {"duration": duration, "width": width, "height": height, "fps": fps}
    meta_path.write_text(json.dumps(meta))
    notify("preview", 1.0, "Prévia pronta.")
    return PreviewResult(key, video_path, strip_path if made_strip else None, **meta)


def _build_filmstrip(video: Path, dst: Path, duration: float, width: int, height: int) -> bool:
    """Uma imagem só com N quadros lado a lado, para servir de fundo da linha do tempo."""
    aspect = (width / height) if width and height else 16 / 9
    tile_w = FILMSTRIP_HEIGHT * aspect
    n = max(6, min(48, round(760 / tile_w)))
    cmd = [
        _ffmpeg_path(), "-y", "-hide_banner", "-loglevel", "error", "-i", str(video),
        "-vf", f"fps={n}/{duration:.3f},scale=-2:{FILMSTRIP_HEIGHT},tile={n}x1",
        "-frames:v", "1", "-q:v", "5", str(dst),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode == 0 and dst.exists() and dst.stat().st_size > 0


# --------------------------------------------------------------------------- #
# Transcrição
# --------------------------------------------------------------------------- #

_model_cache: dict[str, object] = {}


def _load_whisper(model_size: str):
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise DownloadError(
            "faster-whisper não está instalado. Rode: pip install faster-whisper"
        ) from exc
    if model_size not in _model_cache:
        _model_cache[model_size] = WhisperModel(model_size, device="auto", compute_type="int8")
    return _model_cache[model_size]


def transcribe(
    path: Path,
    language: Optional[str] = None,
    model_size: str = "small",
    progress: Optional[ProgressCallback] = None,
) -> dict:
    """Transcreve um arquivo de áudio/vídeo. Retorna text, timed_text, srt, segments e language."""
    notify = progress or (lambda stage, frac, msg: None)
    notify("transcribe", 0.0, f"Carregando modelo de transcrição ({model_size})… na primeira vez ele é baixado.")
    model = _load_whisper(model_size)

    total = _ffprobe_duration(Path(path))
    segments_iter, meta = model.transcribe(
        str(path),
        language=language or None,
        vad_filter=True,
        beam_size=5,
    )

    segments: list[dict] = []
    lines_txt: list[str] = []
    lines_timed: list[str] = []
    lines_srt: list[str] = []
    for i, seg in enumerate(segments_iter, start=1):
        text = seg.text.strip()
        if not text:
            continue
        segments.append({"start": round(seg.start, 3), "end": round(seg.end, 3), "text": text})
        lines_txt.append(text)
        lines_timed.append(f"[{format_timestamp(seg.start)[:8]}] {text}")
        lines_srt.append(
            f"{i}\n{format_timestamp(seg.start, srt=True)} --> {format_timestamp(seg.end, srt=True)}\n{text}\n"
        )
        frac = (seg.end / total) if total else -1
        notify("transcribe", min(frac, 0.99) if frac >= 0 else -1,
               f"Transcrevendo… {format_timestamp(seg.end)[:8]}")

    return {
        "text": "\n".join(lines_txt).strip(),
        "timed_text": "\n".join(lines_timed).strip(),
        "srt": "\n".join(lines_srt).strip() + "\n",
        "segments": segments,
        "language": getattr(meta, "language", None),
    }
