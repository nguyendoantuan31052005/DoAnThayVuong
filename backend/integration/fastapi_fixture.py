"""FastAPI contract fixture for backend integration tests. NOT a trained AI model."""
import json
import socket
from typing import Annotated
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, HttpUrl
import uvicorn

app = FastAPI(title="Backend contract test fixture — no ML model")

class PredictRequest(BaseModel):
    url: HttpUrl

@app.get('/health')
def health():
    return {"status": "ok", "fixture": True}

@app.post('/predict')
def predict(body: PredictRequest, authorization: Annotated[str | None, Header()] = None):
    if authorization != 'Bearer integration-fixture-token':
        raise HTTPException(status_code=401, detail='Fixture token required')
    return {"riskScore": 85, "reasons": ["Integration fixture only; not an AI prediction"], "modelVersion": "fastapi-contract-fixture"}

if __name__ == '__main__':
    sock = socket.socket()
    sock.bind(('127.0.0.1', 0))
    print(json.dumps({"port": sock.getsockname()[1]}), flush=True)
    uvicorn.Server(uvicorn.Config(app, log_level='warning', access_log=False)).run(sockets=[sock])
