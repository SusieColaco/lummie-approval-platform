"""
Interface web local (FastAPI).

Rode:  lummie-dl-web          (ou: python -m lummie_dl.server)
Abra:  http://127.0.0.1:8765

Modo celular:  lummie-dl-web --lan
  Aceita conexões de outros aparelhos da mesma rede Wi-Fi. Só quem tem a chave
  (no QR code e no endereço mostrado) acessa; neste computador não precisa de chave.
"""

from __future__ import annotations

import argparse
import os
import secrets
import socket
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

import segno
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel

from .core import (
    DEFAULT_OUTPUT_DIR,
    DownloadError,
    DownloadRequest,
    PreviewResult,
    cleanup_previews,
    download,
    fetch_info,
    make_preview,
    parse_timestamp,
)

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="LUMMIE Media Downloader", docs_url=None, redoc_url=None)
_executor = ThreadPoolExecutor(max_workers=2)
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()
_previews: dict[str, PreviewResult] = {}


# --------------------------------------------------------------------------- #
# Modo celular (rede local protegida por chave)
# --------------------------------------------------------------------------- #

KEY_COOKIE = "lummie_key"
KEY_FILE = Path.home() / ".lummie-dl" / "key"
LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}
PUBLIC_PATHS = {"/icon.png"}

_lan = False
_port = 8765
_key: Optional[str] = None

