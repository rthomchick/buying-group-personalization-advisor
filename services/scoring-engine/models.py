"""
Pydantic request and response models for the /classify endpoint.
Data model version: 0.2.0
"""
from __future__ import annotations

from pydantic import BaseModel


class SignalObservation(BaseModel):
    signal_name: str    # must match a key in CROSS_ROLE_WEIGHTS
    timestamp: str      # ISO-8601
    solution_category: str


class CAAttributes(BaseModel):
    tal_domain: str
    tal_member: bool
    tal_program_status: str
    tal_marquee: bool
    tal_account_type_source: str
    tal_region: str
    tal_upsell_override_active: bool
    tal_channel: str
    # Contact-plane attribute — passed through; not a scoring input.
    # When true: progressive_disclosure suppressed; experience level routing unaffected.
    holdback_group: bool = False


class ClassifyRequest(BaseModel):
    contact_id: str
    signal_observations: list[SignalObservation]
    ca_attributes: CAAttributes


class TraceStep(BaseModel):
    step: str
    result: str
    corpus_authority: str
    value: str | bool | int | float | None = None


class ClassifyResponse(BaseModel):
    contact_id: str
    role_classification: str
    confidence_tier: str            # HIGH | MEDIUM | LOW | UNKNOWN
    role_scores: dict[str, float]   # decay-adjusted cumulative score per role
    top_score: float                # clamped score used for tier assignment
    second_score: float
    differential: float
    differential_insufficient: bool
    fallback_level: int
    holdback_group: bool            # passed through from ca_attributes
    scoring_trace: list[TraceStep]
    data_model_version: str         # always "0.2.0"
