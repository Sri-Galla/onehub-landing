#!/usr/bin/env python3
"""
Minimal OneHubDB API service.

Public:
  GET /onehub.sh   – serves the latest CLI script
  GET /healthz     – readiness probe

Internal (optional):
  POST /internal/restore – launches a restore job via `restore_demo.sh`
                           (requires API-Key header)
"""
from fastapi import FastAPI, HTTPException, Header, Depends, UploadFile, File
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import os, subprocess, uuid, shlex, pathlib, shutil

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
SCRIPT_FILE = BASE_DIR / "restore_demo.sh"

app = FastAPI(title="OneHubDB API", docs_url=None, redoc_url=None)

# Enable CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = BASE_DIR / "backend" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}


@app.get("/onehub.sh", response_class=PlainTextResponse, include_in_schema=False)
async def serve_script():
    if not SCRIPT_FILE.exists():
        raise HTTPException(status_code=404, detail="script not found")
    # Set a long cache header so browsers/CDNs keep it for 1 day
    headers = {"Cache-Control": "public, max-age=86400"}
    return FileResponse(str(SCRIPT_FILE), media_type="text/x-shellscript", headers=headers)


API_KEY = os.getenv("ONEHUB_API_KEY", "")

def require_api_key(x_api_key: str | None = Header(None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="invalid API key")

@app.post("/internal/restore", dependencies=[Depends(require_api_key)])
async def trigger_restore(dump: str, namespace: str = "default", target: str | None = None):
    if not SCRIPT_FILE.exists():
        raise HTTPException(status_code=500, detail="script missing on server")

    cmd = ["bash", str(SCRIPT_FILE), "restore", "--dump", dump, "--namespace", namespace]
    if target:
        cmd.extend(["--target", target])

    try:
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=e.output)

    return {
        "job_run_id": uuid.uuid4().hex[:8],
        "stdout": output,
    }

@app.post("/upload")
async def upload_dump(file: UploadFile = File(...)):
    if not SCRIPT_FILE.exists():
        raise HTTPException(status_code=500, detail="restore_demo.sh not found")
    file_id = uuid.uuid4().hex
    dest_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
    with dest_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        result = subprocess.run(
            ["bash", str(SCRIPT_FILE), "restore", "--dump", str(dest_path)],
            capture_output=True, text=True, timeout=600,
            cwd=str(BASE_DIR)  # Ensure script runs from project root
        )
        output = result.stdout + "\n" + result.stderr
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    trust_level = "UNKNOWN"
    for line in output.splitlines():
        if line.startswith("Trust Level:"):
            trust_level = line.split(":",1)[1].strip()
            break
    return {"output": output, "trust_level": trust_level}