DENIED_PAGE = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>LUMMIE · acesso</title>
<body style="font-family: system-ui, sans-serif; background: #F4F0E7; color: #111010; max-width: 420px; margin: 18vh auto; padding: 0 24px; line-height: 1.5">
<p style="letter-spacing: .3em; font-size: 12px; font-weight: 600">LUMMIE</p>
<h1 style="font-weight: 500; font-size: 24px">Falta a chave de acesso.</h1>
<p>Abra o link completo que aparece na tela do computador, ou escaneie o QR code de "Usar no celular".</p>
</body>"""


def load_key() -> str:
    """Chave fixa entre execuções (o Atalho do iPhone não quebra ao reiniciar). Apague o arquivo para trocar."""
    env = os.environ.get("LUMMIE_DL_KEY", "").strip()
    if env:
        return env
    try:
        existing = KEY_FILE.read_text().strip()
        if existing:
            return existing
    except OSError:
        pass
    key = secrets.token_urlsafe(18)
    KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
    KEY_FILE.write_text(key)
    try:
        KEY_FILE.chmod(0o600)
    except OSError:
        pass
    return key


def configure(lan: bool, port: int) -> None:
    global _lan, _port, _key
    _lan, _port = lan, port
    _key = load_key() if lan else None


def _key_ok(supplied: Optional[str]) -> bool:
    return bool(supplied and _key) and secrets.compare_digest(supplied.encode(), (_key or "").encode())


@app.middleware("http")
async def require_key(request: Request, call_next):
    if not _lan or request.url.path in PUBLIC_PATHS:
        return await call_next(request)
    if request.client and request.client.host in LOOPBACK_HOSTS:
        return await call_next(request)  # o próprio computador não precisa de chave

    from_query = request.query_params.get("key")
    if _key_ok(from_query) or _key_ok(request.cookies.get(KEY_COOKIE)):
        response = await call_next(request)
        if from_query:
            response.set_cookie(KEY_COOKIE, _key or "", max_age=60 * 60 * 24 * 365,
                                httponly=True, samesite="lax")
        return response

    if request.url.path.startswith("/api/"):
        return JSONResponse({"detail": "Acesso negado. Abra o link com a chave."}, status_code=401)
    return HTMLResponse(DENIED_PAGE, status_code=401)


def _lan_ip() -> Optional[str]:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))  # não envia nada; só descobre a interface de saída
            ip = s.getsockname()[0]
            if ip and not ip.startswith("127."):
                return ip
    except OSError:
        pass
    try:
        ip = socket.gethostbyname(socket.gethostname())
        return None if ip.startswith("127.") else ip
    except OSError:
        return None


def phone_urls() -> dict:
    """Endereços para abrir no celular (com a chave)."""
    ip = _lan_ip()
    name = socket.gethostname().split(".")[0]
    ip_url = f"http://{ip}:{_port}/?key={_key}" if ip else None
    local_url = f"http://{name}.local:{_port}/?key={_key}" if name else None
    return {"ip_url": ip_url, "local_url": local_url}


class InfoBody(BaseModel):
    url: str
    cookies_browser: Optional[str] = None


class JobBody(BaseModel):
    url: str
    mode: str = "video"
    quality: str = "best"
    audio_format: str = "mp3"
    start: Optional[str] = None
    end: Optional[str] = None
    transcribe: bool = False
    language: Optional[str] = None
    whisper_model: str = "small"
    cookies_browser: Optional[str] = None


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return (STATIC_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/icon.png")
def icon() -> FileResponse:
    return FileResponse(STATIC_DIR / "icon.png", media_type="image/png")


@app.get("/api/phone")
def api_phone() -> dict:
    if not _lan:
        return {"lan": False}
    urls = phone_urls()
    main_url = urls["ip_url"] or urls["local_url"]
    qr_svg = segno.make(main_url, error="m").svg_inline(scale=5, border=2, dark="#111010", light="#ffffff", omitsize=True) if main_url else None
    return {"lan": True, "qr_svg": qr_svg, **urls}


@app.post("/api/info")
def api_info(body: InfoBody) -> dict:
    try:
        return fetch_info(body.url.strip(), cookies_browser=body.cookies_browser or None).to_dict()
    except (DownloadError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/jobs")
def api_create_job(body: JobBody) -> dict:
    try:
        req = DownloadRequest(
            url=body.url.strip(),
            mode=body.mode,
            quality=body.quality,
            audio_format=body.audio_format,
            start=parse_timestamp(body.start),
            end=parse_timestamp(body.end),
            transcribe=body.transcribe,
            language=(body.language or None),
            whisper_model=body.whisper_model,
            output_dir=DEFAULT_OUTPUT_DIR,
            cookies_browser=body.cookies_browser or None,
        )
        req.validate()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    job_id = _new_job()

    def progress(stage: str, frac: float, msg: str) -> None:
        with _jobs_lock:
            _jobs[job_id].update(status="running", stage=stage, progress=frac, message=msg)

    def run() -> None:
        try:
            result = download(req, progress=progress)
            with _jobs_lock:
                _jobs[job_id].update(status="done", stage="done", progress=1.0,
                                     message="Pronto.", result=result.to_dict())
        except Exception as exc:  # noqa: BLE001 — qualquer falha vira mensagem para a UI
            with _jobs_lock:
                _jobs[job_id].update(status="error", stage="error", progress=-1,
                                     message=str(exc), error=str(exc))

    _executor.submit(run)
    return {"id": job_id}


def _new_job() -> str:
    job_id = uuid.uuid4().hex[:12]
    with _jobs_lock:
        _jobs[job_id] = {"id": job_id, "status": "queued", "stage": "queued",
                         "progress": -1, "message": "Na fila…", "result": None, "error": None}
    return job_id


@app.post("/api/preview")
def api_create_preview(body: InfoBody) -> dict:
    url = body.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Informe o link do vídeo")
    cookies = body.cookies_browser or None
    job_id = _new_job()

    def progress(stage: str, frac: float, msg: str) -> None:
        with _jobs_lock:
            _jobs[job_id].update(status="running", stage=stage, progress=frac, message=msg)

    def run() -> None:
        try:
            result = make_preview(url, cookies_browser=cookies, progress=progress)
            _previews[result.key] = result
            with _jobs_lock:
                _jobs[job_id].update(status="done", stage="done", progress=1.0,
                                     message="Prévia pronta.", result=result.to_dict())
        except Exception as exc:  # noqa: BLE001
            with _jobs_lock:
                _jobs[job_id].update(status="error", stage="error", progress=-1,
                                     message=str(exc), error=str(exc))

    _executor.submit(run)
    return {"id": job_id}


@app.get("/api/previews/{key}/video")
def api_preview_video(key: str) -> FileResponse:
    prev = _previews.get(key)
    if not prev or not prev.video_path.exists():
        raise HTTPException(status_code=404, detail="Prévia não encontrada")
    return FileResponse(prev.video_path, media_type="video/mp4")


@app.get("/api/previews/{key}/filmstrip")
def api_preview_filmstrip(key: str) -> FileResponse:
    prev = _previews.get(key)
    if not prev or not prev.filmstrip_path or not prev.filmstrip_path.exists():
        raise HTTPException(status_code=404, detail="Miniaturas não encontradas")
    return FileResponse(prev.filmstrip_path, media_type="image/jpeg")


@app.get("/api/jobs/{job_id}")
def api_get_job(job_id: str) -> dict:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job não encontrado")
        return dict(job)


@app.get("/api/jobs/{job_id}/file/{kind}")
def api_get_file(job_id: str, kind: str, inline: bool = False) -> FileResponse:
    with _jobs_lock:
        job = _jobs.get(job_id)
    if not job or job["status"] != "done":
        raise HTTPException(status_code=404, detail="Arquivo ainda não disponível")
    key = {"media": "media_path", "txt": "transcript_txt", "timed": "transcript_timed_txt",
           "srt": "transcript_srt", "json": "transcript_json"}.get(kind)
    path = job["result"].get(key) if key else None
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(path, filename=Path(path).name,
                        content_disposition_type="inline" if inline else "attachment")


@app.get("/api/config")
def api_config() -> dict:
    return {"output_dir": str(DEFAULT_OUTPUT_DIR)}


def main(argv: Optional[list[str]] = None) -> None:
    import uvicorn
    import webbrowser

    parser = argparse.ArgumentParser(prog="lummie-dl-web", description="Interface web do LUMMIE Media Downloader.")
    parser.add_argument("--lan", action="store_true",
                        help="modo celular: aceita aparelhos da mesma rede Wi-Fi, protegidos por uma chave")
    parser.add_argument("--port", type=int, default=int(os.environ.get("LUMMIE_DL_PORT", "8765")))
    parser.add_argument("--no-browser", action="store_true", help="não abre o navegador sozinho")
    args = parser.parse_args(argv)

    configure(lan=args.lan, port=args.port)
    cleanup_previews()
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    local = f"http://127.0.0.1:{args.port}"

    print("\n  LUMMIE Media Downloader" + ("  ·  modo celular" if args.lan else ""))
    print(f"  Neste computador:  {local}")
    print(f"  Pasta de saída:    {DEFAULT_OUTPUT_DIR}")
    if args.lan:
        urls = phone_urls()
        main_url = urls["ip_url"] or urls["local_url"]
        print("\n  No celular (mesmo Wi-Fi), escaneie o QR code ou abra o endereço:")
        if main_url:
            segno.make(main_url, error="m").terminal(compact=True, border=2)
            print(f"  {main_url}")
        if urls["local_url"] and urls["ip_url"]:
            print(f"  ou, se o IP mudar: {urls['local_url']}")
        print("\n  Deixe este computador ligado e sem suspender enquanto usa pelo celular.")
    print()

    if not args.no_browser:
        threading.Timer(1.0, lambda: webbrowser.open(local)).start()
    uvicorn.run(app, host=host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
