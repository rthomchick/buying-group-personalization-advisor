// Module set and variant selection by fallback level — follows Document 4 §5.3
// and Document 5 §§3 and 8 exactly
//
// Source of truth:
// - knowledge/kalder_doc4_content_model_and_taxonomy.md, Section 5 (Module
//   Types and Composition Rules) — the 11 module types, their intended_axes,
//   and per-level fallback behavior (Section 5.3 reference table is
//   authoritative for active-levels-and-fallback-behavior per module type).
// - knowledge/kalder_doc5_personalization_decisioning_rules.md, Section 3
//   (per-module selection logic detail) and Section 7 (holdback — forces
//   Level 5 for all slots) and Section 1.3/8 (progressive_disclosure
//   suppression states).
//
// Takes both VisitorState and DecisioningResult: DecisioningResult alone
// (fallback_level, pending_solution_fallback, trace, etc.) does not carry
// role_classification, solution_category, or holdback_group — those live on
// VisitorState. Real Adobe Target reads both the AEP contact profile and the
// computed routing outcome to select content; this mirrors that split.
//
// Two distinct progressive_disclosure suppression states, never conflated:
// - suppressed_active: Level 1 — architecturally turned off by design, not
//   absent from the catalog (Document 4 §5.2 progressive_disclosure spec;
//   Document 5 §1.3 Level 1 activation notes).
// - suppressed_holdback: holdback_group: true — intentionally withheld for
//   measurement integrity, not because the slot doesn't exist (Document 5
//   §7.7 — progressive_disclosure does not render at Level 5, which is what
//   holdback visitors receive; labeled suppression, not absence).

import type { VisitorState, DecisioningResult } from "@kalder/shared";
import itOpsChampionContent from "../data/content-variants/it_ops_champion.json";

export type ModuleType =
  | "hero"
  | "benefits"
  | "cta"
  | "gated_assets"
  | "proof"
  | "narrative"
  | "problem_framing"
  | "outcomes"
  | "use_cases"
  | "trust_signals"
  | "progressive_disclosure";

export type RenderingState = "rendered" | "not_rendered" | "suppressed_active" | "suppressed_holdback";

export type ModuleSlot = {
  module_type: ModuleType;
  rendering_state: RenderingState;
  axes_active: string[];
  variant_descriptor: string;
  corpus_authority: string;
};

export type ModuleComposition = {
  fallback_level: 1 | 2 | 3 | 4 | 5;
  slots: ModuleSlot[];
};

const MODULE_TYPES: ModuleType[] = [
  "hero",
  "benefits",
  "cta",
  "gated_assets",
  "proof",
  "narrative",
  "problem_framing",
  "outcomes",
  "use_cases",
  "trust_signals",
  "progressive_disclosure",
];

// Document 4 §5.3 reference table — intended_axes per module type.
const INTENDED_AXES: Record<ModuleType, string[]> = {
  hero: ["role", "solution_category", "bg_stage"],
  benefits: ["role", "solution_category"],
  cta: ["role", "confidence_tier", "buying_job"],
  gated_assets: ["role", "buying_job", "bg_stage"],
  proof: ["role", "solution_category", "buying_job"],
  narrative: ["role", "solution_category", "bg_stage"],
  problem_framing: ["role", "solution_category"],
  outcomes: ["role", "solution_category", "bg_stage"],
  use_cases: ["role", "solution_category", "buying_job"],
  trust_signals: ["role", "solution_category"],
  progressive_disclosure: ["confidence_tier", "solution_category"],
};

const POC_SOLUTION_CATEGORY = "it_operations";
const POC_ROLE = "champion";

type ContentVariantSet = {
  level_1_2?: string;
  level_1?: string;
  level_2?: string;
  level_3?: string;
  level_4?: string;
  level_5?: string;
};

function isPocScenario(state: VisitorState): boolean {
  return state.solution_category === POC_SOLUTION_CATEGORY && state.role_classification === POC_ROLE;
}

function pocVariant(moduleType: ModuleType, level: 1 | 2 | 3 | 4 | 5): string | undefined {
  const moduleContent = (itOpsChampionContent.modules as Record<string, ContentVariantSet>)[moduleType];
  if (!moduleContent) return undefined;

  if (level === 1 || level === 2) {
    return moduleContent.level_1_2 ?? (level === 1 ? moduleContent.level_1 : moduleContent.level_2);
  }
  if (level === 3) return moduleContent.level_3;
  if (level === 4) return moduleContent.level_4;
  return moduleContent.level_5;
}

