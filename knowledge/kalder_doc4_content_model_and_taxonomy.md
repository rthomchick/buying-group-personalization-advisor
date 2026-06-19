# Document 4: Content Model and Taxonomy
**Kalder Buying Group Personalization Program**
**Status:** Approved — all sections reviewed and approved by Advisory Council
**Data model version:** 0.2.0
**Corpus position:** Document 4 of 9
**Depends on:** Document 1 (Buying Group Role Architecture), Document 2 (Signal Definition and Confidence Model), Document 3 (Audience and Segmentation Architecture), `kalder_data_model_s0_s1.py` §2, §3, §4, §5, §9, §10, §16, §17, §H AR-02, §CA CR-09
**Required by:** Document 5 (Personalization Decisioning Rules), Document 6 (Buying Group Journey and Convergence Model), Document 8 (Operational Runbook)

---

## Table of Contents

- [Section 1: Content Node Type Schema](#section-1-content-node-type-schema)
- [Section 2: Content Type Taxonomy](#section-2-content-type-taxonomy)
- [Section 3: Tagging Taxonomy and Governance](#section-3-tagging-taxonomy-and-governance)
- [Section 4: Through-Line Requirement](#section-4-through-line-requirement)
- [Section 5: Module Types and Composition Rules](#section-5-module-types-and-composition-rules)
- [Section 6: Converge Content Rules](#section-6-converge-content-rules)
- [Section 7: Coverage Completeness Architecture](#section-7-coverage-completeness-architecture)
- [Section 8: Kalder Compose Integration](#section-8-kalder-compose-integration)

---


## Section 1: Content Node Type Schema

> **Depends on:** `kalder_data_model_s0_s1.py` §2, §3, §4, §5, §9, §10, §16, §17, §H AR-02, §CA CR-09

---

## 1.1 The Sanity Content Graph in the Kalder Personalization Architecture

Kalder.com does not serve pre-built pages. Every page a visitor receives is assembled at render time from a set of content graph nodes selected by Adobe Target based on the visitor's contact-plane classification profile — their `role_classification`, `confidence_tier`, `fallback_level`, `buying_job_inferred`, and `solution_category`. The Sanity content graph is simultaneously the content repository and the personalization selection surface. This is what distinguishes the knowledge-centric content model from a conventional CMS: content is not organized into page variants that are swapped wholesale. Instead, individual nodes on a single page can be substituted independently, each according to its own personalization logic, without requiring a separate page variant for every combination of visitor attributes.

The graph model makes partial-page personalization possible. Consider a solution page where a Champion visits in the `engaged` buying group stage. Adobe Target selects a `Content Module` node tagged `role: champion`, `buying_stage: engaged`, `solution_category: customer_engagement`, and `phase: diverge` for the hero module slot. The `Asset` nodes in the gated content rail on the same page are tagged by `buying_job` and gating level — not by role — so they are selected on a different axis entirely. Two modules on the same page, two different content graph nodes, two different personalization dimensions evaluated independently. The visitor receives a coherent page composed of role-appropriate messaging and stage-appropriate gated assets without any pre-authored page variant that combines those two specific states.

The graph relationships between node types are not decoration. They enforce semantic constraints that flat CMS models cannot. A `Content Module` carrying a `narrative_ref` to a `Narrative` node is making a verifiable structural claim: this module belongs to a through-line family governed by that narrative's `solution_claim` and `message_pillar`. The Sanity schema validates the claim at publish time. Semantic constraints that live in editorial convention rather than schema structure will not survive distributed authoring at scale.

One architectural boundary requires explicit statement here because it governs every AEP and Target integration specification downstream. Adobe Target does not query Sanity nodes at render time. Content node metadata required for Target content selection rules is synchronized to Adobe Target's activity configuration at content publication time — when a `Content Module` or `Experience` node enters `status: approved`, the Sanity publication event triggers a synchronization step that makes the node's selection metadata (`role`, `solution_category`, `buying_stage`, `fallback_level`, `confidence_tier_minimum`, `phase`) available in the Target offer catalog. Any field that Adobe Target must read at session time to select an experience must therefore be present in the synchronized offer catalog, not retrieved from Sanity at runtime. The synchronization mechanism is a Document 8 operational specification. Section 1 establishes the architectural principle: Sanity is the authoring source of truth; AEP/Target is the runtime selection surface; they are not the same system. A schema field that exists in Sanity but is not included in the synchronization payload is invisible to Adobe Target.

The ten node types specified in this section — `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Asset`, `Content Module`, `Experience`, `Channel` — are from `kalder_data_model_s0_s1.py §16 CONTENT_GRAPH_NODE_TYPES`. Every node that enters the content graph conforms to one of these ten schemas. The schemas are the generation parameters for Kalder Compose and the field contracts that Adobe Target's content selection rules read against. A node that does not conform to its schema cannot enter an approved publication state in Sanity and therefore cannot be served.

---

## 1.2 Node Type Specifications

**Axis Conditionality Principle:** A node type varies only on the axes specified in its variation profile. Variation on additional axes is conditionally applied, governed by the module type's `intended_axes` specification in `§10 MODULE_TYPES` (elaborated in Section 5). This principle is what keeps the content inventory sustainable — a node type that required variation on all five personalization axes simultaneously (`role` × `solution_category` × `buying_stage` × `buying_job` × `confidence_tier`) would produce a combinatorially unmanageable authoring load. Every node type specification below states explicitly which axes it varies on and which it intentionally omits.

---

### Audience

**Purpose:** Represents a specific buying group role as a content authoring target, providing the human-readable role brief that content authors and Kalder Compose reference when producing role-specific content. The `Audience` node is not a classification entity — it does not duplicate the role definitions in `§2 ROLES`. It is an authoring reference: the practical translation of a role definition into content guidance for a specific solution category.

**Varies on:** `role`, `solution_category`. An `Audience` node exists per role per covered solution category. It does not vary by `buying_stage`, `buying_job`, or `confidence_tier` — those axes are expressed on `Content Module` nodes, not on the `Audience` node itself. Authoring guidance for stage-specific content is carried in `Content Module` authoring notes, not on the `Audience` node.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `role` | enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` | Must match a key in `§2 ROLES` |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | Must match a key in `§1d SOLUTION_CATEGORIES` |
| `label` | string | Free text, max 80 characters | Human-readable display name, e.g. "Champion — Customer Engagement" |
| `content_preferences` | string | Free text, max 500 characters | Summary of the role's content consumption patterns and preferred formats for this solution category; drawn from `§2 ROLES` behavioral_signature and content_preferences fields |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Effective coverage status per `COVERAGE_STATUS_HIERARCHY` §H AR-02 |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `authoring_notes` | string | Free text | Editorial guidance specific to this role × solution category combination; not surfaced at runtime |
| `representative_titles` | array of strings | From `§19 TITLE_ROLE_MAP` for this solution category and role | Informational only; not used by scoring logic; supports content author calibration |

**Graph references:** The `Audience` node is referenced by `Content Module` nodes (inbound) to specify the intended role audience. `Audience` nodes do not carry outbound references to other node types — they are a terminal reference target, not a traversal starting point. A `Content Module` referencing an `Audience` node asserts that the module's content is authored for the role and solution category on that `Audience` node; it is advisory metadata, not a runtime selection criterion. Adobe Target reads `role` and `solution_category` fields on the `Content Module` directly, not via the `Audience` node reference.

**Coverage tracking:** `coverage_status` field present. Represents the role-level coverage completeness for this `(role, solution_category)` pair. An `Audience` node's `coverage_status` should reflect the minimum status across all `Content Module` nodes that reference it. This rollup is computed by `validate_coverage_consistency()` at CI time; it is not maintained manually.

**Authoring notes:** One `Audience` node should exist per `(role, solution_category)` pair in each covered solution category. An `Audience` node with `coverage_status: pending` indicates that the role has been defined but no approved `Content Module` nodes exist for it. Kalder Compose uses the `content_preferences` field as a generation parameter when producing initial content drafts for this role.

---

### JTBD

**Purpose:** Represents a single Job To Be Done from the 131-code library in `§17 JTBD_CODES` as a first-class content graph node. A `JTBD` node is the authoritative reference target for `jtbd_code` fields on other node types. Every `Content Module` and `Proof` node that carries a `jtbd_code` field references a `JTBD` node rather than containing a free-text string; Sanity's graph integrity enforces that the `jtbd_code` on the referencing node's `solution_category` matches the `solution_category` on the `JTBD` node at publication time.

**Varies on:** `solution_category`. A `JTBD` node is solution-category-specific. It does not vary by `role` — JTBD codes represent the work a buying group member is doing, not who they are. Multiple roles may engage with the same buying job at a given stage, and the same `JTBD` node can be referenced by `Content Module` nodes authored for different roles. It does not vary by `buying_stage` — a JTBD code's `buying_job` field (`problem_identification`, `solution_exploration`, `requirements_building`, `supplier_selection`) encodes the stage relationship structurally. It does not vary by `confidence_tier`.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `jtbd_code` | string | Valid code from `§17 JTBD_CODES` for this node's `solution_category` | Format: `{OPPORTUNITY_TYPE_PREFIX}-{ROLE_PREFIX}-{STAGE_PREFIX}-{SEQUENCE}`, e.g. `CE-C-PI-1` |
| `buying_job` | enum | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` | Must match the `buying_job` value for this `jtbd_code` in `§17` |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | Must match the category scope of this `jtbd_code` in `§17` |
| `label` | string | Free text, max 120 characters | Human-readable name for CMS display and Kalder Compose generation parameters |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Coverage status per `COVERAGE_STATUS_HIERARCHY`; most `§17` codes begin at `constructed` |
| `probable_job_prior` | boolean | `true` / `false` | `true` if this JTBD code appears in `PROBABLE_JOB_PRIORS` for its primary role × stage combination |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `definition` | string | Free text, max 500 characters | The functional definition of what the buyer is trying to accomplish when engaged in this job; sourced from `§17` where available |
| `primary_role_affinity` | enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` | The role most commonly associated with this JTBD code; informational only |

**Graph references:** `JTBD` nodes are referenced by `Content Module` nodes and `Proof` nodes (inbound) via those nodes' `jtbd_code` reference fields. `JTBD` nodes carry no outbound references to other node types — they are a lookup target. The cross-document validation that `validate_signal_references()` performs on `BUYING_JOB_INFERENCE_SIGNALS` has a content graph analog: `validate_jtbd_references()` verifies at CI time that every `jtbd_code` reference on a `Content Module` or `Proof` node resolves to an approved `JTBD` node in the same `solution_category`.

**Coverage tracking:** `coverage_status` field present. Represents the coverage completeness of content authored against this specific JTBD code. A `JTBD` node moves from `constructed` to `partial` when at least one approved `Content Module` references it; from `partial` to `complete` when the minimum required `Content Module` count per role is met (specified in Section 7). The rollup to solution-category coverage status applies the `COVERAGE_STATUS_HIERARCHY` minimum-rank rule: a solution category is only `complete` if all `JTBD` nodes required for that category are `complete`.

**Authoring notes:** `JTBD` nodes should be provisioned from `§17 JTBD_CODES` before `Content Module` authoring begins for a given solution category. A missing `JTBD` node will block `Content Module` publication. `jtbd_code` field must use the exact code string from `§17`; do not introduce code aliases or paraphrases. `probable_job_prior: true` nodes represent the most common content selection entry points and should be prioritized in content commissioning sequencing.

---

### Problem

**Purpose:** Represents a specific business problem that a buying group role is experiencing or trying to articulate, as distinct from the solution or outcome. `Problem` nodes are the pain-side anchors in the content graph. They enable problem-centric content — content that helps a visitor recognize and frame a problem before they are oriented toward any solution — to be tagged precisely and retrieved separately from solution-oriented content.

**Varies on:** `role`, `solution_category`. A `Problem` node is authored for a specific role experiencing a specific problem in a specific solution category context. It does not vary by `buying_stage` — a problem statement is stage-stable in that the problem itself does not change as the buying group advances, though how it is articulated shifts. Stage-specific articulation is handled at the `Content Module` level. It does not vary by `buying_job` or `confidence_tier`.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `role` | enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` | The role for whom this problem statement is written |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | The solution category context for this problem |
| `problem_statement` | string | Free text, max 300 characters | The concise articulation of the problem from the role's perspective; first-person voice recommended |
| `label` | string | Free text, max 80 characters | CMS display name |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Per `COVERAGE_STATUS_HIERARCHY` |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `jtbd_ref` | Sanity reference | Reference to a `JTBD` node in the same `solution_category` | Links this problem to the buying job it arises from; supports content retrieval via job context |
| `urgency_signal` | string | Free text, max 200 characters | What makes this problem time-sensitive or high-stakes for this role; used by Kalder Compose for urgency framing |

**Graph references:** `Problem` nodes are referenced by `Content Module` nodes (inbound) to associate the module's content with the specific problem it addresses. `Problem` nodes optionally reference `JTBD` nodes (outbound) via `jtbd_ref`. The inbound reference from `Content Module` is advisory — it supports content retrieval and authoring context; it is not a required field on `Content Module`.

**Coverage tracking:** `coverage_status` field present. A `Problem` node with `coverage_status: constructed` has been defined but no approved `Content Module` references it yet.

**Authoring notes:** Problem statements should be written from the buyer's perspective, not Kalder's framing. "We can't identify which accounts are close to buying" is a problem statement. "Kalder's buying group identification capabilities address this need" is not. Problem nodes are inputs to Kalder Compose generation prompts — the problem statement populates the pain-side framing parameter. A single role may have multiple `Problem` nodes in a given solution category.

---

### Outcome

**Purpose:** Represents a specific business outcome that a buying group role is trying to achieve, as distinct from the features or capabilities that deliver it. `Outcome` nodes are the aspiration-side anchors in the content graph, complementing `Problem` nodes. They enable outcome-oriented content — content that helps a visitor envision a positive future state — to be tagged and retrieved as a distinct content type.

**Varies on:** `role`, `solution_category`. Outcome articulation is role-specific: an Economic Buyer's outcome ("reduce total cost of ownership for CRM infrastructure by 30% over three years") and a Champion's outcome ("deliver a customer service platform that the team can configure without professional services") address the same solution category but represent fundamentally different success criteria. `Outcome` nodes do not vary by `buying_stage` or `buying_job` — the outcome itself is stable; stage-specific outcome emphasis is expressed at the `Content Module` level.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `role` | enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` | The role for whom this outcome is articulated |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | The solution category context |
| `outcome_statement` | string | Free text, max 300 characters | The articulation of the desired future state from the role's perspective |
| `label` | string | Free text, max 80 characters | CMS display name |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Per `COVERAGE_STATUS_HIERARCHY` |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `metric_proxy` | string | Free text, max 200 characters | A measurable proxy for this outcome, where one exists; used in ROI-oriented content generation |
| `jtbd_ref` | Sanity reference | Reference to a `JTBD` node in the same `solution_category` | Links this outcome to the buying job it supports completion of |

**Graph references:** `Outcome` nodes are referenced by `Content Module` nodes (inbound) to associate module content with the specific outcome it addresses. `Outcome` nodes optionally reference `JTBD` nodes (outbound) via `jtbd_ref`. As with `Problem`, the inbound reference from `Content Module` is advisory, not required.

**Coverage tracking:** `coverage_status` field present. Representation consistent with `COVERAGE_STATUS_HIERARCHY`.

**Authoring notes:** Outcome statements should be written in the buyer's language, not Kalder's product vocabulary. "The security team can audit all AI model interactions in a single view" is an outcome statement. "Kalder AI Platform delivers unified AI governance" is a product claim, which belongs in a `Narrative` node's `solution_claim` field. The distinction matters for content graph integrity: outcome content is problem-space oriented; narrative content is vendor-positioned.

---

### Narrative

**Purpose:** Carries the canonical `solution_claim` and `message_pillar` for a given `(solution_category, buying_stage)` pair. The `Narrative` node is the structural mechanism that enforces the through-line requirement: all role-variant `Content Module` nodes for the same `(solution_category, buying_stage)` pair must reference the same `Narrative` node, which means they all inherit the same `solution_claim` and `message_pillar`. A `Content Module` does not carry its own `solution_claim` or `message_pillar` fields — those values are always read from the referenced `Narrative` parent. This is structural enforcement, not editorial convention. A `Content Module` in draft or under review state that references a `Narrative` node not yet in `approved` status cannot itself enter `approved` status; the status dependency is enforced by Sanity validation.

**Varies on:** `solution_category`, `buying_stage`. A `Narrative` node is scoped to a `(solution_category, buying_stage)` pair. It does not vary by `role` — this is the point: the same Narrative governs all roles at a given stage within a solution category, establishing the through-line that prevents information asymmetry inside the buying group. It does not vary by `buying_job` or `confidence_tier`.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | Solution category this narrative governs |
| `buying_stage` | enum | `targeted` / `engaged` / `prioritized` / `qualified` | The `BG_STAGES` value this narrative applies to; allowed values from `§5 BG_STAGES` |
| `solution_claim` | string | Free text, max 400 characters | The canonical, factually grounded claim about what Kalder's solution achieves in this category and stage context; shared across all role variants |
| `message_pillar` | string | Free text, max 300 characters | The primary thematic emphasis that content for this category × stage should build from; shared across all role variants |
| `label` | string | Free text, max 80 characters | CMS display name, e.g. "Customer Engagement — Targeted" |
| `status` | enum | `draft` / `under_review` / `approved` | Lifecycle state; only `approved` Narratives may be referenced by `Content Module` nodes in `approved` state |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `supporting_claims` | array of strings | Free text, max 200 characters each | Secondary claims that role-specific content may draw from; these are permitted divergence points — roles may choose different supporting claims, as long as the `solution_claim` and `message_pillar` are shared |
| `proof_ref` | array of Sanity references | References to `Proof` nodes | Specific proof points that substantiate the `solution_claim`; populated by content strategist during approval workflow |
| `authoring_brief` | string | Free text, max 500 characters | Guidance for content authors and Kalder Compose on how role variants should apply this narrative; not surfaced at runtime |

**Graph references:** `Narrative` nodes are referenced by `Content Module` nodes (inbound) via the required `narrative_ref` field on all `phase: diverge` and `phase: converge` `Content Module` nodes. The direction and cardinality are: one `Narrative` node governs multiple `Content Module` nodes; each `Content Module` node references exactly one `Narrative` node. `Narrative` nodes optionally reference `Proof` nodes (outbound). `Narrative` nodes do not reference `Audience`, `JTBD`, `Problem`, or `Outcome` nodes — those are content graph inputs, not narrative governance entities.

**The status dependency rule:** A `Content Module` node in `status: approved` requires its `narrative_ref` to resolve to a `Narrative` node in `status: approved`. Sanity validation blocks a `Content Module` from entering `approved` if its referenced `Narrative` is in `draft` or `under_review`. This is the machine-testable expression of the through-line requirement.

**Coverage tracking:** `Narrative` nodes do not carry a `coverage_status` field. Coverage tracking operates at the `Content Module` level. A missing `Narrative` node for a required `(solution_category, buying_stage)` pair will surface as a `Content Module` publication block, which propagates to coverage gap reporting in Section 7.

**Authoring notes:** `Narrative` nodes should be authored by the content strategist and approved before `Content Module` commissioning begins for the relevant `(solution_category, buying_stage)` pair. Amending a `Narrative` node's `solution_claim` or `message_pillar` after dependent `Content Module` nodes have been approved requires those modules to be returned to `under_review` and re-approved — Sanity should enforce this via a validation hook on `Narrative` status changes. Do not conflate `solution_claim` with a product feature claim; it is a claim about what the buyer achieves, not what the product does.

**Implementation note (Raab R-01):** The status-dependency validation rule — blocking a `Content Module` from entering `approved` when its `narrative_ref` points to a non-approved `Narrative` — requires a custom Sanity validation function implemented as a GROQ-based cross-document query on the `status` field of the referenced document. This is not a native Sanity schema constraint; Sanity's built-in reference field type does not enforce status conditions on referenced documents without custom validation logic. The function specification is a Document 8 implementation dependency and must be scoped in the platform engineering workstream before Section 8 drafts.

**Versioning recommendation (Alfonso A-02):** Amending a `Narrative` node's `solution_claim` or `message_pillar` in a live program cascades to all dependent `Content Module` nodes, returning them to `under_review`. For programs with significant approved content inventory, this can temporarily suppress personalization across a solution category while modules are re-reviewed. The recommended pattern is to version `Narrative` nodes: create a new `Narrative` draft for the amended through-line and advance it through review while the current `approved` version remains active. Retire the current version only after all dependent modules have been re-approved against the new version. This pattern requires the Sanity schema to support multiple `Narrative` nodes per `(solution_category, buying_stage)` pair with lifecycle-gated activation — only one `Narrative` per pair should be `approved` at any time. The activation gate is a Document 8 operational procedure.

---

### Proof

**Purpose:** Represents a discrete proof point — a customer reference, a third-party validation, a quantitative outcome, or a peer case — that substantiates a `solution_claim`. `Proof` nodes are the evidentiary layer of the content graph. They are designed to be referenced from multiple `Narrative` and `Content Module` nodes, avoiding proof point duplication across role-specific content.

**Varies on:** `buying_job`, `solution_category`. A `Proof` node is scoped to the buying job it is most relevant for — proof that addresses a supplier selection evaluation criterion is not the same proof as evidence that validates a problem's urgency. It does not vary by `role` — proof points are typically role-shareable, though `Content Module` authors choose which proof points to surface for each role. It does not vary by `buying_stage` or `confidence_tier`.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `proof_type` | enum | `customer_reference` / `analyst_validation` / `quantitative_outcome` / `peer_case` / `benchmark` | Classification of evidence type |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | The solution category this proof point is relevant to |
| `buying_job` | enum | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` | The buying job stage this proof point is most persuasive for |
| `claim` | string | Free text, max 400 characters | The substantiated claim this proof point establishes; e.g., "Customers report 40% reduction in case resolution time in the first 90 days" |
| `label` | string | Free text, max 80 characters | CMS display name |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Per `COVERAGE_STATUS_HIERARCHY` |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `jtbd_ref` | Sanity reference | Reference to a `JTBD` node in the same `solution_category` | Associates this proof point with the specific buying job it supports |
| `source_attribution` | string | Free text, max 200 characters | Source of the proof claim; customer name where disclosed, analyst firm, or study reference |
| `gating_level` | enum | `ungated` / `gated_email` / `gated_registration` | Whether this proof point is usable in ungated content or requires a gated context |

**Graph references:** `Proof` nodes are referenced by `Narrative` nodes (inbound) via `proof_ref` and by `Content Module` and `Asset` nodes (inbound) when proof points are embedded in or linked from content. `Proof` nodes optionally reference `JTBD` nodes (outbound) via `jtbd_ref`. A single `Proof` node may be referenced by multiple `Narrative` and `Content Module` nodes across different roles — this is the intended design, not a data integrity concern.

**Coverage tracking:** `coverage_status` field present. Coverage at the `Proof` level tracks whether the solution category has sufficient substantiated claims across all four buying job stages.

**Authoring notes:** `claim` must be factually substantiated — it is the field most likely to be audited for accuracy. Do not paraphrase or embellish quantitative claims. `Proof` nodes with `proof_type: customer_reference` require legal review before entering `status: approved`. `Content Module` nodes that reference a `Proof` node currently in legal review should not be held in `under_review` solely because of the pending `Proof` status — the `Content Module` may be approved with the `proof_ref` omitted (published without that specific proof point) and the `Proof` reference added when legal review completes. The `Content Module` re-enters `under_review` only to add the proof reference, not to revise the `content_body`. This pattern prevents legal review timelines from blocking content module approval pipelines and must be documented as an explicit workflow path in the Kalder Compose commissioning procedures (Section 8). `Proof` nodes are shared across roles; role-specific framing of a proof point (how the same evidence is presented to a Champion vs. an Economic Buyer) is handled in the `Content Module` that references the `Proof` node, not in the `Proof` node itself.

---

### Asset

**Purpose:** Represents a discrete gated or ungated content asset — an ePDF, video, interactive tool, webinar recording, or other deliverable — that can be surfaced in a page experience via the `gated_assets` module or embedded in a `Content Module`. `Asset` nodes are the distribution layer for content types from `§9 CONTENT_TYPE_TAXONOMY`. They carry the metadata that determines which assets surface for which visitor at which confidence level.

**Varies on:** `buying_job`, `solution_category`. The `gated_assets` module selects assets by `role × buying_stage × buying_job` — the `buying_job` axis is how the module queries the asset inventory. Assets are not role-specific in the same way that `Content Module` nodes are: the same case study may be appropriate for Champion and Economic Buyer at the supplier selection stage, with different framing handled by the module, not the asset itself. Assets do not vary by `confidence_tier` but carry a `confidence_tier_minimum` field that gates which confidence levels may receive them.

[CA FLAG] `confidence_tier_minimum` is a new content graph attribute that must be added to `CLIENT_ATTRIBUTE_MAP` (§CA) to support Adobe Target content selection rule evaluation at session time.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | Solution category this asset belongs to |
| `buying_job` | enum | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` | The buying job this asset is most relevant to |
| `content_type` | enum | Valid key from `§9 CONTENT_TYPE_TAXONOMY` | e.g., `case_study`, `solution_overview`, `roi_calculator` |
| `content_format` | enum | `web_page` / `epdf` / `legacy_pdf` / `video` / `interactive_tool` / `webinar` / `community_post` | The delivery format; determines which engagement event types fire on interaction |
| `gating` | enum | `ungated` / `gated_email` / `gated_registration` | Gating level; ungated assets may appear at any fallback level; gated assets require minimum MEDIUM role confidence |
| `confidence_tier_minimum` | enum | `UNKNOWN` / `LOW` / `MEDIUM` / `HIGH` | Minimum role confidence required to receive this asset; `UNKNOWN` means the asset is available at all fallback levels [CA FLAG] |
| `label` | string | Free text, max 120 characters | CMS display name |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Per `COVERAGE_STATUS_HIERARCHY` |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `jtbd_ref` | Sanity reference | Reference to a `JTBD` node in the same `solution_category` | Associates this asset with a specific buying job code |
| `role_affinity` | array of enums | Subset of role enum values | Roles for whom this asset has strong content relevance; informational, not a hard gate |
| `maps_to_signals` | array of strings | Keys from `§7 CROSS_ROLE_WEIGHTS` | The engagement events that fire when a visitor interacts with this asset; maps to signal scoring per CR-05 pattern in `§9` |
| `phase` | enum | `diverge` / `converge` | Most assets are `diverge`; Consensus Briefs and group alignment assets are `converge` |

**Graph references:** `Asset` nodes are referenced by `Content Module` nodes (inbound) when assets are embedded in or linked from module content. `Asset` nodes optionally reference `JTBD` nodes (outbound) via `jtbd_ref`. `Asset` nodes do not reference `Narrative` nodes — assets are evidence and resource layers, not through-line participants. `Asset` nodes are not role-variant by design; the graph does not require five role-specific variants of a case study. Role-specific framing of asset presentation is handled in the `gated_assets` or `proof` module that surfaces the asset.

**Coverage tracking:** `coverage_status` field present. Coverage tracks whether the required asset inventory by `buying_job` and `solution_category` is complete per the thresholds in Section 7.

**Authoring notes:** `maps_to_signals` must reference valid keys from `§7 CROSS_ROLE_WEIGHTS`. This is validated by `validate_signal_references()` and should be populated during asset commissioning, not retrospectively. Gated assets with `gating: gated_registration` must not be surfaced to visitors below the `MEDIUM` confidence tier; this is enforced by the `confidence_tier_minimum` field and the Adobe Target content selection rule for the `gated_assets` module.

---

### Content Module

**Purpose:** Represents a discrete, role-and-stage-specific content unit that is assembled into a page experience at render time. `Content Module` nodes are the primary personalization unit in the content graph — the node type that Adobe Target selects and substitutes based on the visitor's contact-plane classification profile. A `Content Module` corresponds to a specific module slot in the `Experience` node that governs the page it appears on. All role-variant diverge-phase content lives at this node type level.

**Varies on:** `role`, `solution_category`, `buying_stage`. At minimum, a `Content Module` varies on these three axes — one node per `(role, solution_category, buying_stage)` combination for each module slot. When three-axis personalization is active, `buying_job` is an additional variation axis, but only within the conditions specified in `MODULE_COMPOSITION_RULES §10` (three-axis activation requires HIGH role confidence and KNOWN or INFERRED buying job confidence per Section 5 rules). `Content Module` nodes do not vary by `confidence_tier` — the `confidence_tier_minimum` field sets a display gate, but the node itself does not have separate variants per tier.

**Axis variation note:** The combination of `role` (5 values) × `solution_category` (5 values) × `buying_stage` (4 values) produces up to 100 potential `Content Module` nodes per module slot without the `buying_job` axis. This is the manageable authoring load. Adding `buying_job` as a required fourth axis for all content would produce up to 400 nodes per slot — which is not sustainable. `buying_job` variation on `Content Module` is therefore **conditionally applied**: only for module types where `intended_axes` in `§10 MODULE_TYPES` includes `buying_job`. For module types where `buying_job` is in `omitted_axes_rationale`, `Content Module` nodes do not vary on that axis and the `jtbd_ref` field is advisory rather than deterministic.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `role` | enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` | The role this module is authored for |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | The solution category this module belongs to |
| `buying_stage` | enum | `targeted` / `engaged` / `prioritized` / `qualified` | The `BG_STAGES` value this module is authored for |
| `phase` | enum | `diverge` / `converge` | **Diverge** modules are served by Adobe Target to individual role-classified visitors. **Converge** modules are not served via Adobe Target — they are distributed internally by Champions via private channels (email, Slack, shared documents). This distinction is load-bearing: a converge module that enters the Adobe Target activity set is a configuration error. |
| `narrative_ref` | Sanity reference | Required reference to a `Narrative` node with matching `solution_category` and `buying_stage` | **Required on all `phase: diverge` and `phase: converge` Content Module nodes.** The referenced `Narrative` must be in `status: approved` before this node can enter `status: approved`. This is the structural through-line enforcement mechanism. The `solution_claim` and `message_pillar` values this module must be consistent with are read from the referenced `Narrative` node — they are not stored on this node. |
| `module_type` | enum | Valid key from `§10 MODULE_TYPES` | e.g., `hero`, `benefits`, `cta`, `gated_assets`; determines which page slot this module occupies and which personalization axes apply |
| `content_body` | string | Structured content per module type conventions | The authored content; format varies by `module_type`; populated by Kalder Compose and reviewed by human editor |
| `confidence_tier_minimum` | enum | `UNKNOWN` / `LOW` / `MEDIUM` / `HIGH` | Minimum confidence tier required to serve this module; most role-specific modules require `MEDIUM`; modules with highly specific role claims may require `HIGH` [CA FLAG] |
| `label` | string | Free text, max 120 characters | CMS display name |
| `status` | enum | `draft` / `under_review` / `approved` | Lifecycle state; only `approved` nodes are eligible for Adobe Target serving (diverge) or Champion distribution (converge) |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Per `COVERAGE_STATUS_HIERARCHY`; `complete` requires `status: approved` |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `jtbd_ref` | Sanity reference | Reference to a `JTBD` node in the same `solution_category` | Required when `module_type` varies on `buying_job` axis per `§10`; advisory for module types that omit `buying_job` |
| `audience_ref` | Sanity reference | Reference to an `Audience` node with matching `role` and `solution_category` | Links to the authoring reference for this role; advisory |
| `problem_ref` | Sanity reference | Reference to a `Problem` node with matching `role` and `solution_category` | Associates this module with the problem it addresses |
| `outcome_ref` | Sanity reference | Reference to an `Outcome` node with matching `role` and `solution_category` | Associates this module with the outcome it supports |
| `proof_refs` | array of Sanity references | References to `Proof` nodes | Proof points embedded or linked in this module |
| `asset_refs` | array of Sanity references | References to `Asset` nodes | Assets surfaced by this module |

**Graph references:** `Content Module` nodes are referenced by `Experience` nodes (inbound) as part of the experience composition. `Content Module` nodes reference `Narrative` nodes (outbound, required), `JTBD` nodes (outbound, conditionally required), `Audience` nodes (outbound, optional), `Problem` nodes (outbound, optional), `Outcome` nodes (outbound, optional), `Proof` nodes (outbound, optional), and `Asset` nodes (outbound, optional).

**Coverage tracking:** `coverage_status` field present. `Content Module` coverage is the primary coverage tracking surface. Coverage completeness reporting in Section 7 aggregates `Content Module` `coverage_status` values by `(solution_category, role, buying_stage)` combination, applying the `COVERAGE_STATUS_HIERARCHY` minimum-rank rule.

**Authoring notes:** A `Content Module` must not contain its own `solution_claim` or `message_pillar` text — those values are inherited structurally from the referenced `Narrative` node. If an author finds they need to write a `solution_claim` into a `Content Module`'s `content_body`, that is a signal that either (a) the `Narrative` node for this `(solution_category, buying_stage)` pair does not exist and must be created first, or (b) the author is drafting a new claim that should be reviewed as a potential amendment to the `Narrative` node. The `phase: converge` distinction must be applied correctly: if a module is intended for Champion distribution rather than Adobe Target serving, it must be tagged `phase: converge`. Mis-tagging converge content as diverge is the primary through-line failure mode.

---

### Experience

**Purpose:** Represents a complete assembled page experience — a specific configuration of `Content Module` nodes that compose into a page for a given `(role, solution_category, buying_stage, fallback_level)` combination. The `Experience` node is the assembly specification: it defines which module slots are present, which `Content Module` node fills each slot, and what the experience's overall personalization context is. Adobe Target's activity rules reference `Experience` nodes to determine which assembled configuration to serve. An `Experience` node represents a single fallback level — separate `Experience` nodes exist per `(role, solution_category, buying_stage, fallback_level)` combination; multi-level fallback composition does not occur at the `Experience` node level.

**Varies on:** `role`, `solution_category`, `buying_stage`. An `Experience` node is authored per `(role, solution_category, buying_stage)` combination for each personalized page template. At Level 3 and below fallback levels, `Experience` nodes vary on `solution_category` only (no role differentiation). `Experience` nodes do not vary by `confidence_tier` independently — the `fallback_level` field on the `Experience` node encodes the confidence tier context and determines which modules are included.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `role` | enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` / `default` | `default` is used for fallback level 3 and below experiences where no role classification applies |
| `solution_category` | enum | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | Solution category this experience is designed for |
| `buying_stage` | enum | `targeted` / `engaged` / `prioritized` / `qualified` / `any` | `any` is used for fallback level 4 and below experiences where no stage context applies |
| `fallback_level` | integer | 1 / 2 / 3 / 4 / 5 | Corresponds to the five levels in `§4 FALLBACK_CASCADE`; determines experience depth and which module slots are personalized |
| `module_slots` | array of objects | `[{slot_name: string, content_module_ref: Sanity reference}]` | The ordered list of module slots on this page template and the `Content Module` node assigned to each; all referenced `Content Module` nodes must be in `status: approved` |
| `page_template` | string | Valid key from `§20 WEBSITE_SURFACE_TAXONOMY` | The website surface this experience is designed for |
| `label` | string | Free text, max 120 characters | CMS display name |
| `coverage_status` | enum | `pending` / `constructed` / `partial` / `complete` | Per `COVERAGE_STATUS_HIERARCHY` |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `phase` | enum | `diverge` / `converge` | Most `Experience` nodes are `diverge`; converge experiences are Champion-distributed packages, not web page assemblies |
| `ab_test_variant` | string | Free text | Adobe Target activity variant identifier; populated during A/B test configuration |

**Graph references:** `Experience` nodes reference `Content Module` nodes (outbound) via `module_slots`. `Experience` nodes are referenced by `Channel` nodes (inbound) as the experience package that a channel delivers. The `Experience` node is the junction between content authoring (upstream: `Narrative`, `Content Module`, `Asset`) and delivery configuration (downstream: `Channel`).

**Coverage tracking:** `coverage_status` field present. An `Experience` node is `complete` when all required module slots contain approved `Content Module` references for the relevant `(role, solution_category, buying_stage)` combination.

**Authoring notes:** `Experience` nodes are not authored by the content team — they are assembled by the CMS configuration team from approved `Content Module` nodes. An `Experience` node cannot enter `status: approved` if any of its `module_slots` references a `Content Module` not in `status: approved`. When a `Content Module` is returned to `under_review` (e.g., due to a `Narrative` node amendment), all `Experience` nodes that reference it are automatically flagged for re-review.

---

### Channel

**Purpose:** Represents a delivery channel configuration — the specification for how an `Experience` is delivered to a visitor through a specific channel (web, email, paid media, sales enablement). `Channel` nodes encode the technical delivery contract between the content graph and a specific activation channel. At v1 launch, the only active channel is web (Adobe Target); the schema supports the omni-channel vision in `§0 MODULE_SCOPE`.

**Varies on:** Does not vary by personalization axis. A `Channel` node represents a channel-level configuration, not a role-specific or stage-specific one. The role and stage variation is encoded in the `Experience` nodes that the `Channel` node references. A single `Channel` node for the web channel references all `Experience` nodes configured for Adobe Target delivery — it is the channel specification, not the experience specification.

**Required fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `channel_type` | enum | `web` / `email` / `paid_media` / `sales_enablement` / `events` | Must match a value in `§0 MODULE_SCOPE designed_for` |
| `channel_platform` | string | Free text, max 80 characters | The specific platform within this channel type; e.g., `adobe_target` for web, `marketo` for email |
| `activation_status` | enum | `active` / `planned` / `deferred` | `active` at v1: web only; all others are `planned` or `deferred` |
| `experience_refs` | array of Sanity references | References to `Experience` nodes | The experiences configured for delivery via this channel |
| `label` | string | Free text, max 80 characters | CMS display name |

**Optional fields:**

| Field | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `targeting_rules_ref` | string | Reference or URL to the Adobe Target activity configuration | For the web channel, the link to the Target activity that implements this channel's personalization rules; not a Sanity node reference |
| `consent_gate` | string | Free text | Consent state requirements for this channel per `§P PRIVACY_CONSENT_ARCHITECTURE`; the web channel requires `visitor_consent_state: functional_only` or `full` for behavioral personalization |

**Graph references:** `Channel` nodes reference `Experience` nodes (outbound) via `experience_refs`. `Channel` nodes are not referenced by any other node type — they are terminal assembly nodes. The `Channel` node layer is the boundary between the content graph and the delivery infrastructure.

**Coverage tracking:** `Channel` nodes do not carry a `coverage_status` field. Channel activation status is tracked via the `activation_status` field. Coverage completeness is tracked at the `Experience` and `Content Module` levels, not at the channel level.

**Authoring notes:** `Channel` nodes are maintained by the marketing operations and platform engineering team, not by content authors. The web `Channel` node's `experience_refs` array must be synchronized with the Adobe Target activity configuration — divergence between the Sanity `Channel` node and the live Target activity is a configuration error that will produce incorrect experience delivery without a Sanity-side error. [PENDING: Document 8 owner to specify the operational audit process for verifying `Channel` node / Target activity synchronization.]

---

## 1.3 Graph Relationship Summary

The following describes the principal reference relationships between node types, including direction and semantic meaning. This is a summary; full relationship specifications are in the per-node-type sections above.

**`Content Module` → `Narrative` (required, outbound):** Every `phase: diverge` and `phase: converge` `Content Module` references exactly one `Narrative` node with matching `solution_category` and `buying_stage`. This reference enforces the through-line requirement. The `Content Module` inherits `solution_claim` and `message_pillar` from the referenced `Narrative`; it does not carry its own. A `Content Module` cannot be approved if its `Narrative` reference is absent or the `Narrative` is not in `status: approved`.

**`Narrative` → `Proof` (optional, outbound):** A `Narrative` node may reference one or more `Proof` nodes via `proof_ref` to associate the canonical claims it establishes with their evidentiary basis. This is an authoring-time link used by Kalder Compose to ground `solution_claim` generation in substantiated evidence.

**`Content Module` → `JTBD` (conditionally required, outbound):** `Content Module` nodes for module types where `§10 MODULE_TYPES intended_axes` includes `buying_job` carry a required `jtbd_ref` to a `JTBD` node in the same `solution_category`. For module types where `buying_job` is in `omitted_axes_rationale`, `jtbd_ref` is optional. This reference is validated at publish time by a Sanity validation hook that checks `solution_category` consistency between the `Content Module` and the referenced `JTBD` node.

**`Content Module` → `Asset` (optional, outbound):** `Content Module` nodes for module types that surface downloadable or linked assets (e.g., `gated_assets`) reference one or more `Asset` nodes. The `Asset` nodes provide the metadata that determines which assets surface at which fallback levels.

**`Problem` / `Outcome` → `JTBD` (optional, outbound):** Both `Problem` and `Proof` nodes may reference `JTBD` nodes via `jtbd_ref` to associate the problem or outcome with the buying job it arises from or supports completion of.

**`Experience` → `Content Module` (required, outbound):** `Experience` nodes reference `Content Module` nodes via `module_slots` — one reference per module slot per page template. This is the assembly relationship. An `Experience` node cannot be approved if any referenced `Content Module` is not in `status: approved`.

**`Channel` → `Experience` (required, outbound):** `Channel` nodes reference `Experience` nodes via `experience_refs`. This is the delivery configuration relationship — the specification of which assembled experiences are active in which channels.

**`Audience` is referenced by `Content Module` (optional, inbound):** `Content Module` nodes may carry an `audience_ref` pointing to the `Audience` node that describes the authoring target for this module. This is an authoring reference, not a runtime selection criterion.

---

## 1.4 `coverage_status` at the Node Level and Solution-Category Rollup

`coverage_status` on individual nodes expresses the node's contribution to the overall content inventory. The four values — `pending`, `constructed`, `partial`, `complete` — correspond to the rank hierarchy in `COVERAGE_STATUS_HIERARCHY` (§H AR-02): `pending` = 0, `constructed` = 1, `partial` = 2, `complete` = 3.

**Node-level `coverage_status` semantics:**
- `pending`: The node has been defined (schema exists, required fields populated) but no downstream content has been produced against it. A `JTBD` node at `pending` means no `Content Module` references it. An `Audience` node at `pending` means no approved `Content Module` exists for this role × solution category pair.
- `constructed`: Content exists but has not been source-validated. Most `§17 JTBD_CODES` begin at `constructed`. A `Content Module` at `constructed` has been generated by Kalder Compose but not yet approved by human review.
- `partial`: Some of the required downstream content exists and is approved, but the complete required inventory is not yet met. A `JTBD` node moves from `constructed` to `partial` when at least one approved `Content Module` references it.
- `complete`: All required downstream content for this node exists in approved state. Completeness thresholds are specified in Section 7.

**Solution-category rollup:** A solution category's effective `coverage_status` is the minimum `coverage_status` across all `JTBD` nodes, `Audience` nodes, and `Content Module` nodes required for that category. This is the `inheritance_rule: minimum_across_all_associated_entities` rule from `COVERAGE_STATUS_HIERARCHY`. The `validate_coverage_consistency()` helper function in `§H AR-02` enforces this at CI time.

The rollup is computable, not aspirational. `coverage_status` fields must not be set manually by content authors — they must be derived from the actual state of the node's downstream dependencies. Manual status setting bypasses the minimum-rank rule and produces false completeness signals. The Sanity schema should enforce this: `coverage_status` fields that are computed from downstream state should be read-only in the CMS authoring interface, writable only by the automated coverage tracking pipeline.

[CA FLAG] `solution_category_coverage_status` — the computed effective coverage status per solution category, derived from the minimum-rank rollup — should be added to `CLIENT_ATTRIBUTE_MAP` (§CA) as a surfaceable attribute for operational dashboard monitoring.

---

*End of Section 1. Section 2 (Content Type Taxonomy) specifies how the 30 content types in `§9 CONTENT_TYPE_TAXONOMY` map to node types and module slots. Section 3 (Tagging Taxonomy and Governance) specifies the field-level governance rules for applying the metadata fields defined in this section. Section 7 (Coverage Completeness Architecture) specifies the minimum content inventory thresholds that must be met at each node type level to activate personalization per fallback cascade level.*

---

## Section 2: Content Type Taxonomy

> **Depends on:** Document 4 Section 1 (`Asset` node type), Document 4 Section 3, Document 2 Section 7 (`BUYING_JOB_INFERENCE_SIGNALS`), `kalder_data_model_s0_s1.py` §9, §7 CROSS_ROLE_WEIGHTS

---

### 2.1 Content Types and Node Types: The Relationship

Content types and node types are two separate classification systems that operate on the same content objects. Content types classify what content *is* and what it *does* in the buying group evaluation process — a `case_study` is content a buyer consumes to collect peer validation evidence during supplier selection. Node types classify how content is *structured* in the Sanity content graph — a `case_study` is stored as an `Asset` node with `content_type: case_study`. The two systems intersect at the `Asset` node: the `content_type` field on an `Asset` node maps a graph structure to a content classification, and the `content_format` field on the same node maps it to a delivery mechanism.

The content type tells the personalization system what behavioral signals are possible when the asset is engaged with (via `maps_to_signals`). The node type tells the system how the asset is structured and how it can be referenced by `Content Module` nodes in the content graph. These are distinct responsibilities; conflating them creates confusion in both content planning and content graph maintenance.

The distinction matters operationally because the two vocabularies serve different audiences. Content authors think and commission work in content type vocabulary ("we need more case studies for the `supplier_selection` stage across Customer Engagement"); the personalization machinery operates in node type vocabulary ("retrieve all approved `Asset` nodes with `buying_job: supplier_selection` and `solution_category: customer_engagement`"). Section 2 is the translation layer between those two vocabularies, enabling content plans written in one language to be executed in the other.

---

### 2.2 The `maps_to_signals` Field: Semantics and Implications

In data model v0.2.0, the `signal_weights` field was removed from all `CONTENT_TYPES` entries and replaced with `maps_to_signals` (AR-05). The reason for the change: `signal_weights` was encoding a flat per-role weight profile directly on each content type entry — duplicating, and eventually drifting from, the authoritative weights already specified in `§7 CROSS_ROLE_WEIGHTS`. When a weight was tuned in `CROSS_ROLE_WEIGHTS`, there was no mechanism to propagate the update to the corresponding `signal_weights` entry on the content type. The two tables would silently diverge. `maps_to_signals` solves this by making the content type entry a reference, not a definition. It lists the `CROSS_ROLE_WEIGHTS` keys that are possible when a visitor engages with this content type. The weights themselves are always read from `CROSS_ROLE_WEIGHTS` via that reference. `CROSS_ROLE_WEIGHTS` remains the sole authoritative source for all signal weight values.

`maps_to_signals` lists possible signals — not guaranteed signals. A content type may map to multiple signal keys; which key fires in a given engagement depends on the specific action the visitor takes. A content type with `maps_to_signals: ["case_study_download", "competitive_comparison_view"]` means a visitor who downloads the file fires `case_study_download`; a visitor who reads the content in-browser fires `competitive_comparison_view`. Both are possible; the scoring engine evaluates whichever signal fired and accumulates the corresponding `CROSS_ROLE_WEIGHTS` values. It does not require all keys in `maps_to_signals` to be present in a given engagement.

The `engagement_threshold` field on each content type specifies the minimum engagement depth required for a signal to qualify. Accidental page loads, bot traffic, and single-second visits must not generate signal observations. The threshold ensures that only meaningful engagement contributes to role scoring. Different format types support different threshold mechanisms: `web_page` and `epdf` formats use dwell-time thresholds (minimum active engagement seconds, captured by Segment custom events — not raw tab focus time); `epdf` and `legacy_pdf` downloads fire on the download action event without a dwell requirement; `interactive_tool` formats fire on form submission or calculator interaction completion events; `webinar` formats fire on registration or attendance confirmation events. The threshold type is a property of both the content type and the format — a `case_study` delivered as a `web_page` uses a dwell threshold, while the same content delivered as an `epdf` fires on download. Format choice is therefore a content planning decision with direct signal implications (see Section 2.4).

---

### 2.3 Content Types Organized by Buying Job

#### `problem_identification`

At the `problem_identification` stage, a buyer is asking: Is this problem real? Is it common enough to justify action? How severe is our situation compared to peers? What kind of solution addresses this category of problem? They are not yet evaluating specific vendors. They are building the case — internally, to themselves — that the problem merits investment. Content in this group helps buyers complete that task, not persuade them that a vendor is the right choice.

| Content Type Key | Label | Primary Role Affinity | Phase | Gating | Buying Job Indicator Tier | Notes |
|---|---|---|---|---|---|---|
| `thought_leadership` | Thought Leadership | `champion` | `diverge` | `ungated` | Strong | maps to `diagnostic_assessment` signal key [REQUIRES CONFIRMATION FROM §9 v0.1.0 for exact signal mapping] |
| `analyst_report` | Analyst Report | `champion` | `diverge` | `gated_email` | Strong | Weak indicator for `supplier_selection`; high Champion and EB signal weight |
| `diagnostic_assessment` | Diagnostic Assessment | `champion` | `diverge` | `gated_email` | Strong | maps to `diagnostic_assessment`; Champion = 15, EB = 8; interactive tool format preferred |
| `benchmark_report` | Benchmark Report | `economic_buyer` | `diverge` | `gated_email` | Strong | Quantitative peer comparison; EB affinity highest when business case framing is primary |
| `category_explainer` | Category Explainer | `champion` | `diverge` | `ungated` | Strong | maps to `category_explainer_view`; Champion = 6, EB = 4; moved from `solution_exploration` in v0.2.0 (CR-07) |
| `blog_article` | Blog Article | `champion` | `diverge` | `ungated` | Weak | Low signal weight; awareness-level content; counter-indicator for `requirements_building` |
| `industry_page` | Industry / Vertical Page | `champion` | `diverge` | `ungated` | Weak | Account-level context; no strong role affinity; counter-indicator for `requirements_building` |

**Content planning implications.** The five strong-indicator content types for `problem_identification` — `thought_leadership`, `analyst_report`, `diagnostic_assessment`, `benchmark_report`, and `category_explainer` — are the prerequisite inventory for triggering INFERRED buying job confidence at this stage (any two distinct strong indicators required). The highest-leverage gap to close is typically `diagnostic_assessment`: it is the only interactive content type in this group, it maps to the highest-weight Champion signal (`diagnostic_assessment` = 15) in the inventory, and it also carries substantial EB weight (8). A content team that has thought leadership and analyst reports but no diagnostic assessment is leaving the highest-converting `problem_identification` signal unmapped. `category_explainer` is a recent addition (v0.2.0) and is likely absent from solution categories with `coverage_status: pending` or `constructed` — it should be a first-production priority for IT & Operations and Employee Experience categories, where buyers orienting to a new solution space need the category definition before they can evaluate vendor fit.

---

#### `solution_exploration`

At the `solution_exploration` stage, a buyer knows they have a problem and has committed to evaluating whether solutions exist. They are asking: What does this kind of solution do? Does Kalder specifically address my situation? What does it look like in practice for a company like mine? Content in this group answers these questions from the buyer's product-evaluation perspective, not from Kalder's product-marketing perspective. The buyer is running an assessment; the content supports that assessment.

| Content Type Key | Label | Primary Role Affinity | Phase | Gating | Buying Job Indicator Tier | Notes |
|---|---|---|---|---|---|---|
| `product_solution_overview` | Product / Solution Overview | `champion` | `diverge` | `ungated` | Strong | Core Champion content; maps to signal weight confirming vendor-specific evaluation intent |
| `use_case_page` | Use Case Page | `influencer` | `diverge` | `ungated` | Strong | Also strong for `requirements_building`; `use_case_exploration` signal key; Influencer = 15 |
| `product_tour` | Product Tour / Interactive Demo | `influencer` | `diverge` | `gated_email` | Strong | maps to `product_tour_engagement`; Influencer = 12, User = 8; weak indicator for `requirements_building` |
| `webinar_event_registration` | Webinar / Event Registration | `influencer` | `diverge` | `gated_email` | Weak | maps to `webinar_registration`; Influencer = 15; also weak for `requirements_building` |
| `video_content` | Video Content | `champion` | `diverge` | `ungated` | Weak | maps to `product_tour_engagement` or dwell-equivalent [REQUIRES CONFIRMATION FROM §9 v0.1.0] |

**Content planning implications.** `use_case_page` is the single most strategically important content type at the `solution_exploration` stage because it serves double duty: it is a strong indicator for both `solution_exploration` and `requirements_building`, meaning a visitor who engages with use case content may simultaneously advance buying job inference in both groups. Influencer is the primary affinity role, which has an authoring implication: use case pages need the technical specificity and workflow detail that Influencers are evaluating — not the executive framing appropriate for Economic Buyer content. Teams producing use case pages solely from Champion or EB perspective will underserve the role whose engagement most strongly advances buying job inference. The `product_tour` is critical for User classification, which the ML classifier does not cover at v1 launch; behavioral-only User inference depends heavily on `product_tour_engagement` and `use_case_exploration` signals.

---

#### `requirements_building`

At the `requirements_building` stage, a buyer has moved from evaluation to specification. They are asking: What does integration actually look like? What are the technical requirements for implementation? How do we define what "good" looks like in an RFP or evaluation criteria document? Content in this group serves the mechanics of evaluation — it gives buyers the information they need to formalize requirements, not to discover the solution. The buyer already believes the solution category is relevant; they are now building the institutional case and evaluation structure.

| Content Type Key | Label | Primary Role Affinity | Phase | Gating | Buying Job Indicator Tier | Notes |
|---|---|---|---|---|---|---|
| `technical_documentation` | Technical Documentation | `influencer` | `diverge` | `ungated` | Strong | maps to `technical_docs_deep`; 10+ min dwell threshold; Influencer = 8, Ratifier = 12 |
| `integration_catalog` | Integration Catalog / API Reference | `influencer` | `diverge` | `ungated` | Strong | maps to `integration_catalog_view`; Influencer = 15; triggers disambiguation modifier with `security_whitepaper_download` |
| `rfp_template` | RFP Template / Evaluation Framework | `champion` | `diverge` | `gated_registration` | Strong | No corresponding named signal in Document 2 signal inventory [REQUIRES CONFIRMATION FROM §9 v0.1.0] |
| `use_case_page` | Use Case Page | `influencer` | `diverge` | `ungated` | Strong | Same entry as in `solution_exploration`; buying_job field on individual nodes determines classification |
| `security_compliance` | Security / Compliance Content | `ratifier` | `diverge` | `ungated` | — | maps to `security_whitepaper_download` (download) and `compliance_governance_content` (dwell); not in `BUYING_JOB_INFERENCE_SIGNALS` strong indicators; functions as counter-indicator for `solution_exploration` |
| `faq_support_docs` | FAQ / Support Documentation | `user` | `diverge` | `ungated` | — | maps to `faq_support_docs`; User = 12; not a buying job indicator but serves User pre-adoption evaluation |
| `product_tour` | Product Tour / Interactive Demo | `influencer` | `diverge` | `gated_email` | Weak | Weak indicator for `requirements_building` when co-occurring with strong indicators |
| `webinar_event_registration` | Webinar / Event Registration | `influencer` | `diverge` | `gated_email` | Weak | Weak indicator for `requirements_building` |

**Content planning implications.** The Ratifier role becomes active at this stage — `security_compliance` content (`security_whitepaper_download` signal = 20 for Ratifier, `security_trust_center_visit` = 22) represents the highest single-signal weight in the entire inventory. Yet Ratifier content is commonly the most neglected inventory gap. The production priority is not volume but existence: a solution category with no `security_compliance` content produces no `security_whitepaper_download` or `security_trust_center_visit` signals for Ratifier visitors, leaving those contacts at UNKNOWN confidence with no route to classification. One high-quality security whitepaper per solution category is higher-leverage than ten additional Champion case studies. `rfp_template` is gated at `gated_registration` (the highest gating tier), making it a useful intent signal for contacts who download it — but this also means teams must have HIGH-confidence visitors to serve it to. Low inventory here is acceptable at v1 launch; build it after core role coverage is achieved.

---

#### `supplier_selection`

At the `supplier_selection` stage, a buyer has shortlisted vendors and is making the final decision. They are asking: Can we justify the cost to finance? What is our ROI over three years? How does this vendor compare specifically to our other finalist? Why Kalder versus the alternatives? Content in this group supports the economics and governance of vendor selection — it enables the buying group to defend their decision internally, not just to feel confident in it.

| Content Type Key | Label | Primary Role Affinity | Phase | Gating | Buying Job Indicator Tier | Notes |
|---|---|---|---|---|---|---|
| `roi_calculator` | ROI Calculator / TCO Tool | `economic_buyer` | `diverge` | `ungated` | Strong | maps to `roi_calculator_usage`; EB = 22 (highest EB signal in inventory); counter-indicator for `problem_identification` |
| `pricing_page` | Pricing Page | `economic_buyer` | `diverge` | `ungated` | Strong | maps to `pricing_page_view`; EB = 15, Ratifier = 5; counter-indicator for `problem_identification` |
| `executive_brief` | Executive Brief | `economic_buyer` | `converge` | `gated_email` | Strong | maps to `executive_brief_download`; EB = 12, Champion = 10, User = −10; **converge-phase** — generated from approved diverge content; see Section 6 |
| `competitive_comparison` | Competitive Comparison | `champion` | `diverge` | `gated_email` | Strong | maps to `competitive_comparison_view`; Champion = 18; counter-indicator for `problem_identification` |
| `case_study` | Case Study / Success Story | `champion` | `diverge` | `gated_email` | Weak | maps to `case_study_download`; Champion = 20; weak (not strong) indicator — consumed across stages by Champions |
| `consensus_brief` | Consensus Brief | `champion` | `converge` | `gated_email` | — | maps to `executive_brief_download`; **converge-phase** — synthesized from approved diverge content; not in `BUYING_JOB_INFERENCE_SIGNALS`; see Section 6 |
| `analyst_report` | Analyst Report | `champion` | `diverge` | `gated_email` | Weak | Weak indicator for `supplier_selection` — consumed by Champions at final validation stage |
| `legal_procurement` | Legal / Procurement Documentation | `ratifier` | `diverge` | `ungated` | — | Counter-indicator for `problem_identification` and `solution_exploration`; no named signal in Document 2 signal inventory [REQUIRES CONFIRMATION FROM §9 v0.1.0] |
| `howto_training` | How-To / Training Content | `user` | `diverge` | `ungated` | — | maps to `howto_training_content`; User = 18; counter-indicator for `supplier_selection`; consumed at adoption phase |

**Content planning implications.** The `roi_calculator` carries the highest single-signal weight for Economic Buyer (22) in the entire CROSS_ROLE_WEIGHTS inventory. An EB who interacts with the ROI calculator is almost certainly in a `supplier_selection` buying job; this is both the strongest EB signal and the strongest `supplier_selection` inference trigger. Despite this, ROI calculators are often deprioritized as "engineering-heavy" — they require interactive tooling rather than document authoring. The production investment is justified by the signal quality: no other single content type produces an EB signal of comparable weight. `competitive_comparison` is the Champion analog — Champion = 18 is among the top three Champion signals. These two content types together are the core inventory required to trigger `supplier_selection` INFERRED buying job state. `executive_brief` and `consensus_brief` are converge-phase and cannot be commissioned independently — they require approved diverge content to synthesize from (Section 6). Teams must not sequence converge content ahead of the diverge inventory it depends on.

---

### 2.4 Format Types and Engagement Mechanics

Format type is a separate dimension from content type. It governs delivery mechanism and determines which engagement events are available for signal capture. The same content type can be delivered in multiple formats; the choice affects which signals fire and how the engagement threshold mechanism works.

---

**`web_page`**

A rendered page on kalder.com, instrumented with Segment active engagement tracking. Engagement events available: dwell-time measurement (active engagement seconds, not tab focus time), navigation depth within the page, scroll completion. Threshold mechanism: dwell-based — the content type's `engagement_threshold.minimum_seconds` must be met in active engagement time. Strong affinity content types: `category_explainer` (60s minimum), `use_case_page` (180s minimum), `product_solution_overview`, `thought_leadership`, `industry_page`, `compliance_governance_content` (90s minimum). `web_page` is the primary format for ungated content types where broad reach is prioritized over intent signal strength. A web_page dwell fires a different signal key than the equivalent content as an epdf download — content strategists should be deliberate about which signal they need to generate when selecting format.

---

**`epdf`**

An interactive PDF delivered as a downloadable file or embedded viewer on kalder.com. Two engagement mechanisms are available depending on implementation: (a) file download event captured by Segment, which fires immediately on download action with no dwell requirement; (b) embedded viewer with dwell-time tracking for on-page epdf interaction. Strong affinity content types: `case_study`, `analyst_report`, `executive_brief`, `competitive_comparison`, `benchmark_report`, `diagnostic_assessment` (gated). The download event produces a higher-weight signal for most content types than a web_page dwell, reflecting the higher intent implied by downloading. Teams choosing epdf over web_page for case studies should expect `case_study_download` (Champion = 20) versus a lower-weight dwell signal — this is a deliberate signal quality upgrade.

---

**`legacy_pdf`**

A static PDF file, typically older content not yet migrated to epdf format. Engagement event: file download only. No dwell-time measurement available. Threshold mechanism: action-based (download event fires, no minimum dwell). Signal quality equivalent to epdf download path. Legacy PDFs should be flagged for migration to epdf format when they map to high-weight signal keys; the engagement event parity means migration does not change signal behavior, but epdf supports richer engagement analytics.

---

**`video`**

Video content hosted on kalder.com or an embedded player. Engagement events available: play event, watch percentage (25%, 50%, 75%, 100% checkpoints), completion event. Threshold mechanism: hybrid — minimum watch percentage required before signal fires (analogous to dwell minimum for web_page). The specific completion threshold for each content type maps to its `engagement_threshold` field. Strong affinity content types: `product_tour` (product walkthrough video variant), `video_content`, `thought_leadership` (executive interview format). Video is the highest-intent format for User-affinity content types because Users evaluating daily workflow impact will complete product walkthrough videos at a higher rate than other roles.

---

**`interactive_tool`**

A calculation tool, assessment, simulator, or configuration wizard. Engagement events available: tool load event, interaction event (input field change, slider adjustment), submission event (calculate / generate output). Threshold mechanism: action-based — the qualifying event is submission or calculation completion, not dwell time. Strong affinity content types: `roi_calculator` (maps to `roi_calculator_usage`; EB = 22), `diagnostic_assessment` (maps to `diagnostic_assessment`; Champion = 15, EB = 8). Interactive tools produce the highest signal quality per engagement because they require active participation — a visitor who completes an ROI calculator has committed meaningful effort to the interaction. The submission-based threshold also eliminates accidental engagements more reliably than dwell-time thresholds.

---

**`webinar`**

A live or recorded online event. Engagement events available: registration event, attendance event (live session join), recording view event (on-demand playback). Threshold mechanism: action-based for registration (`webinar_registration` fires on registration form completion); dwell-based for recording views. Strong affinity content types: `webinar_event_registration` (maps to `webinar_registration`; Influencer = 15, Champion = 8), product-specific webinar series. The `webinar_registration` signal fires on registration, not attendance — this means intent is captured at registration time even if the visitor does not attend. Teams can commission webinars primarily as registration intent signals; actual attendance is a secondary benefit.

---

**`community_post`**

Content published in or associated with a community or forum context on kalder.com. Engagement events available: post view (dwell-based), forum navigation depth, reply or comment interaction. Threshold mechanism: dwell-based for view events; action-based for interactions. Maps to `community_forum_engagement` signal: User = 15, EB = −12. Community content is a counter-indicator for Economic Buyer classification — a contact engaging heavily in community forums is more likely an existing customer or User evaluating daily use than an EB conducting pre-purchase evaluation. Commission community content for User audiences deliberately; avoid using it as general-audience content that might skew EB classification negatively.

---

**Content Type × Format Affinity Table**

| Content Type | `web_page` | `epdf` | `legacy_pdf` | `video` | `interactive_tool` | `webinar` | `community_post` |
|---|---|---|---|---|---|---|---|
| `thought_leadership` | Primary | Secondary | — | Secondary | — | — | — |
| `analyst_report` | — | Primary | Secondary | — | — | — | — |
| `diagnostic_assessment` | — | Secondary | — | — | Primary | — | — |
| `benchmark_report` | — | Primary | Secondary | — | — | — | — |
| `category_explainer` | Primary | — | — | Secondary | — | — | — |
| `blog_article` | Primary | — | — | — | — | — | Secondary |
| `product_solution_overview` | Primary | Secondary | — | Secondary | — | — | — |
| `use_case_page` | Primary | Secondary | — | Secondary | — | Secondary | — |
| `product_tour` | — | — | — | Secondary | Primary | — | — |
| `webinar_event_registration` | — | — | — | Secondary | — | Primary | — |
| `technical_documentation` | Primary | Secondary | Secondary | — | — | — | — |
| `integration_catalog` | Primary | — | — | — | — | — | — |
| `rfp_template` | — | Primary | Secondary | — | — | — | — |
| `security_compliance` | Primary | Primary | Secondary | — | — | — | — |
| `roi_calculator` | — | — | — | — | Primary | — | — |
| `pricing_page` | Primary | — | — | — | — | — | — |
| `executive_brief` | — | Primary | — | — | — | — | — |
| `competitive_comparison` | Primary | Primary | — | — | — | — | — |
| `case_study` | Secondary | Primary | Secondary | — | — | — | — |
| `consensus_brief` | — | Primary | — | — | — | — | — |
| `howto_training` | Primary | — | — | Primary | — | Secondary | — |
| `community_forum` | — | — | — | — | — | — | Primary |

*Table legend: **Primary** = recommended format for this content type based on signal affinity and production convention. **Secondary** = viable alternative with different signal implications (e.g., a `case_study` as a `web_page` fires a dwell signal rather than a download signal, producing a lower-weight Champion engagement). A blank cell indicates the combination is less common or not a production priority — not that the combination is architecturally invalid. Format selection is always a content planning decision; Section 2.4 per-format specifications describe the signal consequences of each choice.*

---

### 2.5 Phase Classification of Content Types

Phase classification governs whether a content type is eligible for Adobe Target serving (`diverge`) or restricted to Champion distribution (`converge`). The `phase` field on an individual `Asset` node sets the specific node's classification; for some content types, the phase is determined by the content type itself (always diverge or always converge); for others, phase is set at the node level based on how the content is authored and intended for use.

| Phase | Content Types | Notes |
|---|---|---|
| `diverge` (always) | `thought_leadership`, `analyst_report`, `diagnostic_assessment`, `benchmark_report`, `category_explainer`, `blog_article`, `industry_page`, `product_solution_overview`, `use_case_page`, `product_tour`, `webinar_event_registration`, `video_content`, `technical_documentation`, `integration_catalog`, `rfp_template`, `security_compliance`, `faq_support_docs`, `roi_calculator`, `pricing_page`, `competitive_comparison`, `case_study`, `legal_procurement`, `howto_training`, `community_forum` | Served by Adobe Target to individual role-classified visitors; never distributed as converge content |
| `converge` (always) | `executive_brief`, `consensus_brief` | Distributed internally by Champions; never served by Adobe Target under any circumstances; generated from approved diverge content per Section 6 rules; subject to the `narrative_ref` structural constraint from Section 1 and the through-line corollary from Section 4 |
| Phase-agnostic (node-level determination) | Content types that can serve as embedded content within either a diverge-phase `Content Module` or a converge-phase synthesis document — primarily `case_study`, `analyst_report`, and `benchmark_report` when referenced as proof points | Phase is set at the individual `Asset` node level via the `phase` field; governed per Section 3 tagging rules |

The two converge-phase content types — `executive_brief` and `consensus_brief` — are subject to the converge content generation rules specified in Section 6. Their `phase: converge` classification means they are never commissioned independently. A `consensus_brief` is always generated as a synthesis of approved diverge-phase content for the same `(solution_category, buying_stage)` pair, referencing the same `Narrative` node that governs the diverge-phase modules it synthesizes. The through-line requirement specified in Section 4 makes this a structural constraint, not an editorial preference: a converge document that does not share the `Narrative` parent of its source diverge content cannot be guaranteed to maintain factual backbone coherence.

---

### 2.6 Content Type Coverage and the Inventory Baseline

The 31 content types in this taxonomy are the complete reference set from which coverage completeness is assessed — but not all 31 are required for any given solution category to achieve a given coverage level. Coverage completeness is evaluated against the content types relevant to the solution category's active JTBD codes, not against the full 31-type inventory. A solution category that has complete coverage for `problem_identification` and `solution_exploration` but no `requirements_building` inventory has partial coverage, not pending coverage — the distinction matters for how the `pending_solution_fallback` behavior activates and for which visitors receive degraded experiences.

At v1 launch, Customer Engagement is the only solution category with content inventory across all four buying job groups. IT & Operations carries partial coverage (some buying job groups represented, none complete). Employee Experience, Risk & Compliance, and AI Platform carry pending coverage, meaning the `pending_solution_fallback` from Document 1 (`§4 SCORING_RULES`) is active for visitors whose solution interest maps to those categories. Visitors classified in those categories receive a MEDIUM confidence ceiling and experience Level 3 or below regardless of their behavioral signal strength, until content inventory for those categories is produced and approved.

The content type taxonomy in Section 2.3 is the authoring reference that should drive commissioning decisions. A coverage gap analysis starts from this taxonomy: for each solution category, for each buying job group, for each primary role affinity — which content types are present in the approved node inventory, and which are absent? Section 7 specifies what counts as "sufficient" for each coverage level. Section 2.3 specifies what the taxonomy to assess against looks like.

---

*End of Section 2. Section 3 (Tagging Taxonomy and Governance) specifies the `content_type` and `content_format` field governance rules for `Asset` nodes. Section 5 (Module Types and Composition Rules) specifies how `Asset` nodes are surfaced via the `gated_assets` and related module types. Section 6 (Converge Content Governance) specifies the generation rules for `executive_brief` and `consensus_brief` content types.*

---

## Section 3: Tagging Taxonomy and Governance

> **Depends on:** Document 4 Section 1 (node type schemas), Document 4 Section 4 (through-line requirement), `kalder_data_model_s0_s1.py` §2, §1d, §5, §3, §17, §10, §CA, §4

---

### 3.1 The Tagging Taxonomy: Purpose and Scope

Section 1 specified what fields exist on each node type's schema — what field names are present, what types they carry, and their role in the content graph. Section 3 governs how those fields are applied in practice: what values are permitted, when each field is required versus optional, what the runtime consequence of a missing or incorrect value is, and what rule a content author applies to set each field correctly.

The six canonical tag fields governed here are: `role`, `solution_category`, `buying_stage`, `jtbd_code`, `phase`, and `confidence_tier_minimum`. These fields are the signals Adobe Target reads to select which content node to serve at session time, and the signals the content graph uses to enforce semantic constraints. A tagging error is not a minor quality issue. A `Content Module` tagged with the wrong `confidence_tier_minimum` will be served to visitors whose role confidence cannot support its specificity, or withheld from visitors who should receive it. Tagging errors produce incorrect experiences at scale — silently, because the schema will not catch a value that is legal but wrong.

---

### 3.2 Canonical Tag Field Reference

The table below is the master reference for all six canonical tag fields. Each row summarizes applicability and failure behavior. The full governance rule for each field is in Section 3.3.

| Field | Allowed Values | Authority Source | Node Types: Required | Node Types: Optional | Node Types: N/A | Failure Behavior |
|---|---|---|---|---|---|---|
| `role` | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier`. Standard five-role enum; `Experience` nodes extend with `default` for fallback-level configurations (Levels 3–5) — see Section 1 `Experience` node specification. | `§2 ROLES` | `Audience`, `Content Module` | `Problem`, `Outcome`, `Proof`, `Asset` | `JTBD`, `Narrative`, `Experience`, `Channel` | **Blocking** — missing or invalid value prevents Sanity publication |
| `solution_category` | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | `§1d SOLUTION_CATEGORIES` | `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Asset`, `Content Module`, `Experience` | — | `Channel` | **Blocking** — missing or invalid value prevents Sanity publication |
| `buying_stage` | `targeted` / `engaged` / `prioritized` / `qualified` | `§5 BG_STAGES` | `Narrative`, `Content Module`, `Experience` | `Problem`, `Outcome`, `Proof`, `Asset` | `Audience`, `JTBD`, `Channel` | **Blocking** on required node types; **Warning** on optional node types — publication allowed with flag |
| `jtbd_code` (via `jtbd_ref`) | Valid `JTBD` node reference in same `solution_category` | `§17 JTBD_CODES` scoped by `solution_category` | `Content Module` where `module_type.intended_axes` includes `buying_job` (per `§10 MODULE_TYPES`) | `Content Module` (other `module_type`), `Proof`, `Asset`, `Problem`, `Outcome` | `Audience`, `Narrative`, `Experience`, `Channel` | **Blocking** when conditionally required; **Warning** when optional — two-axis fallback activates; cross-`solution_category` reference is always **Blocking** |
| `phase` | `diverge` / `converge` | `kalder_data_model_s0_s1.py §9 CONTENT_TYPE_TAXONOMY` phase field semantics | `Content Module` | `Asset`, `Experience` | `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Channel` | **Blocking** — missing value prevents Sanity publication; `converge` on a node referenced by a web-active `Channel` is a **cross-node blocking error** |
| `confidence_tier_minimum` | `UNKNOWN` / `LOW` / `MEDIUM` / `HIGH` | `§3 CONFIDENCE_TIERS` | `Content Module`, `Asset` | — | `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Experience`, `Channel` | **Blocking** — missing value prevents Sanity publication [CA FLAG] |

---

### 3.3 Field-by-Field Governance Rules

---

### `role`

**What it governs:** Identifies the buying group role this content node is authored for, determining which visitor classification state triggers its selection.

**Allowed values:** `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` — from `§2 ROLES`.

**Required on:** `Audience`, `Content Module`.

**Optional on:** `Problem`, `Outcome`, `Proof`, `Asset`. These node types are often role-shareable; `role` on these types is advisory metadata that supports retrieval and authoring context, not a runtime selection gate.

**Not applicable to:** `JTBD`, `Narrative`, `Experience`, `Channel`. `Narrative` nodes are intentionally role-agnostic — they are scoped to `(solution_category, buying_stage)` to enforce the through-line across all role variants (see Section 4). `Experience` nodes carry `role` via their constituent `Content Module` slots, not as a direct field.

**Graceful degradation:** Not applicable on required node types — the field is blocking. On optional node types (`Proof`, `Asset`), absence of `role` means the node is treated as role-neutral and eligible for selection across all roles. This is the correct behavior for shared proof points and ungated assets.

**Tagging standard:** Set `role` to the single role for whom this node's content is primarily authored. A `Content Module` authored for Champion and also useful for Influencer should be tagged `champion` — the content graph produces separate Influencer nodes rather than multi-role tagging. Multi-role tagging on `Content Module` is not permitted. On `Proof` and `Asset` nodes, leave `role` empty when the content is genuinely role-neutral (e.g., a quantitative benchmark that is equally relevant to all roles). Populate `role` on `Proof` and `Asset` only when the content has a strong primary role affinity.

**Validation behavior:** Missing or non-enum value is **blocking** on `Audience` and `Content Module`. Non-enum value is **blocking** on all node types. Absence on optional node types is permitted and does not produce a warning.

**`[CA FLAG]`:** `role` maps to `role_classification` in `CLIENT_ATTRIBUTE_MAP` (§CA). This attribute is already registered. No new entry required.

**Note for content authors:** `solution_claim` and `message_pillar` are not fields in this tagging taxonomy and do not appear on `Content Module` nodes in the Sanity authoring interface. Content authors who need to review or amend the through-line governing a module's content should navigate to the `Narrative` node referenced by that module's `narrative_ref` field.

---

### `solution_category`

**What it governs:** Scopes the content node to a specific solution category context, establishing the composite classification key `(contact_id, solution_category)` that all personalization logic operates within.

**Allowed values:** `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` — from `§1d SOLUTION_CATEGORIES`.

**Required on:** `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Asset`, `Content Module`, `Experience`.

**Optional on:** None.

**Not applicable to:** `Channel`. Channel nodes are not scoped to a solution category — they deliver across all categories.

**Graceful degradation:** Not applicable — the field is blocking on all applicable node types.

**Tagging standard:** Every content node that participates in personalization serving must be scoped to exactly one `solution_category`. A content node that is genuinely cross-category (e.g., a company-wide capability brief) is out of scope for the personalization program and should not be entered into the content graph as a personalization candidate. If the same proof point or asset is relevant to multiple solution categories, separate nodes should be created per category. Cross-category duplication is preferable to miscategorized single nodes.

**Validation behavior:** Missing or non-enum value is **blocking** on all applicable node types. A `jtbd_ref` reference pointing to a `JTBD` node with a mismatched `solution_category` is a **separate blocking error** (see `jtbd_code` governance and Section 3.5).

**`[CA FLAG]`:** `solution_category` maps to `solution_category` in `CLIENT_ATTRIBUTE_MAP` (§CA). This attribute is already registered. No new entry required.

---

### `buying_stage`

**What it governs:** Identifies the buying group pipeline stage this content node is authored for, enabling stage-specific content selection within the two-axis (role × stage) and three-axis (role × stage × buying job) personalization modes.

**Allowed values:** `targeted` / `engaged` / `prioritized` / `qualified` — from `§5 BG_STAGES`.

**Required on:** `Narrative`, `Content Module`, `Experience`.

**Optional on:** `Problem`, `Outcome`, `Proof`, `Asset`. Stage tagging on these node types is advisory — it supports retrieval precision for content authored with a specific stage in mind, but these node types are frequently stage-stable and the field may be omitted.

**Not applicable to:** `Audience`, `JTBD`, `Channel`. `Audience` nodes are role × solution category scoped; stage variation is handled at the `Content Module` level. `JTBD` nodes are scoped by `buying_job`, which encodes the stage relationship structurally.

**Graceful degradation:** On optional node types where `buying_stage` is absent, the node is treated as stage-neutral and eligible for selection across all stages. For `Proof` and `Asset` nodes, this is typically correct — the same case study or ROI benchmark is often relevant across multiple stages.

**Tagging standard:** Set `buying_stage` to the single stage for which this module was authored. `Content Module` nodes are authored per `(role, solution_category, buying_stage)` combination; each module node represents one combination. If the same content would be appropriate at two adjacent stages, author a separate module per stage rather than omitting the field. On optional node types, populate `buying_stage` when the content has a strong stage-specific orientation (e.g., a requirements-framing template that is only useful at `prioritized`). Leave empty for stage-stable content.

**Validation behavior:** Missing on `Narrative`, `Content Module`, or `Experience` is **blocking**. Invalid enum value is **blocking** on all applicable node types. Missing on optional node types is permitted.

**`[CA FLAG]`:** `buying_stage` maps to `bg_stage` in `CLIENT_ATTRIBUTE_MAP` (§CA). This attribute is already registered. No new entry required.

---

### `jtbd_code` (via `jtbd_ref`)

**What it governs:** Associates a content node with a specific Job To Be Done from the 131-code library in `§17 JTBD_CODES`, enabling three-axis personalization (role × stage × buying job) when Buying Job Confidence is KNOWN or INFERRED.

**Allowed values:** A Sanity reference field pointing to an approved `JTBD` node. The `JTBD` node's `jtbd_code` value must be a valid code from `§17 JTBD_CODES` scoped to the same `solution_category` as the referencing node. `jtbd_code` is not a free-text string field — it is a reference. Authority: `§17 JTBD_CODES`.

**Conditional requirement rule:** `jtbd_ref` is **required** on `Content Module` nodes where the selected `module_type` includes `buying_job` in its `§10 MODULE_TYPES intended_axes`. `jtbd_ref` is **optional** on all other node types. The Sanity form implementation must enforce this conditionally: when an author selects a `module_type` whose `intended_axes` includes `buying_job`, the `jtbd_ref` field becomes required in the Sanity schema validation and blocks publication if absent. When the selected `module_type` does not include `buying_job` in its `intended_axes`, `jtbd_ref` is optional and its absence does not block publication. The authority for which `module_type` values include `buying_job` in `intended_axes` is `§10 MODULE_TYPES` (elaborated in Section 5 of this document).

**Required on:** `Content Module` (when `module_type.intended_axes` includes `buying_job`).

**Optional on:** `Content Module` (all other `module_type` values), `Proof`, `Asset`, `Problem`, `Outcome`.

**Not applicable to:** `Audience`, `Narrative`, `Experience`, `Channel`. `Narrative` nodes govern the through-line across roles and are not scoped to a specific buying job. `Experience` nodes inherit buying job scoping from their constituent `Content Module` slots.

**Graceful degradation:** When `jtbd_ref` is absent on a `Content Module` node for a `module_type` where it is optional, the content selection system falls back to two-axis personalization (role × stage) for that module. The `PROBABLE_JOB_PRIORS` lookup from `§4 FALLBACK_CASCADE` determines the content variant selection within the two-axis result — the most probable buying job for the visitor's `(role, buying_stage)` combination is used for content matching, but no `jtbd_ref`-specific variant is served. This two-axis fallback is the authoritative behavior and must be referenced by Document 5 (Personalization Decisioning Rules) as the missing-`jtbd_ref` resolution path.

**Tagging standard:** When `jtbd_ref` is conditionally required: look up the visitor's inferred `buying_job` context for the module's `(role, solution_category, buying_stage)` combination using `PROBABLE_JOB_PRIORS` (§4), then select the `JTBD` node from `§17` whose `buying_job` and `solution_category` match that context. When `jtbd_ref` is optional: populate it when the content has a strong, specific buying job orientation. Leave it empty when the content is relevant across multiple buying jobs within the same stage.

**Validation behavior:**
- Missing when conditionally required: **Blocking**.
- Cross-`solution_category` reference (the `JTBD` node's `solution_category` does not match the `Content Module`'s `solution_category`): **Blocking**, enforced by a Sanity publish-time validation hook (GROQ cross-document query). This validation is analogous to `validate_jtbd_references()` at the data model level.
- Reference to a `JTBD` node not in `status: approved`: **Blocking**.
- Missing when optional: **Permitted** — no warning, two-axis fallback activates at runtime.

**`[CA FLAG]`:** The `buying_job` dimension as expressed in content selection is consumed via `buying_job_confirmed` and `buying_job_inferred` attributes in `CLIENT_ATTRIBUTE_MAP` (§CA). Both are already registered. `jtbd_ref` itself is a Sanity internal reference; it does not require a new `CLIENT_ATTRIBUTE_MAP` entry.

---

### `phase`

**What it governs:** Classifies whether a content node serves the diverge phase (individual role evaluation, served via Adobe Target) or the converge phase (group alignment, distributed internally by Champions). This field governs channel eligibility: a `phase: converge` node must not appear in any Adobe Target serving path.

**Allowed values:** `diverge` / `converge`. Phase semantics are governed by the content type taxonomy in `§9 CONTENT_TYPE_TAXONOMY` and the double-diamond structure defined in Document 6 (Buying Group Journey and Convergence Model).

**Required on:** `Content Module`.

**Optional on:** `Asset`, `Experience`. Most assets and experiences are diverge; explicit tagging is required only when a node is converge-phase. The absence of `phase` on an `Asset` or `Experience` node is treated as `diverge` by default — the Adobe Target serving path assumes diverge unless `phase: converge` is explicitly set.

**Not applicable to:** `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Channel`. These node types do not participate in the diverge/converge distinction directly.

**Graceful degradation:** Not applicable on required node types. On `Asset` and `Experience` nodes, absence of `phase` defaults to `diverge`.

**Tagging standard:** `phase: diverge` — the module is authored for individual consumption via Adobe Target. It is role-specific, purchased-content-graph-eligible, and may carry HIGH `confidence_tier_minimum`. `phase: converge` — the module is authored for Champion distribution to the buying group. It is not served via Adobe Target under any circumstances. Converge modules are generated from approved diverge modules (never independently) and distributed via private channels such as email, shared documents, or internal messaging. The practical test: if this module will appear on kalder.com as a served experience, it is diverge. If it will travel internally within the buying group via a Champion, it is converge.

**Validation behavior:**
- Missing on `Content Module`: **Blocking**.
- `phase: converge` on a `Content Module` node that is referenced in an `Experience` node whose parent `Channel` node has `channel_type: web` and `activation_status: active`: **Cross-node blocking error**. This is the primary phase mis-tagging failure mode (a converge module inadvertently entering the Adobe Target serving path). Enforcement: Sanity should validate at publish time that no `phase: converge` `Content Module` is referenced by an `Experience` node linked to a web-active `Channel`. If Sanity cross-document validation cannot enforce this at publish time, it must be enforced as a pipeline check at the Adobe Target activity sync step (Document 8 implementation dependency).

**`[CA FLAG]`:** `phase` is a content graph attribute used at the Sanity-to-Target synchronization layer (specified in Section 1.1). It does not require a visitor-profile `CLIENT_ATTRIBUTE_MAP` entry. No new entry required.

---

### `confidence_tier_minimum`

**What it governs:** Sets the minimum visitor role confidence tier required to receive this content node. Adobe Target reads this field at session time to determine whether the visitor's `confidence_tier` meets the threshold before serving the node. A node tagged `HIGH` is only served to Level 1 visitors. A node tagged `MEDIUM` is served to Level 1 and Level 2 visitors. A node tagged `LOW` is served to Levels 1–3. A node tagged `UNKNOWN` is served at all fallback levels.

**Allowed values:** `UNKNOWN` / `LOW` / `MEDIUM` / `HIGH` — from `§3 CONFIDENCE_TIERS`.

**Required on:** `Content Module`, `Asset`. [CA FLAG] — this field must be present in the Sanity-to-Target synchronization payload for Adobe Target to evaluate it at session time. See Section 1.1 architectural principle and `CLIENT_ATTRIBUTE_MAP` (§CA) entry registered in Section 1.

**Optional on:** None.

**Not applicable to:** `Audience`, `JTBD`, `Problem`, `Outcome`, `Narrative`, `Proof`, `Experience`, `Channel`.

**Graceful degradation:** Not applicable — the field is required on `Content Module` and `Asset`. Missing values are blocking at Sanity publication.

**Tagging standard — three decision tiers:**

Tag **`HIGH`** when the module meets **all three** of the following indicators:
1. The `content_body` uses direct role-address language — e.g., "As a [role title]..." or equivalent role-assumptive framing.
2. The `content_body` makes at least one quantified outcome claim that is role-specific and would be inappropriate or misleading to a visitor in a different role.
3. The `content_body` includes a CTA whose language assumes the visitor's role and would be confusing or irrelevant to another role.

Tag **`MEDIUM`** when the module frames content around the role's general orientation without direct role address, uses role-appropriate vocabulary without making role-specific factual claims, or includes role-appropriate CTAs that are not role-exclusive. Most role-specific `Content Module` nodes at v1 launch should be tagged `MEDIUM`.

Tag **`UNKNOWN`** or **`LOW`** when the module is appropriate across multiple roles, uses solution-category framing without role differentiation, or is explicitly a fallback-level experience variant.

**Over-tagging risk:** A module tagged `HIGH` that actually meets only `MEDIUM` criteria will be withheld from MEDIUM-confidence visitors (Level 2) who could benefit from it. This is a coverage gap that produces measurable under-serving. Reviewers must challenge `HIGH` tags on any module that does not satisfy all three HIGH indicators simultaneously. When in doubt, tag `MEDIUM`. `HIGH` is appropriate for modules where serving the content to a mis-classified visitor would produce a materially confusing or misleading experience — not merely a sub-optimal one.

**Fallback level mapping:**
- `HIGH` → Level 1 only (role confidence ≥ 80, Tier 1 or Tier 2 confirmed)
- `MEDIUM` → Level 1 and Level 2 (role confidence ≥ 50)
- `LOW` → Levels 1–3 (role confidence ≥ 25)
- `UNKNOWN` → All levels (served regardless of role confidence)

**Validation behavior:** Missing value is **Blocking** on `Content Module` and `Asset`. Non-enum value is **Blocking**. A module tagged `HIGH` with `phase: converge` is valid — converge modules may be HIGH-specificity. A module tagged `UNKNOWN` with `phase: diverge` is valid and expected for fallback-level diverge experiences.

**`[CA FLAG]`:** `confidence_tier_minimum` maps to a new entry in `CLIENT_ATTRIBUTE_MAP` (§CA). Registered in Section 1 of this document. No duplicate entry required here.

---

### 3.4 Node Type × Tag Field Matrix

The matrix below is a quick-reference summary of field applicability across all ten node types. It does not override the governance rules in Section 3.3; it supplements them. **R** = Required, **O** = Optional, **N** = Not Applicable, **S** = System-computed (not authored directly).

| Node Type | `role` | `solution_category` | `buying_stage` | `jtbd_code` (`jtbd_ref`) | `phase` | `confidence_tier_minimum` |
|---|---|---|---|---|---|---|
| **Audience** | R | R | N | N | N | N |
| **JTBD** | N | R | N | N | N | N |
| **Problem** | O | R | O | O | N | N |
| **Outcome** | O | R | O | O | N | N |
| **Narrative** | N | R | R | N | N | N |
| **Proof** | O | R | O | O | N | N |
| **Asset** | O | R | O | O | O | R |
| **Content Module** | R | R | R | O / R* | R | R |
| **Experience** | R** | R | R | N | O | N |
| **Channel** | N | N | N | N | N | N |

*`jtbd_ref` is conditionally required on `Content Module` when `module_type.intended_axes` includes `buying_job` per `§10 MODULE_TYPES`; optional otherwise.

**`role` on `Experience` uses the value `default` for fallback-level experiences (Levels 3–5) where no role classification applies. The allowed values set for `Experience.role` extends the standard five roles with `default`.

---

### 3.5 Field Combination Rules

The following combinations are governed by cross-field validation rules. Each combination specifies whether the constraint is enforced at Sanity publish time or as a downstream pipeline check.

**`jtbd_code` + `solution_category` (cross-category reference prohibition)**

The `JTBD` node referenced via `jtbd_ref` must carry the same `solution_category` value as the referencing node. A `Content Module` with `solution_category: customer_engagement` that references a `JTBD` node with `solution_category: it_operations` is a cross-category reference error. This constraint is **blocking at Sanity publish time**, enforced by a GROQ-based cross-document validation hook. The hook queries the `solution_category` field of the referenced `JTBD` document and compares it to the `solution_category` of the publishing node. A mismatch prevents publication. The validation function is analogous to `validate_jtbd_references()` in the data model; the Document 8 implementation dependency is the GROQ query specification for this Sanity validation rule.

**`confidence_tier_minimum: HIGH` + `phase: diverge`**

A `Content Module` tagged `HIGH` and `diverge` is a valid and expected combination — it represents a role-specific experience for HIGH-confidence visitors served via Adobe Target. This combination also requires an approved `Narrative` parent (enforced by `narrative_ref` per Section 1). The combination is valid; no additional constraint applies beyond the standard `narrative_ref` requirement.

**`phase: converge` + web-active `Channel` eligibility**

A `Content Module` or `Experience` node tagged `phase: converge` must not appear in the `module_slots` or `experience_refs` of any node chain that terminates in a `Channel` node with `channel_type: web` and `activation_status: active`. Enforcement preference: **blocking at Sanity publish time** via a cross-node validation that traces the reference chain from the publishing `Content Module` or `Experience` node through its parent `Experience` or `Channel` node. If this cross-document validation is not implementable at Sanity publish time without prohibitive query cost, it must be enforced as a **blocking pipeline check at Adobe Target activity sync time**, with the sync step rejecting any offer that carries `phase: converge` metadata. The Document 8 implementation dependency is confirmation of which enforcement point is used. A `phase: converge` module that enters the Adobe Target activity set is a configuration error that will serve group alignment content to individual visitors on kalder.com — the primary diverge/converge enforcement failure mode.

**`narrative_ref` + `(solution_category, buying_stage)` scoping constraint**

The `Narrative` node referenced via `narrative_ref` on a `Content Module` must carry the same `solution_category` and `buying_stage` values as the referencing `Content Module`. A `Content Module` with `solution_category: customer_engagement` and `buying_stage: engaged` that references a `Narrative` node scoped to `solution_category: it_operations` and `buying_stage: targeted` would import a through-line from the wrong narrative family. This constraint is **blocking at Sanity publish time**, enforced by a GROQ cross-document validation hook that checks the `solution_category` and `buying_stage` fields of the referenced `Narrative` document against the publishing `Content Module`'s corresponding fields. A mismatch on either field prevents publication.

---

### 3.6 `CLIENT_ATTRIBUTE_MAP` Additions from Section 3

The following `[CA FLAG]` markers were registered in Section 3.3's governance blocks. Cross-checked against Section 1 flags to avoid duplication.

**Already registered in Section 1 — no new entry required from Section 3:**
- `confidence_tier_minimum` (on `Asset`): registered in Section 1, Asset node [CA FLAG].
- `confidence_tier_minimum` (on `Content Module`): registered in Section 1, Content Module node [CA FLAG].
- `solution_category_coverage_status`: registered in Section 1, coverage rollup [CA FLAG].

**Already registered in upstream documents — no new entry required:**
- `role_classification` (maps `role` field): registered in Document 2 composite classification output, `CLIENT_ATTRIBUTE_MAP` (§CA).
- `solution_category`: registered in Document 2 composite classification output, `CLIENT_ATTRIBUTE_MAP` (§CA).
- `bg_stage` (maps `buying_stage` field): registered in Document 2 composite classification output and Document 3 TAL data contract, `CLIENT_ATTRIBUTE_MAP` (§CA).
- `buying_job_confirmed`, `buying_job_inferred`: registered in Document 2 Section 7 (Buying Job Confidence Model), `CLIENT_ATTRIBUTE_MAP` (§CA).
- `confidence_tier`: registered in Document 2 composite classification output, `CLIENT_ATTRIBUTE_MAP` (§CA).

**Net new from Section 3:** None. All tag fields map to `CLIENT_ATTRIBUTE_MAP` entries already registered in Section 1 or upstream documents. Section 3 introduces no new AEP/Target-surfacing requirements beyond those already flagged.

This is expected: Section 3 governs how existing content graph fields are applied — it does not introduce new fields. New fields introduced by this section's governance rules (if any arose) would require a Section 1 schema update and a new `CLIENT_ATTRIBUTE_MAP` entry. None arose in this drafting pass.

---

*End of Section 3. Section 5 (Module Types and Composition Rules) specifies the `intended_axes` profiles per `§10 MODULE_TYPES` that govern the conditional `jtbd_ref` requirement on `Content Module` nodes. Document 5 (Personalization Decisioning Rules) specifies the full runtime behavior of the two-axis fallback activated when `jtbd_ref` is absent on optional-`jtbd_ref` modules. Document 9 (Privacy and Consent Architecture) specifies the consent-state conditions under which tag-based personalization is suppressed — those conditions are out of scope here.*

---

## Section 4: Through-Line Requirement

> **Depends on:** Document 4 Section 1 (`Narrative` node schema, `narrative_ref` enforcement), Document 1 (role architecture), Document 6 (convergence points, double-diamond structure), `kalder_data_model_s0_s1.py` §16, §18

---

### 4.1 The Through-Line Requirement: A Buying Group Dynamics Argument

Buying groups do not consume vendor content in isolation. Champions forward materials to Economic Buyers. Economic Buyers circulate executive summaries to their finance or procurement partners. Influencers share technical documentation in internal Slack channels before a requirements framing session. This internal content circulation is not an exception to how buying groups behave — it is the mechanism by which buying groups build shared positions. A personalization program that ignores it is optimizing for the individual visitor session while ignoring the group conversation that follows.

The problem that arises is not contradiction. A well-run personalization program rarely serves a Champion content that factually contradicts what an Economic Buyer receives. The problem is something subtler and more common: each role receives the content that is most compelling for their individual evaluation criteria, and those individually optimized framings can produce a materially different impression of what the vendor does and why the solution matters.

Here is the failure mode as it actually occurs. A Champion at an engaged-stage account receives a content module emphasizing how Kalder's Customer Engagement platform reduces implementation dependency on professional services — framed around operational autonomy, because that is what Champions building the internal business case care about. The same account's Economic Buyer receives a module emphasizing measurable ROI, shorter time-to-value than legacy platforms, and total cost of ownership benchmarks — framed around financial justification, because that is what Economic Buyers need to approve budget. Both framings are accurate. Both are locally optimal for their audience. But when the Champion and the Economic Buyer get on an internal call to compare what they have learned, they may be describing the platform in ways that don't cohere. The Champion is talking about configurability. The Economic Buyer is asking about the ROI model. Neither has a clear picture of the central claim — what Kalder actually is and what it actually achieves — because neither piece of content established it.

This is information asymmetry inside the buying group. It is not a contradiction. The Champion was not told anything false. But the two framings, taken together, do not add up to a coherent shared understanding of the vendor's capability. At a convergence point — Problem Validation, Business Value Alignment, Final Commitment — when the buying group must align on a shared position, this is the moment the asymmetry surfaces as confusion or distrust. Buying groups have stalled or reversed course not because a vendor lied, but because the group couldn't agree on what the vendor's core claim was.

The through-line requirement exists to prevent this. It does not restrict personalization — it constrains the space within which personalization operates. Role variants are permitted to differ substantially in problem framing, proof point selection, content depth, vocabulary, and CTA type. What they are not permitted to differ on is the factual claim at the center of the program's value proposition for a given solution category and buying stage. Every role receives that claim. The role-specific content builds on top of it. The personalization is what surrounds and contextualizes the claim — not the claim itself.

---

### 4.2 What the Through-Line Is: `solution_claim` and `message_pillar`

The through-line is operationalized through two required fields on the `Narrative` node (specified in Section 1): `solution_claim` and `message_pillar`. These fields exist on the `Narrative` node, not on individual `Content Module` nodes. A `Content Module` does not carry its own `solution_claim` or `message_pillar`. It references a `Narrative` node via the required `narrative_ref` field, and the values of those fields govern the module's content. This structural inheritance is what makes the through-line machine-enforceable rather than editorially aspirational.

**`solution_claim`** is the canonical, factually grounded statement of what Kalder's solution achieves in a specific solution category and buying stage context. It answers: what is the core capability claim this program is making to this audience at this point in their evaluation? It is specific enough to be falsifiable and stable enough to anchor all role variants for this `(solution_category, buying_stage)` pair.

**`message_pillar`** is the primary thematic emphasis that content for this solution category and buying stage should build from. Where `solution_claim` is a capability statement, `message_pillar` is a strategic orientation — it tells content authors and Kalder Compose which dimension of the solution to lead with. The two fields together define both *what* is claimed and *what angle* the program is taking on it.

They are both required because one without the other is insufficient. A `solution_claim` without a `message_pillar` leaves content authors without directional guidance: the claim is grounded, but each role variant may emphasize a different facet until the collective program no longer feels like it is making a coherent argument. A `message_pillar` without a `solution_claim` produces thematic coherence without factual grounding — content that feels strategically aligned but makes inconsistent or unverifiable capability statements.

**Concrete example — `(customer_engagement, engaged)`:**

```
solution_claim: "Kalder's Customer Engagement platform reduces the time from 
CX workflow configuration to live deployment from months to weeks, without 
professional services dependency, because the platform is designed for 
business team ownership rather than IT-mediated configuration."

message_pillar: "Speed to value without the implementation tax"
```

Every `Content Module` for `(customer_engagement, engaged)` — whether authored for Champion, Economic Buyer, Influencer, User, or Ratifier — builds on these two values. The Champion's module contextualizes them around operational autonomy and internal credibility. The Economic Buyer's module contextualizes them around ROI timeline and deployment cost reduction. The proof points each role sees may differ. The vocabulary and depth will differ substantially. But both modules are making the same claim, foregrounding the same dimension. When that Champion and Economic Buyer compare notes, they are starting from the same factual foundation.

**Scope note:** The through-line is scoped to `(solution_category, buying_stage)`, not to solution category alone. A `solution_claim` for `(customer_engagement, engaged)` is about establishing why the problem matters and why Kalder's approach to it is credible — appropriate for a buying group in the middle stages of evaluating a solution space. A `solution_claim` for `(customer_engagement, qualified)` is about confirming why Kalder specifically is the right vendor and why the risk of choosing another option is real — appropriate for a buying group making a final commitment decision. Same solution category, different buying stage, different through-line. The `Narrative` node's required `buying_stage` field accommodates this: a separate `Narrative` node exists for each `(solution_category, buying_stage)` pair in the program.

---

### 4.3 The Permitted Divergence Space

The through-line requirement does not flatten role-specific content. It defines a floor — the shared factual backbone — and leaves the content above that floor open to role-specific variation. The following table specifies, for each content element, whether role variants are permitted to differ and under what conditions.

| Element | Permitted to vary by role? | Notes |
|---|---|---|
| `solution_claim` | No | Inherited from `Narrative` node; not stored on `Content Module`; the same value governs all role variants for this `(solution_category, buying_stage)` pair |
| `message_pillar` | No | Inherited from `Narrative` node; not stored on `Content Module`; the same thematic orientation governs all role variants |
| Supporting claims | Yes, with constraint | Role variants may select supporting claims from the pre-approved `supporting_claims` array on the `Narrative` node; they may not introduce claims not present in that array |
| Proof point selection | Yes | Different roles may be shown different `Proof` nodes; proof selection is role-appropriate and does not require every role to receive the same evidence; what matters is that all proof points substantiate the shared `solution_claim` |
| Framing and emphasis | Yes, with constraint | Role variants may frame the `solution_claim` and `message_pillar` differently; framing that selectively emphasizes one aspect so heavily that it creates a materially different impression of the vendor's core capability is not permitted — see Section 4.4 for the test |
| CTA type and language | Yes | CTA selection is governed independently by `role` and `confidence_tier`; CTAs vary across roles without affecting through-line coherence |
| Content depth and vocabulary | Yes | Champion and Economic Buyer content legitimately differ in technical depth; Influencer and User content may use domain-specific vocabulary; these variations do not violate the through-line |
| Problem statement framing | Yes | Different roles experience the same problem from different vantage points; a Champion's problem framing ("I can't get IT to configure this without a six-month project") and an Economic Buyer's problem framing ("Our current platform's professional services dependency is inflating TCO") describe the same underlying condition and do not conflict |
| Outcome articulation | Yes | Different roles have different success criteria; the Champion's outcome ("team owns the configuration without IT tickets") and the Economic Buyer's outcome ("50% reduction in time-to-deployment cost in year one") are genuinely different outcomes that both trace back to the same `solution_claim` |

**The `supporting_claims` governance rule.** Role variants do not originate their own secondary claims. Supporting claims that appear in role-specific content must be drawn from the `supporting_claims` array on the parent `Narrative` node. This array is the pre-approved pool of secondary assertions from which content authors and Kalder Compose may select when building role-specific modules. A claim in a `Content Module`'s `content_body` that does not appear in the `solution_claim`, `message_pillar`, or `supporting_claims` array of the referenced `Narrative` node is an unapproved divergence point and fails through-line review (see Section 4.4).

The `supporting_claims` array must be seeded at `Narrative` node creation with at least one supporting claim per intended role variant. This is an authoring standard, not an optional enhancement. A `Narrative` node approved with an empty `supporting_claims` array creates a practical problem: if role variants cannot draw from an approved pool, any secondary claim they introduce is technically unapproved by default. The program will encounter this situation in early operation, before `Narrative` nodes are fully populated. The handling rule for this edge case: a `Narrative` node approved with an empty `supporting_claims` array permits role-specific content to introduce supporting claims that directly instantiate the `solution_claim` or `message_pillar` without extension — meaning they make the same claim in more specific or role-contextualized language, not additional claims. Any secondary claim that introduces a new dimension of the solution's capability (not present in `solution_claim` or `message_pillar`) is impermissible until the `supporting_claims` array is populated. Reviewers encountering this situation should flag the `Narrative` node for `supporting_claims` expansion before advancing dependent modules to `approved`. This edge case handling must be documented as a named condition in the Kalder Compose approval workflow (Document 8).

---

### 4.4 The Two Enforcement Layers

The through-line is enforced through two complementary layers. Neither layer alone is sufficient.

**Structural enforcement.** The `narrative_ref` required field on all `phase: diverge` and `phase: converge` `Content Module` nodes (specified in Section 1) enforces three things at the Sanity schema level: (1) that a shared `Narrative` parent exists for the module's `(solution_category, buying_stage)` pair, (2) that the `Narrative` node is in `status: approved` before the `Content Module` can enter `status: approved`, and (3) that the `solution_claim` and `message_pillar` values governing this module are always read from the `Narrative` node rather than stored redundantly — or divergently — on the module itself.

Structural enforcement is necessary but not sufficient. It guarantees that a shared `Narrative` parent exists and is approved. It does not evaluate the `content_body` of the `Content Module` for semantic consistency with that parent. A module can correctly reference an approved `Narrative` node and still introduce a claim not in `solution_claim`, `message_pillar`, or `supporting_claims`. It can selectively emphasize one aspect of the `solution_claim` so heavily that a reader would come away with a materially different impression of the vendor's core capability than another role variant produces. The structural layer catches schema violations. It does not catch semantic drift.

**Semantic drift is the primary through-line failure mode in distributed authoring programs.** It does not require a content author to act in bad faith. It occurs when a skilled writer, correctly optimizing for their target role's evaluation criteria, produces framing so specifically tailored to that role's perspective that the shared factual backbone becomes invisible or distorted by selective emphasis. Both the Champion module and the Economic Buyer module pass schema validation. Both reference the approved `Narrative`. But when a Champion and an Economic Buyer who have each consumed their respective modules sit in an internal alignment meeting and describe what the vendor does, they describe different things. The shared `solution_claim` was technically present in both modules, but the emphasis surrounding it led each role to a different conclusion about what it means.

**Procedural enforcement.** The human reviewer in the Kalder Compose approval workflow applies a named through-line review step as a distinct evaluation dimension — separate from grammar review, factual accuracy review, and brand voice review. Through-line review evaluates two questions:

1. Does this module's `content_body` introduce any claim not derivable from the referenced `Narrative` node's `solution_claim`, `message_pillar`, or `supporting_claims` array? If yes, the module fails through-line review and the unapproved claim must be either removed or escalated to the content strategist as a candidate for addition to the `Narrative` node's `supporting_claims`.

2. Does this module's framing create a materially different impression of the vendor's core capability that would produce asymmetry if the module's role and another role compared their experiences? The practical test for this question: if the Champion and the Economic Buyer each read their respective modules and then described Kalder's core capability to a third party in one sentence, would their sentences be compatible? If a reviewer cannot construct compatible one-sentence summaries from the two modules, framing has drifted past the permitted range and one or both modules require revision.

Through-line review is a named step in the Kalder Compose approval workflow (Document 8) and must appear as a distinct checklist item in the human review stage. It is not an implicit expectation of general editorial quality. A module can pass every other review dimension and still fail through-line review. The inverse is also true: a module that passes through-line review may still require revision on grammar, accuracy, or voice. These are independent evaluation gates.

---

### 4.5 The Convergence Content Corollary

The through-line requirement has a direct structural consequence for converge-phase content. A Consensus Brief — the primary instrument by which Champions synthesize buying group evaluation and distribute a shared position to all roles before a convergence point — can only be coherent if the diverge-phase content it synthesizes shares the same factual backbone.

The Kalder Compose workflow for Consensus Brief generation starts from approved diverge-phase `Content Module` nodes for the same `(solution_category, buying_stage)` pair. The synthesis task is: given what each role received, produce a unified document that reflects the shared position the group should be able to align on. If those diverge-phase modules each made the same `solution_claim` and led from the same `message_pillar`, the synthesis is tractable. The Consensus Brief draws from a consistent set of facts and frames them for group consumption. The Champion who distributes it can say: this is what we all received, synthesized.

If the diverge-phase content has semantic drift — each role received a subtly different framing of what Kalder does, built from different implicit claims — the synthesis task is not tractable without resolving the drift first. Kalder Compose, generating from drifted source modules, will either surface the inconsistency (producing a Consensus Brief that hedges rather than states) or suppress it (producing a Consensus Brief that picks one framing and silently discards others). Neither output is what a Champion needs to advance the buying group toward a convergence point.

This means the through-line requirement is the prerequisite for coherent Consensus Brief authoring, not a parallel concern. A program that maintains strict through-line coherence in diverge-phase content will consistently produce better Consensus Briefs — because there is a consistent factual backbone to synthesize from, and the synthesis task reduces to presentation rather than conflict resolution.

The content graph encodes this relationship structurally. A converge-phase `Content Module` (a Consensus Brief or Executive Brief) carries the same required `narrative_ref` field as a diverge-phase module. It references the same `Narrative` node that governs the diverge-phase modules it synthesizes. This is not merely schema compliance — it is what makes the Consensus Brief's synthesis coherent. The `Narrative` node is the shared spine that connects individual role evaluation content to group alignment content. Both phases reference it. Neither phase can introduce claims outside it.

For the full specification of convergence points, Champion distribution mechanics, and the double-diamond phase structure that governs when converge content is generated and circulated, see Document 6 (Buying Group Journey and Convergence Model) and `kalder_data_model_s0_s1.py §18 BUYING_GROUP_CONVERGENCE_POINTS`.

---

*End of Section 4. Section 5 (Module Types and Composition Rules) specifies the eleven module types from `§10 MODULE_TYPES`, their `intended_axes` variation profiles, and the `MODULE_COMPOSITION_RULES` conflict resolution policy. Section 8 (Kalder Compose Integration) specifies the generate → review → approve → publish workflow, including through-line review as a named step in the human review stage.*

---

## Section 5: Module Types and Composition Rules

> **Depends on:** Document 4 Section 1 (`Content Module` node type, `Experience` node `module_slots`), Document 4 Section 3 (conditional `jtbd_ref` requirement), `kalder_data_model_s0_s1.py` §10 MODULE_TYPES, MODULE_COMPOSITION_RULES

---

### 5.1 Module Types and the Page Assembly Model

A module type defines three things simultaneously: the page slot a `Content Module` node occupies within an `Experience` node's `module_slots` array, the personalization axes that slot varies on, and the fallback behavior when a visitor's classification state cannot support the slot's full personalization depth. When Adobe Target assembles a page experience at render time, it selects a `Content Module` node for each occupied module slot independently — each slot is evaluated against its own `intended_axes` profile, not against a single unified visitor state. The result is a page where the hero may be role- and stage-personalized, the benefits section is role-only, and the CTA reflects confidence tier and buying job — three different personalization depths on the same page, each correct for its module type.

The Axis Conditionality Principle established in Section 1.2 applies here at the module type level: a module type varies only on its specified `intended_axes`. A module that specifies `[role, solution_category]` does not "consider" buying job or bg_stage — it has no buying job variant and no stage variant. This is a design decision, not an omission. Multiple module types on the same page may therefore personalize on different axes without inherent conflict, provided the composition rules govern any actual axis overlap. Section 5 specifies what each module type is and how it behaves in composition; Document 5 (Personalization Decisioning Rules) specifies how Adobe Target is configured to implement the selection logic per module type.

---

### 5.2 Module Type Specifications

---

### `hero`

**Page slot:** The primary above-the-fold content area at the top of solution pages, product pages, and home page — the first content a visitor encounters on arrival.

**Purpose:** Gives the visitor immediate confirmation that this page is relevant to their situation, by presenting the solution's core value in language and framing calibrated to their buying group stage and role. The hero module draws from the `Narrative` node — its content expresses the vendor's `solution_claim` and `message_pillar`. It does not carry problem framing; that is the `problem_framing` module's responsibility.

**`intended_axes`:** `[role, solution_category, bg_stage]`

**`omitted_axes_rationale`:**
- `buying_job`: The hero establishes situational relevance at the stage level — not at the specific task level. Buying job specificity is delegated to `gated_assets` and `cta`, which carry the buying_job axis. A hero that attempted to vary on buying_job would require 5 roles × 4 stages × 4 buying jobs = up to 80 variants per solution category per hero slot, which is not authoring-sustainable. Stage-level framing is sufficient for hero-level orientation.
- `confidence_tier`: Hero content is role-and-stage-relevant regardless of how confident the classification is. A MEDIUM-confidence Champion should receive role-appropriate hero framing; withholding it until HIGH confidence would produce a worse experience without serving a governance purpose.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 (HIGH): Full role- and stage-specific hero variant for the visitor's classified role and bg_stage.
- Level 2 (MEDIUM): Same role- and stage-specific variant as Level 1 — the hero does not distinguish between HIGH and MEDIUM confidence; both receive the role × stage selection.
- Level 3 (LOW/solution-interest): Solution-category hero variant — no role differentiation. The hero presents the solution category's general value proposition.
- Level 4 (account-level): Industry or firmographic hero variant if available; otherwise Level 5 default.
- Level 5 (default brand): Standard Kalder brand hero with no personalization signal applied.

**`confidence_tier_minimum`:** `MEDIUM` — both HIGH and MEDIUM visitors receive the role-specific hero; the hero is not suppressed at MEDIUM confidence.

**Composition note:** Named conflict scenario — `hero_vs_gated_assets_stage_mismatch`. See Section 5.4.2.

---

### `benefits`

**Page slot:** The primary value messaging section on solution pages, typically appearing below the hero — presents the core reasons a buyer would choose this solution.

**Purpose:** Lets the visitor quickly assess whether this solution's benefit set matches what they are evaluating for, using language and framing calibrated to their role's evaluation criteria.

**`intended_axes`:** `[role, solution_category]`

**`omitted_axes_rationale`:**
- `buying_job`: Benefits are stage-stable — the fundamental reasons to choose the solution do not change based on whether the visitor is identifying a problem or selecting a supplier. Buying job variation in this slot would produce benefits that shift message in ways that could contradict the through-line. Buying job specificity in adjacent content is handled by `gated_assets`.
- `bg_stage`: Benefits content does not need to shift based on pipeline stage. The solution's value proposition for a given role is consistent across stages; how that value is contextually framed in the surrounding content (hero, cta) shifts by stage.
- `confidence_tier`: Benefits render regardless of confidence level. Withholding role-specific benefits from a MEDIUM visitor would degrade the experience without purpose.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 (HIGH): Full role-specific benefits for the visitor's classified role within the solution category.
- Level 2 (MEDIUM): Same role-specific benefits as Level 1.
- Level 3 (LOW/solution-interest): Solution-category benefits variant — no role differentiation. Presents the solution's value for the general buyer persona at this solution category.
- Level 4 (account-level): Same as Level 3 — solution-category default.
- Level 5 (default brand): Generic solution-agnostic value proposition.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** Named conflict scenario — `cta_vs_benefits_buying_job_mismatch`. See Section 5.4.2. When this conflict fires, the benefits module serves the role-default content (its `[role, solution_category]` variant) regardless of the CTA's `buying_job` axis selection.

---

### `cta`

**Page slot:** The primary call-to-action unit on solution pages and product pages — typically rendered in or near the hero and repeated at page bottom. The slot that drives the next-step action.

**Purpose:** Gives the visitor an appropriate next step that matches how far along their evaluation they are and what their role's typical decision pathway looks like.

**`intended_axes`:** `[role, confidence_tier, buying_job]`

**`omitted_axes_rationale`:**
- `solution_category`: CTA language and type is role-, confidence-, and job-specific — not solution-specific. A Champion at supplier_selection stage requesting a demo uses similar CTA framing whether evaluating Customer Engagement or IT & Operations. Solution-specific CTAs would create unnecessary variant proliferation without meaningful differentiation.
- `bg_stage`: CTA stage-relevance is primarily expressed through the `buying_job` axis, which is more granular than `bg_stage`. A `bg_stage: qualified` Champion whose `buying_job` is `supplier_selection` and a `bg_stage: prioritized` Champion whose `buying_job` is also `supplier_selection` should receive the same CTA — the buying job is the operative signal, not the pipeline stage.

**`jtbd_ref` requirement:** Required — `buying_job` is in `intended_axes`. A different `Content Module` node must exist per buying job value for this module type. The Sanity form requires `jtbd_ref` when `module_type: cta` is selected.

**Fallback behavior:**
- Level 1 (HIGH): Full three-axis CTA — role × confidence_tier × buying_job specific. Direct, assumptive language matching the role's current task.
- Level 2 (MEDIUM): Role × confidence_tier CTA. If buying job confidence is KNOWN, full three-axis; if INFERRED or UNKNOWN, two-axis with PROBABLE_JOB_PRIORS selection. Softer language than Level 1.
- Level 3 (LOW/solution-interest): Solution-category default CTA — exploratory tone, no role assumption. Typically "Learn more" or "Explore [Solution Category]."
- Level 4 (account-level): Brand-level awareness CTA — no solution or role specificity.
- Level 5 (default brand): Generic brand CTA.

**`confidence_tier_minimum`:** `MEDIUM` for role-influenced CTA; `HIGH` for direct role-assumptive CTA variants. Content authors tagging CTA `Content Module` nodes must apply HIGH to modules using explicit role-address language.

**Composition note:** Named conflict scenario — `cta_vs_benefits_buying_job_mismatch`. See Section 5.4.2. The `cta` module's `buying_job` axis takes precedence in this conflict.

---

### `gated_assets`

**Page slot:** The asset download or gated content rail — typically a sidebar or section presenting downloadable resources relevant to the visitor's current evaluation context.

**Purpose:** Puts the specific research, documentation, or validation materials the visitor needs at their current evaluation stage directly in reach — matched to where they are in the buying job, not just their role.

**`intended_axes`:** `[role, buying_job, bg_stage]`

**`omitted_axes_rationale`:**
- `solution_category`: The gated_assets slot queries the Asset inventory within the current page's solution category context — the solution category is the retrieval scope, not a variation axis on the module itself. Every Asset node already carries a `solution_category` field that constrains which assets are eligible for retrieval. The module type does not vary on solution_category because the selection mechanism handles scope implicitly.
- `confidence_tier`: Asset eligibility by gating level (ungated / gated_email / gated_registration) is governed by the `confidence_tier_minimum` field on individual `Asset` nodes, not by module-level confidence tier variation. The module type does not vary by confidence tier; the assets surfaced within it do.

**`jtbd_ref` requirement:** Required — `buying_job` is in `intended_axes`.

**Fallback behavior:**
- Level 1 (HIGH): Full three-axis asset selection — role × buying_job × bg_stage. All gating levels eligible subject to individual asset `confidence_tier_minimum` values.
- Level 2 (MEDIUM): Role × bg_stage with PROBABLE_JOB_PRIORS selection when buying job is INFERRED or UNKNOWN; full three-axis when KNOWN. Gated_registration assets suppressed (require HIGH or MEDIUM minimum depending on individual asset tagging).
- Level 3 (LOW/solution-interest): Solution-category ungated assets only. No role or buying_job matching — broad-relevance content for solution-interested visitors.
- Level 4 (account-level): Generic brand-level assets or industry-relevant ungated content. No solution-specific targeting.
- Level 5 (default brand): No gated_assets slot rendered.

**`confidence_tier_minimum`:** `MEDIUM` for the module slot activation. Individual asset `confidence_tier_minimum` values govern which specific assets within the slot are surfaced per visitor.

**Composition note:** Named conflict scenario — `hero_vs_gated_assets_stage_mismatch`. See Section 5.4.2. The `gated_assets` `buying_job` axis has higher specificity than `hero`'s `bg_stage` axis per the priority order. `gated_assets` keeps its `buying_job`-selected variant; hero demotes to solution_category-level variation.

---

### `proof` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The social proof and customer validation section — typically one or more testimonials, customer logos, or case study excerpts positioned to support the buyer's evaluation confidence.

**Purpose:** Gives the buyer comparative context from peers who have faced similar evaluation decisions — evidence that supports the evaluation conclusion they are building toward, filtered to peers whose situation and role are recognizable.

**`intended_axes`:** `[role, solution_category, buying_job]`

**`omitted_axes_rationale`:**
- `bg_stage`: Proof points are selected by the buying job the visitor is working on, not the pipeline stage of their account. A supplier_selection proof point is a quantified ROI claim; a problem_identification proof point is a peer validation of the problem's severity. Buying job is the better selection dimension than stage.
- `confidence_tier`: Proof points render at all confidence levels — social proof is not suppressed at MEDIUM. The value of showing peer validation to a lower-confidence visitor is at least as high as for a HIGH-confidence visitor.

**`jtbd_ref` requirement:** Required — `buying_job` is in `intended_axes`.

**Fallback behavior:**
- Level 1 and 2: Role- and buying_job-matched proof points. Champion-affinity proof points at problem_identification stage; EB-affinity ROI-quantified proof at supplier_selection.
- Level 3: Solution-category proof points without role differentiation.
- Level 4 and 5: Industry-level proof or no proof slot rendered.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies.

---

### `narrative` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The core messaging and positioning section — typically mid-page on solution pages — that presents the solution's value claim and message pillar in context.

**Purpose:** Lets the buyer understand what this solution is, what it does, and why it matters in terms that connect to the problem they are trying to solve — at the appropriate stage of their evaluation.

**`intended_axes`:** `[role, solution_category, bg_stage]`

**`omitted_axes_rationale`:**
- `buying_job`: The through-line requirement (Section 4) mandates that `solution_claim` and `message_pillar` are shared across role variants for a given `(solution_category, buying_stage)` pair. The `narrative` module slot enforces this by not varying on buying_job — the core claim is stage-stable for a given role and stage, and buying-job-specific nuance belongs in adjacent slots (`gated_assets`, `cta`).
- `confidence_tier`: The narrative claim is relevant regardless of confidence level. A MEDIUM-confidence visitor deserves the same factual claim as a HIGH-confidence one.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 and 2: Role- and stage-specific narrative variant.
- Level 3: Solution-category narrative without role differentiation.
- Level 4 and 5: Generic brand value proposition or no narrative slot.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies. Because this module shares `bg_stage` with `hero`, a `bg_stage`-mismatch scenario analogous to `hero_vs_gated_assets_stage_mismatch` could arise if `gated_assets` and `narrative` appear on the same page with conflicting stage signals. Resolution: `gated_assets buying_job` overrides `narrative bg_stage`; narrative demotes to solution_category-level variation in the same manner as hero.

---

### `problem_framing` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The problem articulation section — typically near the top of solution pages, below the hero — that gives the buyer a precise description of the problem this solution addresses from their perspective.

**Purpose:** Lets the buyer confirm that the problem being described matches their actual situation — stated in the language and terms their role uses to describe the problem, not vendor problem-framing language. The problem_framing module draws from the `Problem` node — its content expresses the buyer's situation in the buyer's language. It does not carry the vendor's capability claim; that is the `hero` and `narrative` modules' responsibility.

**`intended_axes`:** `[role, solution_category]`

**`omitted_axes_rationale`:**
- `bg_stage`: The problem itself does not change based on pipeline stage. How it is emotionally weighted may shift (at supplier_selection, the problem feels more urgent), but the problem framing is role-stable across stages.
- `buying_job`: Problem framing is pre-buying-job content — it supports the problem_identification stage before buying job inference has been established. Requiring a buying_job variant for this slot would mean the slot is never fully activated at the stage when it is most needed.
- `confidence_tier`: Problem framing content is role-specific but not specificity-restricted. A MEDIUM-confidence visitor benefits from role-framed problem description as much as a HIGH-confidence one.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 and 2: Role-specific problem framing within the solution category.
- Level 3: Solution-category problem statement without role differentiation.
- Level 4 and 5: Generic "industry-level" problem description or slot not rendered.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies.

---

### `outcomes` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The success state section — typically mid-page — that presents the specific outcomes a buyer can expect from implementing this solution, calibrated to their role's success criteria.

**Purpose:** Lets the buyer envision what success looks like for them specifically — what changes in their world if this solution is implemented — using outcome statements matched to their role's success criteria.

**`intended_axes`:** `[role, solution_category, bg_stage]`

**`omitted_axes_rationale`:**
- `buying_job`: Outcome statements are stage-relevant — an Economic Buyer at the engaged stage cares about strategic outcomes; the same EB at the qualified stage cares about validated quantified outcomes. Stage governs outcome emphasis better than buying job.
- `confidence_tier`: Outcomes are presented regardless of confidence level; they are not more or less appropriate based on classification confidence.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 and 2: Role- and stage-specific outcome statements.
- Level 3: Solution-category outcomes without role differentiation.
- Level 4 and 5: Generic brand outcome statements or slot not rendered.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies.

---

### `use_cases` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The use case illustration section — typically mid-to-lower page on solution and product pages — that presents concrete application scenarios relevant to the buyer's domain.

**Purpose:** Gives the buyer specific examples of how the solution works in situations similar to theirs — use case illustrations that let them map the solution's capabilities to their own workflow and requirements.

**`intended_axes`:** `[role, solution_category, buying_job]`

**`omitted_axes_rationale`:**
- `bg_stage`: Use case relevance is better expressed through buying_job than bg_stage. A requirements_building visitor evaluating integration scenarios needs different use cases than a problem_identification visitor confirming category relevance — and buying_job captures this distinction better than pipeline stage.
- `confidence_tier`: Use case content is appropriate at all confidence levels; it is not suppressed or altered by confidence tier.

**`jtbd_ref` requirement:** Required — `buying_job` is in `intended_axes`.

**Fallback behavior:**
- Level 1 and 2: Role- and buying_job-matched use case content.
- Level 3: Solution-category use cases without role differentiation.
- Level 4 and 5: Generic product capability illustrations or slot not rendered.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies.

---

### `trust_signals` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The credibility and compliance signals section — typically positioned near conversion points — that presents security certifications, compliance status, privacy posture, and vendor validation signals.

**Purpose:** Gives the buyer the governance and risk information they need to clear organizational barriers to vendor selection — matched to the specific risk concerns their role is responsible for evaluating.

**`intended_axes`:** `[role, solution_category]`

**`omitted_axes_rationale`:**
- `bg_stage`: Trust and compliance signals are relevant throughout the buying journey, not just at late stages. Presenting compliance signals to an engaged-stage Ratifier or Influencer who surfaces early in the evaluation is operationally correct.
- `buying_job`: Trust signals are role-specific (Ratifiers need security certifications; Influencers need integration compatibility; Economic Buyers need vendor financial stability) but not buying-job-specific. Role is the selection dimension.
- `confidence_tier`: Trust signal content is not restricted by confidence tier. A MEDIUM-confidence Ratifier needs compliance documentation as much as a HIGH-confidence one.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 and 2: Role-specific trust signals — security/compliance documentation for Ratifiers; integration partnership signals for Influencers; financial stability and customer retention signals for Economic Buyers.
- Level 3: Solution-category trust signals without role differentiation — generic compliance and security posture for the solution category.
- Level 4 and 5: Brand-level trust signals (general security and compliance overview) or slot not rendered.

**`confidence_tier_minimum`:** `MEDIUM`

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies.

---

### `progressive_disclosure` [REQUIRES CONFIRMATION FROM §10 v0.1.0]

**Page slot:** The zero-party data collection prompt — a contextually placed interactive element inviting the visitor to self-identify their role or buying job in exchange for more relevant content.

**Purpose:** Lets the visitor opt into a more precise personalization experience by declaring who they are or what they are working on — advancing their classification from behavioral inference to zero-party confirmed state.

**`intended_axes`:** `[confidence_tier, solution_category]`

**`omitted_axes_rationale`:**
- `role`: The progressive_disclosure module is displayed precisely when role is not known or not confirmed. A module that varies by role cannot be activated to collect role data — this is circular. The module varies by confidence_tier instead: the prompt shown to a MEDIUM-confidence visitor (confirming their inferred role) differs from the prompt shown to an UNKNOWN-confidence visitor (requesting initial role identification).
- `bg_stage`: Progressive disclosure prompts do not vary by stage. The invitation to self-identify is stage-neutral; the resulting classification improvement affects all subsequent stage-related personalization.
- `buying_job`: Same reason as role — the module is displayed when buying job is not confirmed. Varying by buying_job would require the module to know what it is trying to discover.

**`jtbd_ref` requirement:** Optional — `buying_job` is not in `intended_axes`; two-axis fallback applies per Section 3.

**Fallback behavior:**
- Level 1 (HIGH): Progressive disclosure module not rendered — the visitor is already HIGH-confidence. The slot may be used for a related confirmation or preference capture prompt at the platform engineer's discretion.
- Level 2 (MEDIUM): Role confirmation prompt — "You seem to be evaluating as a [inferred role]. Is that right?" Confirms or corrects the behavioral inference.
- Level 3 (LOW/solution-interest): Initial role identification prompt — no role assumption, asks visitor to self-identify.
- Level 4 (account-level): TAL-context prompt — invites the visitor to identify their evaluation context.
- Level 5 (default brand): Not rendered.

**`confidence_tier_minimum`:** `UNKNOWN` — this slot is specifically designed for visitors at UNKNOWN and LOW confidence. It should not carry a MEDIUM or HIGH minimum.

**Composition note:** No named conflict scenario; general `highest_specificity_wins` policy applies. Because `progressive_disclosure` varies on `confidence_tier` rather than `role`, it does not conflict with role-varying modules on the same page.

---

### 5.3 Module Type Reference Table

| Module Type | `intended_axes` | `jtbd_ref` Required? | `confidence_tier_minimum` | Active at Fallback Levels | Named Conflict Scenario |
|---|---|---|---|---|---|
| `hero` | `[role, solution_category, bg_stage]` | Optional | `MEDIUM` | 1–4 (Level 5: brand default) | `hero_vs_gated_assets_stage_mismatch` |
| `benefits` | `[role, solution_category]` | Optional | `MEDIUM` | 1–4 (Level 5: generic) | `cta_vs_benefits_buying_job_mismatch` |
| `cta` | `[role, confidence_tier, buying_job]` | Required | `MEDIUM` / `HIGH` per variant | 1–4 (Level 5: generic) | `cta_vs_benefits_buying_job_mismatch` |
| `gated_assets` | `[role, buying_job, bg_stage]` | Required | `MEDIUM` (slot); per-asset for content | 1–3 (Level 4: generic assets; Level 5: not rendered) | `hero_vs_gated_assets_stage_mismatch` |
| `proof` | `[role, solution_category, buying_job]` | Required | `MEDIUM` | 1–3 (Level 4–5: not rendered) | None |
| `narrative` | `[role, solution_category, bg_stage]` | Optional | `MEDIUM` | 1–4 (Level 5: brand default) | No independently named scenario; follows `hero_vs_gated_assets_stage_mismatch` resolution pattern when `gated_assets` and `narrative` co-occur on the same page (`gated_assets buying_job` overrides `narrative bg_stage`; narrative demotes to solution_category-level variation) |
| `problem_framing` | `[role, solution_category]` | Optional | `MEDIUM` | 1–3 (Level 4–5: not rendered) | None |
| `outcomes` | `[role, solution_category, bg_stage]` | Optional | `MEDIUM` | 1–3 (Level 4–5: not rendered) | None |
| `use_cases` | `[role, solution_category, buying_job]` | Required | `MEDIUM` | 1–3 (Level 4–5: not rendered) | None |
| `trust_signals` | `[role, solution_category]` | Optional | `MEDIUM` | 1–3 (Level 4: brand trust; Level 5: not rendered) | None |
| `progressive_disclosure` | `[confidence_tier, solution_category]` | Optional | `UNKNOWN` | 2–4 (Level 1: not rendered; Level 5: not rendered) | None |

*Rows 5–11 carry `[REQUIRES CONFIRMATION FROM §10 v0.1.0]` on their per-type specifications above. The `intended_axes` and fallback behaviors for these seven module types are derived from corpus context and should be validated against the full §10 MODULE_TYPES entries in the v0.1.0 data model implementation.*

---

### 5.4 Module Composition Rules

#### 5.4.1 The `highest_specificity_wins` Policy

When multiple modules on a single page personalize on overlapping axes, the module with the most specific axis combination takes precedence for the overlapping axis. Specificity is determined by the following axis priority order, reproduced exactly from `MODULE_COMPOSITION_RULES` in `kalder_data_model_s0_s1.py §10`:

1. `buying_job` — most specific; inferred from session behavior
2. `bg_stage` — stage-level; inferred from account-level engagement
3. `confidence_tier`
4. `role`
5. `solution_category` — broadest

A higher-priority axis is more specific than a lower-priority one. When module A personalizes on `buying_job` and module B personalizes on `bg_stage`, module A has higher specificity on the overlapping pipeline-state dimension — even though both modules may be trying to express stage-relevant content. Module A's `buying_job`-selected variant governs; module B demotes to its next available non-conflicting axis.

"Takes precedence" means operationally: the higher-specificity module retains the variant it selected based on its axis. The lower-specificity module does not use the same axis to select its own variant — it demotes to its next-highest non-overlapping axis and selects from that dimension instead. The visitor does not see a conflict; they see the higher-specificity module's result and the lower-specificity module's demoted result. The conflict resolution is transparent.

Conflict resolution is enforced in the Adobe Target activity configuration layer — specifically through activity priority settings and audience overlap rules. The enforcement layer is in Adobe Target, not in the AEP segment evaluation layer or in a custom decisioning middleware. Document 5 (Personalization Decisioning Rules) specifies the Target activity configuration that implements this policy per module type.

#### 5.4.2 Named Conflict Scenarios

**Scenario 1: `hero_vs_gated_assets_stage_mismatch`**

*Description:* A Champion in Acquisition `bg_stage` may receive an Acquisition hero while `gated_assets` surfaces Progression content if their `buying_job` inference signals a later stage.

*Resolution (authoritative):* `gated_assets buying_job overrides hero stage assumption`

*Full resolution from the data model:* `gated_assets` `buying_job` axis takes precedence; hero demotes to `solution_category`-level variation.

*Operational note for platform engineers:* This scenario arises when a visitor's `buying_job` inference (derived from behavioral signals in the current session) signals a more advanced stage than their account-level `bg_stage`. This is a real and expected condition — a Champion at an `engaged` account may be exhibiting supplier_selection behavioral signals in the current session. Adobe Target should be configured to evaluate the `gated_assets` activity (which uses `buying_job`) at higher priority than the `hero` activity (which uses `bg_stage`). When the conflict fires, the visitor's `hero` slot switches from the role × stage variant to the role × solution_category variant — the stage assumption in the hero is abandoned in favor of a neutral-stage presentation. The visitor sees a stage-generic hero alongside stage-advanced asset recommendations; this is the correct behavior, not an error. The visitor experience impact is: the hero may feel slightly less stage-specific, but the assets they are offered are precisely matched to what they are actually researching.

---

**Scenario 2: `cta_vs_benefits_buying_job_mismatch`**

*Description:* The `cta` module personalizes on `[role, confidence_tier, buying_job]`. The `benefits` module personalizes on `[role, solution_category]` only — it does not vary by `buying_job`. When a visitor's `buying_job` inference is `supplier_selection` but the benefits module renders stage-generic content, the page may deliver a late-stage CTA ("See pricing") alongside early-stage benefits copy ("Why Kalder?").

*Resolution (authoritative):* `cta buying_job overrides benefits stage assumption; benefits renders role-default when buying_job variant is absent`

*Full resolution from the data model:* On pages where both `cta` and `benefits` modules are present, the `cta` module's `buying_job` axis takes precedence. The `benefits` module falls back to the role axis only — it does not attempt to match `cta`'s `buying_job` specificity. If a `benefits` variant for the inferred `buying_job` does not exist, render the role-default `benefits` content rather than a generic fallback.

*Operational note for platform engineers:* This scenario is an expected condition, not a misconfiguration. The `benefits` module is intentionally designed to not vary by `buying_job` — it is stage-stable by design. The CTA is intentionally the buying-job-specific element on the page. The resolution means the page will show a late-stage CTA alongside benefits copy that does not reinforce the late-stage context; this is a content gap, not a system failure. The platform engineer should flag this pattern to the content team so that the `benefits` content can be reviewed for later-stage relevance. Configuring Adobe Target: the `cta` activity operates at higher priority than the `benefits` activity for the `buying_job` axis; `benefits` activity does not evaluate `buying_job` at all and will always select based on `[role, solution_category]`.

#### 5.4.3 General Policy for Novel Conflict Scenarios

A platform engineer encountering a module combination conflict not covered by the two named scenarios above should apply the following five-step procedure:

**Step 1.** Identify the axes on which the conflicting modules both personalize. Two modules conflict on an axis when they both carry that axis in their `intended_axes` and their selected variants would produce different results on the overlapping axis for the same visitor.

**Step 2.** For the overlapping axis (or axes), determine which module has the higher-specificity axis in the `axis_priority_order` (buying_job > bg_stage > confidence_tier > role > solution_category). If both modules share the same axis — for example, both personalize on `role` — and their variants are compatible (both select the same role variant), there is no conflict; proceed to Step 5.

**Step 3.** The higher-specificity module retains its axis-selected variant. Its selection is not altered by the conflict resolution.

**Step 4.** The lower-specificity module demotes to its next-highest non-overlapping axis. If the lower-specificity module has no next-highest non-overlapping axis (all of its `intended_axes` values are at a lower priority level than the conflicting axis, or the module has only the one conflicting axis), it serves its `solution_category`-level default variant.

**Step 5.** If the conflict cannot be resolved by Steps 1–4 — for example, two modules both personalize on exactly the same axis combination at the same priority level and produce contradictory selections — this is a configuration error, not a composition conflict. Do not resolve silently. Escalate to the platform engineering team as a Target activity configuration issue. Document 5 (Personalization Decisioning Rules) and Document 8 (Operational Runbook) own the operational escalation path for unresolvable conflicts.

Note on absent module types: Not every page template will include all eleven module slots. The conflict resolution procedure applies only to modules that are actually present on the page being assembled. A module type absent from the current `Experience` node's `module_slots` array does not participate in conflict resolution and does not affect the resolution of present modules. The general procedure handles this correctly at Step 1: only present, active module slots are evaluated for axis overlap.

---

*End of Section 5. Document 5 (Personalization Decisioning Rules) specifies the Adobe Target activity configuration required to implement the module type `intended_axes` profiles and the `MODULE_COMPOSITION_RULES` conflict resolution policy. Section 7 (Coverage Completeness Architecture) specifies the minimum `Content Module` node count per module type required to activate personalization at each fallback level.*

---

## Section 6: Converge Content Rules

> **Depends on:** Document 4 Section 1 (`Narrative` node, `narrative_ref` field), Document 4 Section 4 (through-line requirement and convergence corollary), Document 1 Section 4 (Role-to-Convergence-Point Matrix)

---

### 6.1 Why Converge Content Exists: The Group Alignment Function

The diverge phase of the buying group journey works. Each role receives content optimized for their individual evaluation criteria. Champions accumulate evidence and build the internal case. Economic Buyers size the problem and stress-test the business justification. Influencers evaluate technical fit and workflow compatibility. Users assess daily operational impact. Ratifiers review compliance and governance posture. Each role arrives at a convergence point having completed meaningful individual work — and yet convergence can still fail.

It fails because individual optimization does not produce group alignment automatically. A Champion who has built a strong personal conviction about this vendor has not necessarily given the Economic Buyer the financial framing they need to approve budget. An Influencer who has validated technical fit has not necessarily shared that validation with the Champion in a form the Champion can carry into the Business Value Alignment conversation. Each role may have strong individual clarity while the group has structural confusion — about what the vendor claims to do, whether the evaluation criteria were shared, or whether the business case that the Champion presents reflects what other roles actually found.

The Champion is the group coordinator at every convergence point. But coordination requires instruments. Sending a Champion into a Requirements Framing conversation with five individually optimized but structurally unrelated pieces of role-specific content is not coordination — it is five separate stories the Champion must reconcile on the spot. The `consensus_brief` and the `executive_brief` are the instruments the Champion uses to convert individual evaluation into group alignment. Both are `phase: converge` content types. Both are distributed internally by Champions via private channels, not served by Adobe Target. Both must synthesize from — and carry a `narrative_ref` to — the same `Narrative` node that governed the diverge content for their `(solution_category, buying_stage)` pair, because that `Narrative` node is the shared factual backbone their synthesis draws from.

---

### 6.2 What Each Converge Content Type Is

#### `consensus_brief`

**What it is:** A synthesis document that reconciles what each required role has been evaluating individually and presents a shared position the group can align around before a convergence point. It does not introduce new vendor claims. It draws from the approved diverge content for each Required role at the target convergence point, and its synthesis is constrained to the `solution_claim`, `message_pillar`, and `supporting_claims` established in the governing `Narrative` node. A buying group member reading a `consensus_brief` should recognize their own evaluation context in it — their problem framing, their success criteria — while also seeing how the other roles' evaluations fit into the same shared picture.

**Distributing role vs. receiving roles — explicit distinction:** The `primary_role_affinity: champion` on `consensus_brief` designates who distributes it, not who is designed to read it. The `consensus_brief` is designed for the **full buying group** — all roles designated as Required (R) at the target convergence point are the intended readers. The Champion selects and distributes the brief to their buying group colleagues. The document is written to be readable and relevant to all required participants, not to any one role's perspective.

**Convergence points this content type maps to:** `consensus_brief` maps to the three earlier convergence points where group alignment is being established — Problem Validation, Requirements Framing, and Solution Validation. At these points, the group is forming shared positions about the problem, the evaluation criteria, and the solution's functional fit; the `consensus_brief` gives them shared reference material for those alignment conversations.

---

#### `executive_brief`

**What it is:** A concise, outcomes-oriented summary of the business case for this solution at the point of financial and governance sign-off. Where a `consensus_brief` synthesizes across all required roles, an `executive_brief` leads with quantified business outcomes, ROI framing, and risk containment language — the information an Economic Buyer needs to approve budget and a Ratifier needs to clear procurement and compliance barriers. The Champion distributes it to those specific roles when the buying group is approaching a decision that requires their formal authorization.

**Distributing role vs. receiving roles — explicit distinction:** As with `consensus_brief`, the `primary_role_affinity: champion` designates who distributes it. The `executive_brief` is designed for the **Economic Buyer and Ratifier specifically** — not for the full buying group. Its framing, vocabulary, and emphasis are calibrated to the financial justification needs of the Economic Buyer and the compliance concerns of the Ratifier. An Influencer or User reading an `executive_brief` would find it useful but not written for their evaluation lens. This distinction from `consensus_brief` is not cosmetic: the generation parameters for an `executive_brief` must draw from approved diverge content authored specifically for `economic_buyer` and `ratifier`, because those are the roles the document is designed to serve.

**Convergence points this content type maps to:** `executive_brief` maps to the three later convergence points where financial and governance authorization is required — Business Value Alignment, Risk & Compliance Validation, and Final Commitment. At these points, the group needs the Economic Buyer to confirm the ROI case and the Ratifier to clear compliance and procurement barriers; the `executive_brief` gives the Champion the instrument to drive those specific authorizations.

---

### 6.3 Generation Prerequisites

Converge content generation is gated by three prerequisites, all of which must be satisfied before Kalder Compose initiates generation for a given `(solution_category, buying_stage)` pair and target convergence point.

#### Prerequisite 1 — Approved diverge coverage for Required roles at the target convergence point

Approved `Content Module` nodes tagged `phase: diverge` must exist for all roles designated as Required (R) at the target convergence point in the Role-to-Convergence-Point Matrix (Document 1, Section 4). At minimum, one approved diverge `Content Module` per Required role per `(solution_category, buying_stage)` pair. Supporting (S) role coverage enriches the synthesis and is recommended but is not a blocking prerequisite.

| Convergence Point | Required Roles | Minimum Diverge Coverage Required Before Generation |
|---|---|---|
| Problem Validation | Champion, Economic Buyer | Approved diverge modules for `champion` + `economic_buyer` at this `(solution_category, buying_stage)` |
| Requirements Framing | Champion, Influencer, User | Approved diverge modules for `champion` + `influencer` + `user` at this `(solution_category, buying_stage)` |
| Solution Validation | Champion, Influencer, User | Approved diverge modules for `champion` + `influencer` + `user` at this `(solution_category, buying_stage)` |
| Business Value Alignment | Champion, Economic Buyer | Approved diverge modules for `champion` + `economic_buyer` at this `(solution_category, buying_stage)` |
| Risk & Compliance Validation | Champion, Economic Buyer, Ratifier | Approved diverge modules for `champion` + `economic_buyer` + `ratifier` at this `(solution_category, buying_stage)` |
| Final Commitment | Champion, Economic Buyer, Ratifier | Approved diverge modules for `champion` + `economic_buyer` + `ratifier` at this `(solution_category, buying_stage)` |

#### Prerequisite 2 — Approved `Narrative` node for the `(solution_category, buying_stage)` pair

The `Narrative` node governing the diverge content for this `(solution_category, buying_stage)` pair must be in `status: approved`. This is the structural prerequisite for through-line coherence: an unapproved `Narrative` node means the `solution_claim` and `message_pillar` that should anchor the synthesis have not been finalized. Converge content generated without an approved `Narrative` parent has no confirmed factual backbone to synthesize from and will inevitably introduce drift relative to the diverge content.

#### Prerequisite 3 — `executive_brief` requires `economic_buyer` and `ratifier` diverge coverage specifically

The convergence point coverage table (Prerequisite 1) establishes the minimum role coverage required at each convergence point. For `executive_brief` specifically, this is not sufficient. Because the `executive_brief` is designed for Economic Buyer and Ratifier consumption — not for the full buying group — its generation parameters must draw from approved diverge content authored specifically for `economic_buyer` and `ratifier`. An `executive_brief` generated only from Champion diverge content will not address the Economic Buyer's financial justification needs or the Ratifier's compliance concerns. Prerequisite 3 is a named additional constraint: `executive_brief` generation requires approved diverge `Content Module` nodes for `economic_buyer` and `ratifier` at the relevant `(solution_category, buying_stage)` pair, beyond whatever the convergence point table requires.

Converge content that does not satisfy all three prerequisites must not be generated, even if Kalder Compose has sufficient context to produce a plausible draft. A draft generated without prerequisite coverage will synthesize incomplete or biased role perspectives into the group alignment document — the Champion will distribute a brief that does not represent the full Required-role evaluation picture.

---

### 6.4 The Narrative Node Structural Constraint

A converge-phase `Content Module` node — whether a `consensus_brief` or an `executive_brief` — carries the same required `narrative_ref` field as diverge-phase `Content Module` nodes (specified in Section 1). It must reference the same `Narrative` node as the diverge-phase `Content Module` nodes for the same `(solution_category, buying_stage)` pair. This is not a schema compliance formality. It is the mechanism that makes the synthesis coherent. The `Narrative` node carries the `solution_claim` and `message_pillar` that every role variant's diverge content was built on. When a converge `Content Module` references that same `Narrative` node, it is anchored to the same factual backbone. The consistency is structural — it was enforced at diverge content authoring time and is inherited at synthesis time.

A converge `Content Module` that references a different `Narrative` node than its source diverge modules is not synthesizing from those modules' shared backbone; it is importing a different through-line, which will produce a brief that diverges from the diverge content it is supposed to represent. This condition is a blocking validation error in Sanity. The validation mechanism is the GROQ-based cross-document check specified in Section 1 (Revision 2): the `narrative_ref` on the converge `Content Module` is compared against the `narrative_ref` values on the diverge `Content Module` nodes designated as its generation source. A mismatch on `solution_category`, `buying_stage`, or the referenced `Narrative` document ID prevents publication. The converge module cannot enter `status: approved` until the mismatch is resolved.

---

### 6.5 Champion Distribution Pathway

When a converge `Content Module` node enters `status: approved` in Sanity, it is made available to the Champion through a designated content delivery surface — the Kalder Compose interface or equivalent — not published to kalder.com for web serving. The delivery surface exists; its design and the workflow through which Champions access it are specified in Document 8 (Operational Runbook). Section 6 specifies only that the surface must exist and must serve approved converge content to Champions, not to Adobe Target.

From that point, the program has no visibility into or control over distribution. The Champion decides who receives the brief, through what channel, at what moment in their internal alignment process. The document may be forwarded as an email attachment, shared as a document link, presented directly in a meeting, or circulated via internal messaging. The program cannot track this chain.

The downstream measurement signal is indirect. The EB arrival pattern established in Document 1 is the primary proxy: an Economic Buyer arriving at kalder.com without a classifiable referral path — the dark social arrival pattern — shortly after a Champion session at the same account, landing directly on high-value content (ROI calculators, pricing pages, executive brief downloads), is the strongest available signal that the Champion distributed converge content and the recipient acted on it. This interpretation is suggestive, not confirmatory. The dark social pattern is consistent with converge content distribution but is not uniquely attributable to it; direct navigation, shared internal links, and other referral-suppressed channels produce the same observable pattern. Document 7 (Measurement and Experimentation Framework) owns the attribution model for converge content effectiveness.

The `executive_brief_download` signal fires when a contact downloads either an `executive_brief` or a `consensus_brief` asset (`executive_brief_download` signal key; EB = 12, Champion = 10, User = −10 per `§7 CROSS_ROLE_WEIGHTS`). The signal key does not distinguish which content type was downloaded. Practitioners should not assume `executive_brief_download` signals exclusively indicate `executive_brief` consumption; they indicate download of either converge content type. Document 7 owns the attribution methodology for isolating content type contribution to this signal.

The consent treatment of privately distributed converge content differs from web-served diverge content. Once a document leaves the program's distribution surface and enters the Champion's private distribution channels, the program's consent management architecture — specified in Document 9 (Privacy and Consent Architecture) — does not govern its receipt by the downstream reader. The recipient's `visitor_consent_state` in AEP controls what the program serves to that visitor on kalder.com; it does not determine whether they may receive a document their colleague forwarded. This boundary does not mean private distribution is legally unconstrained: the contact data and behavioral signals used to generate the converge content were collected and processed under the consent framework documented in Document 9, and that framework governs the generation inputs even when it does not govern the distribution endpoint.

---

### 6.6 What Converge Content Is Not

**Not a personalized web experience.** `consensus_brief` and `executive_brief` are documents distributed by a person, not pages served by a system. They do not appear in Adobe Target activity configurations. They do not have a `fallback_level` assignment. They are not part of the personalization machinery that assembles experiences from content graph nodes at render time.

**Not a role-specific asset served based on the recipient's classification.** The recipient's AEP profile does not determine which `consensus_brief` they receive. The Champion selects and distributes the appropriate brief. The program generates the brief from approved diverge content for the relevant roles, not from the downstream recipient's behavioral classification.

**Not a substitute for diverge-phase content.** A `consensus_brief` synthesizes from diverge content. A buying group that has not completed diverge-phase engagement has no shared experiential basis for the brief to represent. Distributing a `consensus_brief` to a group that hasn't consumed the underlying diverge content produces a document that arrives without shared context — not a coordination tool, but a cold introduction that the group hasn't been prepared for.

**Not independently commissionable.** The generation sequence is architecturally enforced: diverge content approved → converge content generated. This sequence cannot be reversed. Kalder Compose does not accept a converge content generation request that is not preceded by the prerequisite diverge coverage; the system checks all three prerequisites before initiating generation. Commissioning a `consensus_brief` before the Required-role diverge modules are approved is a configuration error, not a workflow shortcut.

---

*End of Section 6. Section 8 (Kalder Compose Integration) specifies the generate → review → approve → distribute workflow, including the interface through which Champions access approved converge content. Document 6 (Buying Group Journey and Convergence Model) specifies convergence point definitions, trigger conditions, and seller actions. Document 7 (Measurement and Experimentation Framework) specifies the attribution model for converge content effectiveness. Document 9 (Privacy and Consent Architecture) specifies the consent framework governing the data used to generate converge content.*

---

## Section 7: Coverage Completeness Architecture

> **Depends on:** Document 4 Sections 1–5, Document 1 (fallback cascade), `kalder_data_model_s0_s1.py` §H AR-02, §4 CR-08

---

### 7.1 The Two-Constraint Model: Coverage and Confidence

A HIGH-confidence role classification is a necessary but not sufficient condition for a Level 1 personalization experience. Content availability is the second, independent constraint. Both must be satisfied simultaneously: the visitor must have a sufficiently high role confidence score, and the content graph must contain approved `Content Module` nodes for the relevant `(solution_category, role, buying_stage)` combination. When the first constraint is satisfied but the second is not, the personalization system does not serve an unmatched Level 1 experience — it routes the visitor to the highest fallback level for which both constraints are met. Section 7 specifies what "approved content inventory exists" means operationally for each fallback level.

Until those conditions are met, the `pending_solution_fallback` behavior activates for the relevant solution category, applying a MEDIUM confidence ceiling regardless of the visitor's actual behavioral score and routing them to Level 3 or below.

At v1 launch, Customer Engagement is the only solution category with approved coverage sufficient to activate Level 1 and Level 2 personalization for all five roles and all four buying stages. IT & Operations carries `partial` coverage status and activates at Level 3. Employee Experience, Risk & Compliance, and AI Platform carry `pending` coverage status and activate `pending_solution_fallback`, routing visitors to Level 4 or below. The thresholds specified in Section 7.3 define the production roadmap for advancing those categories toward Level 2 and Level 1 capability.

---

### 7.2 Coverage Status Progression

The four `COVERAGE_STATUS_HIERARCHY` states — `pending`, `constructed`, `partial`, `complete` — each correspond to a specific content graph condition and a specific maximum fallback level.

**`pending`.** The solution category has been defined in `§1d SOLUTION_CATEGORIES`. One or more `Narrative` nodes may exist for the category, but no approved `Content Module` nodes with `status: approved` and `phase: diverge` exist for any `(role, buying_stage)` combination in this category. The `pending_solution_fallback` behavior is active: any visitor whose active solution context maps to this category receives a MEDIUM confidence ceiling regardless of their behavioral signal strength, and experience depth defaults to Level 4 (account-level) or Level 5 (default brand) depending on TAL identification state. `solution_category_coverage_status` for this category reads `pending` in `CLIENT_ATTRIBUTE_MAP`.

**`constructed`.** At least one approved `Content Module` node exists for the solution category, but the quantity and scope of approved nodes is insufficient to satisfy the Level 3 activation threshold. The category has content in the graph but cannot yet serve a coherent solution-interest experience — the minimum module types required for Level 3 are not all present in approved state. Visitors receive Level 4 or below. `pending_solution_fallback` remains active because the content floor for a meaningful solution-category experience has not been reached. The `constructed` state reflects progress toward coverage without yet delivering a deployable experience.

**`partial`.** The solution category meets the Level 3 activation threshold: solution-category-level `Content Module` nodes for all required Level 3 module types are present in approved state. The category can serve a coherent solution-interest experience to LOW-confidence or UNKNOWN-confidence visitors who have demonstrated solution-category interest. `pending_solution_fallback` deactivates at `partial` status — the category has enough content to be meaningful. Role-specific or role-influenced depth (Level 2 and Level 1) is not yet available; any visitor with MEDIUM or HIGH role confidence in this category still routes to Level 3 because role-variant nodes do not exist.

`partial` is not a deficient state. Level 3 solution-interest personalization is a substantively different experience from the default brand, and a `partial` solution category is delivering meaningful value. The production priority is to advance `partial` categories to Level 2 capability, not to treat `partial` as a failure condition.

**`complete`.** The solution category meets the Level 1 activation threshold for all five roles and all four buying stages. All required module types have approved role-specific `Content Module` nodes across the full `(role, buying_stage)` matrix, including `jtbd_ref`-required variants for buying-job-axis module types. Three-axis personalization is available for module types whose `intended_axes` includes `buying_job`. Full personalization capability is active. `solution_category_coverage_status` reads `complete`.

The effective `coverage_status` for a solution category is the minimum rank across all its associated entities per the `COVERAGE_STATUS_HIERARCHY` inheritance rule (`§H AR-02`): `pending` = 0, `constructed` = 1, `partial` = 2, `complete` = 3. A category where node-level `coverage_status` values diverge from the category-level entry is surfaced by `validate_coverage_consistency()` at CI time. Coverage reporting must use the minimum-rank effective status, not any individual entity's status in isolation.

---

### 7.3 Minimum Content Inventory per Fallback Level

Coverage thresholds are evaluated against approved `Content Module` nodes — `status: approved`, `phase: diverge`. All node counts below refer to approved nodes only. The automated coverage tracking pipeline (Document 8 implementation dependency) recomputes `coverage_status` on each Sanity content graph state change; it is not maintained manually.

---

**Level 3 Activation Threshold — solution-interest personalization**

*Required `coverage_status`: `partial`*

Level 3 serves solution-category content with no role differentiation. The coverage threshold requires solution-category-level nodes, not role-specific nodes. Nodes meeting the Level 3 threshold are tagged with a generic `role` value or unset role, scoped to the solution category.

- **`hero` module**: 1 approved solution-category-level `Content Module` node. The Level 3 hero presents the solution category's general value proposition. No role specificity required; `buying_stage: any` is acceptable at this level.
- **`benefits` module**: 1 approved solution-category-level node. Role field unset or set to a neutral default.
- **`narrative` module**: 1 approved solution-category-level node, referencing an approved `Narrative` node for the solution category. The `Narrative` node's `solution_claim` and `message_pillar` anchor the Level 3 experience.
- **`cta` module**: 4 approved solution-category-level nodes — one per `buying_job` value (`problem_identification`, `solution_exploration`, `requirements_building`, `supplier_selection`). The `cta` module requires `buying_job` in its `intended_axes` per Section 5; Level 3 CTA nodes require `jtbd_ref` even at this level to avoid null-serve on the CTA slot.
- **`gated_assets` slot**: Minimum 3 approved `Asset` nodes with `gating: ungated` for the solution category, spanning at least 2 distinct `buying_job` values. Ungated assets only at Level 3 — gated assets require a minimum role confidence threshold that Level 3 visitors do not satisfy.
- **`problem_framing` module**: 1 approved solution-category-level node.
- **`jtbd_ref` requirement**: Required only for `cta` (4 nodes per buying_job). All other Level 3 modules do not require `jtbd_ref`; two-axis fallback applies.
- **Converge content prerequisite**: Not applicable at Level 3. Converge content prerequisites are specified in Section 6.

Total minimum node count for Level 3 activation: 8 `Content Module` nodes + 3 `Asset` nodes + 1 `Narrative` node. This is a commissioning-sprint-sized scope, not a multi-quarter build.

---

**Level 2 Activation Threshold — role-influenced personalization**

*Required `coverage_status`: above `partial`; the effective `coverage_status` must reach a state where role-influenced variants exist across the required scope. For clarity: a solution category advances past `partial` toward `complete` as role-variant nodes accumulate. Level 2 activates when the role-variant coverage conditions below are met, which corresponds to a `coverage_status` that is transitioning from `partial` toward `complete` at the role-level scope specified.*

Level 2 serves role-influenced content. Nodes meeting the Level 2 threshold carry role-specific values on the `role` field — they are authored for a specific role's general orientation, not just for the solution category.

**Required module types with role-specific nodes:**
- **`hero`**: 5 nodes — 1 per role (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`) — for at minimum 2 buying stages (`engaged` and `prioritized`, which map to the acquisition cohort where Level 2 is most common). Full 4-stage coverage is recommended but not required for initial Level 2 activation.
- **`benefits`**: 5 nodes — 1 per role — for the same minimum 2 buying stages.
- **`narrative`**: 5 nodes — 1 per role — for the same minimum 2 buying stages, each referencing an approved stage-matched `Narrative` node.
- **`cta`**: 5 roles × 4 buying_jobs = 20 nodes minimum (the `cta` module requires `buying_job` axis per Section 5 regardless of fallback level; role specificity is required at Level 2). Coverage for the 2 minimum buying stages means 20 nodes for `engaged` and `prioritized` combined = 40 nodes for full 2-stage coverage.
- **`problem_framing`**: 5 nodes — 1 per role — for the minimum 2 buying stages.
- **`trust_signals`**: 5 nodes — 1 per role — for the minimum 2 buying stages.

**Optional module types at Level 2** (recommended but not required for activation):
- **`proof`**: Role- and buying_job-matched `Proof` nodes enrich the experience; absence does not block Level 2 activation.
- **`use_cases`**: Role- and buying_job-matched use case nodes are valuable; absence does not block Level 2 activation.
- **`outcomes`**: Role- and stage-specific outcome nodes; absence does not block Level 2 activation.

**Buying stage scope**: Minimum coverage for `engaged` and `prioritized`. All four stages (`targeted`, `engaged`, `prioritized`, `qualified`) are required for full Level 2 capability but are not all required for initial Level 2 activation. Level 2 activates per `(role, buying_stage)` pair as each pair's required module set reaches approved status.

**`jtbd_ref` requirement**: Required for `cta` nodes (as at Level 3). Not required for other Level 2 module types. Three-axis personalization does not activate at Level 2 — it activates at Level 1, or at Level 2 only when buying job confidence is KNOWN (zero-party confirmed). Role-variant modules other than `cta` do not require `jtbd_ref` for Level 2 activation.

---

**Level 1 Activation Threshold — role-specific, HIGH confidence personalization**

*Required `coverage_status`: `complete`*

Level 1 serves fully role-specific content with three-axis capability for applicable module types. Level 1 activates per `(role, buying_stage)` pair — it is not a binary solution-category state. A solution category may be Level 1 capable for `(champion, engaged)` while still at Level 2 or Level 3 for `(ratifier, qualified)`. Coverage tracking and the `solution_category_coverage_status` attribute must report at `(solution_category, role, buying_stage)` tuple granularity, not at the solution category level alone. Document 8 (Operational Runbook) specifies the implementation of tuple-granularity coverage tracking.

**Required module types with role-specific nodes (per `(role, buying_stage)` pair):**
- **`hero`**: 1 approved role × stage-specific node.
- **`benefits`**: 1 approved role × stage-specific node.
- **`narrative`**: 1 approved role × stage-specific node, referencing the approved `Narrative` for that `(solution_category, buying_stage)`.
- **`cta`**: 4 nodes — 1 per `buying_job` value — for the role at this `buying_stage`. `jtbd_ref` required on all 4 nodes.
- **`gated_assets` slot**: Minimum 5 approved `Asset` nodes for this `(solution_category, role, buying_stage)` combination — at least 1 per `buying_job` value, spanning gating levels appropriate to the role's `confidence_tier_minimum` expectations.
- **`problem_framing`**: 1 approved role × stage-specific node.
- **`narrative` module** (the page slot, distinct from the `Narrative` node): 1 approved role × stage-specific node.
- **`proof`**: Minimum 2 approved `Proof` nodes with `jtbd_ref` for this role and `solution_category` — one each for at least 2 distinct `buying_job` values relevant to this role's likely evaluation stage.
- **`use_cases`**: Minimum 2 approved nodes with `jtbd_ref` for this role and `solution_category`.
- **`outcomes`**: 1 approved role × stage-specific node.
- **`trust_signals`**: 1 approved role × stage-specific node.

**`jtbd_ref` requirement at Level 1**: Required for `cta`, `gated_assets`, `proof`, and `use_cases` — all module types with `buying_job` in `intended_axes` per Section 5. Three-axis coverage means approved variants exist per `buying_job` value for these module types.

**`coverage_status` reaches `complete`** when all five roles × all four `buying_stage` values have met the Level 1 threshold — meaning 20 `(role, buying_stage)` pairs are each fully provisioned. Until that full 20-pair threshold is met, the solution category is in a transitional state between `partial` and `complete`, activating Level 1 for provisioned pairs and Level 2 or Level 3 for unprovisioned pairs within the same category.

**Granular Level 1 activation note.** Operational coverage reporting must track Level 1 capability at the `(solution_category, role, buying_stage)` tuple level. A coverage dashboard that reports `customer_engagement: complete` while `(customer_engagement, ratifier, targeted)` lacks two of its required module types is producing a false positive. The `validate_coverage_consistency()` function (`§H AR-02`) enforces minimum-rank inheritance at CI time; the coverage dashboard must surface tuple-level gaps as actionable items, not aggregate them into a single category-level indicator.

---

### 7.4 Coverage Gap Monitoring and Escalation

#### 7.4.1 What Is Tracked

The coverage tracking pipeline (Document 8 implementation dependency) monitors three metric dimensions, each at the appropriate granularity for operational decision-making:

- **`pending_solution_fallback` event count** per `solution_key` per 7-day rolling window. Sourced from the logging requirement in `§4 SCORING_RULES pending_solution_fallback`. This metric measures the rate at which the fallback is activating — a proxy for the number of visitors being underserved by missing content coverage. Tracked at `solution_category` granularity.

- **`coverage_status` per `(solution_category, role, buying_stage)` tuple.** Computed by `validate_coverage_consistency()` and the coverage tracking pipeline on each Sanity content graph state change — triggered when any node enters or exits `status: approved`. This is the tuple-level metric that the granular Level 1 activation model depends on. Exposed via the `solution_category_coverage_status` attribute in `CLIENT_ATTRIBUTE_MAP` (§CA), registered in Section 1.

- **Approved node count per module type per `(solution_category, role, buying_stage)`.** The input metric for coverage threshold evaluation. A tuple with `coverage_status: partial` but a specific module type missing from its approved inventory is a gap that the escalation alert payload must surface.

#### 7.4.2 Escalation Threshold and Calibration

The initial `pending_solution_fallback` escalation threshold is 50 events per 7 days per solution category, sourced from `§4 SCORING_RULES pending_solution_fallback escalation_threshold`. This value is a starting hypothesis set without baseline data. It must be calibrated against observed traffic volumes within 30 days of v1 launch.

**Calibration methodology:**
1. For the first 30 days post-v1 launch, capture `pending_solution_fallback` event volume per `solution_category` per day without triggering alerts — observation only.
2. At day 30, compute the 7-day rolling average event rate per `solution_category` from the observation period.
3. Set the per-category threshold at 2× the observed baseline 7-day average rate, with a minimum floor of 20 events per 7 days (below this floor, alerts are informational, not actionable — the volume is too low to prioritize a commissioning sprint).
4. For solution categories with zero observed events during the observation period (expected for `employee_experience`, `risk_compliance`, `ai_platform` at v1 launch given low inbound traffic), apply the floor of 20 events per 7 days until traffic data accumulates.
5. Review thresholds at 60 days post-launch and quarterly thereafter using the same 2× baseline formula applied to the most recent 30-day observation window.

This procedure produces calibrated thresholds without requiring data science resources: the calculation is a rolling average and a multiplier, executable by a marketing operations analyst.

#### 7.4.3 Escalation Response

When the threshold fires for a `solution_category`, an alert is sent to `slack_data_team_channel` (per `§4 SCORING_RULES`). The alert payload must include:
- `solution_category`: the category triggering the alert
- `current_coverage_status`: the current effective `coverage_status` for the category
- `fallback_event_count_7d`: the 7-day event count that triggered the threshold
- `gap_summary`: the specific `(role, buying_stage)` combinations and missing module types preventing advancement to the next coverage gate — not just that a gap exists, but what to produce

The content operations team receiving the alert is responsible for prioritizing coverage gap remediation in the next commissioning sprint. The `gap_summary` field must be specific enough to become a content brief: "Missing approved `hero` and `benefits` nodes for `(it_operations, champion, engaged)` and `(it_operations, economic_buyer, engaged)` — 4 nodes required for Level 2 activation at these pairs."

---

### 7.5 New Solution Category Activation Checklist

A new solution category advances through coverage levels in strict sequence. The following checklist is the gate specification that Document 8 (Operational Runbook) will reference when specifying the new solution category onboarding procedure.

---

**Gate 0 — Foundational prerequisites (before any content is commissioned)**

These nodes must exist before any `Content Module` authoring begins. They are the structural prerequisites that the content graph requires for authoring to be valid.

- `Narrative` nodes for all 4 `(solution_category, buying_stage)` pairs (targeted, engaged, prioritized, qualified): `status: approved`
- `Audience` nodes for all 5 roles: `status: approved`
- `JTBD` nodes for the solution category's active JTBD codes from `§17 JTBD_CODES`: minimum `coverage_status: constructed`
- `§19 TITLE_ROLE_MAP` entry for the solution category: minimum `coverage_status: constructed`
- `§1d SOLUTION_CATEGORIES` entry for the solution category: `coverage_status` field set (may be `pending` at this gate)

Gate 0 is complete when all four `Narrative` nodes and all five `Audience` nodes are in `status: approved`. `Content Module` commissioning cannot begin until Gate 0 is complete — the `narrative_ref` requirement on diverge modules requires approved `Narrative` parents.

---

**Gate 1 — Level 3 activation (solution-interest experience)**

Commission and approve the Level 3 minimum content inventory per Section 7.3:

- 1 `hero` node (solution-category-level, no role specificity)
- 1 `benefits` node (solution-category-level)
- 1 `narrative` module node (solution-category-level, referencing an approved `Narrative` node)
- 4 `cta` nodes — 1 per `buying_job` value, with `jtbd_ref`
- 1 `problem_framing` node (solution-category-level)
- 3 ungated `Asset` nodes spanning ≥ 2 `buying_job` values

Total: 8 `Content Module` nodes + 3 `Asset` nodes = 11 nodes.

`coverage_status` transitions from `pending` → `partial` at this gate. `pending_solution_fallback` deactivates. Visitors with solution interest in this category now receive a Level 3 experience.

---

**Gate 2 — Level 2 activation (role-influenced experience)**

Commission and approve the Level 2 minimum content inventory per Section 7.3, beginning with the two highest-traffic buying stages (`engaged` and `prioritized`):

- 5 `hero` nodes (1 per role) × 2 buying stages = 10 nodes
- 5 `benefits` nodes × 2 buying stages = 10 nodes
- 5 `narrative` module nodes × 2 buying stages = 10 nodes
- 5 roles × 4 `buying_job` values × 2 buying stages = 40 `cta` nodes
- 5 `problem_framing` nodes × 2 buying stages = 10 nodes
- 5 `trust_signals` nodes × 2 buying stages = 10 nodes

Total for minimum 2-stage Level 2 activation: 90 `Content Module` nodes (excluding `proof`, `use_cases`, `outcomes` which are optional at Level 2).

Level 2 activates per `(role, buying_stage)` pair as each pair's required module set reaches approved status. `coverage_status` progresses toward `complete` as pairs are provisioned.

---

**Gate 3 — Level 1 activation (role-specific experience, per `(role, buying_stage)` pair)**

Commission and approve the Level 1 minimum content inventory per Section 7.3 for each `(role, buying_stage)` pair. Level 1 activates per pair, not as a binary category event.

For each pair, the minimum required node set per Section 7.3 includes all required module types with `jtbd_ref` on buying-job-axis modules (`cta`, `gated_assets`, `proof`, `use_cases`).

Full `coverage_status: complete` requires all 20 `(role, buying_stage)` pairs to meet the Level 1 threshold. Coverage tracking reports at tuple granularity so that partial Level 1 capability is visible per pair. Commission pairs in priority order: `(champion, engaged)`, `(champion, prioritized)`, `(economic_buyer, engaged)`, `(economic_buyer, prioritized)` first — these four pairs serve the highest-traffic, highest-intent visitor segments and produce the largest immediate impact per node produced.

---

### 7.6 v1 Launch Coverage State and Immediate Roadmap

| Solution Category | v1 Coverage Status | Current Level Capability | Next Gate | Priority |
|---|---|---|---|---|
| `customer_engagement` | `complete` | Level 1 (all 5 roles, all 4 buying stages) | Maintenance: monitor for coverage drift via `validate_coverage_consistency()` quarterly; commission converge content (`consensus_brief`, `executive_brief`) for remaining convergence points | — |
| `it_operations` | `partial` | Level 3 (solution-category experience) | Gate 2: produce approved `hero`, `benefits`, `narrative`, `cta`, `problem_framing`, `trust_signals` role-variant nodes for `champion` and `economic_buyer` at `engaged` and `prioritized` stages (24 `Content Module` nodes minimum for these two roles × two stages) | High |
| `employee_experience` | `pending` | Level 4 (account-level) | Gate 0 → Gate 1: produce 4 `Narrative` nodes, 5 `Audience` nodes (Gate 0), then produce 8 solution-category-level `Content Module` nodes + 3 ungated `Asset` nodes (Gate 1) | High |
| `risk_compliance` | `pending` | Level 4 (account-level) | Gate 0 → Gate 1: produce 4 `Narrative` nodes, 5 `Audience` nodes (Gate 0), then produce 8 solution-category-level `Content Module` nodes + 3 ungated `Asset` nodes; Ratifier-affinity `Asset` nodes (security/compliance content types) should be prioritized within the Gate 1 asset selection | Medium |
| `ai_platform` | `pending` | Level 4 (account-level) | Gate 0 → Gate 1: produce 4 `Narrative` nodes, 5 `Audience` nodes (Gate 0), then produce 8 solution-category-level `Content Module` nodes + 3 ungated `Asset` nodes; Champion-affinity (technical) content types should be prioritized within Gate 1 | Medium |

**Priority rationale.** `it_operations` is High because it already has `partial` status — Gate 2 requires producing role-variant modules against existing solution-category infrastructure, which is a lower-effort incremental step than Gate 0 → Gate 1 for pending categories. `employee_experience` is High because it is likely the second-highest-traffic solution category after Customer Engagement in Kalder's TAL, meaning the visitor underserving cost of `pending_solution_fallback` is high. `risk_compliance` and `ai_platform` are Medium because their inbound traffic volume at v1 launch is lower, but the Ratifier-specific content gap in `risk_compliance` carries deal-risk implications that justify sequencing it ahead of a pure traffic-volume ranking would suggest.

---

*End of Section 7. Document 8 (Operational Runbook) specifies the coverage tracking pipeline implementation — including the Sanity webhook that triggers `coverage_status` recomputation, the format of gap summaries in escalation payloads, and the Champion content delivery surface referenced in Section 6. Document 5 (Personalization Decisioning Rules) specifies how Adobe Target implements the coverage-gated fallback level routing for each module type.*

---

## Section 8: Kalder Compose Integration

> **Depends on:** Document 4 Sections 1–7, `kalder_data_model_s0_s1.py` §H AR-02, §4 CR-08, `kalder_martech_reference_architecture.md`

---

### 8.1 Workflow Overview

The Kalder Compose integration workflow governs how content enters the Sanity content graph. It begins with the identification of a coverage gap — a missing `(solution_category, role, buying_stage)` combination required by the Section 7 thresholds — proceeds through AI-assisted generation, human review, Sanity publication, and Adobe Target offer synchronization, and concludes with an updated content graph state that the personalization program serves from. A node that has not completed the full workflow cannot be served. A node that completes the workflow enters the content graph as a permanent, versioned record; it does not expire or rotate automatically.

The workflow has four phases: **Generate** (Kalder Compose produces a draft node from a structured generation context), **Review** (human reviewers apply named quality gates), **Approve** (Sanity validation functions enforce schema and cross-document integrity), and **Publish/Sync** (the approved node is written to the Adobe Target offer catalog and coverage status is recomputed).

Scope: this workflow governs diverge-phase `Content Module` nodes, `Narrative` nodes, `Audience` nodes, `JTBD` nodes, `Proof` nodes, `Asset` nodes, and `Experience` nodes. `Channel` nodes are configured once at program setup and are not subject to routine commissioning. Converge-phase nodes (`consensus_brief` and `executive_brief`) follow a variant of the workflow specified separately in Section 8.4.

---

### 8.2 Pre-Commissioning: Node Type Prerequisites

Before Kalder Compose can be invoked for `Content Module` generation for a given `(solution_category, buying_stage, role)` combination, the following prerequisite checks must pass in order. Each check gates the next; the first failed check routes the workflow to the appropriate foundational node commissioning path.

**Gate 0 delay implication (D8-Flag-11 resolution):** Gate 0 prerequisites — authoring and approving the four `Narrative` nodes and five `Audience` nodes for a new solution category — require approximately two to three weeks before `Content Module` commissioning can begin. Kalder Compose generation for `Content Module` nodes cannot begin in parallel with `Narrative` node authoring. New solution category onboarding plans must account for this gate delay at the start of the commissioning sequence.

1. **`Narrative` node prerequisite.** An approved `Narrative` node must exist for the `(solution_category, buying_stage)` pair targeted by the `Content Module` being commissioned. If not, the workflow routes to `Narrative` node commissioning first (Section 8.3.1). `Content Module` commissioning for this pair is blocked until the `Narrative` node enters `status: approved`.

2. **`Audience` node prerequisite.** An approved `Audience` node must exist for the `(solution_category, role)` pair. If not, the workflow routes to `Audience` node commissioning. `Audience` node authoring is human-authored and typically completes in one to two days per solution category.

3. **`JTBD` node prerequisite.** For `Content Module` nodes of module types where `jtbd_ref` is required per Section 5, an approved `JTBD` node must exist for the target `jtbd_code` and `solution_category`. If not, `JTBD` node commissioning is required before `Content Module` generation.

4. **`supporting_claims` seeding prerequisite.** The governing `Narrative` node's `supporting_claims` array must contain at least 5 entries before `Content Module` commissioning proceeds. If the array has fewer than 5 entries, the workflow invokes Kalder Compose in `supporting_claims` seeding mode: Compose generates a candidate pool of 8–12 role-differentiated supporting claims derived from the `Narrative` node's `solution_claim` and `message_pillar`. The content strategist reviews the pool, curates it to a minimum of 5 entries, and updates the `Narrative` node's `supporting_claims` array before `Content Module` generation begins.

---

### 8.3 Per-Node-Type Commissioning Workflows

#### 8.3.1 `Narrative` Node Commissioning (human-authored)

`Narrative` nodes are authored by the content strategist, not generated by Kalder Compose. The `solution_claim` and `message_pillar` are human-authored strategic decisions; delegating them to Compose without human authorship would undermine the through-line's credibility as a factually grounded claim.

**Required fields at authoring time** (must be populated before `status: draft` can be saved): `solution_category`, `buying_stage`, `solution_claim`, `message_pillar`, `label`. A `Narrative` node cannot be saved in draft state without all five fields populated.

**`supporting_claims` seeding step.** After `status: draft` is saved, the content strategist may invoke Kalder Compose to generate supporting claim candidates (Section 8.2, prerequisite 4). Compose-generated candidates require content strategist curation before the `supporting_claims` array is considered populated.

**Review step.** The content strategy lead applies a two-criteria review: (a) is the `solution_claim` factually grounded and substantiatable — could a `Proof` node be linked to support it? (b) is the `message_pillar` directionally coherent with the `solution_claim` — does it orient content authors toward the same emphasis the claim establishes? The through-line review logic from Section 4.4 applies: the `solution_claim` must not be a product feature claim, and the `message_pillar` must not introduce an emphasis that would produce buyer-facing asymmetry if selectively applied by a role-specific module.

**Approval step.** The content strategy lead sets `status: approved`. No Sanity cross-document validation fires on `Narrative` node approval; the `Narrative` is the reference document, not the referencing document.

**Versioning rule (Section 1 Revision 3).** Only one `Narrative` node per `(solution_category, buying_stage)` pair may be in `status: approved` at any time. When a `solution_claim` or `message_pillar` amendment is required, the content strategist creates a new `Narrative` draft for the amended through-line and advances it through review. The current `approved` version remains active until all dependent `Content Module` nodes have been re-approved against the new version. Retiring the current `approved` version before dependent modules are re-approved will block the dependent modules' own `approved` status — the cross-document validation function (Section 8.6, Function 1) will fail for any module whose `narrative_ref` points to a retired or `under_review` `Narrative`.

---

#### 8.3.2 `Content Module` Node Commissioning (Kalder Compose-generated)

**Long-form vs. short-form module track (D8-Flag-10 resolution).** Not all module types require the full R1–R4 review sequence. `cta` and `problem_framing` module types are classified as **short-form modules**: their `content_body` consists of a limited number of discrete elements (headline, subheadline, CTA label, or a brief role-framing statement). Reviewers applying the short-form track skip Stage R1 (factual accuracy review does not apply to a three-word CTA label) and apply a combined R2/R4 check: does the CTA or problem framing text introduce any claim beyond the `Narrative` node's `solution_claim` and `message_pillar`, and is the language consistent with brand voice? All other module types follow the full long-form track (R1 → R2 → R3 → R4). The review queue must surface the module type so the reviewer can identify which track applies before beginning review.

**Phase 1 — Generate**

Kalder Compose is invoked with a structured generation context containing: `module_type`, `role`, `solution_category`, `buying_stage`, `jtbd_code` (if applicable per Section 5 `intended_axes`), and the governing `Narrative` node's `solution_claim`, `message_pillar`, and `supporting_claims` array. The `supporting_claims` array is the permitted secondary claim pool; Compose is instructed to draw from it and not introduce claims outside it.

Compose outputs a draft `content_body` and populates the following fields in the Sanity draft record: `module_type`, `role`, `solution_category`, `buying_stage`, `phase`, `narrative_ref` (set to the governing `Narrative` node's document ID), `jtbd_ref` (if applicable), `label`, `content_body`.

Fields that Compose does not populate at generation time — these are human-reviewer responsibility during Phase 2: `confidence_tier_minimum`, `proof_refs`, `asset_refs`. These require judgment that Compose cannot reliably apply.

Node enters `status: draft` on creation.

**Phase 2 — Review**

The review queue surfaces the node's `module_type` so reviewers can identify long-form vs. short-form track before beginning. Review stages are applied as a named, ordered sequence. Each stage is a discrete checklist item with a binary outcome (pass / return to draft).

**Stage R1 — Factual accuracy review** *(long-form track only)*
Does the `content_body` contain any claim that cannot be substantiated by the referenced `Narrative` node's `solution_claim`, `message_pillar`, `supporting_claims`, or a linked `Proof` node? Claims of the form "reduces time-to-deployment by X%" or "achieves Y metric within Z months" must trace to a specific `Proof` node or a `supporting_claims` entry. Unsubstantiated quantitative claims return the node to `status: draft` for revision. The reviewer flags the specific claim and the required substantiation source.

**Stage R2 — Through-line review** *(named step from Section 4, both tracks)*
Two checklist items:

*(a) Claim inventory check.* Does the `content_body` introduce any claim not derivable from the referenced `Narrative` node's `solution_claim`, `message_pillar`, or `supporting_claims` array? If yes: the unapproved claim must either be removed from `content_body`, or escalated to the content strategist as a candidate for addition to the `Narrative` node's `supporting_claims` array. The node returns to `status: draft` in either case until the claim is resolved.

*(b) One-sentence compatibility test.* If a Champion and an Economic Buyer each read their respective `Content Module` nodes for the same `(solution_category, buying_stage)` pair and described Kalder's core capability to a third party in one sentence, would their sentences be compatible? The reviewer must be able to write two such sentences — one for the module under review and one for the corresponding role-opposite module — and confirm compatibility. If the sentences are not compatible, framing has drifted beyond the permitted range and the module returns to `status: draft` for reframing.

**Supporting claims empty-array condition (named workflow branch).** If the referenced `Narrative` node's `supporting_claims` array is empty — a named condition in early program operation — the reviewer applies the "without extension" constraint: the `content_body` may include supporting claims that directly instantiate the `solution_claim` or `message_pillar` in more specific or role-contextualized language, but may not introduce capability dimensions not present in `solution_claim` or `message_pillar`. Any secondary claim introducing a new capability dimension is impermissible until the `supporting_claims` array is populated. The reviewer flags the `Narrative` node for `supporting_claims` expansion and notes this condition in the review record before advancing the module to `under_review`. This branch is named: **"Narrative supporting_claims empty — content_body restricted to solution_claim/message_pillar instantiation; Narrative flagged for expansion."**

**Stage R3 — Tagging completeness review** *(both tracks)*
The reviewer populates `confidence_tier_minimum` per the three-tier decision rule from Section 3.3 — this is a human reviewer assignment, not a Compose-generated field. The reviewer also confirms `phase` is correctly set: `diverge` for modules intended for Adobe Target serving; `converge` for modules intended for Champion distribution. For all other required tag fields per Section 3 (`role`, `solution_category`, `buying_stage`, `jtbd_code` if applicable), the reviewer confirms that Compose-populated values are correct and complete.

**Stage R4 — Brand voice review** *(both tracks, abbreviated for short-form)*
Standard editorial quality check: grammar, tone, brand vocabulary. This stage does not overlap with or substitute for R1 or R2. A module may fail R4 after passing R1 and R2. Conversely, passing R4 does not imply R1 or R2 have been applied.

Node enters `status: under_review` when review stages are in progress. Node returns to `status: draft` on any review stage failure; the failure reason is recorded in the review log.

**Phase 3 — Approve**

All review stages applicable to the module's track (long-form: R1–R4; short-form: combined R2/R4 and R3) must pass before approval can proceed.

The Sanity approval transition triggers two cross-document GROQ validation functions (D8-Flags-01 and -03):

- **Function 1** *(D8-Flag-01)*: Queries the referenced `Narrative` document's `status` field. If not `approved`, blocks the transition.
- **Function 2** *(D8-Flag-03)*: If `jtbd_ref` is present, queries the referenced `JTBD` document's `solution_category` field. If it does not match the `Content Module`'s `solution_category`, blocks the transition.
- **Function 3** (Section 3.5 scoping check): Queries the referenced `Narrative` document's `solution_category` and `buying_stage` fields. If either does not match the `Content Module`'s corresponding fields, blocks the transition.

All three functions are implemented as custom Sanity validation rules (GROQ cross-document queries) and must be tested as a set under realistic load per Section 8.6 (D8-Flag-05 performance validation).

Node enters `status: approved` on passing all validation checks.

**Phase 4 — Publish/Sync**

An event is emitted on `status: approved` transition. The synchronization pipeline (Document 8 Operational Runbook implementation dependency) processes this event and writes the following fields from the approved node to the Adobe Target offer catalog: `module_type`, `role`, `solution_category`, `buying_stage`, `phase`, `confidence_tier_minimum`, `jtbd_code` (derived from the referenced `JTBD` node's `jtbd_code` string field if `jtbd_ref` is present), `fallback_level` (derived from `confidence_tier_minimum` per the Section 3.3 tier-to-level mapping: `HIGH` → Level 1, `MEDIUM` → Levels 1–2, `LOW` → Levels 1–3, `UNKNOWN` → all levels).

**`phase: converge` exclusion check (D8-Flag-04 resolution).** Before writing any node to the Target offer catalog, the pipeline evaluates the node's `phase` field. If `phase: converge`, the node is excluded from the offer write and a log entry is created: `"Node [id] excluded from Target offer catalog: phase: converge."` This check is synchronous and executes before any offer write, regardless of how the node's `Experience` node relationships are configured. A `phase: converge` node will never appear in the Adobe Target offer catalog under any configuration state.

Coverage status recomputation is triggered on the same `status: approved` event (Section 8.5).

---

#### 8.3.3 `Proof` Node Commissioning (Compose-assisted or human-authored)

`Proof` nodes with `proof_type: quantitative_outcome` or `proof_type: peer_case` may be authored by Kalder Compose with human curation: Compose generates a draft `claim` from the `Narrative` node's `solution_claim` and available evidence, and the content strategist verifies factual accuracy and source attribution. `Proof` nodes with `proof_type: customer_reference` or `proof_type: analyst_validation` are authored directly by the content strategist, not by Compose.

**Legal review condition (Section 1 Revision 6 — named workflow condition).** `Proof` nodes with `proof_type: customer_reference` require legal review before entering `status: approved`. This condition activates a named workflow branch: **"Proof node in legal review — Content Module approved without proof reference; proof reference added when legal review completes; Content Module re-enters under_review only to add the reference."**

Workflow steps for this branch:
1. The `Proof` node enters `status: under_review` pending legal review.
2. Any `Content Module` that would reference this `Proof` node proceeds to `status: approved` with `proof_ref` omitted — the module is published without this specific proof point.
3. When legal review completes and the `Proof` node enters `status: approved`, the content operations team updates the relevant `Content Module` nodes to add the `proof_ref`. Each updated module re-enters `status: under_review` for targeted review (R3 only — confirm the `proof_ref` field is correctly populated; no re-application of R1, R2, or R4 is required unless the `content_body` itself was changed).
4. The `Content Module` is re-approved, triggering a new Publish/Sync event that updates the Target offer catalog entry with the proof reference in the node's metadata.

---

#### 8.3.4 `Asset` Node Commissioning (human-authored)

`Asset` nodes are authored by the content operations team, not by Kalder Compose. The following fields must be populated at authoring time before `status: draft` can be saved:

- `maps_to_signals`: required at authoring time; must reference valid keys from `§7 CROSS_ROLE_WEIGHTS`. An `Asset` node with an empty or invalid `maps_to_signals` field will not contribute to signal scoring when visitors engage with it.
- `confidence_tier_minimum`: set per the Section 3.3 tagging standard at authoring time.
- `content_format`: set to the correct value for Segment instrumentation — this determines which engagement event types fire and must accurately reflect how the asset is delivered.
- `gating`: set to the correct gating level; ungated assets with `confidence_tier_minimum: MEDIUM` or higher are a configuration inconsistency (ungated assets are available at all confidence levels, making a MEDIUM minimum non-operative).

**Embedded epdf viewer tracking clarification (D8-Flag-06 resolution).** Embedded epdf viewer dwell-time tracking is a planned future capability and is **not available at v1 launch**. At v1 launch, `content_format: epdf` assets capture signal via the Segment file download event only. Asset nodes with `content_format: epdf` must reference download-event-based signal keys in `maps_to_signals` — for example, `case_study_download`, `executive_brief_download`, or the appropriate download-firing key for the content type. If the embedded viewer dwell-time signal definition is introduced in a future sprint, it will require: (a) a new `CROSS_ROLE_WEIGHTS` entry, (b) a corresponding Segment custom event specification, and (c) a retroactive update to `maps_to_signals` on all affected `Asset` nodes before the new signal can score. Asset nodes using `maps_to_signals` values that do not yet exist in `CROSS_ROLE_WEIGHTS` are a schema error; they will pass Sanity validation but produce no signal events at runtime.

---

### 8.4 Converge Content Commissioning Workflow

The converge content commissioning workflow — for `consensus_brief` and `executive_brief` `Content Module` nodes — differs from the diverge workflow in three ways: additional pre-generation prerequisite checks, multi-source generation context, and a Champion delivery surface rather than Adobe Target publication.

**Pre-generation prerequisite check (automated).** Before invoking Kalder Compose for a converge `Content Module`, the workflow checks all three prerequisites from Section 6.3:

1. Approved diverge `Content Module` nodes exist for all Required-role participants at the target convergence point, per the Section 6.3 convergence point table.
2. The `Narrative` node for the `(solution_category, buying_stage)` pair is in `status: approved`.
3. For `executive_brief` specifically: approved diverge `Content Module` nodes exist for `economic_buyer` and `ratifier` roles in addition to the convergence point required roles.

If any prerequisite is not met, generation is blocked and the workflow routes to diverge content commissioning for the missing roles. The block reason is surfaced: "BLOCKED: Missing approved diverge modules for [role] at [convergence_point]. Commission diverge modules before generating converge content."

**Recommended source module types (D8-Flag-08 resolution).** The minimum prerequisite from Section 6.3 (one approved diverge module per Required role) is the generation gate. The quality standard — the recommended input set for coherent synthesis — is higher: for each Required-role participant, the recommended generation input set is the `narrative` module node plus at minimum one `proof` or `gated_assets` module node for that role. A `consensus_brief` generated only from `hero` module nodes will present the solution claim without evidentiary support, producing a brief that reads as assertion rather than synthesis. The workflow should prompt the commissioning operator to confirm whether the recommended input set is available before proceeding with the minimum set.

**`progressive_disclosure` commissioning block (D8-Flag-07 resolution).** `progressive_disclosure` module type `Content Module` nodes are **not commissionable at v1 launch**. The block condition: the progressive disclosure UX specification — prompt copy, placement logic, and value exchange design — is owned by Document 6 (Buying Group Journey and Convergence Model) and must be in `status: approved` before `progressive_disclosure` commissioning can begin. The workflow surfaces this named block when a `progressive_disclosure` module type is selected in the commissioning interface: **"BLOCKED: progressive_disclosure commissioning requires Document 6 progressive disclosure UX specification to be approved. Check Document 6 status before proceeding."** Commissioning for this module type unlocks when the relevant Document 6 specification enters approved status.

**Champion delivery surface.** When a converge `Content Module` node enters `status: approved` in Sanity, it is made available to Champions via the Kalder Compose delivery interface — a designated surface within the Kalder Compose application. The interface surfaces approved converge content for the Champion's active accounts and solution categories, derived from their AEP classification profile. The following behaviors are specified:

- Only nodes in `status: approved` and `phase: converge` appear in the delivery interface.
- The interface filters by the Champion's active `solution_category` context.
- Champions access the delivery interface directly; the program does not push content to Champions.
- `phase: converge` nodes are excluded from the Adobe Target offer catalog per Phase 4 of Section 8.3.2 (D8-Flag-04).

The design and UX specification of the Kalder Compose delivery interface is a Layer 2 product specification outside this section's scope.

---

### 8.5 Coverage Tracking Pipeline

**Trigger mechanism (D8-Flag-02 resolution).** The coverage tracking pipeline is triggered by a Sanity webhook that fires on any `Content Module` node `status` field transition to or from `approved`. Event-triggered computation is preferred over scheduled batch computation: coverage status reflects the content graph state within minutes of a node being approved or returned to `under_review`, ensuring the `solution_category_coverage_status` AEP attribute and the escalation threshold evaluation are current.

**Computation sequence.** On each trigger event:

1. Identify the `(solution_category, role, buying_stage)` tuple of the transitioning node.
2. Query Sanity for the current `status: approved` node count per module type for that tuple — querying `phase: diverge` nodes only.
3. Evaluate the tuple against the Section 7.3 thresholds: does the approved node inventory satisfy the Level 1, Level 2, or Level 3 activation conditions for this tuple?
4. Write the computed `coverage_status` back to the tuple's coverage tracking record in Sanity.
5. Roll up to the solution-category-level effective `coverage_status` per the `COVERAGE_STATUS_HIERARCHY` minimum-rank rule: the solution category's effective status is the minimum rank across all `(role, buying_stage)` tuples required for the category.
6. Write the solution-category effective `coverage_status` to the `solution_category_coverage_status` AEP attribute in `CLIENT_ATTRIBUTE_MAP` (§CA).

**Tuple-level monitoring vs. `CLIENT_ATTRIBUTE_MAP` (D8-Flag-12 resolution).** The `solution_category_coverage_status` AEP attribute registered in Section 1 represents the effective solution-category-level rollup — a single value per solution category, surfaced to Adobe Target. This attribute is already registered; no new `CLIENT_ATTRIBUTE_MAP` entries are required. Tuple-level coverage status — per `(solution_category, role, buying_stage)` — is tracked in Sanity node `coverage_status` fields and surfaced via the operational dashboard by querying Sanity directly. Adobe Target does not require tuple-level coverage status as an AEP attribute: per-tuple coverage gating in Target is implemented via the offer catalog itself — a tuple without sufficient approved offers simply has no offers available for Target to serve, and the fallback cascade handles the absence. No additional AEP attribute registrations are needed.

**Level 3 ungated `Asset` threshold query (D8-Flag-09 resolution).** When evaluating the Level 3 threshold for a solution category, the pipeline queries `Asset` nodes filtered by: `solution_category` matching, `gating: ungated`, `status: approved`. From the result set, the pipeline counts distinct values of the `buying_job` field. The qualifying condition for Level 3 asset coverage is: result set count ≥ 3 AND distinct `buying_job` count ≥ 2. A solution category with three ungated assets all tagged `buying_job: supplier_selection` does not satisfy the Level 3 threshold, because the distinct `buying_job` count is 1, not 2. The distinct `buying_job` count is the operative metric; total asset count is a secondary check.

**Escalation alert payload.** When the 7-day `pending_solution_fallback` event count for a solution category exceeds the calibrated threshold (Section 7.4.2), the pipeline generates an alert to `slack_data_team_channel` with the following payload fields:

```
solution_category: [key]
current_coverage_status: [effective status value]
fallback_event_count_7d: [count]
gap_summary: [
  "(it_operations, champion, engaged): missing approved 'hero' (1 required, 0 present), 
   'benefits' (1 required, 0 present)",
  "(it_operations, economic_buyer, engaged): missing approved 'hero' (1 required, 0 present)",
  ...
]
```

The `gap_summary` field is populated from the tuple-level coverage evaluation in the computation sequence above. Each entry names the tuple, the missing module type, the required count, and the current approved count. This format is specific enough to become a content brief without additional investigation.

---

### 8.6 Sanity Validation Function Set

The following three cross-document GROQ validation functions are implemented as custom Sanity validation rules. All three fire at `status: approved` transition on the applicable node type and block publication on any mismatch. They must be tested as a set under realistic content graph load before production deployment.

---

**Function 1 — `narrative_ref` status check (D8-Flag-01 resolution)**

Trigger: `Content Module` node `status: approved` transition.
GROQ query target: `status` field on the document referenced by `narrative_ref`.
Failure condition: Referenced `Narrative` document `status` is not `"approved"`.
Error message: `"Referenced Narrative node [id] must be in approved status before this Content Module can be approved."`

---

**Function 2 — `jtbd_ref` solution_category consistency check (D8-Flag-03 resolution)**

Trigger: Any node `status: approved` transition where `jtbd_ref` is present.
GROQ query target: `solution_category` field on the document referenced by `jtbd_ref`.
Failure condition: Referenced `JTBD` document `solution_category` does not match the publishing node's `solution_category`.
Error message: `"Referenced JTBD node [id] belongs to solution_category [X]; this node's solution_category is [Y]. jtbd_ref must reference a JTBD node in the same solution_category."`

---

**Function 3 — `narrative_ref` (solution_category, buying_stage) scoping check (Section 3.5)**

Trigger: `Content Module` node `status: approved` transition.
GROQ query target: `solution_category` and `buying_stage` fields on the document referenced by `narrative_ref`.
Failure condition: Referenced `Narrative` document `solution_category` does not match the `Content Module`'s `solution_category`, or referenced `Narrative` document `buying_stage` does not match the `Content Module`'s `buying_stage`.
Error message: `"Referenced Narrative node [id] is scoped to (solution_category: [X], buying_stage: [Y]); this Content Module is scoped to (solution_category: [A], buying_stage: [B]). narrative_ref must point to a Narrative node with matching solution_category and buying_stage."`

---

**Performance validation requirement (D8-Flag-05 resolution).** These three functions must be tested as a set before production deployment. Cross-document GROQ validation in Sanity executes at publish time; concurrent publication of multiple nodes triggers multiple GROQ queries simultaneously. Performance regression in the validation function set will manifest as slow or failing publish operations — which blocks the entire Publish/Sync pipeline for the affected nodes.

Acceptance criterion: all three functions complete within 2 seconds per node under simulated concurrent publication of 10 nodes. Testing procedure: run a simulation of 10 simultaneous `status: approved` transitions on `Content Module` nodes with varied `narrative_ref` and `jtbd_ref` references, and measure end-to-end validation time per node. If any function exceeds 2 seconds per node at 10 concurrent publications, the GROQ query must be optimized (index hints, projection narrowing) before production deployment. The Sanity platform engineering team owns this test; the test results must be documented before the content graph is opened for production commissioning.

---

*End of Section 8, and end of Document 4: Content Model and Taxonomy. Document 5 (Personalization Decisioning Rules) specifies Adobe Target activity configuration. Document 8 (Operational Runbook) specifies the Sanity webhook implementation, the Sanity-to-Target synchronization pipeline implementation, the coverage tracking pipeline operational procedures, and the organizational roles that execute this workflow.*
