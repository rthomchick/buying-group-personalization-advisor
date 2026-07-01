"""
Kalder Personalization Hub: Shared Data Model
==============================================
Version: 0.2.0
Downstream document version declaration: All nine corpus documents must declare
'Data model version: 0.2.0' in their metadata headers per MODEL_STATUS migration_strategy.

Single source of truth for all core entities across nine personalization
strategy documents. Every document in the hub imports from this module.

Company: Kalder (kalder.com)
Program: Buying Group Personalization
Scope: kalder.com — Phase 1 activation of an omni-channel B2B buying group
       journey orchestration capability. Channel-agnostic by design.

Source Documents (Kalder v1.0 corpus — nine documents):
- Signal Definition v1.0, Segmentation Framework v1.0
- Content Tagging Framework v1.0, Fragment Architecture Framework v1.0
- Personalization Playbook v1.0, Measurement Plan v1.0
- BG Personalization Vision & Strategy v1.0
- Buying Group Role Architecture v1.0
- Buying Group Journey & Convergence Model v1.0

Analyst Frameworks:
- Forrester B2B Revenue Waterfall (opportunity-centric demand model)
- Gartner Buying Group Journey (non-linear, job-based, convergence-driven)
- Forrester JTBD by Buyer Role (Customer Engagement — source validated)

Entity Hierarchy:
  Platform Capability  — embedded in all products; not purchasable
  Solution Category    — defines buying group type (5 categories)
    Solution           — defines buying group opportunity (15 solutions,
                         child of exactly one category)
      Products         — purchasable units with unique features
                         (many-to-many: 45 products across 15 solutions)

Section Index:
  §M   MODEL_VERSION and MODEL_STATUS
  §1a  Platform capabilities
  §1b  Products registry (45 products)
  §1c  Solutions registry (15 solutions)
  §1d  Solution categories (5 categories)
  §2   Buying group roles
  §3   Buying group role confidence tiers
  §3a  Buying Job Confidence model (KNOWN / INFERRED / UNKNOWN states)
  §3b  Probable buying job priors (PROBABLE_JOB_PRIORS)
  §4   Fallback cascade
  §5   Buying group stages
  §6   Campaign cohorts
  §7   Cross-role signal weight matrix
  §7a  CONDITIONAL_WEIGHT_MODIFIERS
  §8   Signal recency and decay
  §9   Content type taxonomy
  §10  Module types
  §11  Metric hierarchy
  §12  Classification scoring rules
  §13  Data source authority hierarchy
  §14  Engagement score thresholds
  §15  Martech stack
  §16  Content graph node types
  §17  JTBD codes
  §18  Buying group convergence points
  §19  Title to role mapping
  §20  Website surface taxonomy
  §CA  CLIENT_ATTRIBUTE_MAP
  §SA  SALES_ACTIVATION_CONFIG
  §P   Privacy and Consent Architecture
  §H   Helper Functions

Coverage Status:
  COMPLETE    Customer Engagement: title map (source-validated), JTBD codes (source-validated), convergence points
  CONSTRUCTED IT & Operations, Employee Experience, Risk & Compliance, AI Platform:
              title maps (all 13 remaining solutions) and JTBD codes (101 codes) synthesised
              from role definitions, buying group type descriptions, and Gartner/Forrester frameworks.
              Use coverage_status field on each entry to distinguish source-validated vs. constructed.
"""

from __future__ import annotations


# =============================================================================
# §M  MODEL METADATA  (AR-09, AR-01)
# =============================================================================

MODEL_VERSION = {
    "version": "0.2.0",
    "semver_policy": {
        "patch": "Signal weight tuning, label changes, note updates",
        "minor": "New signals, new sections, non-breaking additions",
        "major": "Breaking changes: entity renames, schema restructuring, removing fields",
    },
    "last_updated": "2026-06-05",
    "changelog": [
        {
            "version": "0.2.0",
            "date": "2026-06-05",
            "changes": [
                "CR-01: Deprecated §2 typical_titles as classification input; §19 TITLE_ROLE_MAP is now sole authoritative lookup",
                "CR-02: Added validation_status sub-field per title entry in TITLE_ROLE_MAP (4-value enum)",
                "CR-03 + AR-03: Fixed firmographic bonus guard rail and scoring order bug",
                "CR-04: Added CONDITIONAL_WEIGHT_MODIFIERS section for Ratifier/InfoSec-Influencer disambiguation",
                "CR-04b: Added infosec_influencer_disambiguation_whitepaper entry to CONDITIONAL_WEIGHT_MODIFIERS for security_whitepaper_download co-occurrence case",
                "CR-05: Added anonymous_visitor_long_decay multiplier with identity-transition behavior",
                "CR-06: Added intended_axes, omitted_axes_rationale, and module_composition_rules to MODULE_TYPES",
                "CR-07: Added category_explainer as distinct content type; recascaded BUYING_JOB_INFERENCE_SIGNALS",
                "CR-08 + AR-08: Added pending_solution_fallback directive with escalation_threshold; refactored get_titles_for_role()",
                "CR-09: Added CLIENT_ATTRIBUTE_MAP configurable namespace for AEP/CRM attribute names",
                "CR-10: Revised T3-07 validation methodology to require randomized progressive disclosure",
                "CR-11: Added PRIVACY_CONSENT_ARCHITECTURE section (consent gating, signal classification, geographic rules, retention, deletion)",
                "CR-12: Added SALES_ACTIVATION_CONFIG as separate section (not embedded in convergence points)",
                "AR-01: Added MODEL_STATUS block defining module role and derivation chain",
                "AR-02: Added COVERAGE_STATUS_HIERARCHY with inheritance rules and validate_coverage_consistency() helper",
                "AR-04: Refactored PROBABLE_JOB_PRIORS from tuple keys to nested dict",
                "AR-05: Removed redundant signal_weights from CONTENT_TYPES; added maps_to_signals reference field",
                "AR-06: Added validate_signal_references() helper for referential integrity",
                "AR-07: Resolved CONFIDENCE_TIERS / ENGAGEMENT_THRESHOLDS numeric collision; renamed engagement keys",
                "AR-09: Added MODEL_VERSION dict with semver policy and changelog",
            ],
        },
        {
            "version": "0.1.0",
            "date": "2026-06-01",
            "changes": ["Initial model — S0/S1 scope"],
        },
    ],
}

MODEL_STATUS = {
    "role": "canonical_specification",
    "description": (
        "This module is the canonical specification from which all downstream artifacts "
        "are derived. It is NOT a runtime data layer — the application does not import "
        "this file directly. Downstream systems derive their schemas, API contracts, and "
        "CMS structures from this specification."
    ),
    "derivation_chain": {
        "direct_consumers": [
            "Document 1: Buying Group Role Architecture",
            "Document 2: Signal Definition and Confidence Model",
            "Document 3: Audience and Segmentation Architecture",
            "Document 4: Content Model and Taxonomy",
            "Document 5: Personalization Decisioning Rules",
            "Document 6: Buying Group Journey and Convergence Model",
            "Document 7: Measurement and Experimentation Framework",
            "Document 8: Operational Runbook",
            "Document 9: Privacy and Consent Architecture",
        ],
        "downstream_systems": {
            "aep": "Derives attribute schema from BUYING_JOB_CONFIDENCE and CLIENT_ATTRIBUTE_MAP",
            "ml_classifier": "Derives training signal definitions from CROSS_ROLE_WEIGHTS and TITLE_ROLE_MAP",
            "cms": "Derives content taxonomy from CONTENT_TYPES, MODULE_TYPES, CONTENT_GRAPH_NODE_TYPES",
            "crm": "Derives buying group stage and role fields from BG_STAGES and CONFIDENCE_TIERS",
            "ai_advisor": "Reads JTBD_CODES, TITLE_ROLE_MAP, and SOLUTIONS for advisory logic",
        },
    },
    "versioning_controls": "See MODEL_VERSION — semver policy applies; major version required for breaking changes",
    "migration_strategy": "Documented in CHANGELOG; downstream documents must declare data_model_version in their own metadata",
}


# =============================================================================
# §0  MODULE SCOPE
# =============================================================================

MODULE_SCOPE = {
    "current_activation": ["web"],
    "designed_for": ["web", "email", "paid_media", "sales_enablement", "events"],
    "orchestration_vision": (
        "AI-powered omni-channel B2B buying group journey orchestration. "
        "Web (kalder.com) is Phase 1 activation."
    ),
}


# =============================================================================
# §1a  PLATFORM CAPABILITIES
# Embedded in every Kalder product. Not purchasable separately.
# What makes Kalder AI-native across the board.
# =============================================================================

PLATFORM_CAPABILITIES = {

    "kalder_intelligence": {
        "label": "Kalder Intelligence",
        "tagline": "AI that works, not AI that waits",
        "description": (
            "The AI agent runtime embedded in every Kalder product. "
            "Model-agnostic — routes tasks to the best available model "
            "based on cost, latency, and quality. Agents execute autonomously "
            "within defined guardrails and escalate to humans for exceptions. "
            "Every action is observable, auditable, and explainable."
        ),
        "capabilities": [
            "agent_runtime",
            "model_agnostic_routing",
            "natural_language_interfaces",
            "autonomous_workflow_execution",
            "human_in_the_loop_escalation",
            "real_time_action_streaming",
        ],
        "competes_with": [
            "ServiceNow Now Assist / Otto",
            "Salesforce Einstein / Agentforce",
            "Microsoft Copilot",
            "Workday AI",
        ],
    },

    "kalder_fabric": {
        "label": "Kalder Fabric",
        "tagline": "Connect anything. Automate everything.",
        "description": (
            "The integration and connectivity layer embedded in every Kalder "
            "product. MCP-native by design. Pre-built connectors for 500+ "
            "enterprise systems. Event-driven architecture enables real-time "
            "data flow across the stack."
        ),
        "capabilities": [
            "mcp_native_connectivity",
            "pre_built_connectors_500_plus",
            "event_driven_integration",
            "api_management",
            "real_time_event_routing",
            "bidirectional_sync",
        ],
        "competes_with": [
            "ServiceNow IntegrationHub",
            "Salesforce MuleSoft",
            "Microsoft Azure Integration Services",
        ],
    },

    "kalder_data": {
        "label": "Kalder Data",
        "tagline": "One truth. Every team.",
        "description": (
            "The unified data model shared across all Kalder products. "
            "Accounts, contacts, cases, workflows, orders, assets, and risk "
            "records all live in a single schema — no silos, no reconciliation, "
            "no conflicting records between products."
        ),
        "capabilities": [
            "unified_entity_model",
            "real_time_data_sync",
            "cross_product_data_access",
            "master_data_management",
            "data_lineage_tracking",
            "privacy_by_design",
        ],
        "competes_with": [
            "Salesforce Customer 360",
            "Microsoft Dataverse",
            "ServiceNow Common Service Data Model",
        ],
    },

    "kalder_trust": {
        "label": "Kalder Trust",
        "tagline": "Governance by architecture, not afterthought.",
        "description": (
            "Compliance, governance, and audit controls embedded in every "
            "agent action and workflow execution. Every decision is logged, "
            "every action is bounded by policy, every AI output is explainable. "
            "SOC 2 Type II, ISO 27001, FedRAMP Moderate."
        ),
        "capabilities": [
            "immutable_audit_log",
            "policy_enforcement_engine",
            "explainability_layer",
            "role_based_access_control",
            "data_residency_controls",
            "compliance_certifications",
        ],
        "competes_with": [
            "Salesforce Einstein Trust Layer",
            "ServiceNow AI governance modules",
            "Microsoft Purview",
        ],
    },

    "kalder_build_platform": {
        "label": "Kalder Build Platform",
        "tagline": "Your teams build it. Kalder runs it.",
        "description": (
            "The low-code/no-code development environment available in every "
            "Kalder product. Business teams extend any product without "
            "engineering resources. Custom apps inherit all platform "
            "capabilities automatically."
        ),
        "capabilities": [
            "visual_workflow_builder",
            "drag_and_drop_app_builder",
            "reusable_component_library",
            "one_click_deployment",
            "version_control_and_rollback",
            "sandbox_environments",
        ],
        "competes_with": [
            "ServiceNow App Engine",
            "Salesforce Lightning Platform",
            "Microsoft Power Apps",
        ],
    },

    "kalder_insights_platform": {
        "label": "Kalder Insights Platform",
        "tagline": "Every metric. One view.",
        "description": (
            "Cross-product analytics and reporting embedded in every Kalder "
            "product. Pre-built dashboards for every role. Real-time metrics "
            "powered by the unified data model — no export, no ETL, no waiting."
        ),
        "capabilities": [
            "pre_built_role_dashboards",
            "custom_report_builder",
            "real_time_metrics",
            "cross_product_reporting",
            "scheduled_reporting",
            "embedded_ai_insights",
        ],
        "competes_with": [
            "ServiceNow Performance Analytics",
            "Salesforce CRM Analytics",
            "Microsoft Power BI embedded",
        ],
    },
}


# =============================================================================
# §1b  PRODUCTS REGISTRY  (45 products)
# Purchasable units with unique feature sets.
# Many-to-many with solutions via primary_solution + also_in_solutions.
# =============================================================================