function placeholder(moduleType: ModuleType, state: VisitorState, level: 1 | 2 | 3 | 4 | 5): string {
  return (
    `[PLACEHOLDER] No pre-authored content for ${moduleType} at Level ${level} for ` +
    `solution_category=${state.solution_category}, role=${state.role_classification}. ` +
    `Pre-authored descriptions exist only for the it_operations/champion POC scenario.`
  );
}

function variantDescriptor(moduleType: ModuleType, state: VisitorState, level: 1 | 2 | 3 | 4 | 5): string {
  if (isPocScenario(state)) {
    const variant = pocVariant(moduleType, level);
    if (variant) return variant;
  }
  return placeholder(moduleType, state, level);
}

// --- Per-module-type fallback behavior, Document 4 §5.3 ---------------------

function renderHero(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  const axes = level <= 2 ? INTENDED_AXES.hero : level === 3 ? ["solution_category"] : level === 4 ? ["industry_vertical", "company_size_segment"] : [];
  return {
    module_type: "hero",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("hero", state, level),
    corpus_authority: "Document 4 §5.2 (hero); Document 5 §3.1",
  };
}

function renderBenefits(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  const axes = level <= 2 ? INTENDED_AXES.benefits : level <= 4 ? ["solution_category"] : [];
  return {
    module_type: "benefits",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("benefits", state, level),
    corpus_authority: "Document 4 §5.2 (benefits); Document 5 §3.2",
  };
}

function renderCta(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  const axes =
    level === 1
      ? INTENDED_AXES.cta
      : level === 2
        ? ["role", "confidence_tier"].concat(state.buying_job_confidence === "KNOWN" ? ["buying_job"] : [])
        : level === 3
          ? ["solution_category"]
          : [];
  return {
    module_type: "cta",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("cta", state, level),
    corpus_authority: "Document 4 §5.2 (cta); Document 5 §3.3",
  };
}

function renderGatedAssets(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (level === 5) {
    return {
      module_type: "gated_assets",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 5 per Document 4 §5.3.",
      corpus_authority: "Document 4 §5.3 (gated_assets active levels 1-3; Level 4 generic; Level 5 not rendered)",
    };
  }
  const axes = level <= 2 ? INTENDED_AXES.gated_assets : level === 3 ? ["solution_category"] : ["industry_vertical"];
  return {
    module_type: "gated_assets",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("gated_assets", state, level),
    corpus_authority: "Document 4 §5.2 (gated_assets); Document 5 §3.4",
  };
}

function renderProof(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (level === 4 || level === 5) {
    return {
      module_type: "proof",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 4-5 per Document 4 §5.3.",
      corpus_authority: "Document 4 §5.3 (proof active levels 1-3 only)",
    };
  }
  const axes = level <= 2 ? INTENDED_AXES.proof : ["solution_category"];
  return {
    module_type: "proof",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("proof", state, level),
    corpus_authority: "Document 4 §5.2 (proof); Document 5 §3.5",
  };
}

function renderNarrative(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  const axes = level <= 2 ? INTENDED_AXES.narrative : level <= 4 ? ["solution_category"] : [];
  return {
    module_type: "narrative",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("narrative", state, level),
    corpus_authority: "Document 4 §5.2 (narrative); Document 5 §3.6",
  };
}

function renderProblemFraming(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (level === 4 || level === 5) {
    return {
      module_type: "problem_framing",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 4-5 per Document 4 §5.3 (industry-level Level 4 offer not commissioned for POC).",
      corpus_authority: "Document 4 §5.3 (problem_framing active levels 1-3; Level 4 conditional, Level 5 not rendered)",
    };
  }
  const axes = level <= 2 ? INTENDED_AXES.problem_framing : ["solution_category"];
  return {
    module_type: "problem_framing",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("problem_framing", state, level),
    corpus_authority: "Document 4 §5.2 (problem_framing); Document 5 §3.7",
  };
}

function renderOutcomes(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (level === 4 || level === 5) {
    return {
      module_type: "outcomes",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 4-5 per Document 4 §5.3.",
      corpus_authority: "Document 4 §5.3 (outcomes active levels 1-3 only)",
    };
  }
  const axes = level <= 2 ? INTENDED_AXES.outcomes : ["solution_category"];
  return {
    module_type: "outcomes",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("outcomes", state, level),
    corpus_authority: "Document 4 §5.2 (outcomes); Document 5 §3.8",
  };
}

