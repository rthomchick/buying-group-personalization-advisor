"""
FastAPI scoring engine sidecar.

Endpoints:
    POST /classify  — accept ClassifyRequest, return ClassifyResponse
    GET  /health    — returns {"status": "ok", "data_model_version": "0.2.0"}

CORS permits requests from the Build 1 dev server (http://localhost:3000).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import ClassifyRequest, ClassifyResponse
from classifier import classify_visitor, DATA_MODEL_VERSION

app = FastAPI(title="Kalder Scoring Engine", version=DATA_MODEL_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.post("/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest) -> ClassifyResponse:
    signal_obs = [s.model_dump() for s in request.signal_observations]
    ca_attrs = request.ca_attributes.model_dump()
    return classify_visitor(
        contact_id=request.contact_id,
        signal_observations=signal_obs,
        ca_attributes=ca_attrs,
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "data_model_version": DATA_MODEL_VERSION}
