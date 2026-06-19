#!/usr/bin/env python3
"""
Synthetic contact scoring verification.

Run from services/scoring-engine/:
    python test_classifier.py

Expected outputs:
    Contact A: confidence_tier=MEDIUM, differential_insufficient=False, fallback_level=2
    Contact B: confidence_tier=LOW,    differential_insufficient=True,  fallback_level=3  (P0 override)
    Contact C: confidence_tier=MEDIUM, differential_insufficient=False, fallback_level=2, holdback_group=True

Signal design rationale:
    Contact A — four Champion-weighted signals all within last 90 days (1.0x multiplier).
        Champion score ~73 (MEDIUM), leading second role (Economic Buyer ~24) by ~49 pts >> 10.
    Contact B — mixed Champion/Influencer signals; one signal in 91-180 day window (0.7x).
        Champion ~46.5, Influencer ~38.5, differential ~8.0 < 10 → fires.
    Contact C — identical signal profile to Contact A; holdback_group=True passes through as
        a CA attribute without affecting classification outputs.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from classifier import classify_visitor
from models import ClassifyResponse


# ---------------------------------------------------------------------------
# Shared account-plane CA attributes (all three contacts)
# Source: kalder_layer2_decisions_log_L2E_builds.md § Synthetic Data Set
# ---------------------------------------------------------------------------
_BASE_CA = {
    "tal_domain": "synthco.com",
    "tal_member": True,
    "tal_program_status": "active_prospect",
    "tal_marquee": False,
    "tal_account_type_source": "enterprise",
    "tal_region": "north_america",
    "tal_upsell_override_active": False,
    "tal_channel": "direct",
    "holdback_group": False,
}

# ---------------------------------------------------------------------------
# Contact A — MEDIUM confidence Champion, honest Tier 3 ceiling
# All signals within last 90 days (1.0x decay multiplier).
# Champion: case_study(20) + demo_request(20) + competitive_comparison(18) +
#           diagnostic_assessment(15) = 73
# Second: Economic Buyer = 3+8+5+8 = 24. Differential = 49 >> 10.
# ---------------------------------------------------------------------------
CONTACT_A = {
    "contact_id": "contact_a",
    "signal_observations": [
        {
            "signal_name": "case_study_download",
            "timestamp": "2026-05-20T10:00:00Z",
            "solution_category": "it_operations",
        },
        {
            "signal_name": "demo_request",
            "timestamp": "2026-05-10T14:00:00Z",
            "solution_category": "it_operations",
        },
        {
            "signal_name": "competitive_comparison_view",
            "timestamp": "2026-04-18T09:00:00Z",
            "solution_category": "it_operations",
        },
        {
            "signal_name": "diagnostic_assessment",
            "timestamp": "2026-04-08T11:00:00Z",
            "solution_category": "it_operations",
        },
    ],
    "ca_attributes": _BASE_CA,
}

# ---------------------------------------------------------------------------
# Contact B — Champion/Influencer ambiguous (differential_insufficient=True)
# diagnostic_assessment in 91-180 day window (0.7x multiplier).
# Champion: case_study(20) + diag_assess(15*0.7=10.5) + use_case(8) + webinar(8) = 46.5
# Influencer: case_study(5) + diag_assess(5*0.7=3.5) + use_case(15) + webinar(15) = 38.5
# Differential = 8.0 < 10 → fires. Cap to min(46.5, 49)=46.5 → LOW.
# Priority 0 override → fallback_level=3.
# ---------------------------------------------------------------------------
CONTACT_B = {
    "contact_id": "contact_b",
    "signal_observations": [
        {
            "signal_name": "case_study_download",
            "timestamp": "2026-05-20T10:00:00Z",
            "solution_category": "it_operations",
        },
        {
            # 91-180 day window (0.7x) — ~159 days from 2026-06-18
            "signal_name": "diagnostic_assessment",
            "timestamp": "2026-01-10T14:00:00Z",
            "solution_category": "it_operations",
        },
        {
            "signal_name": "use_case_exploration",
            "timestamp": "2026-05-15T09:00:00Z",
            "solution_category": "it_operations",
        },
        {
            "signal_name": "webinar_registration",
            "timestamp": "2026-05-05T11:00:00Z",
            "solution_category": "it_operations",
        },
    ],
    "ca_attributes": _BASE_CA,
}

# ---------------------------------------------------------------------------
# Contact C — Same behavioral profile as Contact A; holdback_group=True.
# holdback_group is a CA attribute, not a scoring input. Classification
# outputs must be identical to Contact A. holdback_group passes through
# to ClassifyResponse.holdback_group unchanged.
# ---------------------------------------------------------------------------
CONTACT_C = {
    "contact_id": "contact_c",
    "signal_observations": CONTACT_A["signal_observations"],
    "ca_attributes": {**_BASE_CA, "holdback_group": True},
}

CONTACTS = [CONTACT_A, CONTACT_B, CONTACT_C]

EXPECTED = {
    "contact_a": {
        "confidence_tier": "MEDIUM",
        "differential_insufficient": False,
        "fallback_level": 2,
        "holdback_group": False,
    },
    "contact_b": {
        "confidence_tier": "LOW",
        "differential_insufficient": True,
        "fallback_level": 3,
        "holdback_group": False,
    },
    "contact_c": {
        "confidence_tier": "MEDIUM",
        "differential_insufficient": False,
        "fallback_level": 2,
        "holdback_group": True,
    },
}

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

SEPARATOR = "=" * 72


def print_trace(result: ClassifyResponse) -> None:
    for step in result.scoring_trace:
        val_str = f"  [value={step.value}]" if step.value is not None else ""
        print(f"  [{step.step}]")
        print(f"    {step.result}{val_str}")
        print(f"    Authority: {step.corpus_authority}")


def run_contact(contact: dict, expected: dict) -> bool:
    result: ClassifyResponse = classify_visitor(
        contact_id=contact["contact_id"],
        signal_observations=contact["signal_observations"],
        ca_attributes=contact["ca_attributes"],
    )

    cid = result.contact_id
    print(f"\n{SEPARATOR}")
    print(f"CONTACT: {cid.upper()}")
    print(SEPARATOR)

    print("\n--- Scoring Trace ---")
    print_trace(result)

    print("\n--- Summary ---")
    print(f"  role_classification      : {result.role_classification}")
    print(f"  confidence_tier          : {result.confidence_tier}")
    print(f"  role_scores              : {result.role_scores}")
    print(f"  top_score                : {result.top_score}")
    print(f"  second_score             : {result.second_score}")
    print(f"  differential             : {result.differential}")
    print(f"  differential_insufficient: {result.differential_insufficient}")
    print(f"  fallback_level           : {result.fallback_level}")
    print(f"  holdback_group           : {result.holdback_group}")
    print(f"  data_model_version       : {result.data_model_version}")

    # Assertions
    failures: list[str] = []
    for field, exp_val in expected.items():
        actual = getattr(result, field)
        if actual != exp_val:
            failures.append(
                f"  FAIL  {field}: expected={exp_val!r}  got={actual!r}"
            )

    print("\n--- Assertions ---")
    if failures:
        for f in failures:
            print(f)
        print(f"\n  ✗ {cid} FAILED ({len(failures)} assertion(s))")
        return False
    else:
        for field, exp_val in expected.items():
            print(f"  PASS  {field}={exp_val!r}")
        print(f"\n  ✓ {cid} PASSED")
        return True


def main() -> None:
    print(f"\nKalder Scoring Engine — Synthetic Contact Test")
    print(f"Data model version: 0.2.0")
    print(f"Contacts under test: Contact A, Contact B, Contact C\n")

    all_passed = True
    for contact in CONTACTS:
        cid = contact["contact_id"]
        passed = run_contact(contact, EXPECTED[cid])
        if not passed:
            all_passed = False

    print(f"\n{SEPARATOR}")
    if all_passed:
        print("ALL CONTACTS PASSED — proceed to FastAPI wiring (main.py)")
    else:
        print("ONE OR MORE CONTACTS FAILED — do not proceed to main.py")
        sys.exit(1)
    print(SEPARATOR)


if __name__ == "__main__":
    main()
