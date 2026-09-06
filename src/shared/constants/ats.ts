export const ATS_SCORE_LEVELS = {
  POOR: { min: 0, max: 59, label: "Poor", color: "red" },
  NEEDS_IMPROVEMENT: { min: 60, max: 74, label: "Needs Improvement", color: "yellow" },
  GOOD: { min: 75, max: 89, label: "Good", color: "cyan" },
  EXCELLENT: { min: 90, max: 100, label: "Excellent", color: "green" }
} as const;

export const STRONG_ACTION_VERBS = [
  // Technical & Implementation
  "architected", "built", "coded", "configured", "deployed", "designed", "developed",
  "engineered", "implemented", "integrated", "migrated", "optimized", "refactored",
  "automated", "debugged", "maintained", "scaled", "programmed", "orchestrated",
  // Leadership & Project Management
  "spearheaded", "led", "managed", "directed", "mentored", "coached", "supervised",
  "coordinated", "executed", "championed", "fostered", "aligned", "facilitated",
  // Analysis & Impact
  "analyzed", "reduced", "increased", "boosted", "accelerated", "enhanced",
  "maximized", "minimized", "streamlined", "delivered", "solved", "negotiated",
  "established", "identified", "transformed", "modernized", "pioneered",
  // Product & Research
  "researched", "launched", "validated", "iterated", "standardized", "defined",
  // Portuguese Action Verbs (1st and 3rd person past tense)
  "arquitetei", "arquitetou", "construi", "construiu", "codifiquei", "codificou",
  "configurei", "configurou", "implantei", "implantou", "desenvolvi", "desenvolveu",
  "engendrei", "engendrou", "implementei", "implementou", "integrei", "integrou",
  "migrei", "migrou", "otimizei", "otimizou", "refatorei", "refatorou", "automatizei",
  "automatizou", "depurei", "depurou", "mantive", "manteve", "escalei", "escalou",
  "orquestrei", "orquestrou", "liderei", "liderou", "conduzi", "conduziu", "gerenciei",
  "gerenciou", "coordenei", "coordenou", "executei", "executou", "orientei", "orientou",
  "estruturei", "estruturou", "criei", "criou", "reduzi", "reduziu", "aumentei", "aumentou",
  "acelerei", "acelerou", "aprimorei", "aprimorou", "entreguei", "entregou", "estabeleci",
  "estabeleceu", "lancei", "lançou", "transformei", "transformou", "defini", "definiu"
];

export const CONVENTIONAL_SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "languages"
] as const;

export const SUPPORTED_INPUT_EXTENSIONS = [".txt", ".md", ".pdf"] as const;
