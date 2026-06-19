// JSON table lookups — Store 2, five priority tables plus supplementary tables
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Store 2" references
// throughout Stage 3/4 (QT-1, QT-3) and the data/structured/ file list.
//
// Underlying JSON files are extracted mechanically from the canonical
// knowledge/data-model/kalder_data_model.py via scripts/extract-structured-data.py —
// they are not hand-authored, so a lookup miss must never be papered over with a
// guessed value. A miss returns a typed "not_found" result.

import clientAttributeMapFile from "@/data/structured/client_attribute_map.json";
import confidenceTiersFile from "@/data/structured/confidence_tiers.json";
import crossRoleWeightsFile from "@/data/structured/cross_role_weights.json";
import decayMultipliersFile from "@/data/structured/decay_multipliers.json";
import fallbackCascadeFile from "@/data/structured/fallback_cascade.json";
import jtbdCodesFile from "@/data/structured/jtbd_codes.json";
import moduleTypesFile from "@/data/structured/module_types.json";
import salesActivationConfigFile from "@/data/structured/sales_activation_config.json";
import scoringRulesFile from "@/data/structured/scoring_rules.json";

export type StructuredTableName =
  | "CLIENT_ATTRIBUTE_MAP"
  | "CONFIDENCE_TIERS"
  | "CROSS_ROLE_WEIGHTS"
  | "DECAY_MULTIPLIERS"
  | "FALLBACK_CASCADE"
  | "JTBD_CODES"
  | "MODULE_TYPES"
  | "SALES_ACTIVATION_CONFIG"
  | "SCORING_RULES";

type ExtractedFile = {
  _table: string;
  _source: string;
  _data_model_version: string;
  data: unknown;
};

const TABLE_FILES: Record<StructuredTableName, ExtractedFile> = {
  CLIENT_ATTRIBUTE_MAP: clientAttributeMapFile as ExtractedFile,
  CONFIDENCE_TIERS: confidenceTiersFile as ExtractedFile,
  CROSS_ROLE_WEIGHTS: crossRoleWeightsFile as ExtractedFile,
  DECAY_MULTIPLIERS: decayMultipliersFile as ExtractedFile,
  FALLBACK_CASCADE: fallbackCascadeFile as ExtractedFile,
  JTBD_CODES: jtbdCodesFile as ExtractedFile,
  MODULE_TYPES: moduleTypesFile as ExtractedFile,
  SALES_ACTIVATION_CONFIG: salesActivationConfigFile as ExtractedFile,
  SCORING_RULES: scoringRulesFile as ExtractedFile,
};

export type StructuredLookupResult =
  | {
      status: "ok";
      table: StructuredTableName;
      recordKey: string | null; // null when the whole table was requested (e.g. SCORING_RULES)
      record: unknown;
      dataModelVersion: string;
      source: string;
    }
  | {
      status: "table_not_found";
      table: string;
    }
  | {
      status: "record_not_found";
      table: StructuredTableName;
      recordKey: string;
    };

/**
 * Looks up an entire table by canonical name (e.g. "SCORING_RULES" — a
 * parameter table with no individual record keys).
 */
export function lookupTable(tableName: string): StructuredLookupResult {
  const file = TABLE_FILES[tableName as StructuredTableName];
  if (!file) {
    return { status: "table_not_found", table: tableName };
  }
  return {
    status: "ok",
    table: tableName as StructuredTableName,
    recordKey: null,
    record: file.data,
    dataModelVersion: file._data_model_version,
    source: file._source,
  };
}

/**
 * Looks up a single record within a table by its key (e.g. JTBD_CODES["ACQ-CH-PI-1"],
 * CROSS_ROLE_WEIGHTS["demo_request"], CLIENT_ATTRIBUTE_MAP["tal_member"]).
 * Use for QT-1 specific-record-lookup queries. For QT-3 data-model-parameter
 * queries (e.g. "minimum_cumulative_score"), pass the parameter name as recordKey
 * against the SCORING_RULES table.
 */
export function lookupRecord(tableName: string, recordKey: string): StructuredLookupResult {
  const file = TABLE_FILES[tableName as StructuredTableName];
  if (!file) {
    return { status: "table_not_found", table: tableName };
  }

  const table = tableName as StructuredTableName;
  const data = file.data;

  let record: unknown;
  if (Array.isArray(data)) {
    record = data.find((entry) => recordMatchesKey(entry, recordKey));
  } else if (data && typeof data === "object") {
    record = (data as Record<string, unknown>)[recordKey];
  }

  if (record === undefined) {
    return { status: "record_not_found", table, recordKey };
  }

  return {
    status: "ok",
    table,
    recordKey,
    record,
    dataModelVersion: file._data_model_version,
    source: file._source,
  };
}

function recordMatchesKey(entry: unknown, recordKey: string): boolean {
  if (!entry || typeof entry !== "object") return false;
  const candidate = entry as Record<string, unknown>;
  return candidate.level === Number(recordKey) || candidate.level === recordKey || candidate.name === recordKey;
}

/**
 * Convenience accessor for FALLBACK_CASCADE's pending_solution_fallback directive —
 * a first-class program state (CR-08), not a generic record. Returns the directive
 * object as embedded in §4, distinct from the five numbered levels.
 */
export function lookupPendingSolutionFallbackDirective(): StructuredLookupResult {
  const file = TABLE_FILES.FALLBACK_CASCADE;
  const data = file.data as unknown[];
  const directiveEntry = data.find(
    (entry) => entry && typeof entry === "object" && "pending_solution_fallback" in (entry as Record<string, unknown>),
  ) as Record<string, unknown> | undefined;

  if (!directiveEntry) {
    return { status: "record_not_found", table: "FALLBACK_CASCADE", recordKey: "pending_solution_fallback" };
  }

  return {
    status: "ok",
    table: "FALLBACK_CASCADE",
    recordKey: "pending_solution_fallback",
    record: directiveEntry.pending_solution_fallback,
    dataModelVersion: file._data_model_version,
    source: file._source,
  };
}
