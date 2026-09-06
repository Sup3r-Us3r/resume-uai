import { describe, it, expect } from "vitest";
import { MarkdownRenderer } from "../../src/infrastructure/renderers/markdown-renderer.js";
import type { Resume } from "../../src/domain/schemas/resume-schema.js";

describe("MarkdownRenderer", () => {
  const renderer = new MarkdownRenderer();

  const mockResume: Resume = {
    personal: {
      name: "Diana Prince",
      email: "diana.prince@example.com",
      phone: "+1 202-555-0143",
      location: "Washington, DC",
      linkedin: "https://linkedin.com/in/dianaprince",
      github: "https://github.com/dianaprince",
      website: ""
    },
    headline: "Principal DevOps Engineer | Cloud Security",
    summary: "Senior infrastructure leader with 10 years experience hardening enterprise cloud systems.",
    skills: {
      programmingLanguages: ["Python", "Bash", "Go"],
      frameworks: [],
      libraries: [],
      databases: ["PostgreSQL"],
      cloud: ["AWS", "GCP"],
      devops: ["Terraform", "Kubernetes", "Docker", "Ansible"],
      tools: ["Git", "Vault"],
      methodologies: ["DevSecOps", "Zero Trust"],
      other: []
    },
    experience: [
      {
        company: "Defense Tech Corp",
        position: "Principal DevOps Engineer",
        location: "Washington, DC",
        startDate: "2019-04",
        endDate: "Present",
        isCurrent: true,
        summary: "Lead for identity and infrastructure security.",
        responsibilities: [
          "Architected zero-trust Kubernetes clusters across multi-cloud regions.",
          "Automated infrastructure hardening with Terraform and HashiCorp Vault."
        ],
        achievements: ["Zero security incidents across 5 enterprise audit cycles."],
        technologies: ["Kubernetes", "AWS", "Vault", "Terraform"]
      }
    ],
    education: [
      {
        institution: "Georgetown University",
        degree: "B.S. in Information Security",
        fieldOfStudy: "Information Security",
        location: "Washington, DC",
        startDate: "2010",
        endDate: "2014",
        achievements: []
      }
    ],
    certifications: [
      {
        name: "CISSP",
        issuer: "ISC2",
        issueDate: "2018",
        expiryDate: "2024",
        credentialId: "CISSP-8821",
        url: ""
      }
    ],
    languages: [{ language: "English", proficiency: "Native" }],
    projects: []
  };

  it("should render a clean ATS-friendly markdown document in English", async () => {
    const md = await renderer.render(mockResume, { lang: "en" });

    // Verify Title and Headline
    expect(md).toContain("# Diana Prince");
    expect(md).toContain("**Principal DevOps Engineer | Cloud Security**");

    // Verify Contact Info
    expect(md).toContain("diana.prince@example.com");
    expect(md).toContain("+1 202-555-0143");
    expect(md).toContain("[LinkedIn](https://linkedin.com/in/dianaprince)");

    // Verify Summary
    expect(md).toContain("## PROFESSIONAL SUMMARY");
    expect(md).toContain("Senior infrastructure leader with 10 years experience");

    // Verify Skills
    expect(md).toContain("## CORE COMPETENCIES & TECHNICAL SKILLS");
    expect(md).toContain("Python, Bash, Go");
    expect(md).toContain("Terraform, Kubernetes, Docker, Ansible");

    // Verify Experience
    expect(md).toContain("### Principal DevOps Engineer — Defense Tech Corp");
    expect(md).toContain("* Architected zero-trust Kubernetes clusters");
    expect(md).toContain("* **Key Achievement:** Zero security incidents");

    // Verify No Tables or Column tags in output
    expect(md).not.toContain("| --- |");
    expect(md).not.toContain("<div");
    expect(md).not.toContain("<td");
  });

  it("should render a clean ATS-friendly markdown document in Portuguese", async () => {
    const md = await renderer.render(mockResume, { lang: "pt" });

    // Verify Title and Headline
    expect(md).toContain("# Diana Prince");
    expect(md).toContain("**Principal DevOps Engineer | Cloud Security**");

    // Verify Portuguese Headings
    expect(md).toContain("## RESUMO PROFISSIONAL");
    expect(md).toContain("## COMPETÊNCIAS & HABILIDADES TÉCNICAS");
    expect(md).toContain("## EXPERIÊNCIA PROFISSIONAL");
    expect(md).toContain("## FORMAÇÃO ACADÊMICA");
    expect(md).toContain("## CERTIFICAÇÕES");
    expect(md).toContain("## IDIOMAS");
    expect(md).toContain("* **Destaque:** Zero security incidents");
  });
});