function renderUseCases(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (level === 4 || level === 5) {
    return {
      module_type: "use_cases",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 4-5 per Document 4 §5.3.",
      corpus_authority: "Document 4 §5.3 (use_cases active levels 1-3 only)",
    };
  }
  const axes = level <= 2 ? INTENDED_AXES.use_cases : ["solution_category"];
  return {
    module_type: "use_cases",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("use_cases", state, level),
    corpus_authority: "Document 4 §5.2 (use_cases); Document 5 §3.9",
  };
}

function renderTrustSignals(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (level === 5) {
    return {
      module_type: "trust_signals",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 5 per Document 4 §5.3.",
      corpus_authority: "Document 4 §5.3 (trust_signals active levels 1-4; Level 5 not rendered)",
    };
  }
  const axes = level <= 2 ? INTENDED_AXES.trust_signals : level === 3 ? ["solution_category"] : [];
  return {
    module_type: "trust_signals",
    rendering_state: "rendered",
    axes_active: axes,
    variant_descriptor: variantDescriptor("trust_signals", state, level),
    corpus_authority: "Document 4 §5.2 (trust_signals); Document 5 §3.10",
  };
}

// progressive_disclosure: the one module type with two distinct, never-
// conflated suppression states. holdback is evaluated first because a
// holdback visitor is always served Level 5 by the decisioning engine, so the
// two conditions are mutually exclusive in practice — but the explicit check
// order documents the precedence per Document 5 §7.7 (holdback) over §1.3
// (Level 1 active suppression) when reasoning about the rule in isolation.
function renderProgressiveDisclosure(state: VisitorState, level: 1 | 2 | 3 | 4 | 5): ModuleSlot {
  if (state.holdback_group) {
    return {
      module_type: "progressive_disclosure",
      rendering_state: "suppressed_holdback",
      axes_active: [],
      variant_descriptor:
        "SUPPRESSED — holdback control condition. This slot exists architecturally and is intentionally withheld for measurement integrity, not absent from the composition.",
      corpus_authority: "Document 5 §7.7 (progressive_disclosure does not render at Level 5; holdback visitors receive Level 5)",
    };
  }

  if (level === 1) {
    return {
      module_type: "progressive_disclosure",
      rendering_state: "suppressed_active",
      axes_active: [],
      variant_descriptor: "SUPPRESSED — Level 1 (active suppression by design). The visitor is already HIGH-confidence; this slot is architecturally turned off, not absent.",
      corpus_authority: "Document 4 §5.2 (progressive_disclosure Level 1 fallback behavior); Document 5 §1.3",
    };
  }

  if (level === 5) {
    return {
      module_type: "progressive_disclosure",
      rendering_state: "not_rendered",
      axes_active: [],
      variant_descriptor: "Not rendered at Level 5 per Document 4 §5.3.",
      corpus_authority: "Document 4 §5.3 (progressive_disclosure active levels 2-4; Level 1 suppressed_active, Level 5 not_rendered)",
    };
  }

  return {
    module_type: "progressive_disclosure",
    rendering_state: "rendered",
    axes_active: INTENDED_AXES.progressive_disclosure,
    variant_descriptor: variantDescriptor("progressive_disclosure", state, level),
    corpus_authority: "Document 4 §5.2 (progressive_disclosure); Document 5 §3 (role/TAL-context prompts by level)",
  };
}

const RENDERERS: Record<ModuleType, (state: VisitorState, level: 1 | 2 | 3 | 4 | 5) => ModuleSlot> = {
  hero: renderHero,
  benefits: renderBenefits,
  cta: renderCta,
  gated_assets: renderGatedAssets,
  proof: renderProof,
  narrative: renderNarrative,
  problem_framing: renderProblemFraming,
  outcomes: renderOutcomes,
  use_cases: renderUseCases,
  trust_signals: renderTrustSignals,
  progressive_disclosure: renderProgressiveDisclosure,
};

/**
 * Builds the full module composition for a visitor given their state and the
 * decisioning engine's computed result. All 11 module types from Document 4
 * §10 MODULE_TYPES are always present in the returned slots array — module
 * types that do not render at this fallback level are returned with
 * rendering_state: "not_rendered" (or the appropriate suppression state for
 * progressive_disclosure), never omitted from the array. This keeps the
 * composition a complete, inspectable record of every slot's state.
 */
export function renderModules(state: VisitorState, result: DecisioningResult): ModuleComposition {
  const level = result.fallback_level;

  const slots = MODULE_TYPES.map((moduleType) => RENDERERS[moduleType](state, level));

  return { fallback_level: level, slots };
}
