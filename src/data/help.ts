export type Impact = "Good (reduces effort)" | "Bad (increases effort)" | "Neutral";

export type HelpRating = {
  rating: string;
  numeric: number | null;
  impact: Impact;
  meaning: string;
  example: string;
};

export type HelpEntry = {
  title: string;
  description: string;
  ratings?: HelpRating[];
  notes?: string[];
};

const impEM = (n: number | null): Impact => {
  if (n == null) return "Neutral";
  if (n > 1) return "Bad (increases effort)";
  if (n < 1) return "Good (reduces effort)";
  return "Neutral";
};

const impSF = (n: number | null): Impact => {
  if (n == null) return "Neutral";
  // Scale factor weights increase the exponent E; higher weights => more effort.
  if (n > 0) return "Bad (increases effort)";
  return "Good (reduces effort)";
};

export const help: Record<string, HelpEntry> = {
  /* =========================
     ASSUMPTIONS
  ========================= */
  totalLoc: {
    title: "Total legacy LOC to modernize",
    description:
      "Baseline size in scope. This is used as ASLOC for ESLOC unless you override it.",
    notes: [
      "Typical ranges: 10k–10M+ LOC depending on portfolio size.",
      "Example: 250,000 LOC for a mid-size monolith modernization.",
    ],
  },
  scheduleMonths: {
    title: "Project duration (months)",
    description:
      "Planned execution window. Used to translate person-months into average staffing and schedule-based costs.",
    notes: ["Typical ranges: 3–36 months.", "Example: 12 months for a single-product modernization."],
  },
  rdAllocation: {
    title: "% of total R&D resources allocatable",
    description:
      "Fraction (0–1) of internal capacity realistically available for this project.",
    notes: ["Typical: 0.05–0.30 for non-core work; higher for top priority.", "Example: 0.15 = 15% allocation."],
  },
  avgTotalFTE: {
    title: "Total internal R&D FTE pool",
    description:
      "Average total internal delivery capacity (FTEs) you could draw from. The model applies rdAllocation to this to compute internal FTEs applied.",
    notes: ["Example: 94 total R&D FTEs across teams.", "If rdAllocation=0.16 then internal FTE applied ≈ 15."],
  },
  hoursPerMonth: {
    title: "Hours per month per resource",
    description:
      "Used to translate hourly rates into monthly cost and to compute FTE equivalence.",
    notes: ["Default: 160 hours/month.", "Example: 160 (full-time), 80 (half-time)."],
  },
  fteRateLow: {
    title: "Internal FTE rate (low)",
    description:
      "Lower-bound fully loaded internal rate, used to compute an internal cost range.",
    notes: ["Example: $12,000 per person-month."],
  },
  fteRateHigh: {
    title: "Internal FTE rate (high)",
    description:
      "Upper-bound fully loaded internal rate, used to compute an internal cost range.",
    notes: ["Example: $18,000 per person-month."],
  },
  contractorRateLow: {
    title: "Contractor rate (low)",
    description:
      "Lower-bound hourly contractor rate.",
    notes: ["Example: $125/hour."],
  },
  contractorRateHigh: {
    title: "Contractor rate (high)",
    description:
      "Upper-bound hourly contractor rate.",
    notes: ["Example: $195/hour."],
  },

  /* =========================
     ESLOC / REUSE
  ========================= */
  asloc: {
    title: "ASLOC (Adapted SLOC)",
    description:
      "Baseline size of legacy code being adapted/modernized (in SLOC).",
    notes: ["Example: 250,000 SLOC in scope."],
  },
  dm: {
    title: "% Design Modified (DM)",
    description:
      "Percent of adapted code requiring design changes.",
    notes: ["Range: 0–100.", "Example: 30 = moderate redesign."],
  },
  cm: {
    title: "% Code Modified (CM)",
    description:
      "Percent of adapted code requiring code changes.",
    notes: ["Range: 0–100.", "Example: 50 = half the code will change."],
  },
  im: {
    title: "% Integration Required (IM)",
    description:
      "Percent integration effort required due to interfaces, glue code, testing, and deployment integration.",
    notes: ["Range: 0–100.", "Example: 30 for moderate integration with surrounding systems."],
  },
  aa: {
    title: "Assessment & Assimilation (AA)",
    description:
      "Additional % effort for understanding, assessing, and assimilating reused/converted components.",
    notes: ["Range: 0–8 (typical COCOMO II guidance).", "Example: 4 for moderate assimilation overhead."],
  },
  su: {
    title: "Software Understanding (SU)",
    description:
      "How hard the legacy code is to understand (structure, documentation, readability).",
    notes: ["Range: 0–50.", "Example: 10 well-documented; 40 poor structure/documentation."],
  },
  unfm: {
    title: "Programmer Unfamiliarity (UNFM)",
    description:
      "How unfamiliar the team is with the legacy codebase, domain, and environment.",
    notes: ["Range: 0–1.", "Example: 0.2 for a team that knows the domain; 0.8 for new team."],
  },

  /* =========================
     CALIBRATION
  ========================= */
  A: {
    title: "COCOMO II Calibration Constant (A)",
    description:
      "Calibration constant used in the core COCOMO II effort equation.",
    notes: [
      "Effort formula:",
      "PM = A × (KSLOC ^ E) × EAF",

      "",
      "Range interpretation:",

      "Below 2.5 — High Productivity",
      "Indicates an extremely efficient environment with advanced tools, high automation, or a very experienced team. Estimates will be significantly lower than the industry average.",

      "",
      "2.5 – 2.8 — Above Average",
      "Represents a streamlined development process. The organization likely has better-than-average reuse or lower overhead than the standard COCOMO database.",

      "",
      "2.94 — Standard Baseline",
      "Nominal value calibrated from the original 161 projects in the COCOMO II database. Represents typical industry performance.",

      "",
      "3.0 – 3.3 — Below Average",
      "Suggests higher overhead, possibly due to legacy systems, complex integration, or less mature processes.",

      "",
      "Above 3.3 — Low Productivity",
      "Often seen in highly regulated environments such as aerospace or medical software where documentation and verification overhead are significant."
    ]
  },
  B: {
    title: "B (Exponent base)",
    description:
      "Base exponent term in E = B + 0.01 * ΣSF. Use defaults unless calibrated.",
    notes: ["COCOMO II.2000 baseline uses B ≈ 0.91."],
  },

  /* =========================
     SCALE FACTORS (SFj)
  ========================= */
  PREC: {
    title: "PREC — Precedentedness",
    description:
      "How similar this effort is to your past work. More precedent reduces scale diseconomies.",
    ratings: [
      { rating: "Very Low", numeric: 6.20, impact: impSF(6.20), meaning: "First-of-a-kind; major novelty", example: "COBOL → cloud-native with new operating model." },
      { rating: "Low", numeric: 4.96, impact: impSF(4.96), meaning: "Mostly new; limited precedent", example: "New platform + limited internal history." },
      { rating: "Nominal", numeric: 3.72, impact: impSF(3.72), meaning: "Some precedent", example: "Similar modernization done in another BU." },
      { rating: "High", numeric: 2.48, impact: impSF(2.48), meaning: "Generally familiar", example: "Repeatable migration pattern already used." },
      { rating: "Very High", numeric: 1.24, impact: impSF(1.24), meaning: "Largely familiar", example: "Same architecture + same domain." },
      { rating: "Extra High", numeric: 0.00, impact: impSF(0.00), meaning: "Thoroughly familiar", example: "Factory-style conversion with templates." },
    ],
  },
  FLEX: {
    title: "FLEX — Development Flexibility",
    description:
      "Degree of constraints (requirements rigidity, external interfaces, contractual constraints).",
    ratings: [
      { rating: "Very Low", numeric: 5.07, impact: impSF(5.07), meaning: "Rigid; tight conformance", example: "Regulated scope with fixed interfaces and deadlines." },
      { rating: "Low", numeric: 4.05, impact: impSF(4.05), meaning: "Mostly constrained", example: "Strict requirements, limited negotiation." },
      { rating: "Nominal", numeric: 3.04, impact: impSF(3.04), meaning: "Some flexibility", example: "Enterprise backlog with controlled change." },
      { rating: "High", numeric: 2.03, impact: impSF(2.03), meaning: "General conformity", example: "Standards exist but teams can adapt." },
      { rating: "Very High", numeric: 1.01, impact: impSF(1.01), meaning: "Some conformity", example: "Agile modernization; scope trade-offs allowed." },
      { rating: "Extra High", numeric: 0.00, impact: impSF(0.00), meaning: "General goals", example: "Outcome-driven modernization; flexible requirements." },
    ],
  },
  RESL: {
    title: "RESL — Architecture & Risk Resolution",
    description:
      "How much risk is retired and architecture is stabilized before heavy build work.",
    ratings: [
      { rating: "Very Low", numeric: 7.07, impact: impSF(7.07), meaning: "Little risk resolution", example: "No POCs; unclear target architecture." },
      { rating: "Low", numeric: 5.65, impact: impSF(5.65), meaning: "Some risk work", example: "Basic architecture decisions; many unknowns remain." },
      { rating: "Nominal", numeric: 4.24, impact: impSF(4.24), meaning: "Often resolved", example: "Key risks identified; partial prototypes." },
      { rating: "High", numeric: 2.83, impact: impSF(2.83), meaning: "Generally resolved", example: "Architecture baselined; major risks mitigated." },
      { rating: "Very High", numeric: 1.41, impact: impSF(1.41), meaning: "Mostly resolved", example: "End-to-end POC validates performance & integration." },
      { rating: "Extra High", numeric: 0.00, impact: impSF(0.00), meaning: "Fully resolved", example: "Risks retired; blueprint & patterns proven." },
    ],
  },
  TEAM: {
    title: "TEAM — Team Cohesion",
    description:
      "Stakeholder alignment and ability to operate as one team.",
    ratings: [
      { rating: "Very Low", numeric: 5.48, impact: impSF(5.48), meaning: "Very difficult interactions", example: "Conflicting stakeholders; distributed vendors." },
      { rating: "Low", numeric: 4.38, impact: impSF(4.38), meaning: "Some difficult interactions", example: "New team + unclear decision rights." },
      { rating: "Nominal", numeric: 3.29, impact: impSF(3.29), meaning: "Basically cooperative", example: "Standard enterprise delivery team." },
      { rating: "High", numeric: 2.19, impact: impSF(2.19), meaning: "Largely cooperative", example: "Stable agile pods with shared objectives." },
      { rating: "Very High", numeric: 1.10, impact: impSF(1.10), meaning: "Highly cooperative", example: "Low friction collaboration across engineering/product." },
      { rating: "Extra High", numeric: 0.00, impact: impSF(0.00), meaning: "Seamless interactions", example: "Long-standing team; tight alignment and velocity." },
    ],
  },
  PMAT: {
    title: "PMAT — Process Maturity",
    description:
      "Maturity of the organization’s software process discipline.",
    ratings: [
      { rating: "Very Low", numeric: 7.80, impact: impSF(7.80), meaning: "Ad hoc processes", example: "No consistent SDLC; inconsistent quality gates." },
      { rating: "Low", numeric: 6.24, impact: impSF(6.24), meaning: "Low maturity", example: "Some standardization; limited measurement." },
      { rating: "Nominal", numeric: 4.68, impact: impSF(4.68), meaning: "Defined process", example: "Documented SDLC + basic governance." },
      { rating: "High", numeric: 3.12, impact: impSF(3.12), meaning: "Managed", example: "Measured delivery; repeatable CI/CD patterns." },
      { rating: "Very High", numeric: 1.56, impact: impSF(1.56), meaning: "Quantitatively managed", example: "Metrics-driven; predictable throughput." },
      { rating: "Extra High", numeric: 0.00, impact: impSF(0.00), meaning: "Optimizing", example: "Continuous improvement; strong automation." },
    ],
  },

  /* =========================
     EFFORT MULTIPLIERS (Post-Architecture)
  ========================= */
  RELY: {
    title: "RELY — Required Software Reliability",
    description: "Higher reliability requirements increase effort.",
    ratings: [
      { rating: "Very Low", numeric: 0.82, impact: impEM(0.82), meaning: "Slight inconvenience on failure", example: "Internal prototype." },
      { rating: "Low", numeric: 0.92, impact: impEM(0.92), meaning: "Low, recoverable losses", example: "Non-critical internal tool." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Moderate, recoverable losses", example: "Standard enterprise app." },
      { rating: "High", numeric: 1.10, impact: impEM(1.10), meaning: "High financial loss", example: "Revenue-impacting system." },
      { rating: "Very High", numeric: 1.26, impact: impEM(1.26), meaning: "Risk to human life", example: "Healthcare device / safety-critical." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used for this driver", example: "n/a" },
    ],
  },
  DATA: {
    title: "DATA — Data Base Size",
    description: "Relative DB size/complexity compared to program size.",
    ratings: [
      { rating: "Very Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Low", numeric: 0.90, impact: impEM(0.90), meaning: "Small DB relative to code", example: "Lightweight schema." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Moderate DB size", example: "Typical OLTP schema." },
      { rating: "High", numeric: 1.14, impact: impEM(1.14), meaning: "Large DB", example: "Many entities + heavy history." },
      { rating: "Very High", numeric: 1.28, impact: impEM(1.28), meaning: "Very large DB", example: "Huge datasets, complex modeling." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  CPLX: {
    title: "CPLX — Product Complexity",
    description: "Algorithmic, control, data-management, and UI complexity.",
    ratings: [
      { rating: "Very Low", numeric: 0.73, impact: impEM(0.73), meaning: "Very simple logic", example: "Straightforward CRUD." },
      { rating: "Low", numeric: 0.87, impact: impEM(0.87), meaning: "Low complexity", example: "Simple workflows." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Moderate complexity", example: "Enterprise business rules." },
      { rating: "High", numeric: 1.17, impact: impEM(1.17), meaning: "High complexity", example: "Complex integration and logic." },
      { rating: "Very High", numeric: 1.34, impact: impEM(1.34), meaning: "Very high complexity", example: "Advanced optimization." },
      { rating: "Extra High", numeric: 1.74, impact: impEM(1.74), meaning: "Extreme complexity", example: "Real-time / safety-critical control." },
    ],
  },
  RUSE: {
    title: "RUSE — Developed for Reusability",
    description: "Extra effort to build components intended for reuse beyond the current project.",
    ratings: [
      { rating: "Very Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Low", numeric: 0.95, impact: impEM(0.95), meaning: "None across project", example: "One-off modernization." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Across program", example: "Reuse across multiple apps in one org." },
      { rating: "High", numeric: 1.07, impact: impEM(1.07), meaning: "Across product line", example: "Reusable modernization components." },
      { rating: "Very High", numeric: 1.15, impact: impEM(1.15), meaning: "Across multiple product lines", example: "Shared platform assets." },
      { rating: "Extra High", numeric: 1.24, impact: impEM(1.24), meaning: "Extensive reuse requirements", example: "Enterprise-wide reusable framework." },
    ],
    notes: ["Higher RUSE implies tighter RELY/DOCU constraints in COCOMO guidance."],
  },
  DOCU: {
    title: "DOCU — Documentation match to life-cycle needs",
    description: "How well documentation matches what the project and maintenance lifecycle need.",
    ratings: [
      { rating: "Very Low", numeric: 0.81, impact: impEM(0.81), meaning: "Many needs uncovered", example: "Sparse docs; tribal knowledge." },
      { rating: "Low", numeric: 0.91, impact: impEM(0.91), meaning: "Some needs uncovered", example: "Minimal design docs." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Right-sized", example: "Docs match change/ops needs." },
      { rating: "High", numeric: 1.11, impact: impEM(1.11), meaning: "Excessive", example: "Heavy documentation burden." },
      { rating: "Very High", numeric: 1.23, impact: impEM(1.23), meaning: "Very excessive", example: "Over-documenting beyond value." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  TIME: {
    title: "TIME — Execution Time Constraint",
    description: "How tight CPU/execution-time constraints are.",
    ratings: [
      { rating: "Very Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "≤ 50% used", example: "Plenty of headroom." },
      { rating: "High", numeric: 1.11, impact: impEM(1.11), meaning: "~70% used", example: "Moderate performance constraints." },
      { rating: "Very High", numeric: 1.29, impact: impEM(1.29), meaning: "~85% used", example: "Tight latency requirements." },
      { rating: "Extra High", numeric: 1.63, impact: impEM(1.63), meaning: "~95% used", example: "Near-capacity real-time system." },
    ],
  },
  STOR: {
    title: "STOR — Main Storage Constraint",
    description: "How tight memory/storage constraints are.",
    ratings: [
      { rating: "Very Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "≤ 50% used", example: "Ample memory." },
      { rating: "High", numeric: 1.05, impact: impEM(1.05), meaning: "~70% used", example: "Some memory pressure." },
      { rating: "Very High", numeric: 1.17, impact: impEM(1.17), meaning: "~85% used", example: "High memory constraints." },
      { rating: "Extra High", numeric: 1.46, impact: impEM(1.46), meaning: "~95% used", example: "Very constrained runtime." },
    ],
  },
  PVOL: {
    title: "PVOL — Platform Volatility",
    description: "How frequently the platform (OS/DB/infra) changes.",
    ratings: [
      { rating: "Very Low", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
      { rating: "Low", numeric: 0.87, impact: impEM(0.87), meaning: "Stable platform", example: "Rare infra upgrades." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Normal change rate", example: "Quarterly patch cycles." },
      { rating: "High", numeric: 1.15, impact: impEM(1.15), meaning: "Frequent change", example: "Fast-moving cloud services." },
      { rating: "Very High", numeric: 1.30, impact: impEM(1.30), meaning: "Very frequent change", example: "Major changes every ~2 weeks." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  ACAP: {
    title: "ACAP — Analyst Capability",
    description: "Capability of analysts (requirements + architecture/design). Higher capability reduces effort.",
    ratings: [
      { rating: "Very Low", numeric: 1.42, impact: impEM(1.42), meaning: "Low capability", example: "Inexperienced analysis/design team." },
      { rating: "Low", numeric: 1.19, impact: impEM(1.19), meaning: "Below average", example: "New analysts; heavy rework." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Average", example: "Typical enterprise analysts." },
      { rating: "High", numeric: 0.85, impact: impEM(0.85), meaning: "Strong", example: "Domain-savvy analysts." },
      { rating: "Very High", numeric: 0.71, impact: impEM(0.71), meaning: "Top-tier", example: "Proven modernization architects." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  PCAP: {
    title: "PCAP — Programmer Capability",
    description: "Capability of developers. Higher capability reduces effort.",
    ratings: [
      { rating: "Very Low", numeric: 1.34, impact: impEM(1.34), meaning: "Low capability", example: "Junior team; low productivity." },
      { rating: "Low", numeric: 1.15, impact: impEM(1.15), meaning: "Below average", example: "Learning stack while delivering." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Average", example: "Mixed team." },
      { rating: "High", numeric: 0.88, impact: impEM(0.88), meaning: "Strong", example: "Experienced devs on target stack." },
      { rating: "Very High", numeric: 0.76, impact: impEM(0.76), meaning: "Top-tier", example: "High-output modernization engineers." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  PCON: {
    title: "PCON — Personnel Continuity",
    description: "Team stability. Lower turnover reduces effort.",
    ratings: [
      { rating: "Very Low", numeric: 1.29, impact: impEM(1.29), meaning: "Very high turnover", example: "Heavy churn across quarters." },
      { rating: "Low", numeric: 1.12, impact: impEM(1.12), meaning: "High turnover", example: "Contractor rotation." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Normal", example: "Typical attrition." },
      { rating: "High", numeric: 0.90, impact: impEM(0.90), meaning: "Good continuity", example: "Stable core team." },
      { rating: "Very High", numeric: 0.81, impact: impEM(0.81), meaning: "Very stable", example: "Low attrition; long tenure." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  TOOL: {
    title: "TOOL — Use of Software Tools",
    description: "Tool support for the lifecycle (requirements/design/CI/CD/test/config mgmt).",
    ratings: [
      { rating: "Very Low", numeric: 1.17, impact: impEM(1.17), meaning: "Minimal tooling", example: "Manual builds + manual testing." },
      { rating: "Low", numeric: 1.09, impact: impEM(1.09), meaning: "Basic tooling", example: "Some CI, limited automation." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Moderately integrated", example: "Standard DevOps toolchain." },
      { rating: "High", numeric: 0.90, impact: impEM(0.90), meaning: "Strong tooling", example: "Automated CI/CD + test automation." },
      { rating: "Very High", numeric: 0.78, impact: impEM(0.78), meaning: "Highly integrated", example: "Full pipeline + quality gates + IaC." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  SITE: {
    title: "SITE — Multisite Development",
    description: "Distributed vs collocated teams plus comms bandwidth/support.",
    ratings: [
      { rating: "Very Low", numeric: 1.22, impact: impEM(1.22), meaning: "International/distributed with weak comms", example: "Multiple vendors, time zones, poor collaboration tools." },
      { rating: "Low", numeric: 1.09, impact: impEM(1.09), meaning: "Distributed with limited support", example: "Multi-city with basic tooling." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "Some distribution", example: "Hybrid, decent comms." },
      { rating: "High", numeric: 0.93, impact: impEM(0.93), meaning: "Mostly co-located or strong comms", example: "Same metro with strong tooling." },
      { rating: "Very High", numeric: 0.86, impact: impEM(0.86), meaning: "Co-located with strong comms", example: "Same building + good collaboration." },
      { rating: "Extra High", numeric: 0.80, impact: impEM(0.80), meaning: "Fully collocated with strong comms", example: "Single room / pod." },
    ],
  },
  SCED: {
    title: "SCED — Required Development Schedule",
    description: "Schedule compression increases effort; stretching schedule does not reduce effort in COCOMO II.",
    ratings: [
      { rating: "Very Low", numeric: 1.43, impact: impEM(1.43), meaning: "~75% of nominal schedule", example: "Aggressive deadline; high overtime/parallelism." },
      { rating: "Low", numeric: 1.14, impact: impEM(1.14), meaning: "~85% of nominal", example: "Compressed schedule." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "100% nominal", example: "Typical plan." },
      { rating: "High", numeric: 1.00, impact: impEM(1.00), meaning: "~130% of nominal", example: "Schedule stretch." },
      { rating: "Very High", numeric: 1.00, impact: impEM(1.00), meaning: "~160% of nominal", example: "Longer schedule (no effort decrease)." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },

  /* Optional standard Post-Architecture personnel experience drivers (include if/when you add them to UI): */
  APEX: {
    title: "APEX — Applications Experience",
    description: "Team experience with the application domain. More experience reduces effort.",
    ratings: [
      { rating: "Very Low", numeric: 1.22, impact: impEM(1.22), meaning: "≤ 2 months", example: "New to domain." },
      { rating: "Low", numeric: 1.10, impact: impEM(1.10), meaning: "~6 months", example: "Some exposure." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "~1 year", example: "Comfortable." },
      { rating: "High", numeric: 0.88, impact: impEM(0.88), meaning: "~3 years", example: "Strong familiarity." },
      { rating: "Very High", numeric: 0.81, impact: impEM(0.81), meaning: "~6 years", example: "Deep domain expertise." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  PLEX: {
    title: "PLEX — Platform Experience",
    description: "Team experience with platform/infrastructure stack. More experience reduces effort.",
    ratings: [
      { rating: "Very Low", numeric: 1.19, impact: impEM(1.19), meaning: "≤ 2 months", example: "New cloud platform." },
      { rating: "Low", numeric: 1.09, impact: impEM(1.09), meaning: "~6 months", example: "Early familiarity." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "~1 year", example: "Working knowledge." },
      { rating: "High", numeric: 0.91, impact: impEM(0.91), meaning: "~3 years", example: "Experienced." },
      { rating: "Very High", numeric: 0.85, impact: impEM(0.85), meaning: "~6 years", example: "Deep stack expertise." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
  LTEX: {
    title: "LTEX — Language & Tool Experience",
    description: "Team experience with primary language and toolchain. More experience reduces effort.",
    ratings: [
      { rating: "Very Low", numeric: 1.20, impact: impEM(1.20), meaning: "≤ 2 months", example: "New framework/toolchain." },
      { rating: "Low", numeric: 1.09, impact: impEM(1.09), meaning: "~6 months", example: "Limited practice." },
      { rating: "Nominal", numeric: 1.00, impact: impEM(1.00), meaning: "~1 year", example: "Competent." },
      { rating: "High", numeric: 0.91, impact: impEM(0.91), meaning: "~3 years", example: "Strong competence." },
      { rating: "Very High", numeric: 0.84, impact: impEM(0.84), meaning: "~6 years", example: "Expert users of toolchain." },
      { rating: "Extra High", numeric: null, impact: "Neutral", meaning: "Not used", example: "n/a" },
    ],
  },
};
/*
=====================================
CALCULATED FIELD FORMULAS
=====================================

Adaptation Adjustment Factor (AAF)

AAF = (0.4 * DM) + (0.3 * CM) + (0.3 * IM)

Where:
DM = Percent of Design Modified
CM = Percent of Code Modified
IM = Percent of Integration Modified


Equivalent Source Lines of Code (ESLOC)

ESLOC = KSLOC * [AA + AAF * (1 + (0.02 * SU * UNFM))] / 100

Where:
KSLOC = ASLOC / 1000
AA    = Assessment & Assimilation
SU    = Software Understanding
UNFM  = Unfamiliarity

This formula estimates the effective development size after reuse
and modification effort are considered.
*/