import { describe, it, expect } from "vitest";
import { ATSAnalyzer } from "../../src/domain/services/ats-analyzer.js";
import type { Resume } from "../../src/domain/schemas/resume-schema.js";

describe("ATSAnalyzer", () => {
  const analyzer = new ATSAnalyzer();

  const strongResume: Resume = {
    personal: {
      name: "Marcus Aurelius",
      email: "marcus.aurelius@rome.org",
      phone: "+1 555-010-9988",
      location: "Rome, Italy",
      linkedin: "https://linkedin.com/in/marcusaurelius",
      github: "https://github.com/marcusaurelius",
      website: "https://philosophy.org"
    },
    headline: "Senior Cloud Architect | Scalable Microservices",
    summary:
      "Results-oriented Senior Cloud Architect with 10+ years architecting secure cloud platforms. Proven track record reducing infrastructure expenses by 30% and leading high-performing DevOps teams.",
    skills: {
      programmingLanguages: ["Go", "TypeScript", "Python"],
      frameworks: ["Node.js", "Express"],
      libraries: ["Zod"],
      databases: ["PostgreSQL", "Redis"],
      cloud: ["AWS", "GCP", "Kubernetes"],
      devops: ["Terraform", "Docker", "CI/CD"],
      tools: ["Git", "Linux"],
      ai: [],
      methodologies: ["Agile/Scrum", "TDD"],
      other: []
    },
    experience: [
      {
        company: "Imperium Cloud",
        position: "Lead Cloud Architect",
        location: "Rome, Italy",
        startDate: "2020-01",
        endDate: "Present",
        isCurrent: true,
        summary: "Platform infrastructure lead.",
        responsibilities: [
          "Architected multi-region Kubernetes clusters serving 50M requests daily with 99.99% uptime.",
          "Spearheaded cloud migration initiatives, cutting server operating costs by $250k annually.",
          "Engineered automated infrastructure provisioning pipelines using Terraform and GitHub Actions."
        ],
        achievements: ["Delivered zero-downtime database failover solution across AWS regions."],
        technologies: ["AWS", "Kubernetes", "Terraform", "Go"]
      }
    ],
    education: [
      {
        institution: "University of Rome",
        degree: "Master of Science in Computer Engineering",
        fieldOfStudy: "Computer Engineering",
        location: "Rome",
        startDate: "2010",
        endDate: "2015",
        achievements: []
      }
    ],
    certifications: [
      {
        name: "AWS Solutions Architect Professional",
        issuer: "Amazon Web Services",
        issueDate: "2021",
        expiryDate: "2024",
        credentialId: "AWS-999",
        url: ""
      }
    ],
    languages: [{ language: "Italian", proficiency: "Native" }],
    projects: []
  };

  it("should calculate a high ATS score (Good or Excellent) for a complete profile", () => {
    const result = analyzer.analyze(strongResume);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(["Good", "Excellent"]).toContain(result.level);
    expect(result.metrics.actionVerbsFound).toBeGreaterThanOrEqual(2);
    expect(result.metrics.hasMetrics).toBe(true);
  });

  it("should deduct points and provide suggestions when contact info is missing", () => {
    const incompleteResume: Resume = {
      ...strongResume,
      personal: {
        name: "Marcus",
        email: "invalid-email",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        website: ""
      }
    };
    const result = analyzer.analyze(incompleteResume);
    expect(result.score).toBeLessThan(strongResumeScore(analyzer, strongResume));
    expect(result.suggestions.some((s) => s.includes("email"))).toBe(true);
  });

  it("should detect Markdown tables and flag formatting violation", () => {
    const rawTextWithTable = `
| Company | Role | Duration |
| --- | --- | --- |
| Acme | Dev | 2020-2022 |
    `;
    const result = analyzer.analyze(strongResume, rawTextWithTable);
    const tableCheck = result.checks.find((c) => c.id === "format_no_tables");
    expect(tableCheck?.passed).toBe(false);
    expect(result.suggestions.some((s) => s.toLowerCase().includes("table"))).toBe(true);
  });

  it("should analyze raw text heuristics directly with analyzeRawText", () => {
    const raw = `
Lucas Vance
lucas.vance@example.com
+1 555-123-4567
linkedin.com/in/lucasvance

Professional Summary
Senior engineer with extensive experience building cloud systems.

Experience
Lead Engineer at Tech Corp (2020 - Present)
- Architected distributed systems processing 50k requests.
- Engineered automated deployments.

Education
B.S. in Computer Science, University of Washington

Skills
Go, TypeScript, Node.js, AWS, Kubernetes, PostgreSQL, Redis
    `;
    const result = analyzer.analyzeRawText(raw);
    expect(result.score).toBeGreaterThan(60);
    expect(result.passedCount).toBeGreaterThan(5);
  });
});

function strongResumeScore(analyzer: ATSAnalyzer, resume: Resume): number {
  return analyzer.analyze(resume).score;
}
