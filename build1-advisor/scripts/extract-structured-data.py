"""
One-time extraction: serializes named tables from the canonical
knowledge/data-model/kalder_data_model.py into build1-advisor/data/structured/*.json.

This is a mechanical dump of live Python objects (not a transcription) so the
JSON files stay corpus-accurate. Re-run whenever kalder_data_model.py changes.
"""

import importlib.util
import json
import pathlib

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA_MODEL_PATH = REPO_ROOT / "knowledge" / "data-model" / "kalder_data_model.py"
OUTPUT_DIR = pathlib.Path(__file__).resolve().parents[1] / "data" / "structured"

spec = importlib.util.spec_from_file_location("kalder_data_model", DATA_MODEL_PATH)
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)

EXTRACTIONS = {
    "client_attribute_map.json": ("CLIENT_ATTRIBUTE_MAP", model.CLIENT_ATTRIBUTE_MAP),
    "confidence_tiers.json": ("CONFIDENCE_TIERS", model.CONFIDENCE_TIERS),
    "cross_role_weights.json": ("CROSS_ROLE_WEIGHTS", model.CROSS_ROLE_WEIGHTS),
    "decay_multipliers.json": ("DECAY_MULTIPLIERS", model.DECAY_MULTIPLIERS),
    "fallback_cascade.json": ("FALLBACK_CASCADE", model.FALLBACK_CASCADE),
    "jtbd_codes.json": ("JTBD_CODES", model.JTBD_CODES),
    "module_types.json": ("MODULE_TYPES", model.MODULE_TYPES),
    "sales_activation_config.json": ("SALES_ACTIVATION_CONFIG", model.SALES_ACTIVATION_CONFIG),
    "scoring_rules.json": ("SCORING_RULES", model.SCORING_RULES),
}

for filename, (table_name, value) in EXTRACTIONS.items():
    out_path = OUTPUT_DIR / filename
    payload = {
        "_table": table_name,
        "_source": "knowledge/data-model/kalder_data_model.py",
        "_data_model_version": model.MODEL_VERSION["version"],
        "data": value,
    }
    out_path.write_text(json.dumps(payload, indent=2, default=str) + "\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT)}")