PRODUCTS = {

    # ── IT & OPERATIONS ──────────────────────────────────────────────────────

    "kalder_resolve": {
        "label": "Kalder Resolve", "tagline": "AI-native incident and problem management",
        "primary_solution": "it_service_management", "also_in_solutions": [],
        "features": ["incident_management","problem_management","change_management",
                     "request_fulfillment","ai_autonomous_triage","itil_process_framework",
                     "sla_management","on_call_scheduling"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow ITSM Pro","BMC Helix ITSM","Jira Service Management","Freshservice"],
    },
    "kalder_catalog": {
        "label": "Kalder Catalog", "tagline": "Self-service that actually serves",
        "primary_solution": "it_service_management", "also_in_solutions": ["hr_service_delivery"],
        "features": ["service_catalog_builder","nl_request_submission","automated_fulfillment",
                     "multi_tier_approvals","fulfillment_tracking","catalog_analytics"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Service Catalog","Jira Service Management","ManageEngine ServiceDesk Plus"],
    },
    "kalder_asset": {
        "label": "Kalder Asset", "tagline": "Every asset. Every lifecycle stage.",
        "primary_solution": "it_service_management", "also_in_solutions": ["vendor_risk_management"],
        "features": ["cmdb","automated_discovery","software_asset_management",
                     "hardware_lifecycle_tracking","cloud_asset_visibility",
                     "contract_and_license_mgmt","compliance_reporting"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow ITAM","Snow Software","Flexera"],
    },
    "kalder_observe": {
        "label": "Kalder Observe", "tagline": "See everything. Act before it breaks.",
        "primary_solution": "it_operations_management", "also_in_solutions": [],
        "features": ["event_correlation","anomaly_detection","alert_noise_reduction",
                     "cross_domain_topology","predictive_outage_prevention","automated_diagnostics"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow ITOM","Moogsoft","BigPanda","PagerDuty AIOps"],
    },
    "kalder_predict": {
        "label": "Kalder Predict", "tagline": "Plan ahead. Spend less.",
        "primary_solution": "it_operations_management", "also_in_solutions": ["data_and_analytics"],
        "features": ["capacity_forecasting","demand_modeling","cost_optimization_recommendations",
                     "cloud_spend_analytics","infrastructure_right_sizing","scenario_planning"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Cloud Insights","Apptio Cloudability","AWS Cost Explorer"],
    },
    "kalder_map": {
        "label": "Kalder Map", "tagline": "Know your dependencies before they know you.",
        "primary_solution": "it_operations_management", "also_in_solutions": [],
        "features": ["service_topology_visualization","dependency_auto_discovery","change_impact_analysis",
                     "business_service_mapping","real_time_relationship_updates","topology_export_and_reporting"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Service Mapping","Dynatrace Smartscape","Datadog Service Catalog"],
    },
    "kalder_build": {
        "label": "Kalder Build", "tagline": "Build workflows as fast as you think of them.",
        "primary_solution": "enterprise_platform", "also_in_solutions": ["agent_platform"],
        "features": ["visual_workflow_designer","form_and_portal_builder","scripting_and_api_access",
                     "workflow_templates_library","testing_and_preview","version_control","one_click_deployment"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow App Engine","Microsoft Power Platform","Salesforce Lightning Platform"],
    },
    "kalder_studio": {
        "label": "Kalder Studio", "tagline": "Professional-grade apps. No-code speed.",
        "primary_solution": "enterprise_platform", "also_in_solutions": [],
        "features": ["drag_and_drop_component_library","theming_and_branding_engine",
                     "responsive_layout_builder","mobile_app_output",
                     "accessibility_compliance_checker","component_marketplace"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow UI Builder","Salesforce Experience Cloud","OutSystems"],
    },
    "kalder_connect": {
        "label": "Kalder Connect", "tagline": "Every system. One platform.",
        "primary_solution": "enterprise_platform", "also_in_solutions": ["agent_platform","automation_fabric"],
        "features": ["pre_built_connectors_500_plus","mcp_native_protocol_support","bidirectional_data_sync",
                     "event_subscription_and_routing","api_gateway_and_management",
                     "connector_testing_sandbox","error_handling_and_retry"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow IntegrationHub","MuleSoft Anypoint","Boomi","Workato"],
    },

    # ── CUSTOMER ENGAGEMENT ──────────────────────────────────────────────────

    "kalder_service": {
        "label": "Kalder Service", "tagline": "Resolve faster. Cost less. Delight more.",
        "primary_solution": "customer_service", "also_in_solutions": [],
        "features": ["case_management","omnichannel_routing","ai_autonomous_resolution",
                     "knowledge_management","self_service_portal","sla_and_entitlement_mgmt",
                     "customer_satisfaction_surveys","ai_search_and_conversation"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Service Cloud","Zendesk Suite","Freshdesk","ServiceNow CSM"],
    },
    "kalder_field": {
        "label": "Kalder Field", "tagline": "Right technician. Right time. First time.",
        "primary_solution": "customer_service", "also_in_solutions": [],
        "features": ["work_order_management","ai_scheduling_optimization","mobile_technician_app",
                     "parts_and_inventory_mgmt","asset_and_warranty_mgmt",
                     "remote_assist_capability","customer_portal_scheduling"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Field Service","ServiceMax","IFS Field Service Management","Oracle Field Service"],
    },
    "kalder_assist": {
        "label": "Kalder Assist", "tagline": "The co-pilot every agent deserves.",
        "primary_solution": "customer_service", "also_in_solutions": ["hr_service_delivery","it_service_management"],
        "features": ["next_best_action_guidance","response_auto_drafting","real_time_knowledge_retrieval",
                     "case_history_summarization","sentiment_detection",
                     "compliance_guardrails","coaching_and_quality_scoring"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Einstein Copilot for Service","Zendesk Copilot","ServiceNow Now Assist for CSM"],
    },
    "kalder_sales": {
        "label": "Kalder Sales", "tagline": "Sell smarter. Close faster.",
        "primary_solution": "sales_automation", "also_in_solutions": [],
        "features": ["opportunity_management","ai_lead_scoring_and_routing","pipeline_management",
                     "forecasting_and_projection","territory_management",
                     "activity_capture_automation","account_and_contact_mgmt","competitive_intelligence"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Sales Cloud","Microsoft Dynamics 365 Sales","Oracle Sales Cloud","HubSpot Sales Hub"],
    },
    "kalder_configure": {
        "label": "Kalder Configure", "tagline": "Complex quotes. Simple process.",
        "primary_solution": "sales_automation", "also_in_solutions": ["order_management"],
        "features": ["product_configuration_engine","pricing_rules_and_discounting",
                     "quote_generation_and_approval","guided_selling",
                     "subscription_pricing_support","multi_currency_and_tax","e_signature_integration"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Revenue Cloud CPQ","Oracle CPQ Cloud","SAP CPQ","Logik.ai"],
    },
    "kalder_engage": {
        "label": "Kalder Engage", "tagline": "The right message. The right moment.",
        "primary_solution": "sales_automation", "also_in_solutions": [],
        "features": ["email_and_call_sequences","ai_next_best_action","automatic_activity_capture",
                     "meeting_scheduling_automation","sales_playbook_enforcement",
                     "engagement_analytics","linkedin_and_social_integration"],
        "sold_standalone": True,
        "competitive_alternatives": ["Outreach","Salesloft","HubSpot Sales Sequences","Salesforce High Velocity Sales"],
    },
    "kalder_order": {
        "label": "Kalder Order", "tagline": "From signed to shipped. No gaps.",
        "primary_solution": "order_management", "also_in_solutions": [],
        "features": ["order_capture_and_validation","fulfillment_orchestration",
                     "order_modification_and_amendment","returns_and_refunds",
                     "exception_management","customer_order_portal","carrier_and_logistics_integration"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Order Management","ServiceNow Order Management","Oracle Order Management"],
    },
    "kalder_contract": {
        "label": "Kalder Contract", "tagline": "Contracts that close themselves.",
        "primary_solution": "order_management", "also_in_solutions": ["vendor_risk_management"],
        "features": ["contract_template_library","ai_clause_risk_detection","negotiation_workflow",
                     "e_signature_native","obligation_and_milestone_tracking",
                     "automated_renewal_alerts","contract_analytics"],
        "sold_standalone": True,
        "competitive_alternatives": ["Ironclad","DocuSign CLM","Salesforce Contract Management","Conga CLM"],
    },
    "kalder_revenue": {
        "label": "Kalder Revenue", "tagline": "Grow revenue. Protect it.",
        "primary_solution": "order_management", "also_in_solutions": [],
        "features": ["subscription_lifecycle_mgmt","billing_orchestration","expansion_and_upsell_signals",
                     "churn_prediction_and_alerts","revenue_recognition_support",
                     "customer_health_scoring","renewal_management"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Revenue Cloud","Zuora","Chargebee","Gainsight Revenue"],
    },

    # ── EMPLOYEE EXPERIENCE ──────────────────────────────────────────────────

    "kalder_hr": {
        "label": "Kalder HR", "tagline": "HR that helps people, not just manages them.",
        "primary_solution": "hr_service_delivery", "also_in_solutions": [],
        "features": ["hr_case_management","employee_self_service_portal","ai_hr_virtual_agent",
                     "policy_and_document_management","hr_knowledge_base",
                     "cross_departmental_workflows","employee_data_management"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow HR Service Delivery","Workday Help","SAP SuccessFactors Service Center","Zendesk for HR"],
    },
    "kalder_hire": {
        "label": "Kalder Hire", "tagline": "Find the right person faster.",
        "primary_solution": "hr_service_delivery", "also_in_solutions": [],
        "features": ["job_requisition_management","ai_candidate_screening","applicant_tracking",
                     "interview_scheduling_automation","offer_management_and_approval",
                     "recruiter_collaboration_tools","hiring_analytics"],
        "sold_standalone": True,
        "competitive_alternatives": ["Workday Recruiting","Greenhouse","Lever","SAP SuccessFactors Recruiting"],
    },
    "kalder_onboard": {
        "label": "Kalder Onboard", "tagline": "Day one. Every time.",
        "primary_solution": "hr_service_delivery", "also_in_solutions": [],
        "features": ["onboarding_workflow_orchestration","cross_department_task_coordination",
                     "new_hire_portal_and_checklist","equipment_and_access_provisioning",
                     "offboarding_and_transition_workflows","buddy_and_mentor_program_support","onboarding_analytics"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow HRSD Onboarding","BambooHR Onboarding","Workday Onboarding"],
    },
    "kalder_workplace": {
        "label": "Kalder Workplace", "tagline": "Spaces that work as hard as your people.",
        "primary_solution": "workplace_services", "also_in_solutions": [],
        "features": ["desk_and_room_reservations","visitor_management","workplace_service_requests",
                     "hybrid_work_planning","ai_space_utilization","wayfinding_and_floor_maps","employee_workplace_app"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Workplace Service Delivery","Condeco","Robin","Envoy"],
    },
    "kalder_facilities": {
        "label": "Kalder Facilities", "tagline": "Maintain everything. Surprise no one.",
        "primary_solution": "workplace_services", "also_in_solutions": [],
        "features": ["maintenance_request_management","preventive_maintenance_scheduling",
                     "ai_predictive_maintenance","vendor_and_contractor_management",
                     "lease_and_real_estate_tracking","energy_and_sustainability_reporting","capital_project_management"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Workplace Service Delivery","IBM Maximo","Archibus","Planon"],
    },
    "kalder_access": {
        "label": "Kalder Access", "tagline": "Right access. Right people. Always.",
        "primary_solution": "workplace_services", "also_in_solutions": ["governance_risk_compliance"],
        "features": ["badge_provisioning_workflows","physical_access_request_management",
                     "visitor_credentialing","access_certification_campaigns",
                     "physical_identity_governance","acs_integration","compliance_access_reporting"],
        "sold_standalone": True,
        "competitive_alternatives": ["Lenel OnGuard","Genetec","SailPoint Physical Access"],
    },
    "kalder_learn": {
        "label": "Kalder Learn", "tagline": "Learn at work. Not instead of it.",
        "primary_solution": "learning_and_development", "also_in_solutions": [],
        "features": ["course_and_content_delivery","compliance_training_tracking","certification_management",
                     "ai_learning_recommendations","learning_path_builder",
                     "manager_reporting_dashboard","mobile_learning_app"],
        "sold_standalone": True,
        "competitive_alternatives": ["Cornerstone OnDemand","Workday Learning","SAP SuccessFactors Learning","Docebo"],
    },
    "kalder_skills": {
        "label": "Kalder Skills", "tagline": "Know what your workforce can do.",
        "primary_solution": "learning_and_development", "also_in_solutions": ["hr_service_delivery"],
        "features": ["skills_taxonomy_builder","employee_skills_assessment","skills_gap_analysis",
                     "workforce_capability_mapping","hiring_need_forecasting",
                     "internal_mobility_matching","skills_analytics"],
        "sold_standalone": True,
        "competitive_alternatives": ["Workday Skills Cloud","SAP SuccessFactors Succession","Eightfold AI","Gloat"],
    },
    "kalder_coach": {
        "label": "Kalder Coach", "tagline": "Every employee. A personalized path forward.",
        "primary_solution": "learning_and_development", "also_in_solutions": [],
        "features": ["ai_development_plan_generation","career_path_visualization","mentor_and_coach_matching",
                     "stretch_assignment_recommendations","manager_coaching_prompts",
                     "progress_tracking_and_nudges","integration_with_kalder_learn"],
        "sold_standalone": True,
        "competitive_alternatives": ["Betterworks","Lattice","15Five","Workday Career Hub"],
    },

    # ── RISK & COMPLIANCE ────────────────────────────────────────────────────

    "kalder_comply": {
        "label": "Kalder Comply", "tagline": "Compliance that keeps up with the business.",
        "primary_solution": "governance_risk_compliance", "also_in_solutions": [],
        "features": ["risk_register_and_assessment","control_framework_management",
                     "continuous_control_monitoring","ai_risk_scoring",
                     "exception_and_issue_tracking","regulatory_change_tracking","executive_risk_dashboard"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow GRC","Archer (RSA)","MetricStream","IBM OpenPages"],
    },
    "kalder_policy": {
        "label": "Kalder Policy", "tagline": "Policies people actually follow.",
        "primary_solution": "governance_risk_compliance", "also_in_solutions": [],
        "features": ["policy_authoring_and_versioning","stakeholder_review_workflow",
                     "employee_attestation_campaigns","policy_exception_management",
                     "regulatory_linkage","ai_policy_gap_detection","policy_effectiveness_reporting"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Policy and Compliance","MetricStream Policy","LogicGate","Navex PolicyTech"],
    },
    "kalder_audit": {
        "label": "Kalder Audit", "tagline": "Audits that inform, not just report.",
        "primary_solution": "governance_risk_compliance", "also_in_solutions": [],
        "features": ["risk_based_audit_planning","audit_fieldwork_management","evidence_collection_and_management",
                     "issue_and_finding_tracking","management_response_workflow",
                     "ai_audit_scope_recommendations","audit_analytics_and_reporting"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Audit Management","TeamMate+ (Wolters Kluwer)","AuditBoard","Galvanize (Diligent)"],
    },
    "kalder_defend": {
        "label": "Kalder Defend", "tagline": "Detect faster. Respond smarter.",
        "primary_solution": "security_operations", "also_in_solutions": [],
        "features": ["security_incident_management","ai_autonomous_triage","automated_containment_playbooks",
                     "vulnerability_management","threat_case_management",
                     "soc_performance_analytics","siem_and_edr_integration"],
        "sold_standalone": True,
        "competitive_alternatives": ["ServiceNow Security Operations","Splunk SOAR","Palo Alto XSOAR","Microsoft Sentinel SOAR"],
    },
    "kalder_threat": {
        "label": "Kalder Threat", "tagline": "Know the threat before it knows you.",
        "primary_solution": "security_operations", "also_in_solutions": [],
        "features": ["threat_feed_aggregation","ioc_management","threat_actor_profiling",
                     "ai_threat_prioritization","ioc_enrichment_automation",
                     "threat_intelligence_sharing","integration_with_kalder_defend"],
        "sold_standalone": True,
        "competitive_alternatives": ["Recorded Future","ThreatConnect","Anomali","Mandiant Advantage"],
    },
    "kalder_respond": {
        "label": "Kalder Respond", "tagline": "Contain it. Fast.",
        "primary_solution": "security_operations", "also_in_solutions": [],
        "features": ["ai_powered_playbook_execution","automated_containment_actions","cross_tool_orchestration",
                     "forensic_evidence_logging","incident_timeline_reconstruction",
                     "post_incident_review_reports","regulatory_notification_workflows"],
        "sold_standalone": True,
        "competitive_alternatives": ["Palo Alto XSOAR","Splunk SOAR","IBM Security QRadar SOAR","ServiceNow Security Incident Response"],
    },
    "kalder_vendor": {
        "label": "Kalder Vendor", "tagline": "Know your vendors. Know your risk.",
        "primary_solution": "vendor_risk_management", "also_in_solutions": [],
        "features": ["vendor_registry","risk_tiering_and_classification","onboarding_workflow",
                     "due_diligence_documentation","vendor_contact_management",
                     "performance_tracking","offboarding_and_termination"],
        "sold_standalone": True,
        "competitive_alternatives": ["Prevalent","OneTrust Third-Party Risk","ServiceNow VRM","Archer Third Party Management"],
    },
    "kalder_monitor": {
        "label": "Kalder Monitor", "tagline": "Continuous vigilance. Zero blind spots.",
        "primary_solution": "vendor_risk_management", "also_in_solutions": [],
        "features": ["automated_risk_questionnaires","real_time_risk_scoring","adverse_news_monitoring",
                     "fourth_party_risk_visibility","reassessment_trigger_automation",
                     "vendor_risk_benchmarking","remediation_tracking"],
        "sold_standalone": True,
        "competitive_alternatives": ["BitSight","SecurityScorecard","Prevalent Continuous Monitoring","OneTrust Continuous Monitoring"],
    },
    "kalder_supply": {
        "label": "Kalder Supply", "tagline": "Resilient supply chains start here.",
        "primary_solution": "vendor_risk_management", "also_in_solutions": [],
        "features": ["multi_tier_supplier_mapping","concentration_risk_analysis","disruption_scenario_modeling",
                     "supply_chain_resilience_scoring","regulatory_compliance_tracking",
                     "supplier_diversity_reporting","real_time_supply_chain_alerts"],
        "sold_standalone": True,
        "competitive_alternatives": ["Resilinc","Coupa Supply Chain Design","riskmethods (Sphera)","IBM Supply Chain Intelligence Suite"],
    },

    # ── AI PLATFORM ──────────────────────────────────────────────────────────

    "kalder_agents": {
        "label": "Kalder Agents", "tagline": "Build agents. Deploy in minutes.",
        "primary_solution": "agent_platform", "also_in_solutions": ["enterprise_platform"],
        "features": ["visual_agent_designer","code_based_agent_builder","model_agnostic_llm_connection",
                     "mcp_ecosystem_integration","agent_action_library",
                     "multi_agent_orchestration","agent_versioning_and_promotion"],
        "sold_standalone": True,
        "competitive_alternatives": ["Salesforce Agentforce","Microsoft Copilot Studio","ServiceNow AI Platform","Amazon Bedrock Agents"],
    },
    "kalder_govern": {
        "label": "Kalder Govern", "tagline": "AI you can stand behind.",
        "primary_solution": "agent_platform", "also_in_solutions": ["governance_risk_compliance"],
        "features": ["ai_model_registry","bias_detection_and_reporting","explainability_and_attribution",
                     "ai_risk_assessment_framework","deployment_approval_workflows",
                     "ongoing_model_monitoring","regulatory_ai_compliance"],
        "sold_standalone": True,
        "competitive_alternatives": ["Microsoft Azure AI Foundry Governance","IBM OpenScale","Credo AI","Weights and Biases Model Governance"],
    },
    "kalder_simulate": {
        "label": "Kalder Simulate", "tagline": "Test everything. Break nothing in production.",
        "primary_solution": "agent_platform", "also_in_solutions": [],
        "features": ["synthetic_scenario_generation","agent_behavior_simulation","regression_test_suite_builder",
                     "production_mirror_environment","performance_and_load_testing",
                     "simulation_result_analytics","ci_cd_pipeline_integration"],
        "sold_standalone": True,
        "competitive_alternatives": ["Microsoft Copilot Studio Test Framework","Salesforce Agentforce Testing Center"],
    },
    "kalder_automate": {
        "label": "Kalder Automate", "tagline": "Automate the work. Keep the judgment.",
        "primary_solution": "automation_fabric", "also_in_solutions": [],
        "features": ["drag_and_drop_workflow_builder","ai_process_recommendations","pre_built_automation_templates",
                     "conditional_logic_and_branching","human_approval_steps",
                     "error_handling_and_alerting","automation_performance_analytics"],
        "sold_standalone": True,
        "competitive_alternatives": ["Microsoft Power Automate","Salesforce Flow","UiPath Task Mining","ServiceNow Flow Designer"],
    },
    "kalder_mine": {
        "label": "Kalder Mine", "tagline": "Find what to automate next.",
        "primary_solution": "automation_fabric", "also_in_solutions": ["data_and_analytics"],
        "features": ["event_log_ingestion","process_flow_visualization","bottleneck_identification",
                     "automation_opportunity_scoring","compliance_deviation_detection",
                     "process_variant_analysis","roi_estimation_for_automation"],
        "sold_standalone": True,
        "competitive_alternatives": ["Celonis","UiPath Process Mining","Signavio (SAP)","Microsoft Process Mining"],
    },
    "kalder_rpa": {
        "label": "Kalder RPA", "tagline": "Automate the legacy. No API required.",
        "primary_solution": "automation_fabric", "also_in_solutions": [],
        "features": ["attended_bot_builder","unattended_bot_orchestration","ai_resilient_ui_automation",
                     "bot_performance_monitoring","exception_handling_and_escalation",
                     "bot_library_and_reuse","legacy_system_connectors"],
        "sold_standalone": True,
        "competitive_alternatives": ["UiPath","Automation Anywhere","Blue Prism","Microsoft Power Automate Desktop"],
    },
    "kalder_insight": {
        "label": "Kalder Insight", "tagline": "Every answer. One place.",
        "primary_solution": "data_and_analytics", "also_in_solutions": [],
        "features": ["pre_built_executive_dashboards","self_service_report_builder","cross_product_analytics",
                     "ai_anomaly_detection","scheduled_report_distribution",
                     "embedded_analytics_in_products","natural_language_query"],
        "sold_standalone": True,
        "competitive_alternatives": ["Tableau","Looker","Power BI","ServiceNow Performance Analytics"],
    },
    "kalder_pipeline": {
        "label": "Kalder Pipeline", "tagline": "Data where you need it. When you need it.",
        "primary_solution": "data_and_analytics", "also_in_solutions": [],
        "features": ["data_ingestion_connectors","low_code_transformation_builder","ai_assisted_mapping",
                     "pipeline_scheduling_and_monitoring","data_quality_validation",
                     "lineage_and_documentation","error_alerting_and_retry"],
        "sold_standalone": True,
        "competitive_alternatives": ["Informatica","Talend","Fivetran","dbt Cloud"],
    },
    "kalder_model": {
        "label": "Kalder Model", "tagline": "Build ML. Deploy ML. Trust ML.",
        "primary_solution": "data_and_analytics", "also_in_solutions": ["agent_platform"],
        "features": ["model_training_environment","model_versioning_and_registry","one_click_model_deployment",
                     "model_performance_monitoring","automated_retraining_triggers",
                     "feature_store","integration_with_kalder_govern"],
        "sold_standalone": True,
        "competitive_alternatives": ["Databricks MLflow","AWS SageMaker","Azure Machine Learning","Dataiku"],
    },
}


# =============================================================================
# §1c  SOLUTIONS REGISTRY  (15 solutions)
# Each solution belongs to exactly one category.
# Products referenced by key (many-to-many).
# =============================================================================

SOLUTIONS = {

    # ── IT & OPERATIONS ──────────────────────────────────────────────────────
    "it_service_management": {
        "label": "IT Service Management", "short_label": "ITSM",
        "category": "it_operations",
        "products": ["kalder_resolve", "kalder_catalog", "kalder_asset"],
        "opportunity_framing": "ITSM modernisation and AI-native service delivery",
        "champion_typical_title": "IT Director / VP of IT",
        "economic_buyer_typical_title": "CIO / CTO",
        "coverage_status": "constructed",  # corrected from 'partial': TITLE_ROLE_MAP is 'constructed'; effective status = minimum rank
        "competitive_displacement": ["ServiceNow ITSM", "BMC Helix", "Jira Service Management"],
    },
    "it_operations_management": {
        "label": "IT Operations Management", "short_label": "ITOM",
        "category": "it_operations",
        "products": ["kalder_observe", "kalder_predict", "kalder_map"],
        "opportunity_framing": "AIOps and infrastructure operations modernisation",
        "champion_typical_title": "VP of Infrastructure / Head of IT Operations",
        "economic_buyer_typical_title": "CIO / CTO",
        "coverage_status": "constructed",  # corrected from 'partial': TITLE_ROLE_MAP is 'constructed'; effective status = minimum rank
        "competitive_displacement": ["ServiceNow ITOM", "Moogsoft", "PagerDuty AIOps"],
    },
    "enterprise_platform": {
        "label": "Enterprise Platform", "short_label": "Platform",
        "category": "it_operations",
        "products": ["kalder_build", "kalder_studio", "kalder_connect"],
        "opportunity_framing": "Workflow automation and enterprise integration platform",
        "champion_typical_title": "Head of Digital Transformation / Platform Architect",
        "economic_buyer_typical_title": "CIO / Chief Digital Officer",
        "coverage_status": "constructed",  # corrected from 'partial': TITLE_ROLE_MAP is 'constructed'; effective status = minimum rank
        "competitive_displacement": ["ServiceNow App Engine", "Microsoft Power Platform", "Salesforce Platform"],
    },

    # ── CUSTOMER ENGAGEMENT ──────────────────────────────────────────────────
    "customer_service": {
        "label": "Customer Service", "short_label": "Service",
        "category": "customer_engagement",
        "products": ["kalder_service", "kalder_field", "kalder_assist"],
        "opportunity_framing": "Service-first CRM shift and autonomous customer service",
        "champion_typical_title": "Director of Customer Service / Head of Customer Experience",
        "economic_buyer_typical_title": "Chief Customer Officer / COO",
        "coverage_status": "complete",
        "competitive_displacement": ["Salesforce Service Cloud", "Zendesk", "ServiceNow CSM"],
    },
    "sales_automation": {
        "label": "Sales Automation", "short_label": "Sales",
        "category": "customer_engagement",
        "products": ["kalder_sales", "kalder_configure", "kalder_engage"],
        "opportunity_framing": "Lead-to-cash modernisation and AI-native selling",
        "champion_typical_title": "Director of Sales Operations / Head of Revenue Operations",
        "economic_buyer_typical_title": "Chief Revenue Officer / EVP Sales",
        "coverage_status": "complete",
        "competitive_displacement": ["Salesforce Sales Cloud", "Microsoft Dynamics 365 Sales", "Oracle Sales Cloud"],
    },
    "order_management": {
        "label": "Order Management", "short_label": "Orders",
        "category": "customer_engagement",
        "products": ["kalder_order", "kalder_contract", "kalder_revenue"],
        "opportunity_framing": "Commercial lifecycle automation from order to renewal",
        "champion_typical_title": "VP of Revenue Operations / Head of Commercial Operations",
        "economic_buyer_typical_title": "Chief Revenue Officer / CFO",
        "coverage_status": "pending",
        "competitive_displacement": ["Salesforce Revenue Cloud", "Zuora", "ServiceNow Order Management"],
    },

    # ── EMPLOYEE EXPERIENCE ──────────────────────────────────────────────────
    "hr_service_delivery": {
        "label": "HR Service Delivery", "short_label": "HR",
        "category": "employee_experience",
        "products": ["kalder_hr", "kalder_hire", "kalder_onboard"],
        "opportunity_framing": "AI-native HR service transformation",
        "champion_typical_title": "VP of HR / Head of People Operations",
        "economic_buyer_typical_title": "Chief People Officer / CHRO",
        "coverage_status": "pending",
        "competitive_displacement": ["ServiceNow HR Service Delivery", "Workday Help", "SAP SuccessFactors"],
    },
    "workplace_services": {
        "label": "Workplace Services", "short_label": "Workplace",
        "category": "employee_experience",
        "products": ["kalder_workplace", "kalder_facilities", "kalder_access"],
        "opportunity_framing": "Modern workplace experience and facilities modernisation",
        "champion_typical_title": "Head of Real Estate & Facilities / VP of Workplace",
        "economic_buyer_typical_title": "COO / Chief Workplace Officer",
        "coverage_status": "pending",
        "competitive_displacement": ["ServiceNow Workplace Service Delivery", "Condeco", "IBM Maximo"],
    },
    "learning_and_development": {
        "label": "Learning & Development", "short_label": "L&D",
        "category": "employee_experience",
        "products": ["kalder_learn", "kalder_skills", "kalder_coach"],
        "opportunity_framing": "Workforce capability and AI-native learning transformation",
        "champion_typical_title": "VP of Learning & Development / Head of Talent",
        "economic_buyer_typical_title": "Chief People Officer / CHRO",
        "coverage_status": "pending",
        "competitive_displacement": ["Cornerstone OnDemand", "Workday Learning", "SAP SuccessFactors Learning"],
    },

    # ── RISK & COMPLIANCE ────────────────────────────────────────────────────
    "governance_risk_compliance": {
        "label": "Governance, Risk & Compliance", "short_label": "GRC",
        "category": "risk_compliance",
        "products": ["kalder_comply", "kalder_policy", "kalder_audit"],
        "opportunity_framing": "GRC platform consolidation and continuous compliance",
        "champion_typical_title": "Chief Risk Officer / Head of Compliance",
        "economic_buyer_typical_title": "Chief Risk Officer / CFO / General Counsel",
        "coverage_status": "pending",
        "competitive_displacement": ["ServiceNow GRC", "Archer (RSA)", "MetricStream"],
    },
    "security_operations": {
        "label": "Security Operations", "short_label": "SecOps",
        "category": "risk_compliance",
        "products": ["kalder_defend", "kalder_threat", "kalder_respond"],
        "opportunity_framing": "Security operations modernisation and AI-native SOC",
        "champion_typical_title": "CISO / VP of Security Operations",
        "economic_buyer_typical_title": "CISO / CTO / CRO",
        "coverage_status": "pending",
        "competitive_displacement": ["ServiceNow Security Operations", "Splunk SOAR", "Palo Alto XSOAR"],
    },
    "vendor_risk_management": {
        "label": "Vendor Risk Management", "short_label": "VRM",
        "category": "risk_compliance",
        "products": ["kalder_vendor", "kalder_monitor", "kalder_supply"],
        "opportunity_framing": "Third-party and supply chain risk programme modernisation",
        "champion_typical_title": "VP of Procurement / Head of Third-Party Risk",
        "economic_buyer_typical_title": "Chief Risk Officer / CPO / CFO",
        "coverage_status": "pending",
        "competitive_displacement": ["Prevalent", "OneTrust Third-Party Risk", "ServiceNow VRM"],
    },

    # ── AI PLATFORM ──────────────────────────────────────────────────────────
    "agent_platform": {
        "label": "Agent Platform", "short_label": "Agents",
        "category": "ai_platform",
        "products": ["kalder_agents", "kalder_govern", "kalder_simulate"],
        "opportunity_framing": "Enterprise agent strategy and AI-native automation",
        "champion_typical_title": "VP of Engineering / Head of AI / Chief Digital Officer",
        "economic_buyer_typical_title": "CTO / CIO / Chief Digital Officer",
        "coverage_status": "pending",
        "competitive_displacement": ["Salesforce Agentforce", "Microsoft Copilot Studio", "ServiceNow AI Platform"],
    },
    "automation_fabric": {
        "label": "Automation Fabric", "short_label": "Automation",
        "category": "ai_platform",
        "products": ["kalder_automate", "kalder_mine", "kalder_rpa"],
        "opportunity_framing": "Enterprise-wide workflow and process automation",
        "champion_typical_title": "Head of Automation / VP of Digital Transformation",
        "economic_buyer_typical_title": "COO / CTO / Chief Digital Officer",
        "coverage_status": "pending",
        "competitive_displacement": ["UiPath", "Microsoft Power Automate", "Celonis + Automation Anywhere"],
    },
    "data_and_analytics": {
        "label": "Data & Analytics", "short_label": "Data",
        "category": "ai_platform",
        "products": ["kalder_insight", "kalder_pipeline", "kalder_model"],
        "opportunity_framing": "Enterprise analytics and ML platform modernisation",
        "champion_typical_title": "VP of Data / Chief Data Officer",
        "economic_buyer_typical_title": "Chief Data Officer / CTO / CFO",
        "coverage_status": "pending",
        "competitive_displacement": ["Databricks", "Tableau + dbt", "Dataiku"],
    },
}


# =============================================================================
# §1d  SOLUTION CATEGORIES  (5 categories)
# =============================================================================

SOLUTION_CATEGORIES = {

    "it_operations": {
        "label": "IT & Operations", "short_label": "IT",
        "solutions": ["it_service_management", "it_operations_management", "enterprise_platform"],
        "bg_type": "IT buyer",
        "bg_type_description": (
            "Technology leaders responsible for enterprise infrastructure, "
            "service delivery, and digital transformation. Champion is "
            "typically an IT Director or VP of IT; Economic Buyer is CIO or CTO."
        ),
        "coverage_status": "partial",
        "competitive_set": ["ServiceNow", "BMC Helix", "Jira Service Management", "Microsoft"],
    },
    "customer_engagement": {
        "label": "Customer Engagement", "short_label": "CRM",
        "solutions": ["customer_service", "sales_automation", "order_management"],
        "bg_type": "CRM buyer",
        "bg_type_description": (
            "Service and revenue leaders responsible for customer-facing operations. "
            "Two distinct Champion archetypes: service ops leaders (CCO, Director of "
            "Customer Service) and revenue ops leaders (CRO, Director of Sales Ops). "
            "Ratifier composition is nearly identical across both sub-types."
        ),
        "coverage_status": "complete",
        "competitive_set": ["Salesforce", "Zendesk", "Microsoft Dynamics 365", "Freshworks"],
    },
    "employee_experience": {
        "label": "Employee Experience", "short_label": "HR",
        "solutions": ["hr_service_delivery", "workplace_services", "learning_and_development"],
        "bg_type": "HR / People buyer",
        "bg_type_description": (
            "People and workplace leaders responsible for employee experience and "
            "workforce capability. Champion varies by solution: VP HR, VP Workplace, "
            "or VP L&D. Economic Buyer is CPO or CHRO."
        ),
        "coverage_status": "pending",
        "competitive_set": ["Workday", "ServiceNow HR", "SAP SuccessFactors", "Cornerstone OnDemand"],
    },
    "risk_compliance": {
        "label": "Risk & Compliance", "short_label": "GRC",
        "solutions": ["governance_risk_compliance", "security_operations", "vendor_risk_management"],
        "bg_type": "GRC / Risk buyer",
        "bg_type_description": (
            "Governance, risk, and compliance leaders responsible for enterprise risk "
            "posture and regulatory adherence. Ratifier involvement is heaviest in this "
            "category — legal, finance, and procurement all gate late-stage decisions."
        ),
        "coverage_status": "pending",
        "competitive_set": ["ServiceNow GRC + SecOps", "Archer (RSA)", "MetricStream", "Prevalent", "Splunk SOAR"],
    },
    "ai_platform": {
        "label": "AI Platform", "short_label": "AI",
        "solutions": ["agent_platform", "automation_fabric", "data_and_analytics"],
        "bg_type": "Platform / AI buyer",
        "bg_type_description": (
            "Technology and transformation leaders responsible for enterprise AI strategy, "
            "automation programs, and data infrastructure. This buying group has the "
            "highest proportion of technical Influencers and most rigorous Ratifier "
            "scrutiny around AI governance and data privacy."
        ),
        "coverage_status": "pending",
        "competitive_set": ["Microsoft Power Platform + Copilot Studio", "Salesforce Agentforce",
                            "ServiceNow AI Platform", "UiPath", "Celonis", "Databricks"],
    },
}


# =============================================================================
# §1  HELPER FUNCTIONS
# =============================================================================

def get_all_solution_category_keys() -> list[str]:
    return list(SOLUTION_CATEGORIES.keys())

def get_solutions_for_category(category_key: str) -> list[str]:
    return SOLUTION_CATEGORIES.get(category_key, {}).get("solutions", [])

def get_products_for_solution(solution_key: str) -> list[str]:
    return SOLUTIONS.get(solution_key, {}).get("products", [])

def get_solutions_for_product(product_key: str) -> list[str]:
    return [k for k, v in SOLUTIONS.items() if product_key in v.get("products", [])]

def get_category_for_solution(solution_key: str) -> str | None:
    return SOLUTIONS.get(solution_key, {}).get("category")

def get_categories_for_product(product_key: str) -> list[str]:
    return sorted({get_category_for_solution(sk) for sk in get_solutions_for_product(product_key)
                   if get_category_for_solution(sk)})

def get_coverage_status(category_key: str) -> str:
    return SOLUTION_CATEGORIES.get(category_key, {}).get("coverage_status", "unknown")

def validate_inventory() -> dict:
    issues = []
    for cat_key, cat in SOLUTION_CATEGORIES.items():
        sol_keys = cat.get("solutions", [])
        if len(sol_keys) < 3:
            issues.append(f"Category '{cat_key}' has {len(sol_keys)} solutions (minimum 3)")
        for sol_key in sol_keys:
            sol = SOLUTIONS.get(sol_key)
            if not sol:
                issues.append(f"Solution '{sol_key}' not found in SOLUTIONS")
                continue
            prod_keys = sol.get("products", [])
            if len(prod_keys) < 3:
                issues.append(f"Solution '{sol_key}' has {len(prod_keys)} products (minimum 3)")
            for pk in prod_keys:
                if pk not in PRODUCTS:
                    issues.append(f"Product '{pk}' in solution '{sol_key}' not found in PRODUCTS")
    return {
        "passed": len(issues) == 0,
        "issues": issues,
        "summary": {
            "categories": len(SOLUTION_CATEGORIES),
            "solutions": len(SOLUTIONS),
            "products": len(PRODUCTS),
            "platform_capabilities": len(PLATFORM_CAPABILITIES),
        },
    }


# =============================================================================
# §2  BUYING GROUP ROLES  [Signal Def §2, §4 — used by all 7 docs]
#
# Five roles appear in every solution category and every solution.
# Role is context-dependent — the same individual may be Champion in one
# buying group and Ratifier in another within the same account.
# Role assignment is solution-specific, not person-fixed.
#
# ML classifier coverage at v1 launch:
#   COVERED:  champion, economic_buyer, influencer
#   PENDING:  user, ratifier (added as labeled training data accumulates)
#
# Double-diamond role summary:
#   DIVERGE phase  — each role completes individual JTBDs
#   CONVERGE phase — roles gate specific convergence points
# =============================================================================

ROLES = {

    "champion": {
        "label": "Champion",
        "definition": (
            "The insider who believes in Kalder early and rallies the room "
            "to make the deal happen. Builds the case across stakeholders, "
            "gathers proof points, and drives consensus. The primary internal "
            "distributor of converge content — orchestrating group alignment "
            "is their job, not a side task."
        ),
        "typical_titles": {
            "_status": "DEPRECATED — do not use for classification",
            "_superseded_by": "TITLE_ROLE_MAP (§19) with solution_key as required parameter",
            "_retained_for": "Human readability and documentation authoring only",
            "_titles": [
                # IT & Operations
                "IT Director", "VP of IT", "Head of Digital Transformation",
                "Platform Architect", "Director of IT Operations",
                # Customer Engagement — Service
                "Director of Customer Service Operations",
                "Head of Customer Experience",
                "Director of Field Service / Service Operations",
                # Customer Engagement — Sales
                "Director of Sales Operations",
                "Head of Revenue Operations",
                "Director of Sales Strategy & Planning",
                # Employee Experience
                "VP of HR", "Head of People Operations",
                "VP of Learning & Development",
                # Risk & Compliance
                "Head of Compliance", "VP of Security Operations",
                "Head of Third-Party Risk",
                # AI Platform
                "VP of Engineering", "Head of AI / ML",
                "Chief Digital Officer",
            ],
        },
        "behavioral_hypothesis": (
            "Consumes breadth. Needs ammunition for multiple audiences: case "
            "studies, competitive comparisons, demos, content spanning multiple "
            "product and solution areas. High return frequency, broad content "
            "consumption, strong preference for proof-point content. Returns to "
            "the site repeatedly as they build the internal case and respond to "
            "objections from other buying group members."
        ),
        "primary_indicators": [
            "Case study / success story downloads",
            "Competitive comparison page views",
            "Demo request submissions",
            "3+ solution areas explored within 90-day window",
            "Consensus brief or executive brief downloads (late-stage)",
            "Return visits within 30 days of initial session",
        ],
        "counter_indicators": [
            "Exclusive focus on technical docs without proof-point content",
            "Exclusive focus on pricing/ROI without breadth",
            "Single-session engagement without return visits",
            "Security/compliance content as primary content type",
        ],
        "content_seeks": [
            "Case studies with named accounts and quantified outcomes",
            "Competitive comparisons and analyst reports",
            "Cross-solution narratives and platform stories",
            "Demo experiences and product tours",
            "Consensus briefs (for internal distribution)",
            "Executive briefs (for EB preparation)",
        ],
        "content_avoids": [
            "Narrow operational how-to content",
            "Deep implementation and migration detail",
            "Security and compliance whitepapers (unless Ratifier-prep)",
        ],
        "double_diamond_role": {
            "diverge": (
                "Socialises the problem narrative, collects early proof and peer "
                "references, recruits allies within the organisation. At Progression "
                "stage: secures executive sponsorship, stands up use cases, builds "
                "the business case."
            ),
            "converge": (
                "Primary orchestrator of group convergence. Distributes consensus "
                "briefs, runs internal alignment meetings, resolves conflicting "
                "information gathered by other roles. The Champion is the through-line "
                "carrier — ensuring all roles are working from consistent claims."
            ),
        },
        "convergence_points_gated": [
            "problem_validation",
            "requirements_framing",
            "solution_validation",
            "business_value_alignment",
            "risk_compliance_validation",
            "final_commitment",
        ],
        "classification_status": {
            "ml_classifier_v1": "covered",
            "confidence_ceiling": "high",
            "notes": (
                "Best-classified role. Strong behavioral signal diversity: "
                "case study downloads, competitive comparisons, demo requests, "
                "multi-solution exploration. Firmographic confirmation available "
                "for most Champion titles via Demandbase."
            ),
        },
    },

    "economic_buyer": {
        "label": "Economic Buyer",
        "definition": (
            "The person with budget authority who approves the spend and "
            "makes the final call. Evaluates the business case, assesses "
            "financial justification, and signs off on the purchase. "
            "Rarely the initiator — typically engaged by the Champion "
            "once the internal case is built."
        ),
        "typical_titles": {
            "_status": "DEPRECATED — do not use for classification",
            "_superseded_by": "TITLE_ROLE_MAP (§19) with solution_key as required parameter",
            "_retained_for": "Human readability and documentation authoring only",
            "_titles": [
                # IT & Operations
                "CIO", "CTO", "Chief Digital Officer",
                # Customer Engagement — Service
                "Chief Customer Officer", "Chief Operating Officer",
                "EVP/SVP/VP of Customer Service",
                "EVP/SVP/VP of Field Service",
                # Customer Engagement — Sales
                "Chief Revenue Officer",
                "EVP/SVP/VP of Sales / Sales Operations",
                "EVP/SVP/VP of Revenue Operations",
                # Employee Experience
                "Chief People Officer", "CHRO",
                # Risk & Compliance
                "Chief Risk Officer", "CFO", "General Counsel",
                # AI Platform
                "CTO", "Chief Data Officer", "Chief Digital Officer",
            ],
        },
        "behavioral_hypothesis": (
            "Consumes depth in financial justification content but is otherwise "
            "sparse. Short, targeted sessions: pricing pages, ROI calculators, "
            "executive briefs. Low page depth, short session duration, "
            "summary-oriented focus. Often arrives via a forwarded link from "
            "the Champion — not via organic search."
        ),
        "primary_indicators": [
            "ROI calculator usage",
            "Pricing page views",
            "Executive brief downloads",
            "Business value / outcome-focused content views",
            "Short sessions with high-value content (< 5 min, 1-2 pages)",
        ],
        "counter_indicators": [
            "Extended time on technical documentation",
            "Community or forum engagement",
            "High session frequency and broad content exploration",
            "How-to or training content views",
        ],
        "content_seeks": [
            "ROI calculators and TCO tools",
            "Pricing and packaging pages",
            "Executive briefs (2-4 pages, outcome-oriented)",
            "Business value and cost-of-legacy-drag content",
            "Analyst reports (Gartner MQ, Forrester Wave)",
        ],
        "content_avoids": [
            "Technical documentation and API reference",
            "How-to and training content",
            "Community forums and peer Q&A",
        ],
        "double_diamond_role": {
            "diverge": (
                "Sizes the problem, translates pain into target outcomes, "
                "shortlists viable approaches and vendors. At Progression "
                "stage: validates ROI and TCO scenarios, confirms solution "
                "meets defined KPI goals, understands rollout and adoption plans."
            ),
            "converge": (
                "De-risks the investment and confirms value in quarters, not "
                "years. Gates Business Value Alignment convergence point. "
                "Signs off on Final Commitment alongside Ratifier."
            ),
        },
        "convergence_points_gated": [
            "problem_validation",
            "business_value_alignment",
            "risk_compliance_validation",
            "final_commitment",
        ],
        "classification_status": {
            "ml_classifier_v1": "covered",
            "confidence_ceiling": "high",
            "notes": (
                "Well-classified via behavioral signals (ROI calculator, pricing "
                "page) combined with firmographic title matching. Behavioral-only "
                "classification is reliable when ROI calculator usage is present. "
                "Without it, EB and Champion signals can overlap at MEDIUM confidence."
            ),
        },
    },

    "influencer": {
        "label": "Influencer",
        "definition": (
            "The voice that shapes the decision behind the scenes, even without "
            "formal budget authority. Evaluates how the solution would impact "
            "their team or function and provides input that other roles weigh "
            "heavily. Often the most technically rigorous evaluator in the group."
        ),
        "typical_titles": {
            "_status": "DEPRECATED — do not use for classification",
            "_superseded_by": "TITLE_ROLE_MAP (§19) with solution_key as required parameter",
            "_retained_for": "Human readability and documentation authoring only",
            "_titles": [
                # IT & Operations
                "Enterprise Architect", "IT Manager",
                "Head of Platform Engineering", "Director of Business Applications",
                # Customer Engagement — Service
                "VP of IT / Director of Business Applications",
                "Head of Workforce Management",
                "VP of Product or Operations",
                # Customer Engagement — Sales
                "VP of Marketing / Demand Generation",
                "Director of IT or Business Systems",
                "Finance Controller / FP&A",
                # Employee Experience
                "Business Analyst", "Process Owner",
                "Director of HR Technology",
                # Risk & Compliance
                "IT Security Manager", "Data Privacy Officer",
                "VP of Procurement",
                # AI Platform
                "Head of Data Engineering", "ML Platform Lead",
                "Director of Automation",
            ],
        },
        "behavioral_hypothesis": (
            "Consumes depth within a single solution or product area. Evaluating "
            "fit for their specific domain: use cases, product pages, integration "
            "documentation, best practices guides, and technical webinars. Moderate "
            "session frequency. Goes deep on product features and integration "
            "compatibility — these are their stress-test visits."
        ),
        "primary_indicators": [
            "Use case page exploration (depth > 3 min)",
            "Product tour engagement (start and progression)",
            "Webinar registration or attendance",
            "Integration catalog or API reference views",
            "Industry-specific content within single solution category",
            "Technical documentation engagement (medium depth, 5-10 min)",
        ],
        "counter_indicators": [
            "Pricing or ROI content as primary focus",
            "Competitive comparisons and case study hoarding (Champion pattern)",
            "Exclusive focus on how-to/training content (User pattern)",
            "Security/compliance content as primary focus (Ratifier pattern)",
        ],
        "content_seeks": [
            "Use case walkthroughs specific to their function",
            "Product tours and interactive demos",
            "Integration maps and connector documentation",
            "Technical webinars and product briefings",
            "Best practices guides and implementation considerations",
        ],
        "content_avoids": [
            "Pricing and ROI content",
            "Narrow operational step-by-step how-tos",
            "Executive summary content",
        ],
        "double_diamond_role": {
            "diverge": (
                "Shapes requirements and stress-tests how work will flow for "
                "their team. Evaluates solution fit against specific functional "
                "and technical requirements. At Progression stage: validates "
                "'how it works for us' use cases, runs or interprets proof of "
                "concept, issues recommendations."
            ),
            "converge": (
                "Validates solution fit at Requirements Framing and Solution "
                "Validation convergence points. Issues recommendations that the "
                "Champion uses to build the final internal case. Surfacing "
                "integration complexity or feature gaps at this stage is the "
                "most common source of loop-backs."
            ),
        },
        "convergence_points_gated": [
            "requirements_framing",
            "solution_validation",
            "business_value_alignment",
        ],
        "classification_status": {
            "ml_classifier_v1": "covered",
            "confidence_ceiling": "medium",
            "notes": (
                "Behavioral ceiling at MEDIUM for anonymous visitors — Influencer "
                "signals (use case, product tour, webinar) overlap with Champion "
                "patterns at lower engagement depth. The key differentiator is "
                "depth-within-solution vs. breadth-across-solutions. Firmographic "
                "title matching improves confidence significantly for identified visitors."
            ),
        },
    },

    "user": {
        "label": "User",
        "definition": (
            "The hands-on operator who cares whether the solution actually works "
            "in real life. Evaluates based on usability, task efficiency, and "
            "practical fit for daily work. Surfaces frontline friction that other "
            "roles cannot see and validates that the solution is worth adopting."
        ),
        "typical_titles": {
            "_status": "DEPRECATED — do not use for classification",
            "_superseded_by": "TITLE_ROLE_MAP (§19) with solution_key as required parameter",
            "_retained_for": "Human readability and documentation authoring only",
            "_titles": [
                # IT & Operations
                "IT Support Analyst", "Service Desk Agent", "IT Coordinator",
                # Customer Engagement — Service
                "Customer Service Manager / Supervisor",
                "Service Agent / Support Specialist",
                "Field Service Technician", "Dispatcher / Scheduler",
                # Customer Engagement — Sales
                "Account Executive (AE)", "Sales Development Rep (SDR)",
                "Sales Engineer", "Customer Success Manager",
                # Employee Experience
                "HR Coordinator", "Recruiter", "Learning & Development Specialist",
                # Risk & Compliance
                "GRC Analyst", "Security Analyst", "Vendor Manager",
                # AI Platform
                "Data Analyst", "Business Intelligence Analyst",
                "Automation Analyst",
            ],
        },
        "behavioral_hypothesis": (
            "Consumes task-oriented, practical content. Asking 'how does this "
            "work?' and 'can I do my job with this?' Gravitates toward how-to "
            "guides, training resources, FAQs, support documentation, and "
            "community forums. Engages with demo environments and product tours "
            "to experience the interface, not evaluate architecture."
        ),
        "primary_indicators": [
            "How-to and training content views",
            "Community and forum engagement",
            "FAQ and support documentation visits",
            "Task-specific site search terms",
            "Product tour engagement focused on UI/workflow (vs. capabilities)",
        ],
        "counter_indicators": [
            "Pricing or ROI content engagement",
            "Case study or competitive comparison downloads",
            "Multi-solution area exploration",
            "Executive brief downloads",
            "Security whitepaper or compliance doc downloads",
        ],
        "content_seeks": [
            "How-to guides and step-by-step tutorials",
            "Training resources and certification paths",
            "FAQs and support documentation",
            "Community forums and peer Q&A",
            "Product tours focused on daily workflow tasks",
        ],
        "content_avoids": [
            "Executive-level business case content",
            "Pricing pages and ROI calculators",
            "Competitive comparisons",
            "Security and compliance documentation",
        ],
        "double_diamond_role": {
            "diverge": (
                "Surfaces frontline friction and must-have workflows that "
                "other roles miss. Participates in concept workflows and "
                "demo evaluations. At Progression stage: validates use-based "
                "demos, recommends adoption and training milestones, assesses "
                "change management requirements."
            ),
            "converge": (
                "Validates solution fit at Requirements Framing and Solution "
                "Validation convergence points. User veto — a strong negative "
                "recommendation from the User role can stall or reverse a "
                "deal that other roles have approved. Their convergence point "
                "participation is often underweighted and then surfaced as a "
                "late-stage friction event."
            ),
        },
        "convergence_points_gated": [
            "requirements_framing",
            "solution_validation",
        ],
        "classification_status": {
            "ml_classifier_v1": "pending",
            "confidence_ceiling": "medium",
            "notes": (
                "User signals (how-to, community, FAQ) are present in post-sale "
                "customer traffic, creating a classification noise problem: pre-sale "
                "User signals and post-sale customer support signals look identical. "
                "TAL status filter is essential before applying User classification. "
                "Added to ML classifier training set as labeled data accumulates."
            ),
        },
    },

    "ratifier": {
        "label": "Ratifier",
        "definition": (
            "The checkpoint ensuring the deal is legally sound, technically "
            "compliant, and commercially acceptable. Validates that the solution "
            "meets security, legal, compliance, or procurement requirements. "
            "Can block a deal but rarely initiates one. Arrives late-stage "
            "and moves quickly when properly enabled."
        ),
        "typical_titles": {
            "_status": "DEPRECATED — do not use for classification",
            "_superseded_by": "TITLE_ROLE_MAP (§19) with solution_key as required parameter",
            "_retained_for": "Human readability and documentation authoring only",
            "_titles": [
                # Universal across all categories
                "Chief Financial Officer (CFO)",
                "VP of Finance / FP&A Leader",
                "Chief Information Officer (CIO)",
                "Chief Technology Officer (CTO)",
                "Head of Data Privacy / Security",
                "Legal Counsel / General Counsel",
                "Chief Information Security Officer (CISO)",
                "Procurement Manager / VP of Procurement",
                "Data Protection Officer (DPO)",
                "Compliance Officer",
            ],
        },
        "behavioral_hypothesis": (
            "Consumes validation and compliance content with high specificity "
            "and low breadth. Focuses on security whitepapers, compliance "
            "certifications, technical architecture, data privacy documentation, "
            "and legal/procurement terms. Infrequent but deep. Late-stage "
            "engagement pattern. Often arrives via a link shared by the Champion "
            "or EB, not via organic discovery."
        ),
        "primary_indicators": [
            "Security whitepaper or Trust Center visits",
            "Compliance and governance content views (SOC 2, ISO 27001)",
            "Technical documentation engagement (10+ min)",
            "Data privacy / regulatory content views",
            "Legal / procurement / SLA documentation views",
        ],
        "counter_indicators": [
            "Demo requests or product tour engagement",
            "Case study or competitive comparison downloads",
            "Pricing or ROI content views",
            "Broad multi-solution exploration",
        ],
        "content_seeks": [
            "Security whitepapers and Trust Center documentation",
            "Compliance certifications (SOC 2, ISO 27001, FedRAMP)",
            "Technical architecture and data flow diagrams",
            "Data privacy and GDPR/CCPA documentation",
            "Legal terms, SLAs, and procurement guides",
        ],
        "content_avoids": [
            "Demo experiences and product overviews",
            "Marketing and thought leadership content",
            "Pricing and ROI calculators",
        ],
        "double_diamond_role": {
            "diverge": (
                "Clarifies procurement path and requirements early. Identifies "
                "risk flags, understands governance, privacy, and security "
                "requirements. At Progression stage: ensures standards "
                "alignment, finalises terms, SLAs, and liability. Issues "
                "formal approval or rejection."
            ),
            "converge": (
                "Gates Risk, Compliance & Technical Validation and Final "
                "Commitment convergence points. A Ratifier-triggered loop-back "
                "— Purchasing Rules Overrule Group Decision, Legal Flag, Capital "
                "Review Board — is the most damaging late-stage friction event "
                "because it occurs after the Champion and EB have aligned. "
                "Early Ratifier engagement is the primary mitigation."
            ),
        },
        "convergence_points_gated": [
            "risk_compliance_validation",
            "final_commitment",
        ],
        "classification_status": {
            "ml_classifier_v1": "pending",
            "confidence_ceiling": "medium",
            "notes": (
                "Ratifier classification is limited by two factors: (1) late-stage "
                "engagement means few behavioral signals exist before the role is "
                "CRM-confirmed; (2) the Security Trust Center — the strongest Ratifier "
                "signal — also attracts InfoSec Influencers. The key differentiator "
                "is session recency and solution breadth: Ratifiers arrive late and "
                "stay narrow. Zero-party progressive disclosure is the recommended "
                "path to HIGH confidence for this role."
            ),
        },
    },
}


# Default for unclassified visitors
DEFAULT_ROLE = "default"

# Roles covered by ML classifier at v1 launch
ML_CLASSIFIER_V1_COVERAGE = [
    role for role, data in ROLES.items()
    if data["classification_status"]["ml_classifier_v1"] == "covered"
]

# Convergence point participation lookup (role -> convergence points)
ROLE_CONVERGENCE_POINT_MAP = {
    role: data["convergence_points_gated"]
    for role, data in ROLES.items()
}


# =============================================================================
# §3  BUYING GROUP ROLE CONFIDENCE TIERS  [Signal Def §7 — CANONICAL]
#
# Measures how certain the system is about a visitor's buying group ROLE.
# This is distinct from Buying Job Confidence (separate construct below).
# Role confidence is the primary gate for personalization activation.
#
# All documents aligned to this four-tier model.
# Previous three-tier discrepancy (Fragment/Playbook used ≥70) is resolved.
#
# SCALE DIVERGENCE — READ BEFORE USING:
# CONFIDENCE_TIERS (§3): MEDIUM = 50–79, HIGH = 80–100
# ENGAGEMENT_THRESHOLDS (§14): MEDIUM_ENGAGEMENT = 40–69, HIGH_ENGAGEMENT = 70–100
# A score of 45 is LOW confidence but MEDIUM_ENGAGEMENT.
# A score of 72 is HIGH_ENGAGEMENT but MEDIUM confidence.
# These are distinct instruments. Always namespace which scale you are on.
# =============================================================================

CONFIDENCE_TIERS = {
    "high": {
        "min": 80,
        "max": 100,
        "label": "HIGH",
        "personalization_level": "Full role-specific experience",
        "fallback_level": 1,
        "cta_tone": "Direct, assumptive",
        "trigger_conditions": (
            "CRM-confirmed ML classifier prediction (Snowflake); OR "
            "zero-party form data + behavioral confirmation (+30 bonus applied)"
        ),
        "buying_job_inference": "Attempt — KNOWN or INFERRED buying job activates three-axis personalization",
    },
    "medium": {
        "min": 50,
        "max": 79,
        "label": "MEDIUM",
        "personalization_level": "Role-influenced content with safe fallback elements",
        "fallback_level": 2,
        "cta_tone": "Suggestive, educational",
        "trigger_conditions": (
            "Zero-party form classification without behavioral confirmation; OR "
            "strong behavioral pattern (3+ signals, score 50+, top role leads by 10+)"
        ),
        "buying_job_inference": "Attempt only if KNOWN (zero-party). Ignore INFERRED at MEDIUM — too noisy.",
    },
    "low": {
        "min": 25,
        "max": 49,
        "label": "LOW",
        "personalization_level": "Solution-interest content only — no role framing",
        "fallback_level": 3,
        "cta_tone": "Broad, awareness-oriented",
        "trigger_conditions": (
            "Limited behavioral signals (1-2 signals); OR ambiguous pattern "
            "(top role does not lead by 10+)"
        ),
        "buying_job_inference": "Do not attempt. Role is too uncertain to layer job inference on top.",
    },
    "unknown": {
        "min": 0,
        "max": 24,
        "label": "UNKNOWN",
        "personalization_level": "Account-level or default brand experience",
        "fallback_level": 4,
        "cta_tone": "Exploratory",
        "trigger_conditions": (
            "Insufficient data (single page view, <30 sec, no prior history); "
            "OR all signals below minimum thresholds"
        ),
        "buying_job_inference": "Do not attempt.",
    },
}


# =============================================================================
# §3a  BUYING JOB CONFIDENCE  [separate from role confidence — see glossary]
#
# Measures how certain the system is about which BUYING JOB a visitor is
# currently engaged in. Dependent on role confidence being at least MEDIUM.
# Three states (not four tiers — job confidence is not scored numerically).
# =============================================================================

BUYING_JOB_CONFIDENCE = {
    "known": {
        "label": "KNOWN",
        "source": "Zero-party self-identification via progressive disclosure prompt",
        "trigger": "Visitor explicitly answered a buying job question (e.g. 'What are you trying to accomplish today?')",
        "personalization": "Three-axis: role × stage × buying job",
        "aep_attribute": "buying_job_confirmed",
        "session_persistence": True,
        "decay_window_days": 90,
        "activation_condition": "Role confidence must be MEDIUM or HIGH",
    },
    "inferred": {
        "label": "INFERRED",
        "source": "Behavioral pattern matching against BUYING_JOB_INFERENCE_SIGNALS",
        "trigger": "Minimum 2 strong indicator content types observed in current session or last 30 days",
        "personalization": "Three-axis with probabilistic job selection — serve most likely variant",
        "aep_attribute": "buying_job_inferred",
        "session_persistence": False,  # re-inferred each session
        "decay_window_days": 30,
        "activation_condition": "Role confidence must be HIGH only — INFERRED job at MEDIUM role is too noisy",
    },
    "unknown": {
        "label": "UNKNOWN",
        "source": "None — default state",
        "trigger": "No progressive disclosure response and no matching behavioral pattern",
        "personalization": "Two-axis: role × stage. Serve most probable buying job for role/stage combination.",
        "aep_attribute": None,
        "fallback_behavior": "Use PROBABLE_JOB_PRIORS lookup to select most likely job for role × BG stage",
        "activation_condition": "Default — applies whenever role confidence < MEDIUM or no job signal",
    },
}


# =============================================================================
# §3b  PROBABLE JOB PRIORS
#
# Probable buying job by role × BG stage when buying job confidence is UNKNOWN.
# Used as a content selection prior — not a classification claim.
#
# v0.2.0 AR-04: Refactored from tuple-key pattern to nested dict for serialization safety.
# Stage keys must exactly match BG_STAGES: targeted, engaged, prioritized, qualified
# Buying job values must exactly match the four valid codes:
#   problem_identification, solution_exploration, requirements_building, supplier_selection
# None values for ratifier are intentional — Ratifiers do not appear in early stages;
#   a None return signals "do not infer a buying job for this role/stage combination"
# =============================================================================
PROBABLE_JOB_PRIORS = {
    "champion": {
        "targeted":    "problem_identification",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
    "economic_buyer": {
        "targeted":    "problem_identification",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
    "influencer": {
        "targeted":    "solution_exploration",   # INF enters later
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "requirements_building",
    },
    "user": {
        "targeted":    "solution_exploration",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "requirements_building",
    },
    "ratifier": {
        "targeted":    None,   # Ratifiers do not appear at targeted stage
        "engaged":     None,   # Ratifiers do not appear at engaged stage
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
}

# Behavioral patterns that suggest buying job (INFERRED state only)
# Requires 2+ strong indicators in current session or last 30 days
BUYING_JOB_INFERENCE_SIGNALS = {
    "problem_identification": {
        "strong_indicators": ["thought_leadership", "analyst_report", "diagnostic_assessment", "benchmark_report", "category_explainer"],
        # category_explainer moved from solution_exploration — CR-07
        "weak_indicators": ["blog_article", "industry_page"],
        "counter_indicators": ["roi_calculator", "pricing_page", "legal_procurement"],
    },
    "solution_exploration": {
        "strong_indicators": ["product_solution_overview", "use_case_page", "product_tour"],
        # category_explainer removed from solution_exploration — CR-07
        "weak_indicators": ["webinar_event_registration", "video_content"],
        "counter_indicators": ["legal_procurement", "security_compliance"],
    },
    "requirements_building": {
        "strong_indicators": ["technical_documentation", "integration_catalog", "rfp_template", "use_case_page"],
        "weak_indicators": ["product_tour", "webinar_event_registration"],
        "counter_indicators": ["blog_article", "thought_leadership"],
    },
    "supplier_selection": {
        "strong_indicators": ["roi_calculator", "pricing_page", "executive_brief", "competitive_comparison"],
        "weak_indicators": ["case_study", "analyst_report"],
        "counter_indicators": ["howto_training", "community_forum"],
    },
}


# =============================================================================
# §4  FALLBACK CASCADE  [Signal Def §6.4]
#
# Routing modifier: see 'pending_solution_fallback' entry below for coverage-gated ceiling.
# =============================================================================

FALLBACK_CASCADE = [
    {
        "level": 1,
        "name": "Role-specific experience",
        "trigger": "Role confidence = HIGH",
        "description": (
            "Content, CTAs, and framing fully tailored to the classified role "
            "for the relevant solution category. Three-axis personalization "
            "activates if buying job confidence is KNOWN or INFERRED."
        ),
    },
    {
        "level": 2,
        "name": "Role-influenced experience",
        "trigger": "Role confidence = MEDIUM",
        "description": (
            "Content leans toward the classified role but retains safe fallback "
            "elements. No highly role-specific CTAs. Three-axis activates only "
            "if buying job confidence is KNOWN (not INFERRED)."
        ),
    },
    {
        "level": 3,
        "name": "Solution-interest experience",
        "trigger": "Role confidence = LOW or UNKNOWN with identified solution interest",
        "description": (
            "Content organised by solution category without role-specific framing. "
            "No role assumptions made. Serving the most probable content for the "
            "solution area based on account-level signals."
        ),
    },
    {
        "level": 4,
        "name": "Account-level experience",
        "trigger": "TAL account identified — no solution interest or role signal",
        "description": (
            "Personalised by industry, company size, or account attributes only. "
            "No solution or role assumptions."
        ),
    },
    # -------------------------------------------------------------------------
    # Not a cascade level — a routing modifier that applies a MEDIUM confidence
    # ceiling when solution coverage is pending or constructed. Evaluated at
    # Step 2 of the fallback level activation sequence (Document 5, Section 1.6).
    # CR-08 origin; merged from standalone FALLBACK_CASCADE_PENDING_SOLUTION per
    # Document 5 Section 10.1 authority: §4 FALLBACK_CASCADE is the single
    # authority for all routing directives.
    # -------------------------------------------------------------------------
    {
        "pending_solution_fallback": {
            "behavior": "category_level_anchor_titles",
            "description": (
                "When a visitor's solution interest maps to a TITLE_ROLE_MAP entry with "
                "coverage_status: 'pending', fall back to the champion_typical_title and "
                "economic_buyer_typical_title anchor titles defined in §1c SOLUTIONS for "
                "firmographic matching. Confidence ceiling remains MEDIUM. Do not apply "
                "firmographic_confirmation_bonus."
            ),
            "confidence_ceiling": "medium",
            "apply_firmographic_bonus": False,
            "logging_requirement": (
                "Flag all pending-solution fallback events with solution_key and visitor_id "
                "for coverage gap tracking."
            ),
            "escalation_threshold": {
                "fallback_event_count": 50,
                "window_days": 7,
                "alert_channel": "slack_data_team_channel",
                "description": (
                    "High fallback volume for a pending solution signals it should be "
                    "prioritized for coverage completion."
                ),
                "calibration_note": (
                    "This threshold (50 events / 7 days) is a starting hypothesis — "
                    "it was set without baseline data and must be tuned in the first "
                    "sprint cycle after deployment. For high-volume solutions "
                    "(agent_platform, security_operations), this may fire in week 1 "
                    "and produce alert fatigue. For low-volume solutions, it may "
                    "never fire. The build session must capture fallback event "
                    "volume per solution_key from day one to enable calibration."
                ),
            },
        },
    },
    {
        "level": 5,
        "name": "Default brand experience",
        "trigger": "Non-TAL or unidentified visitor",
        "description": (
            "Standard kalder.com experience with no personalisation. "
            "Exploratory CTAs only."
        ),
    },
]


# =============================================================================
# §5  BUYING GROUP STAGES  [Signal Def §3.1, Segmentation §2]
#
# Seller-centric, opportunity-centric pipeline health measure.
# Based on Forrester B2B Revenue Waterfall (Detected → Engaged →
# Prioritized → Qualified).
# Distinct from convergence points, which are buyer-centric milestones.
# Data source: Snowflake ML classifier + CRM via Kafka → AEP.
# =============================================================================

BG_STAGES = {
    "targeted": {
        "label": "Targeted",
        "forrester_equivalent": "Detected",
        "description": (
            "Account is on the TAL. No engagement from any BG members "
            "in the last 180 days. Buying group exists on paper but has "
            "not yet shown interest."
        ),
        "cohort_mapping": "education",
        "personalization_focus": "Education — build problem awareness and urgency",
        "double_diamond_phase": "Pre-diverge — no job signal yet",
    },
    "engaged": {
        "label": "Engaged",
        "forrester_equivalent": "Engaged",
        "description": (
            "At least one engagement from any BG member in the last 180 days. "
            "Early interest is present. Diverge phase has begun for at least "
            "one role."
        ),
        "cohort_mapping": "acquisition",
        "personalization_focus": "Acquisition — connect challenges to Kalder capabilities",
        "double_diamond_phase": "Diverge — individual JTBDs beginning",
    },
    "prioritized": {
        "label": "Prioritized",
        "forrester_equivalent": "Prioritized",
        "description": (
            "2+ members (or one hand-raiser) engaged in the last 90 days "
            "with no active opportunity. Real momentum — multiple roles "
            "are active in the diverge phase."
        ),
        "cohort_mapping": "acquisition",
        "personalization_focus": "Acquisition/Progression — proof points, competitive differentiation",
        "double_diamond_phase": "Diverge — multiple roles active; first convergence points approaching",
    },
    "qualified": {
        "label": "Qualified",
        "forrester_equivalent": "Qualified",
        "description": (
            "At least one accepted member converted into a Stage 1+ opportunity. "
            "Sales is actively engaged. Group is working toward convergence "
            "points to advance the opportunity."
        ),
        "cohort_mapping": "progression_early_to_mature",
        "personalization_focus": "Progression — reinforce value, reduce evaluation friction, enable convergence",
        "double_diamond_phase": "Converge — group alignment is the primary job",
    },
}


# =============================================================================
# §6  CAMPAIGN COHORTS  [Segmentation §2]
#
# Volume estimates are Kalder-plausible approximations.
# Baseline establishment required before targets can be set.
# ServiceNow IT-specific volume numbers from source removed.
# =============================================================================

CAMPAIGN_COHORTS = {
    "education": {
        "label": "Education",
        "priority": 4,
        "entry_criteria": {
            "bg_stage": "Targeted",
            "engagement": "Low",
            "opportunity": "None",
            "bg_members": "< 2 identified",
        },
        "activation_intent": (
            "Build problem awareness. Position Kalder as a trusted guide "
            "before the buying cycle begins. Serve content that helps "
            "potential Champions name and size the problem."
        ),
        "content_focus": "Thought leadership, industry trends, challenge framing, diagnostic tools",
        "double_diamond_phase": "Pre-diverge — seeding problem identification",
        "estimated_volume": "pending_baseline",
        "content_gating": "Ungated — broad distribution, light personalisation",
    },
    "acquisition": {
        "label": "Acquisition",
        "priority": 3,
        "entry_criteria": {
            "bg_stage": "Engaged or Prioritized",
            "engagement": "Low or Medium",
            "opportunity": "None",
            "bg_members": "2+ identified",
        },
        "activation_intent": (
            "Activate and complete buying groups. Help each role complete "
            "their diverge-phase JTBDs. Convert interest into known, "
            "engaged buyers across all five roles."
        ),
        "content_focus": "Solution overviews, use cases, product tours, competitive differentiation, demos",
        "double_diamond_phase": "Diverge — role-specific JTBD enablement",
        "estimated_volume": "pending_baseline",
        "content_gating": "Mix of gated and ungated",
    },
    "progression_early_to_mature": {
        "label": "Progression Early-to-Mature",
        "priority": 2,
        "entry_criteria": {
            "bg_stage": "Qualified",
            "engagement": "Low or Medium",
            "opportunity": "Stage 2-4",
            "bg_members": "2+ identified",
        },
        "activation_intent": (
            "Deepen engagement across all BG members in active deals. "
            "Enable convergence points. Serve content that helps the "
            "group align toward shared position."
        ),
        "content_focus": "Case studies, ROI models, consensus briefs, implementation guides, proof of concept support",
        "double_diamond_phase": "Converge — group alignment and convergence point enablement",
        "estimated_volume": "pending_baseline",
        "content_gating": "Mix — converge content designed to travel internally",
    },
    "progression_win_now": {
        "label": "Progression Win Now",
        "priority": 1,
        "entry_criteria": {
            "bg_stage": "Qualified",
            "engagement": "Low or Medium",
            "opportunity": "Stage 5-7",
            "bg_members": "2+ identified",
        },
        "activation_intent": (
            "Final push for late-stage deals. Enable Final Commitment "
            "convergence point. Remove late-stage friction — especially "
            "Ratifier-triggered blockers."
        ),
        "content_focus": "Executive briefs, procurement guides, security docs, customer references, contract support",
        "double_diamond_phase": "Converge — Final Commitment convergence point",
        "estimated_volume": "pending_baseline",
        "content_gating": "Mixed — late-stage content highly personalised by role",
    },
}


# =============================================================================
# §7  CROSS-ROLE SIGNAL WEIGHT MATRIX  [Signal Def Appendix A, Table 28]
#
# Weights are testable hypotheses about role behavior.
# Scale: 0 to ±25. Positive = supports role. Negative = contradicts role.
# Validate against CRM ground truth as labeled data accumulates.
# Source weights retained from Signal Definition v0.6.4 (architecture-agnostic).
# New signals added: diagnostic_assessment, integration_catalog, security_trust_center.
# =============================================================================

CROSS_ROLE_WEIGHTS = {
    "case_study_download": {
        "label": "Case study / success story download",
        "champion": 20, "economic_buyer": 3, "influencer": 5, "user": 2, "ratifier": 2,
    },
    "competitive_comparison_view": {
        "label": "Competitive comparison page view",
        "champion": 18, "economic_buyer": 5, "influencer": 3, "user": 0, "ratifier": 2,
    },
    "demo_request": {
        "label": "Demo request submission",
        "champion": 20, "economic_buyer": 8, "influencer": 5, "user": 3, "ratifier": 0,
    },
    "multi_solution_exploration": {
        "label": "3+ solution areas explored (90-day window)",
        "champion": 15, "economic_buyer": 3, "influencer": -5, "user": -8, "ratifier": -10,
    },
    "roi_calculator_usage": {
        "label": "ROI calculator / TCO tool interaction",
        "champion": 8, "economic_buyer": 22, "influencer": 3, "user": 0, "ratifier": 3,
    },
    "pricing_page_view": {
        "label": "Pricing page view",
        "champion": 5, "economic_buyer": 15, "influencer": 3, "user": 0, "ratifier": 5,
    },
    "executive_brief_download": {
        "label": "Executive brief or consensus brief download",
        "champion": 10, "economic_buyer": 12, "influencer": 3, "user": -10, "ratifier": 3,
    },
    "use_case_exploration": {
        "label": "Use case page exploration (> 3 min)",
        "champion": 8, "economic_buyer": 3, "influencer": 15, "user": 8, "ratifier": 2,
    },
    "product_tour_engagement": {
        "label": "Product tour / interactive demo engagement",
        "champion": 8, "economic_buyer": 3, "influencer": 12, "user": 8, "ratifier": 2,
    },
    "webinar_registration": {
        "label": "Webinar registration or attendance",
        "champion": 8, "economic_buyer": 3, "influencer": 15, "user": 3, "ratifier": 3,
    },
    "howto_training_content": {
        "label": "How-to / training content view",
        "champion": 2, "economic_buyer": -10, "influencer": 5, "user": 18, "ratifier": 2,
    },
    "community_forum_engagement": {
        "label": "Community / forum engagement",
        "champion": 5, "economic_buyer": -12, "influencer": 5, "user": 15, "ratifier": 2,
    },
    "security_whitepaper_download": {
        "label": "Security whitepaper download",
        "champion": 5, "economic_buyer": 3, "influencer": 3, "user": 0, "ratifier": 20,
    },
    "compliance_governance_content": {
        "label": "Compliance / governance content view",
        "champion": 3, "economic_buyer": 5, "influencer": 3, "user": 0, "ratifier": 18,
    },
    "technical_docs_deep": {
        "label": "Technical documentation (10+ min dwell)",
        "champion": 3, "economic_buyer": -10, "influencer": 8, "user": 5, "ratifier": 12,
    },
    "faq_support_docs": {
        "label": "FAQ / support documentation view",
        "champion": 2, "economic_buyer": 0, "influencer": 3, "user": 12, "ratifier": 2,
    },
    # New signals added for Kalder full-website scope
    "diagnostic_assessment": {
        "label": "Diagnostic assessment / interactive quiz completion",
        "champion": 15, "economic_buyer": 8, "influencer": 5, "user": 3, "ratifier": 0,
    },
    "integration_catalog_view": {
        "label": "Integration catalog or API reference view",
        "champion": 3, "economic_buyer": 0, "influencer": 15, "user": 5, "ratifier": 3,
    },
    "security_trust_center_visit": {
        "label": "Security and Trust Center page visit",
        "champion": 5, "economic_buyer": 5, "influencer": 5, "user": 0, "ratifier": 22,
    },
    # CR-07: New signal supporting category_explainer content type
    "category_explainer_view": {
        "label": "Category explainer page view (60s+ dwell)",
        "champion": 6,
        "economic_buyer": 4,
        "influencer": 2,
        "user": 0,
        "ratifier": 0,
    },
}


# =============================================================================
# §7a  CONDITIONAL WEIGHT MODIFIERS  [Signal Def — CR-04]
#
# Named rules applied by the scoring engine when trigger conditions are met.
# These modifiers must be stored in the model and applied at classification time.
# Do not hard-code in application logic — that creates a second source of truth.
# =============================================================================

CONDITIONAL_WEIGHT_MODIFIERS = {
    "infosec_influencer_disambiguation": {
        "trigger_signal": "security_trust_center_visit",
        "co_occurrence_signals": ["integration_catalog_view", "technical_docs_deep"],
        "co_occurrence_window": "same_session",
        "requires_any": True,
        # Either co-occurrence signal is sufficient to trigger the modifier
        "modifications": {
            "ratifier": -12,    # 22 → 10
            "influencer": +10,  # 5 → 15
        },
        "rationale": (
            "A security_trust_center_visit in isolation is a strong Ratifier signal "
            "(compliance validation, late-stage). The same visit co-occurring with "
            "integration_catalog_view or technical_docs_deep signals an InfoSec "
            "Influencer conducting architecture evaluation — not a Ratifier doing "
            "compliance validation. The behavioral pattern distinguishes the roles "
            "where title data alone cannot."
        ),
        "behavioral_note": (
            "Security Trust Center visits consumed in isolation indicate a Ratifier "
            "conducting compliance validation. The same visit co-occurring with "
            "integration catalog or deep technical documentation engagement indicates "
            "an InfoSec Influencer building an architecture evaluation — they are "
            "consuming both the compliance posture and the technical integration "
            "surface in the same session, which is an Influencer behavior pattern, "
            "not a Ratifier one."
        ),
        "validation_status": "Hypothesis",
        "validation_metric": (
            "T2-06 Role Classification Accuracy — Ratifier and Influencer "
            "disambiguation rate at ≥60% accuracy threshold"
        ),
        "version": "v0.6.4",
    },

    "infosec_influencer_disambiguation_whitepaper": {
        "trigger_signal": "security_whitepaper_download",
        "co_occurrence_signals": ["integration_catalog_view", "technical_docs_deep"],
        "co_occurrence_window": "same_session",
        "requires_any": True,
        # Either co-occurrence signal is sufficient to trigger the modifier
        "modifications": {
            "ratifier": -10,    # 20 → 10
            "influencer": +10,  # 3 → 13
        },
        "rationale": (
            "A security_whitepaper_download that co-occurs with integration_catalog_view "
            "or technical_docs_deep in the same session shifts the behavioral interpretation "
            "from compliance validation (Ratifier) to architecture evaluation (Influencer). "
            "Mirrors the infosec_influencer_disambiguation logic for security_trust_center_visit "
            "with adjusted deltas reflecting the lower base Ratifier weight for this signal "
            "(20 vs. 22) and the lower base Influencer weight (3 vs. 5)."
        ),
        "behavioral_note": (
            "Security whitepaper downloads consumed in isolation indicate a Ratifier "
            "conducting compliance due diligence. The same download co-occurring with "
            "integration catalog or deep technical documentation engagement indicates "
            "an InfoSec Influencer building an architecture evaluation — they are "
            "consuming both the security specification and the technical integration "
            "surface in the same session, which is an Influencer behavior pattern, "
            "not a Ratifier one."
        ),
        "validation_status": "Hypothesis",
        "validation_metric": (
            "T2-06 Role Classification Accuracy — Ratifier and Influencer "
            "disambiguation rate at ≥60% accuracy threshold"
        ),
        "version": "v0.6.4",
    },
}


# =============================================================================
# §8  SIGNAL RECENCY & DECAY  [Signal Def §8]
#
# Decay multipliers applied to signal weights based on when signal occurred.
# Aligned with ML classifier's 180-day engagement window.
# =============================================================================

DECAY_MULTIPLIERS = {
    "current_session": {
        "multiplier": 1.5,
        "window": "Current session",
        "description": "Strongest indicator of current intent. Real-time personalisation decisions.",
    },
    "last_90_days": {
        "multiplier": 1.0,
        "window": "Last 90 days",
        "description": "Current and reliable role behavior indicators (baseline).",
        "bg_stage_alignment": "Prioritized stage: 2+ members engaged in last 90 days",
    },
    "91_to_180_days": {
        "multiplier": 0.7,
        "window": "91-180 days",
        "description": "Still contributes but discounted. Role and intent may have evolved.",
        "bg_stage_alignment": "ML classifier engagement window boundary (180 days)",
    },
    "over_180_days": {
        "multiplier": 0.0,
        "window": "> 180 days",
        "description": "Historical context only. Does not contribute to role scores.",
        "bg_stage_alignment": "ML classifier excludes activity beyond 180 days",
    },
    # CR-05: Anonymous visitor continuity multiplier
    "anonymous_visitor_long_decay": {
        "multiplier": 0.2,
        "window": "181–365 days",
        "applies_to": "anonymous_unidentified_only",
        "description": (
            "Preserves weak signal continuity for return anonymous visitors. "
            "Does not apply to CRM-confirmed contacts, where over_180_days: 0.0 stands."
        ),
        "identity_transition_behavior": {
            "rule": "rescore_on_identification",
            "description": (
                "When an anonymous visitor with 181–365 day signal history becomes "
                "identified (via progressive disclosure or CRM match), historical signals "
                "in this window are rescored using the identified-visitor rules — which "
                "apply over_180_days: 0.0. The anonymous_visitor_long_decay multiplier "
                "does not persist after identification. This prevents weak anonymous "
                "signal history from inflating the identified-visitor role score."
            ),
        },
    },
}

# Privacy note — CR-11 cross-reference:
# The over_180_days: 0.0 multiplier is a SCORING control, not a DATA RETENTION control.
# A signal scored at 0.0 still exists in the data store. Actual deletion of signals
# beyond the retention window is governed by PRIVACY_CONSENT_ARCHITECTURE (§P),
# not by this section.


# =============================================================================
# §9  CONTENT TYPE TAXONOMY  [Tagging §3, CRM deck — buyer journey aligned]
#
# Content types are organised by buying job (outside-in) with campaign stage
# as a secondary organiser. Each type carries a phase annotation
# (diverge / converge / both) reflecting the double-diamond model.
#
# Format is a separate dimension — see CONTENT_FORMATS below.
# Content type answers: "what does engaging with this reveal about the visitor?"
# Content format answers: "how is this delivered?"
# =============================================================================

CONTENT_TYPES = {

    # --- Problem Identification (Education stage — diverge) ---
    "thought_leadership": {
        "label": "Thought Leadership",
        "buying_job": "problem_identification",
        "campaign_stage": "Education",
        "phase": "diverge",
        "definition": "Original POV content, trend analysis, cost-of-inaction framing. Problem-centric, not solution-centric.",
        "primary_role_affinity": "general",
        "maps_to_signals": ["case_study_download", "competitive_comparison_view"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "diagnostic_assessment": {
        "label": "Diagnostic Assessment",
        "buying_job": "problem_identification",
        "campaign_stage": "Education",
        "phase": "diverge",
        "definition": "Interactive tools that help buyers identify and quantify their problem. High Champion and EB signal.",
        "primary_role_affinity": "champion",
        "maps_to_signals": ["diagnostic_assessment"],
        "engagement_threshold": {"type": "tool_interaction", "minimum_seconds": 120},
        "gating": "ungated",
    },
    "benchmark_report": {
        "label": "Benchmark / Peer Comparison Report",
        "buying_job": "problem_identification",
        "campaign_stage": "Education",
        "phase": "diverge",
        "definition": "Industry data that contextualises the buyer's situation against peers. Validates urgency.",
        "primary_role_affinity": "economic_buyer",
        "maps_to_signals": ["executive_brief_download"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "analyst_report": {
        "label": "Analyst Report (Gartner, Forrester, IDC)",
        "buying_job": "problem_identification",
        "campaign_stage": "Education",
        "phase": "diverge",
        "definition": "Third-party validation of the problem space and solution landscape. Champion ammunition.",
        "primary_role_affinity": "general",
        "maps_to_signals": ["case_study_download", "executive_brief_download"],
        "engagement_threshold": {"type": "dwell_time_or_epdf", "minimum_seconds": 60},
        "gating": "gated",
    },

    # --- Solution Exploration (Acquisition stage — diverge) ---
    "product_solution_overview": {
        "label": "Product / Solution Overview",
        "buying_job": "solution_exploration",
        "campaign_stage": "Acquisition",
        "phase": "diverge",
        "definition": "Solution landing pages, capability summaries. What Kalder does for this solution area.",
        "primary_role_affinity": "general",
        "maps_to_signals": ["multi_solution_exploration", "use_case_exploration"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    # CR-07: category_explainer moved from solution_exploration to problem_identification
    # and updated with correct buying_job, maps_to_signals, and definition
    "category_explainer": {
        "label": "Category Explainer",
        "buying_job": "problem_identification",   # moved from solution_exploration
        "campaign_stage": "Education",
        "phase": "diverge",
        "definition": (
            "Content that explains what a solution category is and why it matters — "
            "not what Kalder specifically does. Orients early-stage buyers who have "
            "identified a problem area but have not yet begun vendor evaluation."
        ),
        "primary_role_affinity": "champion",
        "maps_to_signals": ["category_explainer_view"],  # weight defined in §7 CROSS_ROLE_WEIGHTS
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "product_tour": {
        "label": "Product Tour / Interactive Demo",
        "buying_job": "solution_exploration",
        "campaign_stage": "Acquisition",
        "phase": "diverge",
        "definition": "Self-guided interactive walkthrough. Influencer and User evaluate daily workflow fit.",
        "primary_role_affinity": "influencer",
        "maps_to_signals": ["product_tour_engagement"],
        "engagement_threshold": {"type": "interaction_depth", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "integration_map": {
        "label": "Integration Map / Catalog",
        "buying_job": "solution_exploration",
        "campaign_stage": "Acquisition",
        "phase": "diverge",
        "definition": "How Kalder connects to existing infrastructure. Influencer primary — evaluating technical fit.",
        "primary_role_affinity": "influencer",
        "maps_to_signals": ["integration_catalog_view"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "video_content": {
        "label": "Video Content",
        "buying_job": "solution_exploration",
        "campaign_stage": "Education/Acquisition",
        "phase": "diverge",
        "definition": "Product overviews, executive perspectives, customer stories, capability demos.",
        "primary_role_affinity": "general",
        "maps_to_signals": [],  # pending role-specific video subtype signal mapping
        "engagement_threshold": {"type": "video_completion_threshold"},
        "gating": "ungated",
        "weights_pending_baseline": True,
        "notes": "Split into subtypes (executive_video, technical_demo, product_walkthrough) as data accumulates",
    },
    "webinar_event_registration": {
        "label": "Webinar / Event Registration",
        "buying_job": "solution_exploration",
        "campaign_stage": "Education/Acquisition",
        "phase": "diverge",
        "definition": "Webinar sign-ups, event landing pages. Signal is the act of registering.",
        "primary_role_affinity": "general",
        "maps_to_signals": ["webinar_registration"],
        "engagement_threshold": {"type": "form_submission"},
        "gating": "gated",
    },

    # --- Requirements Building (Acquisition/Progression — diverge) ---
    "use_case_page": {
        "label": "Use Case Page",
        "buying_job": "requirements_building",
        "campaign_stage": "Acquisition",
        "phase": "diverge",
        "definition": "Specific scenarios mapped to roles and outcomes. Influencer and User evaluate fit.",
        "primary_role_affinity": "influencer",
        "maps_to_signals": ["use_case_exploration"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "technical_documentation": {
        "label": "Technical Documentation",
        "buying_job": "requirements_building",
        "campaign_stage": "Acquisition/Progression",
        "phase": "diverge",
        "definition": "API docs, architecture diagrams, integration guides. Influencer deep evaluation.",
        "primary_role_affinity": "influencer",
        "maps_to_signals": ["technical_docs_deep"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 90},
        "gating": "ungated",
    },
    "rfp_template": {
        "label": "RFP Template / Evaluation Framework",
        "buying_job": "requirements_building",
        "campaign_stage": "Acquisition",
        "phase": "diverge",
        "definition": "Editable requirements frameworks that give the group a shared evaluation structure.",
        "primary_role_affinity": "champion",
        "maps_to_signals": ["case_study_download", "executive_brief_download"],
        "engagement_threshold": {"type": "dwell_time_or_epdf", "minimum_seconds": 60},
        "gating": "gated",
    },
    "demo_trial_request": {
        "label": "Demo / Trial Request",
        "buying_job": "requirements_building",
        "campaign_stage": "Acquisition/Progression",
        "phase": "diverge",
        "definition": "Form-gated demo requests, proof of concept initiation.",
        "primary_role_affinity": "champion",
        "maps_to_signals": ["demo_request"],
        "engagement_threshold": {"type": "form_submission"},
        "gating": "gated",
    },

    # --- Supplier Selection (Progression stage — diverge + converge) ---
    "case_study": {
        "label": "Case Study",
        "buying_job": "supplier_selection",
        "campaign_stage": "Acquisition/Progression",
        "phase": "both",   # diverge when consumed individually; converge when forwarded
        "definition": "Customer proof with named accounts and quantified outcomes. Champion ammunition.",
        "primary_role_affinity": "champion",
        "maps_to_signals": ["case_study_download"],
        "engagement_threshold": {"type": "dwell_time_or_epdf", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "competitive_comparison": {
        "label": "Competitive Comparison",
        "buying_job": "supplier_selection",
        "campaign_stage": "Acquisition",
        "phase": "diverge",
        "definition": "Head-to-head comparisons, analyst evaluations, battle cards.",
        "primary_role_affinity": "champion",
        "maps_to_signals": ["competitive_comparison_view"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "roi_calculator": {
        "label": "ROI Calculator / TCO Tool",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression",
        "phase": "diverge",
        "definition": "Interactive financial modelling. EB primary — justifying the spend.",
        "primary_role_affinity": "economic_buyer",
        "maps_to_signals": ["roi_calculator_usage"],
        "engagement_threshold": {"type": "tool_interaction", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "pricing_page": {
        "label": "Pricing Page",
        "buying_job": "supplier_selection",
        "campaign_stage": "Acquisition/Progression",
        "phase": "diverge",
        "definition": "Packaging, tiers, commercial structure. EB and Champion primary.",
        "primary_role_affinity": "economic_buyer",
        "maps_to_signals": ["pricing_page_view"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },
    "executive_brief": {
        "label": "Executive Brief",
        "buying_job": "supplier_selection",
        "campaign_stage": "Acquisition/Progression",
        "phase": "both",
        "definition": "2-4 page outcome-oriented summary for senior leaders. Champion preps EB.",
        "primary_role_affinity": "economic_buyer",
        "maps_to_signals": ["executive_brief_download"],
        "engagement_threshold": {"type": "dwell_time_or_epdf", "minimum_seconds": 60},
        "gating": "gated",
    },
    "consensus_brief": {
        "label": "Consensus Brief",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression",
        "phase": "converge",    # primary converge content type
        "definition": (
            "Forwardable cross-role summary designed to help buying group members "
            "reconcile individually gathered information and reach a shared position. "
            "Synthesised from approved diverge content — must not introduce new claims. "
            "Champion is the primary distributor."
        ),
        "primary_role_affinity": "champion",
        "maps_to_signals": ["executive_brief_download"],
        "engagement_threshold": {"type": "dwell_time_or_epdf", "minimum_seconds": 30},
        "gating": "gated",
        "through_line_requirement": "mandatory",
        "generation_note": "Generated by Kalder Compose AFTER all role-specific diverge content is approved",
    },
    "customer_reference": {
        "label": "Customer Reference",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression",
        "phase": "converge",
        "definition": "Peer access — reference calls, peer community validation.",
        "primary_role_affinity": "champion",
        "maps_to_signals": ["case_study_download"],
        "engagement_threshold": {"type": "form_submission"},
        "gating": "gated",
    },
    "business_value": {
        "label": "Business Value / Outcomes",
        "buying_job": "supplier_selection",
        "campaign_stage": "Acquisition/Progression",
        "phase": "diverge",
        "definition": "Value proposition pages, cost-of-legacy-drag messaging, outcome quantification.",
        "primary_role_affinity": "economic_buyer",
        "maps_to_signals": ["roi_calculator_usage", "pricing_page_view"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
    },

    # --- Compliance / Risk (late Progression — diverge for Ratifier) ---
    "security_compliance": {
        "label": "Security / Compliance Documentation",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression (late)",
        "phase": "diverge",
        "definition": "SOC 2 reports, ISO 27001, FedRAMP documentation, security architecture.",
        "primary_role_affinity": "ratifier",
        "maps_to_signals": ["compliance_governance_content"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 90},
        "gating": "gated",
    },
    "governance_policy": {
        "label": "Governance / Privacy Policy",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression (late)",
        "phase": "diverge",
        "definition": "Data governance, privacy policy, GDPR/CCPA, regulatory compliance documentation.",
        "primary_role_affinity": "ratifier",
        "maps_to_signals": ["compliance_governance_content"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 90},
        "gating": "gated",
    },
    "legal_procurement": {
        "label": "Legal / Procurement",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression (late)",
        "phase": "diverge",
        "definition": "Terms of service, SLA documentation, procurement and commercial guides.",
        "primary_role_affinity": "ratifier",
        "maps_to_signals": ["security_whitepaper_download"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "gated",
    },
    "risk_mitigation_plan": {
        "label": "Risk Mitigation / Implementation Success Plan",
        "buying_job": "supplier_selection",
        "campaign_stage": "Progression (late)",
        "phase": "converge",
        "definition": "Implementation risk management, success plan, escalation paths. Addresses Ratifier blockers.",
        "primary_role_affinity": "ratifier",
        "maps_to_signals": ["security_whitepaper_download", "compliance_governance_content"],
        "engagement_threshold": {"type": "dwell_time_or_epdf", "minimum_seconds": 60},
        "gating": "gated",
    },

    # --- Post-sale / Operational (excluded from acquisition scoring) ---
    "howto_training": {
        "label": "How-To / Training",
        "buying_job": "post_sale",
        "campaign_stage": "Post-sale",
        "phase": "diverge",
        "definition": "Step-by-step guides, tutorials, certification paths. Pre-sale: User evaluation signal.",
        "primary_role_affinity": "user",
        "maps_to_signals": ["howto_training_content"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "ungated",
        "notes": "Suppress from Acquisition scoring for existing customer traffic. Apply TAL status filter.",
    },
    "community_forum": {
        "label": "Community / Forum",
        "buying_job": "post_sale",
        "campaign_stage": "Post-sale",
        "phase": "diverge",
        "definition": "Community discussions, peer Q&A. Heavy post-sale traffic — suppress for existing customers.",
        "primary_role_affinity": "user",
        "maps_to_signals": ["community_forum_engagement"],
        "engagement_threshold": {"type": "interaction", "minimum_seconds": 60},
        "gating": "ungated",
        "notes": "Suppress from Acquisition scoring for existing customer traffic.",
    },
    "faq_knowledge_base": {
        "label": "FAQ / Knowledge Base",
        "buying_job": "post_sale",
        "campaign_stage": "Cross-stage",
        "phase": "diverge",
        "definition": "Frequently asked questions, searchable KB articles.",
        "primary_role_affinity": "user",
        "maps_to_signals": ["faq_support_docs"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 30},
        "gating": "ungated",
    },
    "adoption_rollout": {
        "label": "Adoption / Implementation Planning",
        "buying_job": "post_sale",
        "campaign_stage": "Progression (late)",
        "phase": "converge",
        "definition": "Implementation guides, change management resources, rollout planning.",
        "primary_role_affinity": "economic_buyer",
        "maps_to_signals": ["roi_calculator_usage"],
        "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
        "gating": "gated",
    },
}


# Content format taxonomy — separate dimension from content type
CONTENT_FORMATS = {
    "web_page":    {"label": "Web Page",     "event_types": ["page_view", "dwell_time", "scroll_depth", "cta_click"]},
    "epdf":        {"label": "ePDF",         "event_types": ["open", "page_view", "scroll_depth", "download"]},
    "legacy_pdf":  {"label": "Legacy PDF",   "event_types": ["download"]},
    "video":       {"label": "Video",        "event_types": ["play", "watch_time", "completion_rate"]},
    "interactive": {"label": "Interactive",  "event_types": ["start", "step_completion", "input_submitted", "completion"]},
    "webinar":     {"label": "Webinar",      "event_types": ["registration", "attendance", "watch_time"]},
    "community":   {"label": "Community",    "event_types": ["view", "engagement", "post", "reply"]},
}


# =============================================================================
# §10  MODULE TYPES  [Fragment §3]
#
# Page assembly patterns for the knowledge-centric content model.
# Granularity patterns:
#   A = Section-Level (pre-authored variant, complete section swap)
#   B = Component-Level (individual component within a section)
#   C = Dynamic Assembly (layout shell + content graph query at render time)
# =============================================================================

MODULE_TYPES = {
    "hero": {
        "label": "Hero",
        "description": "Primary banner section at top of page. Headline, subhead, imagery, and primary CTA as a unified section.",
        "granularity_pattern": "A",
        "pattern_name": "Section-Level",
        "personalisation_axes": ["role", "confidence_tier", "solution_category"],
        "intended_axes": ["role", "solution_category", "confidence_tier"],
        "omitted_axes_rationale": {
            "buying_job": "Hero provides stage-generic orientation; buying job variation is handled by cta and gated_assets modules",
            "bg_stage": "Hero does not vary by pipeline stage — stage-level personalization handled by campaign cohort targeting upstream",
        },
    },
    "benefits": {
        "label": "Benefits",
        "description": "Key value proposition or benefits cards. Typically 3-4 cards authored and swapped as a complete set.",
        "granularity_pattern": "A",
        "pattern_name": "Section-Level",
        "personalisation_axes": ["role", "solution_category"],
        "intended_axes": ["role", "solution_category"],
        "omitted_axes_rationale": {
            "buying_job": "Benefits section is stage-stable; buying job variation handled by gated_assets",
            "confidence_tier": "Benefits render regardless of confidence level — no confidence gate applied",
            "bg_stage": "Benefits copy does not vary by pipeline stage",
        },
    },
    "cta": {
        "label": "CTA",
        "description": "Call-to-action block. Conversion-oriented. Confidence-split: HIGH confidence receives direct CTA; MEDIUM receives educational CTA.",
        "granularity_pattern": "A",
        "pattern_name": "Section-Level",
        "personalisation_axes": ["role", "confidence_tier", "buying_job"],
        "intended_axes": ["role", "confidence_tier", "buying_job"],
        "omitted_axes_rationale": {
            "solution_category": "CTA varies by role and buying job, not solution category — solution context is set by the page, not the module",
            "bg_stage": "bg_stage is an account-level signal; CTA operates at visitor/session level",
        },
    },
    "featured_solutions": {
        "label": "Featured Solutions",
        "description": "Container heading plus solution spotlights (typically 3), personalised as a complete set per role.",
        "granularity_pattern": "A",
        "pattern_name": "Section-Level",
        "personalisation_axes": ["role", "solution_category"],
        "intended_axes": ["role", "solution_category"],
        "omitted_axes_rationale": {
            "buying_job": "Solution spotlight selection is role-driven, not job-driven — job-level filtering happens in gated_assets",
            "confidence_tier": "Featured solutions display regardless of confidence tier",
        },
    },
    "perspectives": {
        "label": "Perspectives",
        "description": "Expert and customer perspectives. Quotes, testimonials, toggle behaviour. Trust narrative section.",
        "granularity_pattern": "A",
        "pattern_name": "Section-Level",
        "personalisation_axes": ["role", "solution_category", "industry"],
        "intended_axes": ["role", "solution_category", "industry"],
        "omitted_axes_rationale": {
            "buying_job": "Proof and perspectives are stage-stable social proof; job-level variation handled by gated_assets",
            "confidence_tier": "Perspectives render at all confidence tiers — trust-building is appropriate even at LOW",
        },
    },
    "gated_assets": {
        "label": "Gated Assets",
        "description": "Gated asset recommendation cards. Dynamic assembly: layout shell with content graph query filtered by role, stage, and JTBD.",
        "granularity_pattern": "C",
        "pattern_name": "Dynamic Assembly",
        "personalisation_axes": ["role", "confidence_tier", "buying_job", "campaign_cohort"],
        "intended_axes": ["role", "confidence_tier", "buying_job", "campaign_cohort"],
        "omitted_axes_rationale": {
            "solution_category": "Solution context is set by the page surface; gated_assets queries content graph using page-level solution context, not as a separate axis",
        },
    },
    "resource_crosslinks": {
        "label": "Resource Crosslinks",
        "description": "Resource mosaic cards. Related content filtered by role, cohort, and content format from content graph.",
        "granularity_pattern": "C",
        "pattern_name": "Dynamic Assembly",
        "personalisation_axes": ["role", "campaign_cohort", "content_type"],
        "intended_axes": ["role", "campaign_cohort", "content_type"],
        "omitted_axes_rationale": {
            "buying_job": "Resource crosslinks are role and stage cohort driven; buying job inference adds noise at the mosaic level",
            "confidence_tier": "Crosslinks render at all confidence tiers — ungated resource discovery is appropriate before role is confirmed",
        },
    },
    "product_card": {
        "label": "Product Card",
        "description": "Individual product highlight card within a product group. Emphasises role-relevant features.",
        "granularity_pattern": "B",
        "pattern_name": "Component-Level",
        "personalisation_axes": ["role"],
        "intended_axes": ["role"],
        "omitted_axes_rationale": {
            "solution_category": "Product card is scoped to a single product; solution_category is implicit in card context",
            "buying_job": "Feature emphasis is role-driven; buying job variation would require card-level copy permutations not warranted at component level",
            "confidence_tier": "Product card displays regardless of confidence — it is a product fact card, not a CTA",
        },
    },
    "navigation": {
        "label": "Navigation",
        "description": "Contextual navigation links and related solution recommendations personalised per role.",
        "granularity_pattern": "B",
        "pattern_name": "Component-Level",
        "personalisation_axes": ["role", "solution_category"],
        "intended_axes": ["role", "solution_category"],
        "omitted_axes_rationale": {
            "buying_job": "Navigation structure is role-driven; adding buying_job axis would require session-level nav recomposition that risks disorientation",
            "confidence_tier": "Navigation renders at all confidence tiers — wayfinding is always helpful",
        },
    },
    "logo_farm": {
        "label": "Logo Farm",
        "description": "Customer logo grid. Dynamic assembly: layout shell with content graph pool filtered by industry and solution.",
        "granularity_pattern": "C",
        "pattern_name": "Dynamic Assembly",
        "personalisation_axes": ["industry", "solution_category"],
        "intended_axes": ["industry", "solution_category"],
        "omitted_axes_rationale": {
            "role": "Logo farm is proof by industry and solution, not role — the same proof set is relevant across roles",
            "buying_job": "Customer proof selection is industry and solution driven; buying job filtering would over-narrow the pool",
            "confidence_tier": "Logo farms render at all confidence tiers",
        },
    },
    "testimonial": {
        "label": "Testimonial",
        "description": "Customer quote or case study card. Dynamic: card template with content graph pool filtered by role and industry.",
        "granularity_pattern": "C",
        "pattern_name": "Dynamic Assembly",
        "personalisation_axes": ["role", "industry", "solution_category"],
        "intended_axes": ["role", "industry", "solution_category"],
        "omitted_axes_rationale": {
            "buying_job": "Testimonial selection is role and industry driven; job-level testimonial permutations would require more content than is available at launch",
            "confidence_tier": "Testimonials render at all confidence tiers — social proof is appropriate before role is confirmed",
        },
    },
}


# =============================================================================
# §10a  MODULE COMPOSITION RULES  [CR-06 — architect expansion]
#
# Governs resolution when multiple modules on the same page personalize on
# overlapping axes. highest_specificity_wins is the default policy.
# =============================================================================

MODULE_COMPOSITION_RULES = {
    "conflict_resolution_policy": "highest_specificity_wins",
    "description": (
        "When multiple modules on a single page personalize on overlapping axes, "
        "the module with the most specific axis combination takes precedence. "
        "Stage-level signals from gated_assets override role-only signals from hero "
        "when the visitor's buying job inference differs from their bg_stage."
    ),
    "axis_priority_order": [
        "buying_job",       # most specific — inferred from session behavior
        "bg_stage",         # stage-level — inferred from account-level engagement
        "confidence_tier",  # role confidence
        "role",             # role classification
        "solution_category", # broadest
    ],
    "known_conflict_scenarios": {
        "hero_vs_gated_assets_stage_mismatch": {
            "description": (
                "A Champion in Acquisition bg_stage may receive an Acquisition hero "
                "while gated_assets surfaces Progression content if their buying job "
                "inference signals a later stage. Resolution: gated_assets buying_job "
                "axis takes precedence; hero demotes to solution_category-level variation."
            ),
            "resolution": "gated_assets buying_job overrides hero stage assumption",
        },
        "cta_vs_benefits_buying_job_mismatch": {
            "description": (
                "The cta module personalizes on [role, confidence_tier, buying_job]. "
                "The benefits module personalizes on [role, solution_category] only — "
                "it does not vary by buying_job. When a visitor's buying_job inference "
                "is 'supplier_selection' but the benefits module renders stage-generic "
                "content, the page may deliver a late-stage cta ('See pricing') "
                "alongside early-stage benefits copy ('Why Kalder?'). "
                "Resolution: on pages where both cta and benefits modules are present, "
                "the cta module's buying_job axis takes precedence. The benefits module "
                "should fall back to the role axis only — it does not attempt to match "
                "cta's buying_job specificity. If a benefits variant for the inferred "
                "buying_job does not exist, render the role-default benefits content "
                "rather than a generic fallback."
            ),
            "resolution": "cta buying_job overrides benefits stage assumption; benefits renders role-default when buying_job variant is absent",
        },
    },
}


# =============================================================================
# §11  METRIC HIERARCHY  [Measurement §2]
#
# Three tiers: T1 = programme outcomes, T2 = BG health, T3 = personalisation.
# Owner references updated to org chart role titles (named individuals removed).
# Data source references updated: Dynamics → Salesforce, Adobe Analytics →
# Segment / Snowflake where applicable.
# T2-09 added: Convergence Point Progression Rate (new metric).
# =============================================================================

METRICS = {

    # ── Tier 1: Programme Outcomes (opportunity / account level) ─────────────
    "T1-01": {
        "tier": 1,
        "name": "Stage 2 to Stage 5 Conversion Rate",
        "definition": "% of opps advancing from Stage 2 (Discovery) to Stage 5 (EB Validated)",
        "target": "20% increase QoQ",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce",
    },
    "T1-02": {
        "tier": 1,
        "name": "Win Rate — BG-Engaged",
        "definition": "% of Stage 2+ opps reaching Closed Won, by BG engagement level at opp creation",
        "target": "7%+ increase YoY",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce",
    },
    "T1-03": {
        "tier": 1,
        "name": "BG Contact Density on Opportunities",
        "definition": "% of Stage 2+ opps with 2+ engaged BG contacts attached",
        "target": "80%+",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Monthly",
        "data_source": "Salesforce",
    },
    "T1-04": {
        "tier": 1,
        "name": "Average Deal Size — BG-Engaged vs. Non-BG",
        "definition": "Mean NNACV for opps with BG engagement Medium+ vs. Low/no BG engagement",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce",
    },
    "T1-05": {
        "tier": 1,
        "name": "Pipeline Velocity — BG-Engaged",
        "definition": "Median days Stage 2 to Stage 5, by BG engagement level",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce",
    },
    "T1-06": {
        "tier": 1,
        "name": "Net New Pipeline — TAL",
        "definition": "Total pipeline value within 30K TAL, by solution category and cohort",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Monthly",
        "data_source": "Salesforce + AEP (cohort tag)",
    },

    # ── Tier 2: Buying Group Health (BG level, per solution category) ─────────
    "T2-01": {
        "tier": 2,
        "name": "Cohort Progression Rate (OEC)",
        "definition": "Net % of BGs advancing from one campaign cohort to the next within a measurement quarter",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce + AEP",
        "is_oec": True,
        "sub_metrics": ["T2-01a", "T2-01b", "T2-01c"],
    },
    "T2-01a": {
        "tier": 2,
        "name": "Education → Acquisition Progression",
        "definition": "Member identification event — BG gained 2+ members and engagement",
        "target": "Pending baseline",
        "owner": "Platform Engineering Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce + Kafka",
    },
    "T2-01b": {
        "tier": 2,
        "name": "Acquisition → Progression",
        "definition": "Sales process event — BG reached Qualified with Stage 1+ opportunity",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce",
    },
    "T2-01c": {
        "tier": 2,
        "name": "Progression Early-to-Mature → Win Now",
        "definition": "Deal execution event — opportunity advanced from Stage 2-4 to Stage 5+",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce",
    },
    "T2-02": {
        "tier": 2,
        "name": "BG Engagement Distribution",
        "definition": "Count and % of BGs at High / Medium / Low engagement, by solution category",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Monthly",
        "data_source": "Snowflake ML classifier",
    },
    "T2-04": {
        "tier": 2,
        "name": "Ratifier Discovery Rate",
        "definition": "Form conversion rate for Ratifier role identification by solution category",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Monthly",
        "data_source": "Segment / Snowflake",
    },
    "T2-05": {
        "tier": 2,
        "name": "BG Completeness Score",
        "definition": "Average distinct roles per BG at opp creation, by solution category",
        "target": "Pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Monthly",
        "data_source": "Salesforce + Snowflake ML classifier",
    },
    "T2-06": {
        "tier": 2,
        "name": "Role Classification Accuracy",
        "definition": "% of behaviourally classified visitors that match CRM role when CRM data becomes available",
        "target": "60% minimum",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Signal model vs. Salesforce CRM",
    },
    "T2-07": {
        "tier": 2,
        "name": "Engagement Threshold Validation",
        "definition": "Retroactive validation that engagement thresholds predict cohort progression",
        "target": "Empirical thresholds — pending baseline",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Salesforce + Snowflake ML classifier",
    },
    "T2-08": {
        "tier": 2,
        "name": "CRM-Confirmed Contact Pool Size",
        "definition": "Count of visitors with CRM role match available in AEP",
        "target": "Pending Kafka pipeline go-live",
        "owner": "Platform Engineering Lead",
        "cadence": "Monthly",
        "data_source": "AEP + Salesforce",
    },
    "T2-09": {
        "tier": 2,
        "name": "Convergence Point Progression Rate",
        "definition": (
            "% of opportunities that advance from one convergence point to the next "
            "within 30 days of convergence-enabling content (consensus brief, executive "
            "brief, risk mitigation plan) being served. Measures converge phase effectiveness."
        ),
        "target": "Pending baseline — new metric",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Monthly",
        "data_source": "AEP + Salesforce (convergence point events)",
        "notes": (
            "Proxy signals: Champion re-engagement after content gap (distributed internally); "
            "multi-role account engagement within 7-day window after consensus brief served; "
            "opportunity stage advancement within 30 days."
        ),
    },

    # ── Tier 3: Personalisation Performance (visitor / experience level) ──────
    "T3-01": {
        "tier": 3,
        "name": "Conversion Rate by Identification Layer",
        "definition": "Conversion segmented by identification layer (Account / BG Stage / Role)",
        "target": "Pending baseline",
        "owner": "T&O Lead",
        "cadence": "Monthly per activity",
        "data_source": "Segment / Snowflake",
    },
    "T3-02": {
        "tier": 3,
        "name": "Personalisation Lift vs. Default",
        "definition": "Conversion rate lift of personalised vs. default experience, per activity",
        "target": "Statistically significant at 95% confidence",
        "owner": "T&O Lead",
        "cadence": "Monthly per activity",
        "data_source": "Adobe Target + Segment",
    },
    "T3-03": {
        "tier": 3,
        "name": "ePDF Engagement Depth",
        "definition": "Scroll depth, page views, and time-on-page for embedded PDF content",
        "target": "Pending baseline",
        "owner": "T&O Lead",
        "cadence": "Monthly",
        "data_source": "Segment (custom events)",
    },
    "T3-04": {
        "tier": 3,
        "name": "Engagement by Role",
        "definition": "Engagement metrics segmented by classified role for personalised experiences",
        "target": "Pending baseline",
        "owner": "T&O Lead",
        "cadence": "Monthly",
        "data_source": "Segment + AEP segment",
    },
    "T3-05": {
        "tier": 3,
        "name": "Form Capture Rate",
        "definition": "Form conversion rate for role identification and progressive disclosure forms",
        "target": "Pending baseline",
        "owner": "T&O Lead",
        "cadence": "Monthly",
        "data_source": "Segment",
    },
    "T3-06": {
        "tier": 3,
        "name": "Auto-Personalisation Lift Validation",
        "definition": "Lift of AP-selected experiences vs. manual allocation, per activity",
        "target": "Statistically significant lift",
        "owner": "T&O Lead",
        "cadence": "Quarterly (post-AP launch)",
        "data_source": "Adobe Target",
    },
    "T3-07": {
        "tier": 3,
        "name": "Anonymous Behavioural Targeting Accuracy",
        "definition": (
            "Accuracy of behavioural role classification for anonymous TAL visitors. "
            "Primary validation: randomized progressive disclosure experiment. "
            "Secondary validation: CRM retrospective match (retained but acknowledged "
            "to carry survivor bias — not used as primary accuracy measure)."
        ),
        "primary_validation": {
            "method": "randomized_progressive_disclosure",
            "description": (
                "For a statistically defined sample of anonymous visitors with MEDIUM+ "
                "role confidence, surface a role-confirmation prompt and compare the "
                "declared role to the inferred role. Provides an unbiased accuracy estimate "
                "unaffected by the survivor bias present in CRM retrospective matching."
            ),
            "power_calculation_inputs": {
                "target_accuracy_differential": "15 percentage points (e.g., distinguish 60% from 75%)",
                "minimum_confidence_interval": "95%",
                "expected_medium_plus_base_rate": "TBD — establish at baseline",
                "minimum_sample_size": "TBD — calculated from base rate at baseline establishment",
                "note": (
                    "Sample size must be set via power calculation before the first "
                    "validation run. 'TBD — set at baseline' is not an acceptable "
                    "steady-state answer."
                ),
            },
        },
        "secondary_validation": {
            "method": "crm_retrospective_match",
            "description": (
                "Signal model prediction vs. subsequent Salesforce CRM match for "
                "visitors who later identified. Retained as a supplementary signal. "
                "Carries survivor bias: only measures accuracy for anonymous visitors "
                "who later converted. Systematically excludes missed or incorrect "
                "classifications where the visitor never identified."
            ),
        },
        "target": "Pending baseline — establish via primary validation method",
        "owner": "Analytics & Data Science Lead",
        "cadence": "Quarterly",
        "data_source": "Segment + AEP + Salesforce CRM",
    },
}


# =============================================================================
# §12  CLASSIFICATION SCORING RULES  [Signal Def §5.6, §6.3]
# =============================================================================

SCORING_RULES = {
    "minimum_cumulative_score": 25,
    "minimum_role_differential": 10,        # top role must lead second by this margin
    "firmographic_confirmation_bonus": 30,   # added when Demandbase title match confirms role
    "firmographic_bonus_requires_minimum_behavioral_score": 15,
    # The +30 bonus is ONLY applied when the visitor's behavioral score for
    # the top role already meets this floor AFTER the differential check.
    # A floor of 15 requires at least one meaningful behavioral signal above
    # the noise floor. Title match alone cannot produce a MEDIUM classification.
    # Interaction with differential check: the bonus is applied AFTER the
    # differential check. A visitor whose differential was insufficient at step 2
    # remains capped at 49 even if the bonus would otherwise be applied.
    "minimum_session_duration_seconds": 60,
    "minimum_page_views_for_signals": 2,
    "single_page_minimum_seconds": 30,
    "minimum_signal_diversity_for_high": 2,  # minimum 2 distinct signal types for HIGH
    "behavioral_only_confidence_ceiling": "medium",
    "score_clamp_floor": 0,
    "score_clamp_ceiling": 100,
    "re_scoring_note": (
        "Section-isolated re-scoring: when re-evaluating after content updates, "
        "carry forward original scores for unchanged signal types to prevent drift."
    ),
}


# =============================================================================
# §13  DATA SOURCE AUTHORITY HIERARCHY  [Signal Def §9.1]
#
# Three-rank hierarchy governing role classification confidence.
# Rank 1 updated: CRM-confirmed ML classifier, not rules-based D&A model.
# =============================================================================

DATA_SOURCE_HIERARCHY = [
    {
        "rank": 1,
        "source": "CRM-confirmed ML classifier prediction (Snowflake)",
        "confidence": "Highest authority — triggers HIGH confidence tier",
        "description": (
            "ML classifier trained on labeled closed-won CRM contacts. "
            "Title × function × solution category × behavioral pattern → "
            "role label with confidence score. Delivered to AEP via Kafka. "
            "Covers Champion, Economic Buyer, Influencer at v1 launch."
        ),
    },
    {
        "rank": 2,
        "source": "Zero-party self-identification (progressive disclosure form)",
        "confidence": "High authority — triggers HIGH confidence when combined with behavioral confirmation",
        "description": (
            "Visitor explicitly selects their role or buying job via a "
            "progressive disclosure prompt. Stored as AEP profile attribute. "
            "Decays after 90 days and requires re-confirmation."
        ),
    },
    {
        "rank": 3,
        "source": "Behavioral inference (signal weight scoring)",
        "confidence": "Medium authority — MEDIUM confidence ceiling, never HIGH",
        "description": (
            "Signal weight scoring against CROSS_ROLE_WEIGHTS, modified by "
            "DECAY_MULTIPLIERS. Subject to noise from post-sale customer traffic "
            "on operational surfaces. Apply TAL status filter before scoring."
        ),
    },
]


# =============================================================================
# §14  ENGAGEMENT SCORE THRESHOLDS  [Measurement §2.3]
#
# Measures opportunity health (seller-centric).
# Distinct from Buying Group Role Confidence (personalisation certainty).
# Advisory note: EB auto-qualification rule (single HIGH EB = HIGH BG)
# should be reviewed — it can over-elevate BG health for single-contact opps.
#
# SCALE DIVERGENCE — READ BEFORE USING:
# CONFIDENCE_TIERS (§3): MEDIUM = 50–79, HIGH = 80–100
# ENGAGEMENT_THRESHOLDS (§14): MEDIUM_ENGAGEMENT = 40–69, HIGH_ENGAGEMENT = 70–100
# A score of 45 is LOW confidence but MEDIUM_ENGAGEMENT.
# A score of 72 is HIGH_ENGAGEMENT but MEDIUM confidence.
# These are distinct instruments. Always namespace which scale you are on.
# =============================================================================

ENGAGEMENT_THRESHOLDS = {
    "HIGH_ENGAGEMENT": {
        "member_level": {"min": 70, "max": 100},
        "bg_aggregation": (
            "EB is High; OR 2+ members High; OR 1 High + 1 High unclassified hand-raiser"
        ),
        "advisory": (
            "Single HIGH EB triggering HIGH BG health should be validated — "
            "single-contact opportunities may over-report readiness."
        ),
    },
    "MEDIUM_ENGAGEMENT": {
        "member_level": {"min": 40, "max": 69},
        "bg_aggregation": (
            "EB is Medium; OR 2+ members Medium+; OR 1 Warm + 1 Medium unclassified"
        ),
    },
    "LOW_ENGAGEMENT": {
        "member_level": {"min": 0, "max": 39},
        "bg_aggregation": "All others. Default for nascent buying groups.",
    },
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_confidence_tier(score: int) -> dict:
    """Given a role confidence score (0-100), return the matching tier dict."""
    for tier_key, tier in CONFIDENCE_TIERS.items():
        if tier["min"] <= score <= tier["max"]:
            return {**tier, "key": tier_key}
    return {**CONFIDENCE_TIERS["unknown"], "key": "unknown"}


def get_fallback_level(score: int) -> dict:
    """Given a role confidence score, return the applicable fallback cascade level."""
    tier = get_confidence_tier(score)
    level_num = tier["fallback_level"]
    for level in FALLBACK_CASCADE:
        if level["level"] == level_num:
            return level
    return FALLBACK_CASCADE[-1]


def calculate_role_scores(
    observed_signals: list[str],
    decay_window: str = "current_session"
) -> dict[str, float]:
    """
    Given a list of observed signal keys and a decay window, return
    weighted scores per role.

    Args:
        observed_signals: list of CROSS_ROLE_WEIGHTS keys
        decay_window: one of DECAY_MULTIPLIERS keys

    Returns:
        dict mapping role keys to weighted scores
    """
    multiplier = DECAY_MULTIPLIERS.get(decay_window, {}).get("multiplier", 1.0)
    scores: dict[str, float] = {role: 0.0 for role in ROLES}

    for signal_key in observed_signals:
        signal = CROSS_ROLE_WEIGHTS.get(signal_key, {})
        for role in ROLES:
            scores[role] += signal.get(role, 0) * multiplier

    return scores


def classify_visitor(
    observed_signals: list[str],
    decay_window: str = "current_session",
    firmographic_role: str | None = None,
) -> dict:
    """
    Classify a visitor's buying group role from behavioral signals.

    v0.2.0 corrected scoring order (AR-03 + CR-03):
    1. Calculate raw behavioral scores from CROSS_ROLE_WEIGHTS
    2. Run differential check — is top_role_score - second_role_score >= minimum_role_differential?
    3. If differential insufficient: cap adjusted_score at 49; set differential_insufficient: True
    4. ONLY THEN apply firmographic_confirmation_bonus if guard rail conditions are met
    5. Return final score and classification tier

    Args:
        observed_signals: list of CROSS_ROLE_WEIGHTS keys
        decay_window: one of DECAY_MULTIPLIERS keys
        firmographic_role: role key if Demandbase title match exists

    Returns:
        dict with classified_role, score, confidence_tier, fallback_level,
        differential_insufficient (bool), firmographic_confirmed (bool)
    """
    scores = calculate_role_scores(observed_signals, decay_window)

    if not scores or max(scores.values()) < SCORING_RULES["minimum_cumulative_score"]:
        return {
            "classified_role": DEFAULT_ROLE,
            "score": 0,
            "confidence_tier": CONFIDENCE_TIERS["unknown"],
            "fallback_level": FALLBACK_CASCADE[-1],
            "differential_insufficient": False,
            "firmographic_confirmed": False,
        }

    top_role = max(scores, key=lambda r: scores[r])
    top_score = scores[top_role]
    sorted_scores = sorted(scores.values(), reverse=True)
    differential = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else sorted_scores[0]

    # Step 2-3: Differential check — cap at 49 if insufficient; do NOT apply bonus yet
    differential_insufficient = differential < SCORING_RULES["minimum_role_differential"]
    if differential_insufficient:
        adjusted_score = min(top_score, 49)  # cap at LOW if differential insufficient
    else:
        adjusted_score = min(top_score, 100)

    # Step 4: Apply firmographic bonus ONLY if:
    #   (a) differential was sufficient (not capped), AND
    #   (b) behavioral score meets the minimum floor (firmographic_bonus_requires_minimum_behavioral_score)
    # A visitor whose differential was insufficient remains capped at 49 regardless of bonus.
    firmographic_confirmed = False
    if (
        firmographic_role
        and firmographic_role in ROLES
        and firmographic_role == top_role
        and not differential_insufficient
        and top_score >= SCORING_RULES["firmographic_bonus_requires_minimum_behavioral_score"]
    ):
        adjusted_score = adjusted_score + SCORING_RULES["firmographic_confirmation_bonus"]
        firmographic_confirmed = True

    adjusted_score = max(
        SCORING_RULES["score_clamp_floor"],
        min(SCORING_RULES["score_clamp_ceiling"], adjusted_score)
    )

    tier = get_confidence_tier(int(adjusted_score))
    fallback = get_fallback_level(int(adjusted_score))

    return {
        "classified_role": top_role,
        "score": adjusted_score,
        "all_scores": scores,
        "confidence_tier": tier,
        "fallback_level": fallback,
        "differential_insufficient": differential_insufficient,
        # differential_insufficient: True = behavioral signal exists but role is ambiguous
        # differential_insufficient: False + LOW score = genuinely weak signal
        "firmographic_confirmed": firmographic_confirmed,
    }


def get_probable_buying_job(role: str, bg_stage: str) -> str | None:
    """Return the most probable buying job for a role × BG stage combination.

    v0.2.0 AR-04: Updated to work with nested dict PROBABLE_JOB_PRIORS.
    Returns None for role/stage combinations where buying job inference is not meaningful.
    Returns "unknown" only when the role or bg_stage key is not found in the dict.
    """
    role_map = PROBABLE_JOB_PRIORS.get(role)
    if role_map is None:
        return "unknown"
    if bg_stage not in role_map:
        return "unknown"
    return role_map[bg_stage]  # may be None — callers must handle None explicitly


def get_cohort_priority_order() -> list[str]:
    """Return campaign cohort keys ordered by priority (highest first)."""
    return sorted(
        CAMPAIGN_COHORTS.keys(),
        key=lambda k: CAMPAIGN_COHORTS[k]["priority"]
    )


# =============================================================================
# §15  MARTECH STACK  [kalder_martech_reference_architecture.md — CANONICAL]
#
# Single source of truth for tool names used across the corpus.
# Full architecture documented at kalder_martech_reference_architecture.md.
# =============================================================================

MARTECH_STACK = {

    # ── Sources ──────────────────────────────────────────────────────────────
    "salesforce": {
        "label": "Salesforce",
        "layer": "sources",
        "role": "CRM system of record — contacts, opportunities, account data, CRM-assigned BG roles",
        "url": "salesforce.com",
    },
    "kalder_platform_internal": {
        "label": "Kalder Platform (internal)",
        "layer": "sources",
        "role": "Internal workflow engine. Orchestrates BG classification model and Kalder Compose pipeline. Feeds structured BG data into Snowflake.",
        "notes": "Kalder eats its own cooking — the platform it sells runs its own operations.",
    },
    "marketo": {
        "label": "Marketo Engage",
        "layer": "sources",
        "role": "Marketing automation — email, nurture programs, campaign execution. Engagement signals flow to Snowflake.",
    },
    "outreach": {
        "label": "Outreach",
        "layer": "sources",
        "role": "Sales engagement — sequences, call logs, activity signals. Feeds Snowflake.",
    },

    # ── Warehouse ─────────────────────────────────────────────────────────────
    "snowflake": {
        "label": "Snowflake",
        "layer": "warehouse",
        "role": "Central data warehouse. Aggregates CRM, behavioral, marketing, and sales data. Houses the ML BG classifier. Durable event store.",
    },
    "looker": {
        "label": "Looker",
        "layer": "warehouse",
        "role": "BI and reporting on Snowflake. Powers T1/T2/T3 measurement dashboards.",
    },

    # ── Collection ────────────────────────────────────────────────────────────
    "segment": {
        "label": "Segment (Twilio)",
        "layer": "collection",
        "role": "Event collection and routing from kalder.com. Routes simultaneously to Snowflake (durable) and AEP (real-time). In stack since early growth; AEP layered on top when B2B activation limits hit.",
    },
    "kafka": {
        "label": "Kafka",
        "layer": "collection",
        "role": "Streaming pipeline Snowflake → AEP. Carries ML classifier outputs (role, stage, BG health) into AEP at near real-time latency.",
    },

    # ── CDP ───────────────────────────────────────────────────────────────────
    "aep": {
        "label": "Adobe Experience Platform (Real-Time CDP B2B Edition)",
        "layer": "cdp",
        "role": "Unified CDP with native B2B object model. Receives behavioral events (Segment) and BG intelligence (Kafka). Builds unified profiles, assigns audience segments, activates to Adobe Target.",
        "purchase_rationale": "Purchased specifically for this program — the reason Segment was not sufficient for role-level activation at 30K-account TAL scale.",
    },

    # ── Activation ────────────────────────────────────────────────────────────
    "adobe_target": {
        "label": "Adobe Target",
        "layer": "activation",
        "role": "Web personalisation decisioning engine. Receives AEP audience segments. Runs XT activities, confidence-split CTAs, and holdback groups.",
    },
    "sixsense": {
        "label": "6sense",
        "layer": "activation",
        "role": "Intent data and predictive scoring. Identifies accounts in active buying cycles. Enriches AEP profiles for early-stage role classification.",
    },
    "demandbase": {
        "label": "Demandbase",
        "layer": "activation",
        "role": "Firmographic enrichment and web visitor identification. Resolves anonymous visitors to known TAL accounts via reverse IP. Provides title-to-role confirmation input.",
    },

    # ── Content Ops ───────────────────────────────────────────────────────────
    "kalder_compose": {
        "label": "Kalder Compose",
        "layer": "content_ops",
        "role": "Internal AI content operations capability. Model-agnostic LLM inference. Generates structured content graph nodes constrained by role, JTBD, stage, and solution. Kalder Platform orchestrates review → approve → publish workflow.",
        "status": "internal_competitive_advantage",
        "future_potential": "Potential future product offering — the AWS parallel: internal infrastructure that may become a product.",
    },

    # ── Engagement ────────────────────────────────────────────────────────────
    "sanity": {
        "label": "Sanity",
        "layer": "engagement",
        "role": "Knowledge-centric content graph and repository. Stores structured content nodes with rich metadata. Pages assembled from graph at render time — no pre-built variants. Kalder Compose populates; Adobe Target queries.",
    },

    # ── BG Intelligence (internal) ────────────────────────────────────────────
    "ml_classifier": {
        "label": "Buying Group ML Classifier",
        "layer": "intelligence",
        "role": "Internal ML model on Snowflake. Trained on labeled closed-won CRM contacts. Predicts BG roles for identified visitors with confidence scores. Outputs feed AEP via Kafka. Built and operated by D&A team.",
        "vendor": "internal",
        "coverage_v1": ["champion", "economic_buyer", "influencer"],
    },
}


# =============================================================================
# §16  CONTENT GRAPH NODE TYPES  [Fragment §2 — knowledge-centric model]
#
# The 10 node types that replace AEM's XF/CF model.
# Pages are assembled artifacts generated from these nodes at render time.
# No page variant is pre-built.
#
# These node types are also the generation schema for Kalder Compose.
# Tags on each node constrain what Kalder Compose generates.
#
# Markdown with YAML front matter is the storage format in Sanity.
# =============================================================================

CONTENT_GRAPH_NODE_TYPES = {

    "audience": {
        "label": "Audience",
        "description": (
            "Defines who a piece of content is for. The primary axis for "
            "all personalisation decisions. Specifies buying group role, "
            "solution category, and confidence tier requirements."
        ),
        "required_fields": [
            "role",               # buying group role key from ROLES
            "solution_category",  # solution category key
            "confidence_tier",    # minimum confidence tier to activate
            "opportunity_type",   # ACQ / RET / UPS / XSL
        ],
        "optional_fields": [
            "solution",           # specific solution key (more targeted than category)
            "industry",           # industry vertical (v2)
            "account_segment",    # TAL tier
        ],
        "relationships": ["jtbd", "experience"],
        "authored_by": "Content Strategy Lead",
        "generated_by": "Kalder Compose",
    },

    "jtbd": {
        "label": "JTBD (Job To Be Done)",
        "description": (
            "Defines what the audience member is trying to accomplish. "
            "The key that links audience to content — a Narrative node "
            "serves a specific JTBD, not just a role."
        ),
        "required_fields": [
            "jtbd_code",          # from §17 JTBD_CODES
            "buying_job",         # problem_identification / solution_exploration / requirements_building / supplier_selection
            "campaign_stage",     # Education / Acquisition / Progression
            "phase",              # diverge / converge
        ],
        "optional_fields": [
            "re_entry",           # bool — is this a loop-back JTBD variant?
            "convergence_point",  # which convergence point this JTBD advances toward
        ],
        "relationships": ["audience", "problem", "narrative"],
        "authored_by": "PM, Buying Group Personalization",
        "generated_by": "human only — JTBD definitions are strategic, not generated",
    },

    "problem": {
        "label": "Problem",
        "description": (
            "States the specific pain or challenge the audience is experiencing. "
            "Problem nodes are role-specific — the same underlying problem is "
            "framed differently for each role. Part of the diverge phase."
        ),
        "required_fields": [
            "role",
            "problem_statement",
            "cost_of_inaction",   # what happens if they don't act
            "solution_category",
        ],
        "optional_fields": [
            "quantified_impact",  # specific metric if available
            "industry_variant",   # industry-specific version
        ],
        "relationships": ["audience", "jtbd", "outcome", "narrative"],
        "authored_by": "Content Strategy Lead",
        "generated_by": "Kalder Compose (seeded from Champion problem node)",
        "through_line_field": "solution_claim",  # must match across roles
    },

    "outcome": {
        "label": "Outcome",
        "description": (
            "States the measurable result the audience achieves with Kalder. "
            "Outcome framing is role-specific: Champions see business case "
            "outcomes; EBs see financial outcomes; Influencers see operational "
            "outcomes; Users see daily work outcomes; Ratifiers see risk outcomes."
        ),
        "required_fields": [
            "role",
            "outcome_statement",
            "metric",             # the KPI this outcome maps to
            "time_to_value",      # when they see the result
            "solution_category",
        ],
        "optional_fields": [
            "quantified_outcome", # specific number if available
            "proof_node_ids",     # proof nodes that validate this outcome
        ],
        "relationships": ["problem", "narrative", "proof"],
        "authored_by": "Content Strategy Lead",
        "generated_by": "Kalder Compose",
        "through_line_field": "solution_claim",
    },

    "narrative": {
        "label": "Narrative",
        "description": (
            "The core story connecting problem to outcome for a specific role "
            "at a specific buying job stage. The primary personalised content "
            "unit. Multiple narrative nodes exist per solution — one per role "
            "per buying job — all anchored to the same solution_claim and "
            "message_pillar (the through-line)."
        ),
        "required_fields": [
            "role",
            "buying_job",
            "campaign_stage",
            "phase",              # diverge or converge
            "solution",           # solution key
            "solution_claim",     # canonical claim — must match across all role variants
            "message_pillar",     # brand pillar — must match across all role variants
            "headline",
            "body_copy",
            "foregrounded_dimension",  # what this role cares about most
        ],
        "optional_fields": [
            "suppressed_dimension",    # what this role doesn't need
            "proof_node_ids",
            "version",
            "re_entry_variant",        # bool — is this a loop-back version?
        ],
        "relationships": ["audience", "jtbd", "problem", "outcome", "proof", "content_module"],
        "authored_by": "Content Strategy Lead (seed nodes)",
        "generated_by": "Kalder Compose (variants from seed)",
        "through_line_fields": ["solution_claim", "message_pillar"],
        "validation_rule": (
            "All narrative nodes for the same solution_claim must share "
            "identical solution_claim and message_pillar values. "
            "Kalder Compose enforces this at generation time."
        ),
    },

    "proof": {
        "label": "Proof",
        "description": (
            "Evidence that validates the narrative. Shared pool — the same "
            "proof node can be referenced by multiple narrative nodes across "
            "different roles. Proof nodes are the through-line in action: "
            "the same customer outcome, the same statistic, the same analyst "
            "quote — framed differently per role in the narrative layer."
        ),
        "required_fields": [
            "proof_type",         # case_study / statistic / analyst_quote / customer_quote / award
            "proof_statement",    # the fact or quote
            "source",             # customer name / analyst firm / publication
            "solution_category",
            "quantified_outcome", # the number (if applicable)
        ],
        "optional_fields": [
            "role_affinity",      # which roles find this proof most compelling
            "industry",           # industry of the proof source
            "recency",            # when the proof was generated
            "named_account",      # bool — is the customer named?
        ],
        "relationships": ["narrative", "outcome", "asset"],
        "authored_by": "Content Strategy Lead",
        "generated_by": "human only — proof must be factual, not generated",
        "through_line_note": (
            "Proof nodes are the shared factual layer. Narratives reference "
            "them; proof nodes themselves are not role-specific. This is what "
            "prevents information asymmetry across the buying group."
        ),
    },

    "asset": {
        "label": "Asset",
        "description": (
            "A discrete content artifact — a document, video, tool, or "
            "interactive — that a visitor can engage with or download. "
            "Assets are tagged with content type, format, role affinity, "
            "JTBD code, and gating level."
        ),
        "required_fields": [
            "title",
            "content_type",       # from §9 CONTENT_TYPES
            "content_format",     # from §9 CONTENT_FORMATS
            "role_affinity",      # primary role this asset serves
            "jtbd_codes",         # list of JTBD codes this asset supports
            "campaign_stage",
            "phase",
            "gating",             # ungated / gated
        ],
        "optional_fields": [
            "epdf_eligible",      # bool
            "solution",           # specific solution
            "industry",
            "engagement_threshold_seconds",
        ],
        "relationships": ["proof", "content_module", "experience"],
        "authored_by": "Content Strategy Lead",
        "generated_by": "Kalder Compose (for generated asset types: briefs, templates)",
    },

    "content_module": {
        "label": "Content Module",
        "description": (
            "A renderable unit of content assembled from one or more nodes "
            "(narrative, proof, asset). Maps to a module type in §10. "
            "The content module is what Adobe Target ultimately serves — "
            "it is the bridge between the content graph and the page."
        ),
        "required_fields": [
            "module_type",        # from §10 MODULE_TYPES
            "role",
            "confidence_tier",
            "solution",
            "campaign_stage",
            "headline_node_id",   # narrative node providing headline
            "body_node_id",       # narrative node providing body
        ],
        "optional_fields": [
            "proof_node_ids",
            "asset_node_ids",
            "cta_text",
            "cta_destination",
            "version",
        ],
        "relationships": ["narrative", "proof", "asset", "experience"],
        "authored_by": "T&O Lead (assembly configuration)",
        "generated_by": "Assembled at render time from component nodes",
    },

    "experience": {
        "label": "Experience",
        "description": (
            "A complete personalised page experience assembled from content "
            "modules. The experience is the unit that Adobe Target activates — "
            "it specifies which modules appear in which slots for a given "
            "audience × solution × confidence tier combination."
        ),
        "required_fields": [
            "audience_node_id",
            "page_surface",       # from §20 WEBSITE_SURFACES
            "solution",
            "confidence_tier",
            "module_slots",       # ordered list of content_module node IDs
            "control_variant",    # bool — is this the holdback/default experience?
        ],
        "optional_fields": [
            "buying_job",
            "industry",
            "ab_test_id",
        ],
        "relationships": ["audience", "content_module", "channel"],
        "authored_by": "T&O Lead",
        "generated_by": "human — experience assembly is a strategic decision",
    },

    "channel": {
        "label": "Channel",
        "description": (
            "Defines how an experience is delivered. Channel is the outermost "
            "node — the same content graph can power web, email, paid media, "
            "and sales enablement by changing only the channel node. "
            "Phase 1 activates web only."
        ),
        "required_fields": [
            "channel_type",       # web / email / paid_media / sales_enablement / event
            "delivery_system",    # tool that delivers this channel (Adobe Target, Marketo, etc.)
            "activation_status",  # active / planned / future
        ],
        "optional_fields": [
            "personalisation_capability",  # what personalisation dimensions this channel supports
            "signal_capture",              # what behavioral signals this channel captures
        ],
        "relationships": ["experience"],
        "authored_by": "Platform Engineering Lead",
        "generated_by": "human — channel configuration is an engineering decision",
    },
}


# =============================================================================
# §17  JTBD CODES  [Tagging §5.3, CRM deck — role × stage × buying job]
#
# COVERAGE STATUS:
#   COMPLETE:  Customer Engagement (CRM) — Acquisition and Progression
#   PARTIAL:   IT & Operations — Acquisition and Progression (implicit from deck)
#   PENDING:   Employee Experience, Risk & Compliance, AI Platform
#
# CODE FORMAT: {OPP_TYPE}-{ROLE}-{BUYING_JOB}-{SEQUENCE}
#   OPP_TYPE:   ACQ (Acquisition), RET (Retention), UPS (Upsell), XSL (Cross-sell)
#   ROLE:       CH (Champion), EB (Economic Buyer), INF (Influencer),
#               USR (User), RAT (Ratifier)
#   BUYING_JOB: PI (Problem Identification), SE (Solution Exploration),
#               RB (Requirements Building), SS (Supplier Selection)
#   SEQUENCE:   1, 2, 3 (multiple JTBDs per role × buying job)
#
# PENDING sections use placeholder structure with coverage_status = "pending".
# Do not fabricate JTBD descriptions for unvalidated categories.
# =============================================================================

JTBD_CODES = {

    # =========================================================================
    # CUSTOMER ENGAGEMENT — COMPLETE
    # Source: CRM Buying Group Planning deck, ServiceNow Nov 2025
    # Validated for Service (CSM/FSM) and Sales (SOM) sub-types.
    # Original flat key format preserved for backward compatibility.
    # =========================================================================

    # --- Champion — Acquisition ----------------------------------------------

    "ACQ-CH-PI-1": {
        "label": "Socialize a service-first narrative",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["thought_leadership", "benchmark_report", "diagnostic_assessment"],
        "phase": "diverge",
    },
    "ACQ-CH-PI-2": {
        "label": "Collect early proof and peer references",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["case_study", "analyst_report", "customer_reference"],
        "phase": "diverge",
    },
    "ACQ-CH-PI-3": {
        "label": "Recruit allies within the organization",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["consensus_brief", "executive_brief"],
        "phase": "converge",
    },

    # --- Champion — Progression ----------------------------------------------

    "PRG-CH-SS-1": {
        "label": "Secure executive sponsorship",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["executive_brief", "roi_calculator", "consensus_brief"],
        "phase": "converge",
    },
    "PRG-CH-SS-2": {
        "label": "Stand up use cases",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["use_case_page", "case_study", "product_tour"],
        "phase": "diverge",
    },
    "PRG-CH-SS-3": {
        "label": "Orchestrate consensus across organization",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["consensus_brief", "executive_brief", "risk_mitigation_plan"],
        "phase": "converge",
    },

    # --- Economic Buyer — Acquisition ----------------------------------------

    "ACQ-EB-PI-1": {
        "label": "Size the problem",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["diagnostic_assessment", "benchmark_report", "business_value"],
        "phase": "diverge",
    },
    "ACQ-EB-PI-2": {
        "label": "Translate pains into target outcomes",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["business_value", "thought_leadership", "analyst_report"],
        "phase": "diverge",
    },
    "ACQ-EB-PI-3": {
        "label": "Shortlist viable approaches and vendors",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["competitive_comparison", "analyst_report", "category_explainer"],
        "phase": "diverge",
    },

    # --- Economic Buyer — Progression ----------------------------------------

    "PRG-EB-SS-1": {
        "label": "Validate ROI and TCO scenarios",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["roi_calculator", "executive_brief", "case_study"],
        "phase": "diverge",
    },
    "PRG-EB-SS-2": {
        "label": "Confirm solution meets defined KPI goals",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["business_value", "case_study", "benchmark_report"],
        "phase": "diverge",
    },
    "PRG-EB-SS-3": {
        "label": "Understand rollout and adoption plans",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["adoption_rollout", "risk_mitigation_plan"],
        "phase": "diverge",
    },

    # --- Influencer — Acquisition --------------------------------------------

    "ACQ-INF-RB-1": {
        "label": "Help shape requirements",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["use_case_page", "rfp_template", "technical_documentation"],
        "phase": "diverge",
    },
    "ACQ-INF-RB-2": {
        "label": "Stress test how work will flow for their team",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["product_tour", "demo_trial_request", "use_case_page"],
        "phase": "diverge",
    },

    # --- Influencer — Progression --------------------------------------------

    "PRG-INF-SS-1": {
        "label": "Validate how it works for us — use cases",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["use_case_page", "product_tour", "demo_trial_request"],
        "phase": "diverge",
    },
    "PRG-INF-SS-2": {
        "label": "Run or interpret proof of concept",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["technical_documentation", "integration_map"],
        "phase": "diverge",
    },
    "PRG-INF-SS-3": {
        "label": "Issue recommendations to buying group",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["consensus_brief"],
        "phase": "converge",
    },

    # --- Ratifier — Acquisition ----------------------------------------------

    "ACQ-RAT-PI-1": {
        "label": "Clarify procurement need and path",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["legal_procurement", "governance_policy"],
        "phase": "diverge",
    },
    "ACQ-RAT-PI-2": {
        "label": "Identify risk flags early",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["security_compliance", "governance_policy"],
        "phase": "diverge",
    },
    "ACQ-RAT-PI-3": {
        "label": "Understand governance, privacy and security requirements",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["security_compliance", "governance_policy", "legal_procurement"],
        "phase": "diverge",
    },

    # --- Ratifier — Progression ----------------------------------------------

    "PRG-RAT-SS-1": {
        "label": "Ensure standards alignment",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["security_compliance", "governance_policy"],
        "phase": "diverge",
    },
    "PRG-RAT-SS-2": {
        "label": "Finalize terms, SLAs and liability",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["legal_procurement", "risk_mitigation_plan"],
        "phase": "diverge",
    },

    # --- User — Acquisition --------------------------------------------------

    "ACQ-USR-SE-1": {
        "label": "Surface frontline friction and must-have workflows",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["product_tour", "use_case_page", "howto_training"],
        "phase": "diverge",
    },
    "ACQ-USR-SE-2": {
        "label": "Participate in concept workflows and demos",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["product_tour", "demo_trial_request"],
        "phase": "diverge",
    },

    # --- User — Progression --------------------------------------------------

    "PRG-USR-SS-1": {
        "label": "Validate use-based demos",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["product_tour", "demo_trial_request", "use_case_page"],
        "phase": "diverge",
    },
    "PRG-USR-SS-2": {
        "label": "Recommend adoption and training milestones",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["customer_engagement"],
        "coverage_status": "complete",
        "content_types": ["adoption_rollout", "howto_training"],
        "phase": "diverge",
    },


    # =========================================================================
    # IT & OPERATIONS — CONSTRUCTED
    # Source basis:
    #   - IT Working Deck slide 38 (Champion + Decision-maker messaging only;
    #     Acquisition + Progression stages; full five-role matrix not drafted)
    #   - Four partial codes already in data model preserved and upgraded here
    #   - §2 ROLES typical_titles and behavioral hypotheses
    #   - §1c SOLUTIONS: it_service_management, it_operations_management,
    #     enterprise_platform anchor titles
    #   - §1d SOLUTION_CATEGORIES: "IT buyer" bg_type_description
    #   - CRM matrix as structural template
    #
    # IT buying character: Champion is the transformation driver ("IT becoming
    # builders"); EB validates ROI for the transformation investment; Influencer
    # is the Enterprise Architect / platform engineering lead stress-testing
    # integration and architecture fit; User is the service desk operator
    # evaluating daily usability; Ratifier is CFO/Legal/Security gating spend
    # and data governance. Convergence is heavier on architecture validation
    # than in CRM because IT buyers own the platform the solution runs on.
    # =========================================================================

    # --- Champion — Acquisition ----------------------------------------------

    "IT-ACQ-CH-PI-1": {
        "label": "Build problem awareness — IT as AI builders vision",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "partial",  # from IT deck: "How close are you to IT becoming builders?"
        "content_types": ["thought_leadership", "diagnostic_assessment"],
        "phase": "diverge",
        "notes": "Upgraded from partial; source: IT deck slide 38 Champion Acquisition messaging",
    },
    "IT-ACQ-CH-PI-2": {
        "label": "Collect proof that AI-native ITSM outperforms legacy",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["case_study", "benchmark_report", "analyst_report"],
        "phase": "diverge",
    },
    "IT-ACQ-CH-PI-3": {
        "label": "Recruit allies — align IT leadership on transformation urgency",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "executive_brief"],
        "phase": "converge",
    },
    "IT-ACQ-CH-SE-1": {
        "label": "Evaluate AI-native ITSM versus legacy modernization path",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "partial",  # from IT deck: "How do we get you started on IT becoming builders?"
        "content_types": ["product_solution_overview", "competitive_comparison"],
        "phase": "diverge",
        "notes": "Upgraded from partial; source: IT deck slide 38 Champion Acquisition messaging",
    },
    "IT-ACQ-CH-SE-2": {
        "label": "Map platform architecture to enterprise integration requirements",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "integration_map", "use_case_page"],
        "phase": "diverge",
    },

    # --- Champion — Progression ----------------------------------------------

    "IT-PRG-CH-SS-1": {
        "label": "Align team on prioritization trade-offs",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "partial",  # from IT deck: "IT becoming builders: do you know the prioritization trade offs?"
        "content_types": ["consensus_brief", "executive_brief"],
        "phase": "converge",
        "notes": "Upgraded from partial; source: IT deck slide 38 Champion Progression messaging",
    },
    "IT-PRG-CH-SS-2": {
        "label": "Evangelize the IT-as-builders vision to the C-suite",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "case_study", "roi_calculator"],
        "phase": "converge",
        "notes": "Derived from IT deck: 'How do you evangelize your vision of IT becoming builders?'",
    },
    "IT-PRG-CH-SS-3": {
        "label": "Stand up ITSM use cases and adoption roadmap",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "adoption_rollout", "product_tour"],
        "phase": "diverge",
    },

    # --- Economic Buyer — Acquisition ----------------------------------------

    "IT-ACQ-EB-PI-1": {
        "label": "Quantify the cost of IT fragmentation and legacy drag",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["benchmark_report", "business_value", "diagnostic_assessment"],
        "phase": "diverge",
    },
    "IT-ACQ-EB-PI-2": {
        "label": "Translate IT transformation into board-level outcomes",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["thought_leadership", "analyst_report", "business_value"],
        "phase": "diverge",
    },
    "IT-ACQ-EB-SE-1": {
        "label": "Assess strategic fit of AI-native platform versus point solutions",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["competitive_comparison", "analyst_report", "category_explainer"],
        "phase": "diverge",
    },

    # --- Economic Buyer — Progression ----------------------------------------

    "IT-PRG-EB-SS-1": {
        "label": "Ratify ROI for IT transformation investment",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "partial",  # from IT deck: "IT becoming builders: have you ratified the ROI?"
        "content_types": ["roi_calculator", "executive_brief"],
        "phase": "diverge",
        "notes": "Upgraded from partial; source: IT deck slide 38 Decision-maker Progression messaging",
    },
    "IT-PRG-EB-SS-2": {
        "label": "Confirm TCO advantage and consolidation savings",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["business_value", "case_study", "benchmark_report"],
        "phase": "diverge",
    },
    "IT-PRG-EB-SS-3": {
        "label": "Approve platform investment and multi-year roadmap",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "adoption_rollout", "risk_mitigation_plan"],
        "phase": "converge",
    },

    # --- Influencer — Acquisition --------------------------------------------

    "IT-ACQ-INF-RB-1": {
        "label": "Evaluate platform architecture against enterprise standards",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "integration_map", "rfp_template"],
        "phase": "diverge",
        "notes": "Influencer for IT is typically Enterprise Architect or Head of Platform Engineering",
    },
    "IT-ACQ-INF-RB-2": {
        "label": "Stress test integration compatibility and API surface",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "product_tour", "demo_trial_request"],
        "phase": "diverge",
    },
    "IT-ACQ-INF-RB-3": {
        "label": "Define non-functional requirements and scalability criteria",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 3,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "rfp_template"],
        "phase": "diverge",
    },

    # --- Influencer — Progression --------------------------------------------

    "IT-PRG-INF-SS-1": {
        "label": "Validate platform fit through proof of concept",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "demo_trial_request", "integration_map"],
        "phase": "diverge",
    },
    "IT-PRG-INF-SS-2": {
        "label": "Issue architecture recommendation to buying group",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "technical_documentation"],
        "phase": "converge",
    },

    # --- User — Acquisition --------------------------------------------------

    "IT-ACQ-USR-SE-1": {
        "label": "Surface daily service desk friction and workflow gaps",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "howto_training"],
        "phase": "diverge",
        "notes": "User for ITSM is IT Support Analyst or Service Desk Agent",
    },
    "IT-ACQ-USR-SE-2": {
        "label": "Participate in hands-on product demos and trials",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "demo_trial_request"],
        "phase": "diverge",
    },

    # --- User — Progression --------------------------------------------------

    "IT-PRG-USR-SS-1": {
        "label": "Validate usability for real incident and request workflows",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "use_case_page", "demo_trial_request"],
        "phase": "diverge",
    },
    "IT-PRG-USR-SS-2": {
        "label": "Recommend training and onboarding milestones",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["adoption_rollout", "howto_training"],
        "phase": "diverge",
    },

    # --- Ratifier — Acquisition ----------------------------------------------

    "IT-ACQ-RAT-PI-1": {
        "label": "Establish data governance and AI use policy boundaries",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance"],
        "phase": "diverge",
        "notes": "IT Ratifier is often CTO, CISO, or Head of Data Privacy",
    },
    "IT-ACQ-RAT-PI-2": {
        "label": "Identify security and compliance requirements for platform evaluation",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["security_compliance", "legal_procurement", "governance_policy"],
        "phase": "diverge",
    },

    # --- Ratifier — Progression ----------------------------------------------

    "IT-PRG-RAT-SS-1": {
        "label": "Confirm security posture and compliance certifications",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["security_compliance", "governance_policy"],
        "phase": "diverge",
    },
    "IT-PRG-RAT-SS-2": {
        "label": "Finalize data residency, SLAs, and contractual terms",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["it_operations"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "risk_mitigation_plan"],
        "phase": "diverge",
    },


    # =========================================================================
    # EMPLOYEE EXPERIENCE — CONSTRUCTED
    # Source basis:
    #   - §2 ROLES typical_titles (HR Coordinator, VP of HR, VP L&D, etc.)
    #   - §1c SOLUTIONS: hr_service_delivery, workplace_services,
    #     learning_and_development anchor titles
    #   - §1d SOLUTION_CATEGORIES: "HR / People buyer" bg_type_description
    #   - Gartner buying-job framework (PI → SE → RB → SS)
    #   - CRM matrix as structural template
    #
    # EX buying character: Champion is a functional leader whose team directly
    # uses the product (VP HR, VP Workplace, VP L&D). EB is CPO or CHRO —
    # often closer to the Champion than in IT or CRM; sponsor and champion may
    # be the same person in smaller enterprises. Influencer is HR Technology
    # or IT-adjacent (Director of HR Technology, Business Analyst) — evaluates
    # system fit rather than functional outcomes. User is the coordinator or
    # specialist doing daily work. Ratifier is CFO and Legal, plus IT/CIO for
    # data/integration sign-off. The buying group is smaller than CRM and
    # convergence happens faster, but CHRO needs a strong people-outcomes case.
    # =========================================================================

    # --- Champion — Acquisition ----------------------------------------------

    "EX-ACQ-CH-PI-1": {
        "label": "Build the case that employee experience is a business performance lever",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["thought_leadership", "benchmark_report", "diagnostic_assessment"],
        "phase": "diverge",
    },
    "EX-ACQ-CH-PI-2": {
        "label": "Collect peer proof that AI-native HR/EX platforms outperform legacy",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["case_study", "customer_reference", "analyst_report"],
        "phase": "diverge",
    },
    "EX-ACQ-CH-PI-3": {
        "label": "Recruit CHRO and IT as co-sponsors before vendor evaluation",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "executive_brief"],
        "phase": "converge",
    },
    "EX-ACQ-CH-SE-1": {
        "label": "Evaluate AI-native EX platform versus point solution patchwork",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["product_solution_overview", "competitive_comparison", "use_case_page"],
        "phase": "diverge",
    },

    # --- Champion — Progression ----------------------------------------------

    "EX-PRG-CH-SS-1": {
        "label": "Secure CHRO sponsorship and budget commitment",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "roi_calculator", "consensus_brief"],
        "phase": "converge",
    },
    "EX-PRG-CH-SS-2": {
        "label": "Stand up employee journey use cases for the buying group",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "case_study", "product_tour"],
        "phase": "diverge",
    },
    "EX-PRG-CH-SS-3": {
        "label": "Orchestrate final consensus across HR, IT, and Finance",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "executive_brief", "risk_mitigation_plan"],
        "phase": "converge",
    },

    # --- Economic Buyer — Acquisition ----------------------------------------

    "EX-ACQ-EB-PI-1": {
        "label": "Size the cost of poor employee experience on retention and productivity",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["benchmark_report", "business_value", "diagnostic_assessment"],
        "phase": "diverge",
    },
    "EX-ACQ-EB-PI-2": {
        "label": "Translate employee experience outcomes into CFO-ready language",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["business_value", "analyst_report", "thought_leadership"],
        "phase": "diverge",
    },
    "EX-ACQ-EB-SE-1": {
        "label": "Assess build vs. buy vs. consolidate options for HR technology",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["competitive_comparison", "analyst_report", "category_explainer"],
        "phase": "diverge",
    },

    # --- Economic Buyer — Progression ----------------------------------------

    "EX-PRG-EB-SS-1": {
        "label": "Validate ROI on employee experience transformation investment",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["roi_calculator", "executive_brief", "case_study"],
        "phase": "diverge",
    },
    "EX-PRG-EB-SS-2": {
        "label": "Confirm people-outcomes metrics align with corporate strategy",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["business_value", "benchmark_report", "case_study"],
        "phase": "diverge",
    },
    "EX-PRG-EB-SS-3": {
        "label": "Understand change management and adoption plan",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["adoption_rollout", "risk_mitigation_plan"],
        "phase": "diverge",
    },

    # --- Influencer — Acquisition --------------------------------------------

    "EX-ACQ-INF-RB-1": {
        "label": "Map HR technology requirements against existing systems of record",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "integration_map", "rfp_template"],
        "phase": "diverge",
        "notes": "Influencer for EX is typically Director of HR Technology or Business Analyst",
    },
    "EX-ACQ-INF-RB-2": {
        "label": "Stress test workflow fit for target employee populations",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "demo_trial_request"],
        "phase": "diverge",
    },

    # --- Influencer — Progression --------------------------------------------

    "EX-PRG-INF-SS-1": {
        "label": "Validate integration with HRIS and payroll systems",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "integration_map"],
        "phase": "diverge",
    },
    "EX-PRG-INF-SS-2": {
        "label": "Issue technical and process fit recommendation to buying group",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief"],
        "phase": "converge",
    },

    # --- User — Acquisition --------------------------------------------------

    "EX-ACQ-USR-SE-1": {
        "label": "Surface daily HR workflow friction and case management gaps",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "howto_training"],
        "phase": "diverge",
        "notes": "User for EX is HR Coordinator, Recruiter, or L&D Specialist",
    },
    "EX-ACQ-USR-SE-2": {
        "label": "Evaluate self-service and portal usability for employees",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "demo_trial_request"],
        "phase": "diverge",
    },

    # --- User — Progression --------------------------------------------------

    "EX-PRG-USR-SS-1": {
        "label": "Validate that day-to-day HR workflows are genuinely simplified",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "use_case_page", "demo_trial_request"],
        "phase": "diverge",
    },
    "EX-PRG-USR-SS-2": {
        "label": "Recommend employee onboarding and training milestones",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["adoption_rollout", "howto_training"],
        "phase": "diverge",
    },

    # --- Ratifier — Acquisition ----------------------------------------------

    "EX-ACQ-RAT-PI-1": {
        "label": "Establish data privacy boundaries for employee data handling",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance"],
        "phase": "diverge",
        "notes": "EX Ratifier: CFO gates spend; Legal/CISO gates employee data use",
    },
    "EX-ACQ-RAT-PI-2": {
        "label": "Identify labor law compliance and works council requirements",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "governance_policy"],
        "phase": "diverge",
    },

    # --- Ratifier — Progression ----------------------------------------------

    "EX-PRG-RAT-SS-1": {
        "label": "Confirm employee data governance and GDPR / regional compliance",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["security_compliance", "governance_policy"],
        "phase": "diverge",
    },
    "EX-PRG-RAT-SS-2": {
        "label": "Finalize contract terms and data processing agreements",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["employee_experience"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "risk_mitigation_plan"],
        "phase": "diverge",
    },


    # =========================================================================
    # RISK & COMPLIANCE — CONSTRUCTED
    # Source basis:
    #   - §2 ROLES typical_titles (Head of Compliance, VP Security Ops,
    #     GRC Analyst, Data Privacy Officer, etc.)
    #   - §1c SOLUTIONS: governance_risk_compliance, security_operations,
    #     vendor_risk_management anchor titles
    #   - §1d SOLUTION_CATEGORIES: "GRC / Risk buyer" bg_type_description
    #     ("Ratifier involvement is heaviest in this category")
    #   - Gartner buying-job framework
    #   - CRM matrix as structural template
    #
    # RC buying character: This is the most Ratifier-heavy category in the
    # model. The Ratifier is not a late-stage gatekeeper — they participate
    # from Problem Identification because regulatory risk is the primary
    # purchase driver. Champion is the functional risk leader (Head of
    # Compliance, VP SecOps, Head of Third-Party Risk) who initiates the
    # program. EB is CRO, CFO, or General Counsel — whoever owns enterprise
    # risk posture. Influencer is IT Security Manager or Data Privacy Officer
    # providing technical/legal input. User is the GRC or Security Analyst
    # running day-to-day workflows. Champion often doubles as technical
    # evaluator; vendor risk buying groups can be very flat (Champion + EB
    # + Ratifier, with User/Influencer merged).
    # =========================================================================

    # --- Champion — Acquisition ----------------------------------------------

    "RC-ACQ-CH-PI-1": {
        "label": "Quantify regulatory exposure and compliance gap",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["diagnostic_assessment", "benchmark_report", "thought_leadership"],
        "phase": "diverge",
    },
    "RC-ACQ-CH-PI-2": {
        "label": "Build internal case for automating risk and compliance workflows",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["case_study", "analyst_report", "business_value"],
        "phase": "diverge",
    },
    "RC-ACQ-CH-PI-3": {
        "label": "Recruit Legal and Finance as co-sponsors early",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "executive_brief"],
        "phase": "converge",
        "notes": "In RC, Ratifier co-sponsorship at PI stage is more common than in other categories",
    },
    "RC-ACQ-CH-SE-1": {
        "label": "Evaluate GRC platform capabilities against regulatory framework",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["product_solution_overview", "competitive_comparison", "use_case_page"],
        "phase": "diverge",
    },
    "RC-ACQ-CH-RB-1": {
        "label": "Define compliance workflow and control framework requirements",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["rfp_template", "use_case_page", "technical_documentation"],
        "phase": "diverge",
    },

    # --- Champion — Progression ----------------------------------------------

    "RC-PRG-CH-SS-1": {
        "label": "Secure CRO / General Counsel endorsement for platform selection",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "consensus_brief", "risk_mitigation_plan"],
        "phase": "converge",
    },
    "RC-PRG-CH-SS-2": {
        "label": "Stand up risk control use cases and audit trail demonstrations",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "case_study"],
        "phase": "diverge",
    },
    "RC-PRG-CH-SS-3": {
        "label": "Orchestrate final sign-off across Legal, Finance, and IT",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "risk_mitigation_plan", "executive_brief"],
        "phase": "converge",
    },

    # --- Economic Buyer — Acquisition ----------------------------------------

    "RC-ACQ-EB-PI-1": {
        "label": "Assess enterprise risk exposure and cost of non-compliance",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["benchmark_report", "business_value", "analyst_report"],
        "phase": "diverge",
    },
    "RC-ACQ-EB-SE-1": {
        "label": "Evaluate GRC platform versus manual controls and point solutions",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["competitive_comparison", "analyst_report", "category_explainer"],
        "phase": "diverge",
    },

    # --- Economic Buyer — Progression ----------------------------------------

    "RC-PRG-EB-SS-1": {
        "label": "Validate risk-reduction ROI and audit cost savings",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["roi_calculator", "executive_brief", "case_study"],
        "phase": "diverge",
    },
    "RC-PRG-EB-SS-2": {
        "label": "Confirm platform meets regulatory obligations for the business",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance", "business_value"],
        "phase": "diverge",
    },

    # --- Influencer — Acquisition --------------------------------------------

    "RC-ACQ-INF-RB-1": {
        "label": "Map technical security requirements and integration constraints",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "security_compliance", "rfp_template"],
        "phase": "diverge",
        "notes": "Influencer for RC is IT Security Manager or Data Privacy Officer",
    },
    "RC-ACQ-INF-RB-2": {
        "label": "Validate data residency and privacy controls meet policy",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance"],
        "phase": "diverge",
    },

    # --- Influencer — Progression --------------------------------------------

    "RC-PRG-INF-SS-1": {
        "label": "Certify platform security posture and pen test findings",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["security_compliance", "technical_documentation"],
        "phase": "diverge",
    },
    "RC-PRG-INF-SS-2": {
        "label": "Issue security and privacy recommendation to the buying group",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "governance_policy"],
        "phase": "converge",
    },

    # --- User — Acquisition --------------------------------------------------

    "RC-ACQ-USR-SE-1": {
        "label": "Surface manual control gaps and audit workflow friction",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "howto_training"],
        "phase": "diverge",
        "notes": "User for RC is GRC Analyst, Security Analyst, or Vendor Manager",
    },
    "RC-ACQ-USR-SE-2": {
        "label": "Evaluate platform usability for control testing and evidence collection",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "demo_trial_request"],
        "phase": "diverge",
    },

    # --- User — Progression --------------------------------------------------

    "RC-PRG-USR-SS-1": {
        "label": "Validate that compliance workflows and reporting meet audit standards",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "use_case_page", "demo_trial_request"],
        "phase": "diverge",
    },
    "RC-PRG-USR-SS-2": {
        "label": "Recommend analyst training and control library onboarding",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["adoption_rollout", "howto_training"],
        "phase": "diverge",
    },

    # --- Ratifier — Acquisition (heaviest Ratifier involvement in any category)

    "RC-ACQ-RAT-PI-1": {
        "label": "Establish regulatory and contractual boundaries for vendor evaluation",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "governance_policy"],
        "phase": "diverge",
        "notes": "Ratifier enters at PI in RC — regulatory risk is the primary purchase driver",
    },
    "RC-ACQ-RAT-PI-2": {
        "label": "Identify regulatory obligations that the platform must satisfy",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance", "legal_procurement"],
        "phase": "diverge",
    },
    "RC-ACQ-RAT-RB-1": {
        "label": "Define contractual and legal requirements for GRC platform",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "rfp_template", "governance_policy"],
        "phase": "diverge",
        "notes": "RC Ratifier participates at RB stage — unusual vs other categories",
    },

    # --- Ratifier — Progression ----------------------------------------------

    "RC-PRG-RAT-SS-1": {
        "label": "Confirm regulatory compliance certifications and audit rights",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["security_compliance", "governance_policy"],
        "phase": "diverge",
    },
    "RC-PRG-RAT-SS-2": {
        "label": "Negotiate and execute DPA, MSA, and liability terms",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "risk_mitigation_plan"],
        "phase": "diverge",
    },
    "RC-PRG-RAT-SS-3": {
        "label": "Final sign-off — risk posture acceptable to board / audit committee",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["risk_compliance"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "risk_mitigation_plan", "governance_policy"],
        "phase": "converge",
        "notes": "RC Ratifier is the final convergence gatekeeper — board/audit committee may be involved",
    },


    # =========================================================================
    # AI PLATFORM — CONSTRUCTED
    # Source basis:
    #   - §2 ROLES typical_titles (VP Engineering, Head of AI/ML, CDO,
    #     Head of Data Engineering, ML Platform Lead, Automation Analyst)
    #   - §1c SOLUTIONS: agent_platform, automation_fabric, data_and_analytics
    #     anchor titles
    #   - §1d SOLUTION_CATEGORIES: "Platform / AI buyer" bg_type_description
    #     ("highest proportion of technical Influencers and most rigorous
    #     Ratifier scrutiny around AI governance and data privacy")
    #   - Gartner buying-job framework
    #   - CRM matrix as structural template with AI-specific adjustments
    #
    # AI Platform buying character: This category has the most technically
    # sophisticated Champion in the model — VP Engineering, Head of AI/ML, or
    # CDO. They are simultaneously the domain expert, internal advocate, and
    # technical evaluator. EB is CTO, CDO, or COO depending on the solution
    # sub-type. Influencer is a highly technical peer (Head of Data Engineering,
    # ML Platform Lead) who will actually build on or operate the platform — not
    # just affected by it. User is the practitioner layer (Data Analyst, BI
    # Analyst, Automation Analyst). Ratifier scrutiny is heaviest around AI
    # governance, model transparency, and data privacy. The buying group is
    # often smaller but deeper — fewer people, more technical depth per person.
    # =========================================================================

    # --- Champion — Acquisition ----------------------------------------------

    "AI-ACQ-CH-PI-1": {
        "label": "Build organizational awareness of the AI infrastructure gap",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["thought_leadership", "diagnostic_assessment", "benchmark_report"],
        "phase": "diverge",
    },
    "AI-ACQ-CH-PI-2": {
        "label": "Collect proof that unified AI platforms outperform point-tool proliferation",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["case_study", "analyst_report", "customer_reference"],
        "phase": "diverge",
    },
    "AI-ACQ-CH-PI-3": {
        "label": "Align CTO and business unit leaders on AI platform strategy",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 3,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "executive_brief"],
        "phase": "converge",
    },
    "AI-ACQ-CH-SE-1": {
        "label": "Evaluate AI platform architectures — build vs. buy vs. compose",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["product_solution_overview", "competitive_comparison", "technical_documentation"],
        "phase": "diverge",
    },
    "AI-ACQ-CH-SE-2": {
        "label": "Prototype evaluation criteria with ML and data engineering peers",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "demo_trial_request", "use_case_page"],
        "phase": "diverge",
    },

    # --- Champion — Progression ----------------------------------------------

    "AI-PRG-CH-SS-1": {
        "label": "Secure CTO / CDO commitment to AI platform standardization",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "roi_calculator", "consensus_brief"],
        "phase": "converge",
    },
    "AI-PRG-CH-SS-2": {
        "label": "Stand up platform use cases across agent, automation, and data domains",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "case_study"],
        "phase": "diverge",
    },
    "AI-PRG-CH-SS-3": {
        "label": "Orchestrate AI governance and Ratifier alignment before commitment",
        "role": "champion", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "governance_policy", "risk_mitigation_plan"],
        "phase": "converge",
        "notes": "AI governance sign-off is a distinct converge step in this category",
    },

    # --- Economic Buyer — Acquisition ----------------------------------------

    "AI-ACQ-EB-PI-1": {
        "label": "Quantify cost of fragmented AI and automation point tools",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["benchmark_report", "business_value", "diagnostic_assessment"],
        "phase": "diverge",
    },
    "AI-ACQ-EB-PI-2": {
        "label": "Translate AI platform investment into strategic business outcomes",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["thought_leadership", "analyst_report", "business_value"],
        "phase": "diverge",
    },
    "AI-ACQ-EB-SE-1": {
        "label": "Assess platform vendor landscape against enterprise AI strategy",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["analyst_report", "competitive_comparison", "category_explainer"],
        "phase": "diverge",
    },

    # --- Economic Buyer — Progression ----------------------------------------

    "AI-PRG-EB-SS-1": {
        "label": "Validate AI platform ROI and engineering productivity gains",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["roi_calculator", "executive_brief", "case_study"],
        "phase": "diverge",
    },
    "AI-PRG-EB-SS-2": {
        "label": "Confirm platform roadmap aligns with multi-year AI strategy",
        "role": "economic_buyer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["business_value", "analyst_report", "adoption_rollout"],
        "phase": "diverge",
    },

    # --- Influencer — Acquisition --------------------------------------------

    "AI-ACQ-INF-RB-1": {
        "label": "Define technical requirements for model serving, orchestration, and data access",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "integration_map", "rfp_template"],
        "phase": "diverge",
        "notes": "Influencer for AI Platform is Head of Data Engineering or ML Platform Lead — most technical Influencer in model",
    },
    "AI-ACQ-INF-RB-2": {
        "label": "Stress test platform fit against existing data infrastructure",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "demo_trial_request", "product_tour"],
        "phase": "diverge",
    },
    "AI-ACQ-INF-RB-3": {
        "label": "Evaluate MLOps, lineage, and observability capabilities",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "requirements_building", "sequence": 3,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["technical_documentation", "product_solution_overview"],
        "phase": "diverge",
    },

    # --- Influencer — Progression --------------------------------------------

    "AI-PRG-INF-SS-1": {
        "label": "Run proof of concept on production data and real model workloads",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["demo_trial_request", "technical_documentation"],
        "phase": "diverge",
    },
    "AI-PRG-INF-SS-2": {
        "label": "Issue technical platform recommendation to engineering leadership",
        "role": "influencer", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["consensus_brief", "technical_documentation"],
        "phase": "converge",
    },

    # --- User — Acquisition --------------------------------------------------

    "AI-ACQ-USR-SE-1": {
        "label": "Surface friction in current data pipelines and model deployment workflows",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["use_case_page", "product_tour", "howto_training"],
        "phase": "diverge",
        "notes": "User for AI Platform is Data Analyst, BI Analyst, or Automation Analyst",
    },
    "AI-ACQ-USR-SE-2": {
        "label": "Evaluate platform usability for day-to-day analytics and model work",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "solution_exploration", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "demo_trial_request"],
        "phase": "diverge",
    },

    # --- User — Progression --------------------------------------------------

    "AI-PRG-USR-SS-1": {
        "label": "Validate that analyst workflows and self-service BI are genuinely improved",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["product_tour", "use_case_page", "demo_trial_request"],
        "phase": "diverge",
    },
    "AI-PRG-USR-SS-2": {
        "label": "Recommend developer onboarding and platform training milestones",
        "role": "user", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["adoption_rollout", "howto_training"],
        "phase": "diverge",
    },

    # --- Ratifier — Acquisition (AI governance scrutiny is highest here) -----

    "AI-ACQ-RAT-PI-1": {
        "label": "Establish AI governance policy and model transparency requirements",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance"],
        "phase": "diverge",
        "notes": "AI Ratifier scrutiny is heaviest around AI governance and data privacy — §1d",
    },
    "AI-ACQ-RAT-PI-2": {
        "label": "Identify data sovereignty, residency, and privacy requirements",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "problem_identification", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "legal_procurement", "security_compliance"],
        "phase": "diverge",
    },

    # --- Ratifier — Progression ----------------------------------------------

    "AI-PRG-RAT-SS-1": {
        "label": "Audit AI model explainability, bias controls, and responsible AI posture",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 1,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["governance_policy", "security_compliance"],
        "phase": "diverge",
        "notes": "AI-specific ratifier check not present in other categories",
    },
    "AI-PRG-RAT-SS-2": {
        "label": "Confirm data processing terms, SLAs, and vendor AI liability posture",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 2,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["legal_procurement", "risk_mitigation_plan", "governance_policy"],
        "phase": "diverge",
    },
    "AI-PRG-RAT-SS-3": {
        "label": "Final sign-off — AI platform meets enterprise AI ethics and compliance bar",
        "role": "ratifier", "opportunity_type": "acquisition",
        "buying_job": "supplier_selection", "sequence": 3,
        "solution_categories": ["ai_platform"],
        "coverage_status": "constructed",
        "content_types": ["executive_brief", "governance_policy", "risk_mitigation_plan"],
        "phase": "converge",
    },
}


# =============================================================================
# §18  BUYING GROUP CONVERGENCE POINTS  [CRM deck p.16 — double-diamond]
#
# Six convergence points where the buying group must align before progressing.
# These are the exits from the CONVERGE phase of each double-diamond stage.
# common_blockers reference Gartner friction events that cause loop-backs.
#
# Coverage: Customer Engagement validated from source.
# All other categories: same six convergence points apply universally —
# convergence points are category-agnostic. The roles required and common
# blockers are consistent across all five solution categories.
# =============================================================================

BG_CONVERGENCE_POINTS = {

    "problem_validation": {
        "label": "Problem Validation",
        "sequence": 1,
        "description": "The group agrees the problem is real, urgent, and worth solving.",
        "roles_required": ["champion", "economic_buyer", "influencer"],
        "precedes_buying_job": "solution_exploration",
        "common_blockers": [
            "misalignment_on_problem",
            "group_diagnostic_deployment",
            "deconflicting_information_within_buying_group",
            "buying_group_turnover",
            "ceo_turnover",
        ],
        "loop_trigger_severity": {
            "ceo_turnover":                                  "full_reset",
            "buying_group_turnover":                         "full_reset",
            "misalignment_on_problem":                       "partial_reset",
            "deconflicting_information_within_buying_group": "partial_reset",
            "group_diagnostic_deployment":                   "partial_reset",
        },
        "content_that_enables_alignment": [
            "diagnostic_assessment",
            "benchmark_report",
            "thought_leadership",
            "consensus_brief",
        ],
        "re_entry_content_shift": (
            "On re-entry, prioritise external validation over awareness content. "
            "A group re-validating after CEO turnover needs peer references and "
            "analyst data, not introductory problem framing."
        ),
    },

    "requirements_framing": {
        "label": "Requirements Framing",
        "sequence": 2,
        "description": "Define what 'good' looks like and set evaluation criteria.",
        "roles_required": ["champion", "influencer", "user"],
        "precedes_buying_job": "requirements_building",
        "common_blockers": [
            "buying_group_debates",
            "group_disagreement_on_requirements",
            "end_user_input",
            "buying_consultant_discussion",
        ],
        "loop_trigger_severity": {
            "group_disagreement_on_requirements": "partial_reset",
            "buying_group_debates":               "partial_reset",
            "end_user_input":                     "scope_expansion",
            "buying_consultant_discussion":       "scope_expansion",
        },
        "content_that_enables_alignment": [
            "rfp_template",
            "use_case_page",
            "consensus_brief",
        ],
        "re_entry_content_shift": (
            "On re-entry after debate, serve content that helps the group converge "
            "on shared criteria. Requirements Framing re-entry is a consensus problem, "
            "not an information problem."
        ),
    },

    "solution_validation": {
        "label": "Solution Validation",
        "sequence": 3,
        "description": "Confirm Kalder meets functional and technical needs.",
        "roles_required": ["champion", "influencer", "user"],
        "precedes_buying_job": "supplier_selection",
        "common_blockers": [
            "online_content_shared",
            "expert_consultation",
            "feasibility_review",
            "exploration_of_integration_with_existing_systems",
        ],
        "loop_trigger_severity": {
            "online_content_shared":                          "confidence_erosion",
            "expert_consultation":                            "partial_reset",
            "feasibility_review":                             "partial_reset",
            "exploration_of_integration_with_existing_systems": "scope_expansion",
        },
        "content_that_enables_alignment": [
            "technical_documentation",
            "integration_map",
            "product_tour",
            "use_case_page",
            "customer_reference",
        ],
        "re_entry_content_shift": (
            "On re-entry after expert challenge, serve technical proof over "
            "business value content. The blocker is credibility, not ROI."
        ),
    },

    "business_value_alignment": {
        "label": "Business Value Alignment",
        "sequence": 4,
        "description": "Align on ROI, TCO, and measurable outcomes.",
        "roles_required": ["champion", "economic_buyer", "influencer"],
        "precedes_buying_job": "supplier_selection",
        "common_blockers": [
            "business_case_data_unavailable",
            "budget_cut",
            "procurement_flag",
        ],
        "loop_trigger_severity": {
            "business_case_data_unavailable": "partial_reset",
            "budget_cut":                     "full_reset",
            "procurement_flag":               "scope_expansion",
        },
        "content_that_enables_alignment": [
            "roi_calculator",
            "executive_brief",
            "business_value",
            "customer_reference",
        ],
        "re_entry_content_shift": (
            "On re-entry after budget constraint, shift from ROI justification "
            "to cost-of-inaction framing. The EB already knows the value — "
            "they need ammunition to defend the spend internally."
        ),
    },

    "risk_compliance_validation": {
        "label": "Risk, Compliance & Technical Validation",
        "sequence": 5,
        "description": "Clear security, legal, and procurement hurdles.",
        "roles_required": ["champion", "economic_buyer", "ratifier"],
        "precedes_buying_job": "supplier_selection",
        "common_blockers": [
            "purchasing_rules_overrule_group_decision",
            "legal_flag",
            "capital_review_board",
            "more_information_needed_from_sales_reps",
        ],
        "loop_trigger_severity": {
            "purchasing_rules_overrule_group_decision": "full_reset",
            "legal_flag":                               "partial_reset",
            "capital_review_board":                     "partial_reset",
            "more_information_needed_from_sales_reps":  "confidence_erosion",
        },
        "content_that_enables_alignment": [
            "security_compliance",
            "governance_policy",
            "legal_procurement",
            "risk_mitigation_plan",
            "executive_brief",
        ],
        "re_entry_content_shift": (
            "Ratifier-triggered re-entry requires security and compliance proof, "
            "not business value content. The Ratifier eliminates risk — "
            "serve them what they need to say yes."
        ),
    },

    "final_commitment": {
        "label": "Final Commitment",
        "sequence": 6,
        "description": "Full alignment on value, risk, and readiness to sign across all roles.",
        "roles_required": ["champion", "economic_buyer", "ratifier"],
        "precedes_buying_job": None,
        "common_blockers": [
            "buying_group_turnover",
            "contract_updates_required",
            "purchasing_rules_overrule_group_decision",
        ],
        "loop_trigger_severity": {
            "buying_group_turnover":                    "partial_reset",
            "contract_updates_required":                "minor_delay",
            "purchasing_rules_overrule_group_decision": "full_reset",
        },
        "content_that_enables_alignment": [
            "adoption_rollout",
            "risk_mitigation_plan",
            "executive_brief",
            "customer_reference",
        ],
        "re_entry_content_shift": None,
    },
}


# =============================================================================
# §19  TITLE → ROLE MAPPING  [CRM deck p.8 — solution-level]
#
# COVERAGE STATUS:
#   COMPLETE:  Customer Engagement — Service (CSM/FSM) and Sales (SOM)
#   PENDING:   IT & Operations, Employee Experience, Risk & Compliance, AI Platform
#
# Keys off solution sub-type within category.
# Source: CRM Buying Group Planning deck (ServiceNow, Nov 2025), validated.
# =============================================================================

TITLE_ROLE_MAP = {

    # =========================================================================
    # CUSTOMER ENGAGEMENT — COMPLETE (source validated)
    # §19 is the sole authoritative role lookup (CR-01).
    # solution_key is a required parameter for any classification call.
    # Cross-solution title overlap is expected behavior, not a data error.
    # =========================================================================

    "customer_service": {
        "coverage_status": "complete",
        "source": "CRM Buying Group Planning deck, ServiceNow Nov 2025, slide 8",
        "champion": {
            "titles": [
                {"title": "Head / Director of Customer Experience",                 "validation_status": "validated"},
                {"title": "Director of Customer Service Operations / Delivery",     "validation_status": "validated"},
                {"title": "Head of Digital Transformation / Service Innovation",    "validation_status": "partial_crm_match"},
                {"title": "Director of Field Service / Service Operations Leader",  "validation_status": "validated"},
                {"title": "Customer Success Director / VP of Customer Success",     "validation_status": "validated"},
                {"title": "EVP/SVP/VP of Technology",                              "validation_status": "partial_crm_match"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Customer Officer",                                 "validation_status": "validated"},
                {"title": "Chief Operating Officer",                                "validation_status": "validated"},
                {"title": "EVP/SVP/VP Customer Service",                           "validation_status": "validated"},
                {"title": "EVP/SVP/VP of Field Service",                           "validation_status": "validated"},
                {"title": "EVP/SVP/VP Service / Service Operations",               "validation_status": "validated"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "VP of IT / Director of Business Applications",           "validation_status": "validated"},
                {"title": "Head of Workforce Management",                           "validation_status": "validated"},
                {"title": "VP of Product or Operations",                            "validation_status": "validated"},
                {"title": "Finance or FP&A Leader",                                "validation_status": "partial_crm_match"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Customer Service Manager / Supervisor",                  "validation_status": "validated"},
                {"title": "Service Agent / Support Specialist",                     "validation_status": "validated"},
                {"title": "Field Service Technician",                               "validation_status": "validated"},
                {"title": "Dispatcher / Scheduler",                                 "validation_status": "validated"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "validated"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "validated"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "validated"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "validated"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "validated"},
            ],
        },
    },

    "sales_automation": {
        "coverage_status": "complete",
        "source": "CRM Buying Group Planning deck, ServiceNow Nov 2025, slide 8",
        "champion": {
            "titles": [
                {"title": "Director of Sales Operations",                           "validation_status": "validated"},
                {"title": "Head of Revenue Operations",                             "validation_status": "validated"},
                {"title": "Director of Sales Strategy & Planning",                  "validation_status": "validated"},
                {"title": "Director of Sales Enablement",                           "validation_status": "validated"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Revenue Officer",                                  "validation_status": "validated"},
                {"title": "Chief Customer Officer",                                 "validation_status": "validated"},
                {"title": "EVP/SVP/VP of Sales / Sales Operations",                "validation_status": "validated"},
                {"title": "EVP/SVP/VP of Operations",                              "validation_status": "validated"},
                {"title": "EVP/SVP/VP of Revenue Operations",                      "validation_status": "validated"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "VP of Marketing / Demand Generation",                    "validation_status": "validated"},
                {"title": "VP of Customer Success",                                 "validation_status": "validated"},
                {"title": "Director of IT or Business Systems",                     "validation_status": "validated"},
                {"title": "Finance Controller / FP&A",                             "validation_status": "partial_crm_match"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Account Executive (AE)",                                 "validation_status": "validated"},
                {"title": "Sales Development Rep (SDR)",                            "validation_status": "validated"},
                {"title": "Sales Engineer",                                         "validation_status": "validated"},
                {"title": "Customer Success Manager",                               "validation_status": "validated"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "validated"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "validated"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "validated"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "validated"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "validated"},
            ],
        },
    },

    # Inferred from sales_automation + §1c champion/EB anchor titles
    "order_management": {
        "coverage_status": "constructed",
        "source": "Constructed from §1c anchor titles and sales_automation structural template",
        "champion": {
            "titles": [
                {"title": "VP of Revenue Operations",                               "validation_status": "constructed_from_anchor"},
                {"title": "Head of Commercial Operations",                          "validation_status": "inferred"},
                {"title": "Director of Order Management",                           "validation_status": "inferred"},
                {"title": "Director of Revenue Operations",                         "validation_status": "inferred"},
                {"title": "Head of Quote-to-Cash / Lead-to-Cash",                  "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Revenue Officer",                                  "validation_status": "constructed_from_anchor"},
                {"title": "Chief Financial Officer",                                "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Operations",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Revenue Operations",                      "validation_status": "inferred"},
                {"title": "Chief Operating Officer",                                "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Director of IT or Business Systems",                     "validation_status": "inferred"},
                {"title": "Director of Finance / FP&A",                            "validation_status": "inferred"},
                {"title": "VP of Customer Success",                                 "validation_status": "inferred"},
                {"title": "Director of Sales Operations",                           "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Order Management Specialist",                            "validation_status": "inferred"},
                {"title": "Commercial Analyst",                                     "validation_status": "inferred"},
                {"title": "Contract Administrator",                                 "validation_status": "inferred"},
                {"title": "Billing / Revenue Analyst",                             "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "VP of Finance / Controller",                             "validation_status": "inferred"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "inferred"},
                {"title": "Head of Legal / General Counsel",                        "validation_status": "inferred"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "inferred"},
            ],
        },
    },


    # =========================================================================
    # IT & OPERATIONS — CONSTRUCTED
    # Source basis: IT deck slide 38 (Champion + Decision-maker messaging only);
    # §2 ROLES typical_titles; §1c SOLUTIONS anchor titles.
    # =========================================================================

    "it_service_management": {
        "coverage_status": "constructed",
        "source": "Constructed from IT deck slide 38, §2 typical_titles, §1c anchor titles",
        "champion": {
            "titles": [
                {"title": "IT Director",                                            "validation_status": "constructed_from_anchor"},
                {"title": "VP of IT",                                               "validation_status": "constructed_from_anchor"},
                {"title": "Head of Digital Transformation",                         "validation_status": "inferred"},
                {"title": "Director of IT Operations",                              "validation_status": "inferred"},
                {"title": "Director of IT Service Delivery",                        "validation_status": "inferred"},
                {"title": "Head of Enterprise Service Management",                  "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "constructed_from_anchor"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "constructed_from_anchor"},
                {"title": "Chief Digital Officer",                                  "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Technology",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of IT",                                      "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Enterprise Architect",                                   "validation_status": "inferred"},
                {"title": "IT Manager / Senior IT Manager",                         "validation_status": "inferred"},
                {"title": "Head of Platform Engineering",                           "validation_status": "inferred"},
                {"title": "Director of Business Applications",                      "validation_status": "inferred"},
                {"title": "IT Service Manager",                                     "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "IT Support Analyst",                                     "validation_status": "inferred"},
                {"title": "Service Desk Agent",                                     "validation_status": "inferred"},
                {"title": "IT Coordinator",                                         "validation_status": "inferred"},
                {"title": "Incident Manager",                                       "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "inferred"},
                {"title": "VP of Procurement / Vendor Management",                 "validation_status": "inferred"},
            ],
        },
    },

    "it_operations_management": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (VP Infrastructure / Head of IT Ops)",
        "champion": {
            "titles": [
                {"title": "VP of Infrastructure",                                   "validation_status": "constructed_from_anchor"},
                {"title": "Head of IT Operations",                                  "validation_status": "constructed_from_anchor"},
                {"title": "Director of Cloud Operations",                           "validation_status": "inferred"},
                {"title": "Director of Site Reliability Engineering (SRE)",        "validation_status": "inferred"},
                {"title": "Head of AIOps / Observability",                         "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "constructed_from_anchor"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "constructed_from_anchor"},
                {"title": "Chief Digital Officer",                                  "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Technology",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Engineering",                             "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Enterprise Architect",                                   "validation_status": "inferred"},
                {"title": "Head of Platform Engineering",                           "validation_status": "inferred"},
                {"title": "Principal SRE / Staff Engineer",                         "validation_status": "inferred"},
                {"title": "Director of Cloud Architecture",                         "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "IT Operations Analyst",                                  "validation_status": "inferred"},
                {"title": "NOC Engineer",                                           "validation_status": "inferred"},
                {"title": "Cloud Operations Engineer",                              "validation_status": "inferred"},
                {"title": "SRE / On-Call Engineer",                                "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "Head of Procurement",                                    "validation_status": "inferred"},
                {"title": "VP of Risk / Head of Enterprise Risk",                  "validation_status": "inferred"},
            ],
        },
    },

    "enterprise_platform": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (Head of Digital Transformation / Platform Architect)",
        "champion": {
            "titles": [
                {"title": "Head of Digital Transformation",                         "validation_status": "constructed_from_anchor"},
                {"title": "Platform Architect",                                     "validation_status": "constructed_from_anchor"},
                {"title": "VP of Enterprise Architecture",                          "validation_status": "inferred"},
                {"title": "Director of Platform Engineering",                       "validation_status": "inferred"},
                {"title": "Head of Workflow Automation",                            "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "constructed_from_anchor"},
                {"title": "Chief Digital Officer",                                  "validation_status": "constructed_from_anchor"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Technology",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Digital & Innovation",                    "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Enterprise Architect",                                   "validation_status": "inferred"},
                {"title": "Head of Integration Architecture",                       "validation_status": "inferred"},
                {"title": "Director of Business Applications",                      "validation_status": "inferred"},
                {"title": "Head of Developer Experience",                           "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Platform / Low-Code Developer",                          "validation_status": "inferred"},
                {"title": "Business Process Analyst",                               "validation_status": "inferred"},
                {"title": "Application Owner",                                      "validation_status": "inferred"},
                {"title": "Workflow Administrator",                                 "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "General Counsel / Head of Legal",                        "validation_status": "inferred"},
                {"title": "VP of Procurement",                                      "validation_status": "inferred"},
            ],
        },
    },


    # =========================================================================
    # EMPLOYEE EXPERIENCE — CONSTRUCTED
    # =========================================================================

    "hr_service_delivery": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (VP HR / Head of People Ops)",
        "champion": {
            "titles": [
                {"title": "VP of HR",                                               "validation_status": "constructed_from_anchor"},
                {"title": "Head of People Operations",                              "validation_status": "constructed_from_anchor"},
                {"title": "Director of HR Shared Services",                         "validation_status": "inferred"},
                {"title": "Director of HR Technology",                              "validation_status": "inferred"},
                {"title": "Head of Employee Experience",                            "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief People Officer (CPO)",                             "validation_status": "constructed_from_anchor"},
                {"title": "Chief Human Resources Officer (CHRO)",                   "validation_status": "constructed_from_anchor"},
                {"title": "Chief Operating Officer (COO)",                          "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of People",                                  "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Human Resources",                         "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Director of HR Technology",                              "validation_status": "inferred"},
                {"title": "Business Analyst / Process Owner",                       "validation_status": "inferred"},
                {"title": "VP of IT / Director of Business Applications",           "validation_status": "inferred"},
                {"title": "Finance Controller / FP&A",                             "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "HR Coordinator",                                         "validation_status": "inferred"},
                {"title": "HR Business Partner (HRBP)",                            "validation_status": "inferred"},
                {"title": "Recruiter / Talent Acquisition Specialist",             "validation_status": "inferred"},
                {"title": "HR Generalist",                                          "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "inferred"},
                {"title": "General Counsel / Head of Legal",                        "validation_status": "inferred"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "inferred"},
            ],
        },
    },

    "workplace_services": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles",
        "champion": {
            "titles": [
                {"title": "VP of Workplace Services",                               "validation_status": "inferred"},
                {"title": "Head of Facilities / Real Estate",                       "validation_status": "inferred"},
                {"title": "Director of Workplace Experience",                       "validation_status": "inferred"},
                {"title": "Head of Employee Workplace Technology",                  "validation_status": "inferred"},
                {"title": "VP of Corporate Services",                               "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief People Officer (CPO)",                             "validation_status": "inferred"},
                {"title": "Chief Operating Officer (COO)",                          "validation_status": "inferred"},
                {"title": "Chief Human Resources Officer (CHRO)",                   "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Operations",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Facilities / Real Estate",                "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Director of HR Technology",                              "validation_status": "inferred"},
                {"title": "VP of IT / Head of IT",                                 "validation_status": "inferred"},
                {"title": "Business Analyst / Process Owner",                       "validation_status": "inferred"},
                {"title": "Director of Facilities Operations",                      "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Facilities Coordinator",                                 "validation_status": "inferred"},
                {"title": "Workplace Experience Specialist",                        "validation_status": "inferred"},
                {"title": "Office Manager",                                         "validation_status": "inferred"},
                {"title": "Employee Services Agent",                                "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "inferred"},
                {"title": "VP of Procurement",                                      "validation_status": "inferred"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "inferred"},
            ],
        },
    },

    "learning_and_development": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (VP L&D)",
        "champion": {
            "titles": [
                {"title": "VP of Learning & Development",                           "validation_status": "constructed_from_anchor"},
                {"title": "Head of Talent Development",                             "validation_status": "inferred"},
                {"title": "Director of L&D / Chief Learning Officer",               "validation_status": "inferred"},
                {"title": "Head of Organizational Development",                     "validation_status": "inferred"},
                {"title": "Director of Leadership Development",                     "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief People Officer (CPO)",                             "validation_status": "inferred"},
                {"title": "Chief Human Resources Officer (CHRO)",                   "validation_status": "constructed_from_anchor"},
                {"title": "Chief Operating Officer (COO)",                          "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of People / Talent",                         "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Human Resources",                         "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Director of HR Technology",                              "validation_status": "inferred"},
                {"title": "Business Analyst / Process Owner",                       "validation_status": "inferred"},
                {"title": "VP of IT / Director of Business Applications",           "validation_status": "inferred"},
                {"title": "Manager of Learning Technology",                         "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Learning & Development Specialist",                      "validation_status": "inferred"},
                {"title": "Instructional Designer",                                 "validation_status": "inferred"},
                {"title": "Training Coordinator",                                   "validation_status": "inferred"},
                {"title": "HR Business Partner (learning-focused)",                 "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "inferred"},
                {"title": "Head of Data Privacy / Security",                        "validation_status": "inferred"},
                {"title": "VP of Procurement",                                      "validation_status": "inferred"},
            ],
        },
    },


    # =========================================================================
    # RISK & COMPLIANCE — CONSTRUCTED
    # =========================================================================

    "governance_risk_compliance": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles, §1d GRC bg_type_description",
        "champion": {
            "titles": [
                {"title": "Head of Compliance",                                     "validation_status": "constructed_from_anchor"},
                {"title": "VP of Governance, Risk & Compliance",                    "validation_status": "inferred"},
                {"title": "Chief Compliance Officer",                               "validation_status": "inferred"},
                {"title": "Director of Risk Management",                            "validation_status": "inferred"},
                {"title": "Head of Enterprise Risk",                                "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Risk Officer (CRO)",                               "validation_status": "constructed_from_anchor"},
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "General Counsel / Chief Legal Officer",                  "validation_status": "inferred"},
                {"title": "Chief Compliance Officer (if not Champion)",             "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Risk",                                    "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "IT Security Manager",                                    "validation_status": "inferred"},
                {"title": "Data Privacy Officer / DPO",                             "validation_status": "inferred"},
                {"title": "VP of Procurement",                                      "validation_status": "inferred"},
                {"title": "Internal Audit Director",                                "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "GRC Analyst",                                            "validation_status": "inferred"},
                {"title": "Risk Analyst",                                           "validation_status": "inferred"},
                {"title": "Compliance Analyst",                                     "validation_status": "inferred"},
                {"title": "Internal Auditor",                                       "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "General Counsel / Chief Legal Officer",                  "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "Board Audit Committee / External Auditor (proxy)",       "validation_status": "inferred"},
                {"title": "VP of Procurement / Head of Vendor Management",         "validation_status": "inferred"},
            ],
        },
    },

    "security_operations": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (VP Security Ops)",
        "champion": {
            "titles": [
                {"title": "VP of Security Operations",                              "validation_status": "constructed_from_anchor"},
                {"title": "Head of Cybersecurity",                                  "validation_status": "inferred"},
                {"title": "Director of Security Operations Center (SOC)",           "validation_status": "inferred"},
                {"title": "Director of Threat Intelligence",                        "validation_status": "inferred"},
                {"title": "Head of Incident Response",                              "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "constructed_from_anchor"},
                {"title": "Chief Risk Officer (CRO)",                               "validation_status": "inferred"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "inferred"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Security",                                "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "IT Security Manager",                                    "validation_status": "inferred"},
                {"title": "Data Privacy Officer / DPO",                             "validation_status": "inferred"},
                {"title": "Director of IT Operations",                              "validation_status": "inferred"},
                {"title": "Enterprise Architect (security-focused)",                "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Security Analyst",                                       "validation_status": "inferred"},
                {"title": "SOC Analyst",                                            "validation_status": "inferred"},
                {"title": "Threat Hunter",                                          "validation_status": "inferred"},
                {"title": "Incident Response Analyst",                              "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "General Counsel / Chief Legal Officer",                  "validation_status": "inferred"},
                {"title": "Chief Risk Officer (CRO)",                               "validation_status": "inferred"},
                {"title": "Board Risk / Audit Committee (proxy)",                   "validation_status": "inferred"},
                {"title": "VP of Procurement",                                      "validation_status": "inferred"},
            ],
        },
    },

    "vendor_risk_management": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (Head of Third-Party Risk)",
        "champion": {
            "titles": [
                {"title": "Head of Third-Party Risk",                               "validation_status": "constructed_from_anchor"},
                {"title": "VP of Vendor Risk Management",                           "validation_status": "inferred"},
                {"title": "Director of Supplier Risk",                              "validation_status": "inferred"},
                {"title": "Head of Procurement Risk",                               "validation_status": "inferred"},
                {"title": "Director of Third-Party Governance",                     "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Risk Officer (CRO)",                               "validation_status": "constructed_from_anchor"},
                {"title": "Chief Procurement Officer (CPO)",                        "validation_status": "constructed_from_anchor"},
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "General Counsel / Chief Legal Officer",                  "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Procurement / Supply Chain",              "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "VP of Procurement",                                      "validation_status": "inferred"},
                {"title": "IT Security Manager",                                    "validation_status": "inferred"},
                {"title": "Data Privacy Officer / DPO",                             "validation_status": "inferred"},
                {"title": "Director of Legal / Contract Management",                "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Vendor Manager",                                         "validation_status": "inferred"},
                {"title": "Third-Party Risk Analyst",                               "validation_status": "inferred"},
                {"title": "Procurement Analyst",                                    "validation_status": "inferred"},
                {"title": "Contract Administrator",                                 "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "General Counsel / Chief Legal Officer",                  "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "Chief Risk Officer (CRO, if not EB)",                   "validation_status": "inferred"},
                {"title": "Board Audit / Risk Committee (proxy)",                   "validation_status": "inferred"},
            ],
        },
    },


    # =========================================================================
    # AI PLATFORM — CONSTRUCTED
    # =========================================================================

    "agent_platform": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (VP Engineering / Head of AI/ML / CDO)",
        "champion": {
            "titles": [
                {"title": "VP of Engineering",                                      "validation_status": "constructed_from_anchor"},
                {"title": "Head of AI / ML",                                        "validation_status": "constructed_from_anchor"},
                {"title": "Chief AI Officer / VP of AI",                            "validation_status": "inferred"},
                {"title": "Director of AI Platform Engineering",                    "validation_status": "inferred"},
                {"title": "Head of Intelligent Automation",                         "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "constructed_from_anchor"},
                {"title": "Chief Information Officer (CIO)",                        "validation_status": "inferred"},
                {"title": "Chief Digital Officer",                                  "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Engineering",                             "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Product & Technology",                    "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Head of Data Engineering",                               "validation_status": "inferred"},
                {"title": "ML Platform Lead / Staff ML Engineer",                   "validation_status": "inferred"},
                {"title": "Director of Automation",                                 "validation_status": "inferred"},
                {"title": "Principal Engineer / Distinguished Engineer",            "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "AI / ML Engineer",                                       "validation_status": "inferred"},
                {"title": "Automation Analyst",                                     "validation_status": "inferred"},
                {"title": "Business Intelligence Analyst",                          "validation_status": "inferred"},
                {"title": "Data Scientist",                                         "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "General Counsel / Head of Legal",                        "validation_status": "inferred"},
                {"title": "Chief Risk Officer / VP of Risk",                        "validation_status": "inferred"},
                {"title": "Head of AI Ethics / Responsible AI (where applicable)", "validation_status": "inferred"},
            ],
        },
    },

    "automation_fabric": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (Head of Automation / VP Digital Transformation)",
        "champion": {
            "titles": [
                {"title": "Head of Automation",                                     "validation_status": "constructed_from_anchor"},
                {"title": "VP of Digital Transformation",                           "validation_status": "constructed_from_anchor"},
                {"title": "Director of Intelligent Automation",                     "validation_status": "inferred"},
                {"title": "Head of Robotic Process Automation (RPA)",               "validation_status": "inferred"},
                {"title": "Director of Business Process Excellence",                "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Operating Officer (COO)",                          "validation_status": "constructed_from_anchor"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "constructed_from_anchor"},
                {"title": "Chief Digital Officer",                                  "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Operations",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Digital & Transformation",                "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Director of Automation",                                 "validation_status": "inferred"},
                {"title": "Enterprise Architect",                                   "validation_status": "inferred"},
                {"title": "Head of Data Engineering",                               "validation_status": "inferred"},
                {"title": "Business Process Owner / Director of Process Excellence","validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Automation Analyst",                                     "validation_status": "inferred"},
                {"title": "RPA Developer / Citizen Developer",                      "validation_status": "inferred"},
                {"title": "Business Process Analyst",                               "validation_status": "inferred"},
                {"title": "Operations Analyst",                                     "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "Chief Risk Officer / VP of Risk",                        "validation_status": "inferred"},
                {"title": "VP of Finance / FP&A Leader",                           "validation_status": "inferred"},
                {"title": "General Counsel / Head of Legal",                        "validation_status": "inferred"},
            ],
        },
    },

    "data_and_analytics": {
        "coverage_status": "constructed",
        "source": "Constructed from §2 typical_titles, §1c anchor titles (VP of Data / Chief Data Officer)",
        "champion": {
            "titles": [
                {"title": "VP of Data",                                             "validation_status": "constructed_from_anchor"},
                {"title": "Chief Data Officer (CDO)",                               "validation_status": "constructed_from_anchor"},
                {"title": "Head of Data & Analytics",                               "validation_status": "inferred"},
                {"title": "Director of Data Platform Engineering",                  "validation_status": "inferred"},
                {"title": "Head of Business Intelligence",                          "validation_status": "inferred"},
            ],
        },
        "economic_buyer": {
            "titles": [
                {"title": "Chief Data Officer (CDO, if not Champion)",             "validation_status": "constructed_from_anchor"},
                {"title": "Chief Technology Officer (CTO)",                         "validation_status": "constructed_from_anchor"},
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "constructed_from_anchor"},
                {"title": "EVP/SVP/VP of Technology",                              "validation_status": "inferred"},
                {"title": "EVP/SVP/VP of Data & Analytics",                        "validation_status": "inferred"},
            ],
        },
        "influencer": {
            "titles": [
                {"title": "Head of Data Engineering",                               "validation_status": "inferred"},
                {"title": "ML Platform Lead",                                       "validation_status": "inferred"},
                {"title": "Director of Analytics Engineering",                      "validation_status": "inferred"},
                {"title": "BI Platform Lead / Head of Data Products",               "validation_status": "inferred"},
            ],
        },
        "user": {
            "titles": [
                {"title": "Data Analyst",                                           "validation_status": "inferred"},
                {"title": "Business Intelligence Analyst",                          "validation_status": "inferred"},
                {"title": "Analytics Engineer",                                     "validation_status": "inferred"},
                {"title": "Data Scientist",                                         "validation_status": "inferred"},
            ],
        },
        "ratifier": {
            "titles": [
                {"title": "Chief Financial Officer (CFO)",                          "validation_status": "inferred"},
                {"title": "Chief Information Security Officer (CISO)",              "validation_status": "inferred"},
                {"title": "General Counsel / Head of Legal",                        "validation_status": "inferred"},
                {"title": "Chief Risk Officer / VP of Risk",                        "validation_status": "inferred"},
                {"title": "Head of Data Privacy / DPO",                             "validation_status": "inferred"},
            ],
        },
    },
}


# =============================================================================
# §20  WEBSITE SURFACE TAXONOMY
#
# Maps kalder.com surface types to personalisation eligibility, signal
# contribution, phase relevance, and exclusion logic.
# Surfaces with signal_contribution "negative" actively suppress role scores.
# Post-sale surfaces require TAL status filter before scoring.
# =============================================================================

WEBSITE_SURFACES = {

    # ── GTM Surfaces ──────────────────────────────────────────────────────────
    "homepage": {
        "label": "Homepage",
        "primary_audience": ["prospect", "customer", "general"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "weak",
        "buying_group_relevance": "awareness",
        "notes": "Account-level and cohort-level personalisation only. Strong signal on repeat visits combined with solution page engagement.",
    },
    "solution_l1": {
        "label": "Solution Category Page (L1)",
        "primary_audience": ["prospect"],
        "personalisation": "full",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "acquisition",
    },
    "solution_l2": {
        "label": "Solution Sub-Type Page (L2)",
        "primary_audience": ["prospect"],
        "personalisation": "full",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "acquisition",
    },
    "product_page": {
        "label": "Product Page",
        "primary_audience": ["prospect", "influencer_heavy"],
        "personalisation": "full",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "acquisition_progression",
        "notes": "Influencer and User heavy at evaluation stage. Product page depth signals requirements_building phase.",
    },
    "industry_page": {
        "label": "Industry / Vertical Page",
        "primary_audience": ["prospect"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "moderate",
        "buying_group_relevance": "education_acquisition",
        "notes": "Strong firmographic signal. Industry page + solution page in same session = high-confidence combo.",
    },
    "pricing_page": {
        "label": "Pricing Page",
        "primary_audience": ["prospect", "economic_buyer_heavy"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "very_strong",
        "buying_group_relevance": "progression",
        "notes": "Strongest single late-stage intent signal. Triggers immediate sales alert.",
    },
    "competitive_page": {
        "label": "Competitive / Why Kalder Page",
        "primary_audience": ["prospect"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "acquisition",
    },
    "customer_story": {
        "label": "Customer Story / Case Study Page",
        "primary_audience": ["prospect", "customer"],
        "personalisation": "full",
        "phase": "both",
        "signal_contribution": "strong",
        "buying_group_relevance": "acquisition_progression",
    },
    "partner_page": {
        "label": "Partner / Integration Page",
        "primary_audience": ["prospect", "influencer_heavy", "partner"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "moderate",
        "buying_group_relevance": "acquisition",
    },
    "resource_hub": {
        "label": "Resource Hub / Content Library",
        "primary_audience": ["prospect", "customer"],
        "personalisation": "full",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "education_acquisition_progression",
    },

    # ── Technical / Evaluation Surfaces ──────────────────────────────────────
    "technical_docs": {
        "label": "Technical Documentation",
        "primary_audience": ["influencer", "user", "developer", "customer"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "strong_for_influencer",
        "buying_group_relevance": "acquisition_progression",
        "exclusion_notes": "Apply TAL status filter. Existing customer doc access excluded from Acquisition scoring.",
    },
    "api_reference": {
        "label": "API Reference / Developer Portal",
        "primary_audience": ["developer", "influencer", "customer"],
        "personalisation": "none",
        "phase": "diverge",
        "signal_contribution": "moderate_suppressed",
        "buying_group_relevance": "acquisition",
        "exclusion_notes": "Suppress from role classification unless account is pre-sale TAL.",
    },
    "security_trust": {
        "label": "Security & Trust Center",
        "primary_audience": ["ratifier", "influencer", "prospect"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "very_strong_for_ratifier",
        "buying_group_relevance": "progression",
        "notes": "Strongest Ratifier signal on the website. Security center + pricing page = near-certain late-stage opportunity.",
    },
    "integration_catalog": {
        "label": "Integration Catalog",
        "primary_audience": ["influencer", "user", "developer"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "strong_for_influencer",
        "buying_group_relevance": "acquisition",
    },

    # ── Proof / Validation Surfaces ───────────────────────────────────────────
    "roi_calculator_surface": {
        "label": "ROI / TCO Calculator",
        "primary_audience": ["economic_buyer", "champion"],
        "personalisation": "full",
        "phase": "diverge",
        "signal_contribution": "very_strong",
        "buying_group_relevance": "progression",
        "notes": "Highest-value interactive signal. Immediate SDR alert trigger.",
    },
    "analyst_report_page": {
        "label": "Analyst Report / Third-Party Validation",
        "primary_audience": ["prospect", "economic_buyer", "ratifier"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "acquisition_progression",
    },

    # ── Community / Post-Sale Surfaces ────────────────────────────────────────
    "community_forum_surface": {
        "label": "Community Forum",
        "primary_audience": ["customer", "user", "developer"],
        "personalisation": "partial",
        "phase": "post_sale",
        "signal_contribution": "suppressed",
        "buying_group_relevance": "retention_upsell",
        "exclusion_flag": "suppress_acquisition_scoring",
    },
    "knowledge_base_surface": {
        "label": "Knowledge Base / Support Portal",
        "primary_audience": ["customer", "user"],
        "personalisation": "partial",
        "phase": "post_sale",
        "signal_contribution": "suppressed",
        "buying_group_relevance": "retention",
        "exclusion_flag": "suppress_acquisition_scoring",
    },
    "training_certification": {
        "label": "Training & Certification",
        "primary_audience": ["customer", "user", "influencer"],
        "personalisation": "partial",
        "phase": "post_sale",
        "signal_contribution": "weak_suppressed",
        "buying_group_relevance": "retention_upsell",
        "notes": "Pre-sale access (free trial / POC) should NOT be suppressed — strong User and Influencer signal in that context.",
    },
    "changelog": {
        "label": "Product Changelog / Release Notes",
        "primary_audience": ["customer", "influencer", "developer"],
        "personalisation": "none",
        "phase": "post_sale",
        "signal_contribution": "suppressed",
        "buying_group_relevance": "retention_upsell",
    },

    # ── Corporate Surfaces ────────────────────────────────────────────────────
    "about_leadership": {
        "label": "About / Leadership",
        "primary_audience": ["general", "ratifier", "prospect"],
        "personalisation": "none",
        "phase": "excluded",
        "signal_contribution": "suppressed",
        "buying_group_relevance": "none",
        "exclusion_flag": "corporate",
    },
    "newsroom": {
        "label": "Newsroom / Press",
        "primary_audience": ["press", "analyst", "investor"],
        "personalisation": "none",
        "phase": "excluded",
        "signal_contribution": "suppressed",
        "buying_group_relevance": "none",
        "exclusion_flag": "corporate",
    },
    "legal_privacy": {
        "label": "Legal / Privacy / Compliance",
        "primary_audience": ["ratifier", "legal", "general"],
        "personalisation": "none",
        "phase": "excluded",
        "signal_contribution": "suppressed",
        "buying_group_relevance": "none",
        "exclusion_flag": "corporate",
    },
    "careers": {
        "label": "Careers",
        "primary_audience": ["job_seeker"],
        "personalisation": "none",
        "phase": "excluded",
        "signal_contribution": "negative",
        "buying_group_relevance": "none",
        "exclusion_flag": "job_seeker",
        "notes": "Careers page visits SUBTRACT from role confidence scores — a contact here is a job seeker, not a Champion.",
    },
    "investor_relations": {
        "label": "Investor Relations",
        "primary_audience": ["investor", "analyst", "press"],
        "personalisation": "none",
        "phase": "excluded",
        "signal_contribution": "negative",
        "buying_group_relevance": "none",
        "exclusion_flag": "corporate",
    },

    # ── Event / Campaign Surfaces ─────────────────────────────────────────────
    "event_page": {
        "label": "Event Page",
        "primary_audience": ["prospect", "customer"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "moderate",
        "buying_group_relevance": "education_acquisition",
        "omnichannel_note": "Event registration data bridges web and offline — feeds omnichannel orchestration layer.",
    },
    "webinar_page": {
        "label": "Webinar Registration / Replay",
        "primary_audience": ["prospect", "customer"],
        "personalisation": "partial",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "education_acquisition",
    },
    "campaign_landing": {
        "label": "Campaign Landing Page",
        "primary_audience": ["prospect"],
        "personalisation": "full",
        "phase": "diverge",
        "signal_contribution": "strong",
        "buying_group_relevance": "education_acquisition_progression",
        "notes": "Respect campaign stage targeting — do not override an Education campaign page with Progression content.",
    },
}


# =============================================================================
# §CA  CLIENT ATTRIBUTE MAP  (CR-09, finalized Document 8 Section 2)
#
# Canonical registry of every AEP profile attribute, contact-plane scoring attribute,
# and content-plane offer catalog field that the program reads, writes, or evaluates
# at runtime. Maps canonical attribute names to type definitions, source pipelines,
# read mechanisms, and null behaviors.
#
# Governance: Marketing Ops engineer owns the registry. Data Architect approves
# all additions. No attribute may be used in Target, Marketo, Outreach, or Salesforce
# configuration without a valid entry here. See Document 8 Section 2.5 for full
# governance rules.
#
# Onboarding: Default values are Kalder's own AEP attribute names (canonical schema).
# Override `allowed_values` enumerations during AI Advisor client onboarding where
# client Salesforce field names differ from canonical names.
#
# All references to aep_attribute values throughout the model must resolve
# through this map at runtime, not by reading hardcoded strings directly.
# =============================================================================

CLIENT_ATTRIBUTE_MAP = {

    # =========================================================================
    # ACCOUNT-PLANE ATTRIBUTES
    # Stored on the AEP account profile; evaluated once per account.
    # All contacts at a given account share the same account-plane values.
    # =========================================================================

    "tal_member": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Salesforce CRM → AEP account profile via Kafka streaming pipeline",
        "null_behavior": "If absent, visitor is treated as non-TAL; no personalization above Level 5 activates",
        "onboarding_required": True,
    },
    "tal_program_status": {
        "plane": "account",
        "type": "str",
        "allowed_values": "active_prospect / post_sale / out_of_program",
        "source_pipeline": "AEP pipeline (derived from Salesforce account type via Kafka)",
        "null_behavior": "If null, visitor is treated as out_of_program; no personalization above Level 5 activates",
        "onboarding_required": True,
    },
    "tal_upsell_override_active": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Salesforce via Kafka pipeline or manual override",
        "null_behavior": "If null, treated as false; no upsell experience activates",
        "onboarding_required": True,
    },
    "tal_solution_interest_flags": {
        "plane": "account",
        "type": "list",
        "allowed_values": "Array of solution category keys: it_operations / customer_engagement / employee_experience / risk_compliance / ai_platform",
        "source_pipeline": "AEP pipeline (aggregated from behavioral signals across scoring window)",
        "null_behavior": "If null or empty array, no solution-specific Level 4 personalization activates; visitor routes to brand-level Level 4 or Level 5",
        "onboarding_required": False,
    },
    "tal_region": {
        "plane": "account",
        "type": "str",
        "allowed_values": "Salesforce account region value (client-specific enumeration)",
        "source_pipeline": "Salesforce account record via Kafka",
        "null_behavior": "If null, regional campaign assignment is skipped; visitor receives non-regional content",
        "onboarding_required": True,
    },
    "tal_marquee": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Salesforce account record via Kafka",
        "null_behavior": "If null, treated as false; standard content inventory allocation applies",
        "onboarding_required": True,
    },
    "tal_open_pipeline": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Salesforce account record via Kafka",
        "null_behavior": "If null, treated as false; SDR activation eligibility not extended",
        "onboarding_required": True,
    },
    "tal_channel": {
        "plane": "account",
        "type": "str",
        "allowed_values": "direct / msp / partner",
        "source_pipeline": "Salesforce account record via Kafka",
        "null_behavior": "If null, channel routing falls back to direct; Outreach sequence selection uses direct-channel variant",
        "onboarding_required": True,
    },
    "tal_new_logo_eligible": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Salesforce CRM via Kafka streaming pipeline",
        "null_behavior": "If null, treated as false; acquisition personalization is suppressed; visitor receives standard non-acquisition experience",
        "onboarding_required": True,
    },
    "tal_account_domain": {
        "plane": "account",
        "type": "str",
        "allowed_values": "Domain URL string (e.g. kalder.com)",
        "source_pipeline": "Salesforce CRM via Kafka streaming pipeline",
        "null_behavior": "If null, Demandbase reverse-IP matching cannot execute for this account; visitor routes to Level 5 until the domain is populated",
        "onboarding_required": True,
    },
    "tal_last_refreshed_at": {
        "plane": "account",
        "type": "str",
        "allowed_values": "ISO 8601 UTC timestamp string",
        "source_pipeline": "Kafka pipeline (written on every successful Salesforce CRM sync event)",
        "null_behavior": "If null, staleness check cannot execute; operational monitoring alert fires; treated as a data pipeline error",
        "onboarding_required": False,
    },
    "tal_account_type_source": {
        "plane": "account",
        "type": "str",
        "allowed_values": "suspect / prospect / customer / customer_via_partner / customer_subsidiary",
        "source_pipeline": "Salesforce CRM via Kafka streaming pipeline",
        "null_behavior": "If null, tal_program_status computation cannot execute; account remains unclassified; no personalization above Level 5",
        "onboarding_required": True,
    },
    "bg_cohort": {
        "plane": "account",
        "type": "str",
        "allowed_values": "education / acquisition / progression_early_to_mature / progression_win_now",
        "source_pipeline": "AEP pipeline (computed from bg_stage, sfdc_opportunity_stage, and account-level signals per Document 3, Section 2)",
        "null_behavior": "If null, cohort assignment is pending; account receives education treatment until pipeline assigns a cohort value",
        "onboarding_required": False,
    },
    "bg_stage": {
        "plane": "account",
        "type": "str",
        "allowed_values": "targeted / engaged / prioritized / qualified",
        "source_pipeline": "AEP pipeline (computed from account-level engagement signals and Salesforce opportunity state per Document 3, Section 2)",
        "null_behavior": "If null, visitor is treated as targeted; minimum personalization depth applies for TAL-identified accounts",
        "onboarding_required": False,
    },
    "sfdc_opportunity_created": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Salesforce CRM via Kafka streaming pipeline (opportunity creation event triggers write)",
        "null_behavior": "If null, treated as false; qualified stage assignment is not triggered",
        "onboarding_required": True,
    },
    "sfdc_opportunity_stage": {
        "plane": "account",
        "type": "str",
        "allowed_values": "Salesforce opportunity stage value (client-specific enumeration; maps to progression_early_to_mature or progression_win_now cohort)",
        "source_pipeline": "Salesforce CRM via Kafka streaming pipeline",
        "null_behavior": "If null, all qualified accounts are treated as progression_early_to_mature until the Kafka sfdc_opportunity_stage pipeline is confirmed per Document 8 Section 7",
        "onboarding_required": True,
    },
    "sfdc_opportunity_stage_stale": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "AEP pipeline (staleness flag; set when sfdc_opportunity_stage has not been updated within 24-hour SLA threshold)",
        "null_behavior": "If null, treated as false; staleness is not assumed; pipeline continues to use available sfdc_opportunity_stage value",
        "onboarding_required": False,
    },
    "contact_engagement_event_count_180d": {
        "plane": "account",
        "type": "int",
        "allowed_values": "0 to unbounded; qualifying threshold defined in Document 3, Section 2 stage transition rules",
        "source_pipeline": "Segment event aggregation (rolling 180-day count of qualifying engagement events, keyed to account)",
        "null_behavior": "If null or zero, account remains at targeted stage; targeted → engaged transition does not fire",
        "onboarding_required": False,
    },
    "hand_raiser_event": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "Segment event pipeline (set on qualifying hand-raiser event per Document 3, Section 2 trigger conditions)",
        "null_behavior": "If null, treated as false; engaged → prioritized transition does not fire",
        "onboarding_required": False,
    },
    "bg_health_single_eb_elevated": {
        "plane": "account",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "AEP pipeline annotation (derived from inspection of contact-plane engagement scores; set when a single Economic Buyer is at HIGH_ENGAGEMENT with no other members at MEDIUM_ENGAGEMENT or above)",
        "null_behavior": "If null, treated as false; no guard rail behavior activates; standard experience applies",
        "onboarding_required": False,
    },
    "primary_solution_interest": {
        "plane": "account",
        "type": "str",
        "allowed_values": "it_operations / customer_engagement / employee_experience / risk_compliance / ai_platform / null",
        "source_pipeline": "AEP pipeline (computed from tal_solution_interest_flags; ranking logic selects solution category with highest aggregate signal weight across rolling 180-day window)",
        "null_behavior": "If null: progressive_disclosure slot falls back to cross-category brand prompt at Level 4; Level 4 solution-category coverage evaluation falls back to tal_solution_interest_flags. Null means uncomputed, not empty.",
        "onboarding_required": False,
    },
    "solution_category_coverage_status": {
        "plane": "account",
        "type": "str",
        "allowed_values": "below_level_1 / level_1 / level_2 / level_3 (per COVERAGE_STATUS_HIERARCHY, Document 4 Section 7.2)",
        "source_pipeline": "Coverage tracking pipeline (writes computed value to AEP account profile per solution category on Sanity webhook trigger per Document 4, Section 8.5)",
        "null_behavior": "If null for a given solution category, that category is treated as below_level_1; pending_solution_fallback behavior activates for visitors with interest in that category",
        "onboarding_required": False,
    },

    # =========================================================================
    # CONTACT-PLANE ATTRIBUTES
    # Keyed to (contact_id, solution_category) composite key.
    # The same contact may carry independent classification states across
    # multiple solution categories.
    # =========================================================================

    "visitor_consent_state": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "full / functional_only / declined",
        "source_pipeline": "Consent management platform via AEP (consent events ingested by AEP and written to visitor profile)",
        "null_behavior": "If null or absent, treat as declined — no signal collection, no scoring, Level 5 experience. Do not default to functional_only on null.",
        "onboarding_required": True,
    },
    "buying_job_confirmed": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "problem_identification / solution_exploration / requirements_building / supplier_selection / null",
        "source_pipeline": "Zero-party declaration via progressive disclosure prompt response; written by Segment event pipeline via AEP Edge Network streaming ingestion",
        "null_behavior": "If null, KNOWN state is not active; scoring falls back to Tier 3 behavioral inference; buying_job_inferred governs",
        "onboarding_required": False,
    },
    "buying_job_inferred": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "problem_identification / solution_exploration / requirements_building / supplier_selection / null",
        "source_pipeline": "Tier 3 behavioral inference via AEP scoring pipeline (signal weight aggregation per Document 2, Section 7)",
        "null_behavior": "If null, INFERRED state is not active; three-axis content selection falls back to two-axis; per-module-type deterministic fallback rules apply per Document 5, Section 2.5",
        "onboarding_required": False,
    },
    "role_confidence_score": {
        "plane": "contact",
        "type": "int",
        "allowed_values": "0–100; set to 100 when Tier 1 ML classifier governs",
        "source_pipeline": "Tier 3 behavioral scoring engine (§12 SCORING_RULES)",
        "null_behavior": "If null, confidence_tier defaults to UNKNOWN; scoring pipeline has not yet run for this composite key",
        "onboarding_required": False,
    },
    "role_classification": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "champion / economic_buyer / influencer / user / ratifier / default",
        "source_pipeline": "Composite: Tier 1 ML classifier, Tier 2 zero-party self-identification, or Tier 3 behavioral scoring per authority adjudication rules in Document 2, Section 9",
        "null_behavior": "If null or default, Level 3 or below applies; role-specific content is not served; default is the valid pre-classification value, not an error state",
        "onboarding_required": False,
    },
    "confidence_tier": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "HIGH / MEDIUM / LOW / UNKNOWN",
        "source_pipeline": "AEP scoring pipeline (§3 CONFIDENCE_TIERS tier assignment after full scoring sequence per Document 2, Section 5)",
        "null_behavior": "If null, treated as UNKNOWN; Level 3 or below applies; pre-pipeline gate has not yet evaluated this contact",
        "onboarding_required": False,
    },
    "differential_insufficient": {
        "plane": "contact",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "AEP scoring pipeline (set when top-scoring role leads second-highest-scoring role by fewer than 10 points; score capped at 49 when set; see Document 2, Section 5)",
        "null_behavior": "If null, treated as false; Priority 0 override is not active; standard fallback level routing applies",
        "onboarding_required": False,
    },
    "fallback_level": {
        "plane": "contact",
        "type": "int",
        "allowed_values": "1 / 2 / 3 / 4 / 5",
        "source_pipeline": "AEP scoring pipeline (derived from confidence_tier + solution interest signal per Document 2, Section 8.8 routing sequence; real-time recomputation triggered by role_classification_zero_party write events)",
        "null_behavior": "If null, Target defaults to Level 5 brand experience; scoring pipeline has not yet assigned a fallback level for this composite key",
        "onboarding_required": False,
    },
    "classification_mismatch": {
        "plane": "contact",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "AEP scoring pipeline (set when Tier 1 ML classifier role and Tier 3 behavioral top-scoring role disagree per Document 2, Section 9)",
        "null_behavior": "If null, treated as false; no mismatch flag is active; data quality alert does not fire",
        "onboarding_required": False,
    },
    "solution_category": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "it_operations / customer_engagement / employee_experience / risk_compliance / ai_platform",
        "source_pipeline": "Established at signal collection time by the AEP event pipeline; forms the second component of the (contact_id, solution_category) composite key",
        "null_behavior": "If null, contact-plane classification cannot execute; composite key is not resolvable; visitor routes to account-plane experience (Level 4 or Level 5)",
        "onboarding_required": False,
    },
    "stitching_pending": {
        "plane": "contact",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "AEP identity resolution pipeline (set during anonymous-to-known contact promotion; transitional state; 24-hour SLA before Data team alert fires)",
        "null_behavior": "If null, treated as false; identity stitching is not in progress; contact-plane attributes are authoritative",
        "onboarding_required": False,
    },
    "holdback_group": {
        "plane": "contact",
        "type": "bool",
        "allowed_values": "true / false",
        "source_pipeline": "AEP identity resolution pipeline (set at first TAL identification using deterministic hash assignment; permanent for pre-sale lifecycle; carries forward from anonymous to identified contact on identity stitching)",
        "null_behavior": "If null, treated as false (visitor is not in holdback; receives personalization). When true: visitor receives Level 5 default brand experience only; progressive_disclosure slot is architecturally suppressed regardless of offer catalog state.",
        "onboarding_required": False,
    },
    "role_classification_zero_party": {
        "plane": "contact",
        "type": "str",
        "allowed_values": "champion / economic_buyer / influencer / user / ratifier / null",
        "source_pipeline": "Segment event pipeline via AEP Edge Network streaming ingestion on progressive disclosure prompt response",
        "null_behavior": "If null, no zero-party role declaration has been received; behavioral classification (role_classification) governs",
        "onboarding_required": False,
    },

    # =========================================================================
    # CONTENT-PLANE ATTRIBUTES
    # Fields on Sanity CMS content nodes (Asset nodes and Content Module nodes).
    # Read by Adobe Target from the offer catalog at activity resolution time.
    # NOT visitor profile attributes and NOT stored in AEP.
    # =========================================================================

    "confidence_tier_minimum": {
        "plane": "content",
        "type": "str",
        "allowed_values": "HIGH / MEDIUM / LOW / UNKNOWN",
        "source_pipeline": "Set by human reviewer at Stage R3 of the Document 4 commissioning workflow; stored as a field on the Sanity Content Module node and Asset node",
        "null_behavior": "If null on an Asset or Content Module node, the content node is ineligible for serving until confidence_tier_minimum is set by a human reviewer. A null value is a commissioning-incomplete state, not a default-to-all-levels state.",
        "onboarding_required": True,
    },
}


# =============================================================================
# §SA  SALES ACTIVATION CONFIG  (CR-12)
#
# Sales alert configuration maintained as a separate section from
# BG_CONVERGENCE_POINTS. Preserves the model's channel-agnostic design:
# convergence point definitions are stable and system-agnostic; alert
# configuration is coupling to a specific CRM and SDR toolchain that varies
# by client.
#
# trigger_condition and alert_payload.recommended_action are CANONICAL —
# they encode buying intelligence and must not be changed at onboarding.
# crm_field, sdr_sequence, and alert_channel are client-configured at onboarding.
# =============================================================================

SALES_ACTIVATION_CONFIG = {
    "convergence_point_alerts": {

        "problem_validation": {
            "trigger_condition": (
                "Champion reaches MEDIUM+ role confidence AND buying_job inferred as "
                "'problem_identification' AND Economic Buyer has at least one signal "
                "in the last 30 days. Convergence point is approaching — group is "
                "consuming problem-framing content but has not yet shifted to "
                "solution_exploration buying job signals."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "problem_validation",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "misalignment_on_problem or buying_group_turnover",
                "recommended_action": (
                    "Champion and EB are approaching problem alignment. "
                    "Engage now with external validation content (benchmark report, "
                    "peer references, analyst data) to reinforce urgency. "
                    "Do not introduce solution content yet — the group is still in "
                    "diverge phase. A sales touch at this point should share a "
                    "relevant benchmark or named-account story, not pitch features."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "requirements_framing": {
            "trigger_condition": (
                "Champion and Influencer both reach MEDIUM+ role confidence AND "
                "buying_job inference shifts from 'problem_identification' to "
                "'requirements_building' OR use_case_exploration signal appears in "
                "the current session. User-role signal has appeared at least once "
                "in the last 14 days — end-user input is active."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "requirements_framing",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "group_disagreement_on_requirements or buying_consultant_discussion",
                "recommended_action": (
                    "Champion and Influencer are defining evaluation criteria. "
                    "This is the highest-leverage sales intervention point before "
                    "a formal RFP or evaluation framework is locked. Offer an RFP "
                    "template or requirements workshop. If a buying consultant has "
                    "appeared (buying_consultant_discussion blocker is active), "
                    "engage with technical credibility content — not pitch material."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "solution_validation": {
            "trigger_condition": (
                "Champion and Influencer both reach MEDIUM+ role confidence AND "
                "technical_docs_deep, integration_catalog_view, or product_tour_engagement "
                "signals appear in the last 7 days. Buying job inference is "
                "'requirements_building' or 'supplier_selection'. Group is evaluating "
                "functional and technical fit."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "solution_validation",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "feasibility_review or exploration_of_integration_with_existing_systems",
                "recommended_action": (
                    "Group is in active technical evaluation. This is a Influencer-led "
                    "convergence point — the Champion needs technical proof to carry "
                    "internally. Provide integration documentation, a technical "
                    "architecture brief, and a named customer reference for a similar "
                    "stack. If feasibility_review blocker is active, proactively offer "
                    "a solutions engineer engagement before the group reaches an impasse."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "business_value_alignment": {
            "trigger_condition": (
                "Economic Buyer reaches MEDIUM+ role confidence AND "
                "roi_calculator_usage or pricing_page_view signal appears in the "
                "last 14 days. Champion is at MEDIUM+ and has consumed executive_brief "
                "or case_study content. Group is in active ROI and TCO evaluation."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "business_value_alignment",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "business_case_data_unavailable or budget_cut",
                "recommended_action": (
                    "EB is building or stress-testing the business case. "
                    "This is the highest-stakes EB engagement in the buying journey. "
                    "Provide a pre-built ROI model with inputs populated for their "
                    "industry and company size. If business_case_data_unavailable "
                    "blocker is active, offer a value assessment workshop. "
                    "If budget_cut is active, shift framing from ROI to "
                    "cost-of-inaction — the EB needs ammunition to defend the spend, "
                    "not a new justification to build from scratch."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "risk_compliance_validation": {
            "trigger_condition": (
                "Ratifier reaches LOW+ role confidence OR security_trust_center_visit "
                "signal appears for any group member AND Champion and EB are both at "
                "MEDIUM+. Buying job inference is 'supplier_selection'. "
                "Late-stage procurement or legal review is active or approaching."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "risk_compliance_validation",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "purchasing_rules_overrule_group_decision or legal_flag or capital_review_board",
                "recommended_action": (
                    "Ratifier is entering the process. This is the most common "
                    "source of late-stage deal slippage — engage proactively rather "
                    "than reactively. Provide a security and compliance package: "
                    "SOC 2 report, data residency documentation, DPA template, "
                    "and a one-page executive summary of Kalder Trust capabilities. "
                    "If legal_flag or capital_review_board blockers are active, "
                    "escalate to AE immediately — these require direct engagement, "
                    "not content delivery."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "final_commitment": {
            "trigger_condition": (
                "Champion, Economic Buyer, and Ratifier all have at least LOW+ "
                "role confidence AND Champion buying job inference is 'supplier_selection' "
                "AND group bg_stage is 'Qualified'. All three required roles are "
                "active — full buying group convergence is in progress."
            ),
            "alert_payload": {
                "bg_stage": "Qualified",
                "convergence_point": "final_commitment",
                "roles_active": ["champion", "economic_buyer", "ratifier"],
                "blocker_risk": "buying_group_turnover or contract_updates_required or purchasing_rules_overrule_group_decision",
                "recommended_action": (
                    "Full buying group is aligned and approaching commitment. "
                    "Remove remaining friction — proactively provide procurement "
                    "guide, contract redline support, and implementation timeline. "
                    "If buying_group_turnover is active at this stage, treat it "
                    "as partial_reset: re-brief the new member on the full "
                    "business case before re-engaging on commitment. "
                    "If purchasing_rules_overrule_group_decision fires at this "
                    "stage, escalate immediately — it is a full_reset blocker and "
                    "requires executive-level engagement to resolve."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },
    },
    "onboarding_note": (
        "crm_field, sdr_sequence, and alert_channel are populated during AI Advisor "
        "client onboarding. trigger_condition and alert_payload (including "
        "recommended_action) are canonical — they encode the buying intelligence "
        "and must not be modified at onboarding."
    ),
}


# =============================================================================
# §P  PRIVACY AND CONSENT ARCHITECTURE  (CR-11 — Pre-Build Blocker)
#
# Two-track completion path:
# Track 1 (data / marketing ops): LIA for 20 first-party behavioral signals.
#   Completed — §P.2 reflects this.
# Track 2 (legal): Demandbase DPA and consent mechanism review.
#   Pending — gates firmographic_confirmation_bonus and title-match scoring.
#   Does NOT block the build session.
# =============================================================================

# P.1  Consent State Gating
VISITOR_CONSENT_STATES = {
    "full": {
        "description": "All signals may be collected and scored.",
        "eligible_signals": "all",
    },
    "functional_only": {
        "description": (
            "Only signals classified as 'legitimate_interest' or 'no_pii' may be "
            "collected. Cross-site tracking and third-party enrichment are suppressed."
        ),
        "suppressed_signal_classes": ["explicit_consent_required"],
    },
    "declined": {
        "description": "No behavioral signals may be collected or scored.",
        "eligible_signals": "none",
        "action": "Serve unPersonalized experience. Do not score or classify.",
    },
}
# The visitor_consent_state attribute (mapped via CLIENT_ATTRIBUTE_MAP) must be
# checked before signal collection and scoring logic executes on any visitor.

# P.2  Signal-Level Consent Classification
# Covers all 20 signals in CROSS_ROLE_WEIGHTS.
# Track 1 (20 first-party behavioral signals): LIA completed by data / marketing ops team.
# Track 2 (Demandbase firmographic): pending legal review.

# Any signal key not present in SIGNAL_CONSENT_REQUIREMENTS is treated as functional_only.
# This default must be applied before SIGNAL_CONSENT_REQUIREMENTS is complete and
# retained permanently as a safety net for new signals added after v0.2.0.
PENDING_CONSENT_CLASSIFICATION_DEFAULT = "functional_only"

# Track 1 complete — 20 first-party behavioral signals
# All are owned-property behavioral signals. No PII. No cross-site tracking.
# Lawful basis: legitimate_interest (LIA completed by data / marketing ops team).
# GDPR Article 6(1)(f) applies. LIA documentation required before activation.
LI_FIRST_PARTY = {
    "lawful_basis": "legitimate_interest",
    "pii_involved": False,
    "cross_site": False,
    "gdpr_suppressed_without_consent": False,
    "ccpa_opt_out_affects": False,
}

SIGNAL_CONSENT_REQUIREMENTS = {
    # First-party behavioral signals — LIA completed, no legal review required
    "case_study_download":          {**LI_FIRST_PARTY},
    "competitive_comparison_view":  {**LI_FIRST_PARTY},
    "demo_request":                 {**LI_FIRST_PARTY},
    "multi_solution_exploration":   {**LI_FIRST_PARTY},
    "roi_calculator_usage":         {**LI_FIRST_PARTY},
    "pricing_page_view":            {**LI_FIRST_PARTY},
    "executive_brief_download":     {**LI_FIRST_PARTY},
    "use_case_exploration":         {**LI_FIRST_PARTY},
    "product_tour_engagement":      {**LI_FIRST_PARTY},
    "webinar_registration":         {**LI_FIRST_PARTY},
    "howto_training_content":       {**LI_FIRST_PARTY},
    "community_forum_engagement":   {**LI_FIRST_PARTY},
    "security_whitepaper_download": {**LI_FIRST_PARTY},
    "compliance_governance_content":{**LI_FIRST_PARTY},
    "technical_docs_deep":          {**LI_FIRST_PARTY},
    "faq_support_docs":             {**LI_FIRST_PARTY},
    "diagnostic_assessment":        {**LI_FIRST_PARTY},
    "integration_catalog_view":     {**LI_FIRST_PARTY},
    "security_trust_center_visit":  {**LI_FIRST_PARTY},
    "category_explainer_view":      {**LI_FIRST_PARTY},

    # Track 2 pending — third-party enrichment signal
    # Requires legal review: Demandbase DPA, GDPR Article 6(1)(a) consent mechanism.
    # Features gated on this signal (firmographic_confirmation_bonus, title-match
    # scoring pathway) must remain suppressed until Track 2 completes.
    "demandbase_firmographic_match": {
        "lawful_basis": "explicit_consent_required",
        "pii_involved": True,
        "cross_site": True,
        "gdpr_suppressed_without_consent": True,
        "ccpa_opt_out_affects": True,
        "track_2_status": "pending_legal_review",
        "note": (
            "Third-party reverse-IP firmographic enrichment via Demandbase. "
            "Cannot be activated in GDPR jurisdictions without explicit consent. "
            "Suppressed entirely in 'functional_only' and 'declined' consent states. "
            "If 6sense intent data feeds scoring, classify as explicit_consent_required "
            "and add a separate entry here."
        ),
    },
}

# P.3  Geographic Handling Rules
GEOGRAPHIC_CONSENT_RULES = {
    "GDPR": {
        "jurisdictions": ["EU", "UK", "EEA"],
        "suppressed_signal_classes": ["explicit_consent_required"],
        "default_consent_state_if_unknown": "functional_only",
        "gdpr_lawful_basis_note": (
            "Legitimate interest applies to behavioral signals on owned web properties. "
            "Third-party enrichment (Demandbase) requires explicit consent under "
            "GDPR Article 6(1)(a). Document legitimate interest basis in LIA before "
            "activating any signal classified as legitimate_interest."
        ),
    },
    "CCPA": {
        "jurisdictions": ["California, US"],
        "opt_out_affects_signals": ["explicit_consent_required"],
        "right_to_opt_out_notice_required": True,
    },
    "default": {
        "jurisdictions": "All others",
        "default_consent_state_if_unknown": "functional_only",
        "note": "Conservative default pending legal review for additional jurisdictions.",
    },
}

# P.4  Data Retention Schedule
# CRITICAL DISTINCTION: DECAY_MULTIPLIERS (§8) are SCORING controls.
# A signal with over_180_days: 0.0 still exists in the data store — it contributes
# zero to scoring but is visible to legal review. Retention windows below are
# STORAGE controls that govern when data is physically deleted.
DATA_RETENTION_SCHEDULE = {
    "raw_behavioral_signals": {
        "retention_window_days": 365,
        "description": "Raw event data in Segment / AEP event stream",
        "deletion_trigger": "Rolling window — auto-expire after retention_window_days",
    },
    "scored_role_attributes": {
        "retention_window_days": 180,
        "description": "AEP profile attributes: role_confidence_score, role_classification, bg_stage",
        "deletion_trigger": "Rolling window; also deleted on consent withdrawal or DSR",
    },
    "crm_enriched_records": {
        "retention_window_days": 730,  # 2 years — standard CRM retention
        "description": "Salesforce CRM contact records with buying group field enrichment",
        "deletion_trigger": "DSR or contract termination; coordinated with CRM admin",
    },
    "firmographic_enrichment_cache": {
        "retention_window_days": 90,
        "description": "Demandbase reverse-IP match results cached in AEP",
        "deletion_trigger": "Rolling window; suppressed immediately on consent withdrawal",
    },
}

# P.5  Anonymization and Deletion Path
DELETION_PATH = {
    "trigger_events": ["consent_withdrawal", "data_subject_request_DSR", "contract_termination"],
    "cascade_steps": [
        {
            "step": 1,
            "system": "AEP",
            "action": "Delete all profile attributes in scored_role_attributes retention class",
            "sla_hours": 72,
        },
        {
            "step": 2,
            "system": "Segment",
            "action": "Suppress future event collection; submit deletion request for historical events",
            "sla_hours": 72,
        },
        {
            "step": 3,
            "system": "Snowflake",
            "action": "Execute DELETE on visitor_signals and visitor_scores tables for visitor_id",
            "sla_hours": 168,  # 7 days — batch deletion
        },
        {
            "step": 4,
            "system": "Salesforce CRM",
            "action": "Null-out buying group enrichment fields; retain base contact record per CRM retention policy",
            "sla_hours": 168,
        },
    ],
    "confirmation_requirement": "Generate deletion confirmation record with timestamp and step completion status",
}

# Convenience bundle for downstream imports
PRIVACY_CONSENT_ARCHITECTURE = {
    "visitor_consent_states": VISITOR_CONSENT_STATES,
    "pending_consent_classification_default": PENDING_CONSENT_CLASSIFICATION_DEFAULT,
    "li_first_party": LI_FIRST_PARTY,
    "signal_consent_requirements": SIGNAL_CONSENT_REQUIREMENTS,
    "geographic_consent_rules": GEOGRAPHIC_CONSENT_RULES,
    "data_retention_schedule": DATA_RETENTION_SCHEDULE,
    "deletion_path": DELETION_PATH,
}


# =============================================================================
# §15-§20 HELPER FUNCTIONS
# =============================================================================

def get_jtbd_codes_for_role_stage(
    role: str,
    campaign_stage: str,
    solution_category: str | None = None,
) -> list[str]:
    """Return JTBD code keys for a given role and campaign stage."""
    results = []
    stage_lower = campaign_stage.lower()
    for code, data in JTBD_CODES.items():
        if data.get("coverage_status") in ("pending",):
            continue
        if data.get("role") != role:
            continue
        code_stage = data.get("campaign_stage", "").lower()
        if stage_lower not in code_stage and "progression" not in code_stage:
            if stage_lower == "progression" and "prg" not in code.upper():
                continue
        if solution_category and solution_category not in data.get("solution_categories", []):
            continue
        results.append(code)
    return results


def get_convergence_points_for_role(role: str) -> list[str]:
    """Return convergence point keys that a given role gates."""
    return [
        cp_key for cp_key, cp in BG_CONVERGENCE_POINTS.items()
        if role in cp.get("roles_required", [])
    ]


def get_surface_personalisation_eligibility(surface_key: str) -> str:
    """Return personalisation eligibility for a website surface."""
    surface = WEBSITE_SURFACES.get(surface_key, {})
    return surface.get("personalisation", "none")


def get_signal_suppression_surfaces() -> list[str]:
    """Return surface keys that suppress or negate role classification signals."""
    return [
        k for k, v in WEBSITE_SURFACES.items()
        if v.get("signal_contribution") in ("suppressed", "negative", "weak_suppressed")
        or v.get("exclusion_flag") is not None
    ]


# =============================================================================
# §H  HELPER FUNCTIONS — DATA INTEGRITY  (AR-02, AR-06)
# =============================================================================

COVERAGE_STATUS_HIERARCHY = {
    # A solution's effective coverage_status is the MINIMUM across:
    # its own SOLUTIONS entry, its TITLE_ROLE_MAP entry, and its JTBD_CODES entries.
    "rank": {"pending": 0, "constructed": 1, "partial": 2, "complete": 3},
    "inheritance_rule": "minimum_across_all_associated_entities",
    "description": (
        "When a solution's SOLUTIONS entry reads 'constructed' but its TITLE_ROLE_MAP "
        "entry reads 'pending', the effective status is 'pending'. Reporting on "
        "category completeness must use effective_coverage_status, not the SOLUTIONS "
        "entry in isolation."
    ),
}


def validate_coverage_consistency():
    """
    Surfaces entities where coverage_status diverges from their parent entity's status.
    Call at import time in development; run as a CI check before model updates are merged.
    Raises ValueError on any inconsistency (consistent with validate_signal_references()).
    Returns a list of (entity_type, entity_key, local_status, parent_status) tuples
    where local_status is inconsistent with parent_status per the inheritance rule.
    """
    rank = COVERAGE_STATUS_HIERARCHY["rank"]
    inconsistencies = []

    # Step 1: Cross-check TITLE_ROLE_MAP entries against SOLUTIONS entries.
    # Per the inheritance rule, a SOLUTIONS entry with a higher rank than the
    # corresponding TITLE_ROLE_MAP entry is inconsistent — the effective status
    # is the minimum (lower rank) of the two, so a SOLUTIONS entry claiming
    # 'complete' when TITLE_ROLE_MAP says 'pending' is a documentation mismatch.
    for solution_key, title_map_entry in TITLE_ROLE_MAP.items():
        title_map_status = title_map_entry.get("coverage_status")
        if title_map_status is None:
            continue
        solution_entry = SOLUTIONS.get(solution_key, {})
        solution_status = solution_entry.get("coverage_status")
        if solution_status is None:
            continue
        title_map_rank = rank.get(title_map_status, -1)
        solution_rank = rank.get(solution_status, -1)
        # Flag when SOLUTIONS claims a higher rank than TITLE_ROLE_MAP
        # (SOLUTIONS entry overstates completeness relative to title coverage)
        if solution_rank > title_map_rank:
            inconsistencies.append((
                "title_role_map_vs_solutions",
                solution_key,
                title_map_status,   # local (lower)
                solution_status,    # parent claim (higher — inconsistent)
            ))

    # Step 2: Cross-check JTBD_CODES entries against their parent solution's
    # TITLE_ROLE_MAP coverage_status. A JTBD entry with a higher rank than
    # its parent solution's TITLE_ROLE_MAP entry is inconsistent.
    for jtbd_key, jtbd_entry in JTBD_CODES.items():
        jtbd_status = jtbd_entry.get("coverage_status")
        if jtbd_status is None:
            continue  # skip entries without coverage_status field
        solution_categories = jtbd_entry.get("solution_categories", [])
        for solution_key in solution_categories:
            title_map_entry = TITLE_ROLE_MAP.get(solution_key, {})
            title_map_status = title_map_entry.get("coverage_status")
            if title_map_status is None:
                continue
            jtbd_rank = rank.get(jtbd_status, -1)
            title_map_rank = rank.get(title_map_status, -1)
            # Flag when JTBD entry claims a higher rank than parent TITLE_ROLE_MAP
            if jtbd_rank > title_map_rank:
                inconsistencies.append((
                    "jtbd_vs_title_role_map",
                    jtbd_key,
                    jtbd_status,       # local (higher than parent — inconsistent)
                    title_map_status,  # parent status (lower)
                ))

    if inconsistencies:
        formatted = "\n".join(
            f"  [{entity_type}] key={key!r}: local={local!r}, parent={parent!r}"
            for entity_type, key, local, parent in inconsistencies
        )
        raise ValueError(
            f"Coverage status inconsistencies found ({len(inconsistencies)} total):\n{formatted}"
        )

    return []


def validate_signal_references():
    """
    Cross-checks that:
    1. All keys in BUYING_JOB_INFERENCE_SIGNALS[*]["strong_indicators"] and
       "weak_indicators" exist in CONTENT_TYPES.
    2. The buying_job classification on each referenced content type matches the
       inference signal group it appears in.
    Raises ValueError on any mismatch at import time.
    Call before merging any change to §9 or BUYING_JOB_INFERENCE_SIGNALS.
    """
    pass  # implementation pending — stub added per AR-06


def get_titles_for_role(solution_key: str, role: str) -> dict:
    """Return job titles for a given role within a solution.

    v0.2.0 AR-08: Returns a structured result object that distinguishes failure reasons.
    Callers must not interpret an empty titles list as a data gap without
    checking the status field.

    Returns:
        dict with keys: status ("not_found" | "pending" | "ok"), titles (list), reason (str)
    """
    solution_map = TITLE_ROLE_MAP.get(solution_key)
    if solution_map is None:
        return {
            "status": "not_found",
            "titles": [],
            "reason": f"solution_key '{solution_key}' not in TITLE_ROLE_MAP",
        }
    if solution_map.get("coverage_status") == "pending":
        return {
            "status": "pending",
            "titles": [],
            "reason": f"coverage_status is pending for '{solution_key}' — apply pending_solution_fallback (§4)",
        }
    role_data = solution_map.get(role, {})
    titles = [entry["title"] for entry in role_data.get("titles", [])]
    return {"status": "ok", "titles": titles}