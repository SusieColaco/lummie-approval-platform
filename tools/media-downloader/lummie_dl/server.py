"""
Interface web local (FastAPI).

Rode:  lummie-dl-web          (ou: python -m lummie_dl.server)
Abra:  http://127.0.0.1:8765
"""

from __future__ import annotations

import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

from .core import (
    DEFAULT_OUTPUT_DIR,
    DownloadError,
    DownloadRequest,
    download,
    fetch_info,
    parse_timestamp,
)

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="LUMMIE Media Downloader", docs_url=None, redoc_url=None)
_executor = ThreadPoolExecutor(max_workers=2)
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()


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

    job_id = uuid.uuid4().hex[:12]
    with _jobs_lock:
        _jobs[job_id] = {"id": job_id, "status": "queued", "stage": "queued",
                         "progress": -1, "message": "Na fila…", "result": None, "error": None}

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


@app.get("/api/jobs/{job_id}")
def api_get_job(job_id: str) -> dict:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job não encontrado")
        return dict(job)


@app.get("/api/jobs/{job_id}/file/{kind}")
def api_get_file(job_id: str, kind: str) -> FileResponse:
    with _jobs_lock:
        job = _jobs.get(job_id)
    if not job or job["status"] != "done":
        raise HTTPException(status_code=404, detail="Arquivo ainda não disponível")
    key = {"media": "media_path", "txt": "transcript_txt", "timed": "transcript_timed_txt",
           "srt": "transcript_srt", "json": "transcript_json"}.get(kind)
    path = job["result"].get(key) if key else None
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(path, filename=Path(path).name)


@app.get("/api/config")
def api_config() -> dict:
    return {"output_dir": str(DEFAULT_OUTPUT_DIR)}


def main() -> None:
    import uvicorn
    import webbrowser

    host, port = "127.0.0.1", 8765
    print(f"\n  LUMMIE Media Downloader\n  → http://{host}:{port}\n  Pasta de saída: {DEFAULT_OUTPUT_DIR}\n")
    threading.Timer(1.0, lambda: webbrowser.open(f"http://{host}:{port}")).start()
    uvicorn.run(app, host=host, port=port, log_level="warning")


if __name__ == "__main__":
    main()
