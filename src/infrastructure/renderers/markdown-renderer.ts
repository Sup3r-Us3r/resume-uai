import fs from "node:fs/promises";
import path from "node:path";
import type { ResumeRenderer } from "../../application/ports/resume-renderer.js";
import type { SupportedLanguage } from "../../application/ports/ai-provider.js";
import type { Resume } from "../../domain/schemas/resume-schema.js";
import { RenderError } from "../../shared/errors/app-error.js";

export interface MarkdownRendererOptions {
  templatePath?: string;
  lang?: SupportedLanguage;
}

interface RendererLabels {
  summaryHeading: string;
  skillsHeading: string;
  experienceHeading: string;
  educationHeading: string;
  certificationsHeading: string;
  projectsHeading: string;
  languagesHeading: string;
  languagesSkill: string;
  frameworksSkill: string;
  librariesSkill: string;
  databasesSkill: string;
  cloudSkill: string;
  devopsSkill: string;
  toolsSkill: string;
  methodologiesSkill: string;
  otherSkill: string;
  keyAchievement: string;
  technologies: string;
  noExperience: string;
  noEducation: string;
  present: string;
}

const LABELS_PT: RendererLabels = {
  summaryHeading: "RESUMO PROFISSIONAL",
  skillsHeading: "COMPETÊNCIAS & HABILIDADES TÉCNICAS",
  experienceHeading: "EXPERIÊNCIA PROFISSIONAL",
  educationHeading: "FORMAÇÃO ACADÊMICA",
  certificationsHeading: "CERTIFICAÇÕES",
  projectsHeading: "PRINCIPAIS PROJETOS",
  languagesHeading: "IDIOMAS",
  languagesSkill: "Linguagens",
  frameworksSkill: "Frameworks & Bibliotecas",
  librariesSkill: "Bibliotecas",
  databasesSkill: "Bancos de Dados",
  cloudSkill: "Nuvem & Infraestrutura",
  devopsSkill: "DevOps",
  toolsSkill: "Ferramentas & Softwares",
  methodologiesSkill: "Metodologias",
  otherSkill: "Outras competências",
  keyAchievement: "Destaque",
  technologies: "Tecnologias",
  noExperience: "*Nenhum histórico profissional informado.*",
  noEducation: "*Nenhuma formação acadêmica informada.*",
  present: "Presente"
};

const LABELS_EN: RendererLabels = {
  summaryHeading: "PROFESSIONAL SUMMARY",
  skillsHeading: "CORE COMPETENCIES & TECHNICAL SKILLS",
  experienceHeading: "PROFESSIONAL EXPERIENCE",
  educationHeading: "EDUCATION",
  certificationsHeading: "CERTIFICATIONS",
  projectsHeading: "KEY PROJECTS",
  languagesHeading: "LANGUAGES",
  languagesSkill: "Languages",
  frameworksSkill: "Frameworks & Libraries",
  librariesSkill: "Libraries",
  databasesSkill: "Databases",
  cloudSkill: "Cloud & Infrastructure",
  devopsSkill: "DevOps",
  toolsSkill: "Tools & Software",
  methodologiesSkill: "Methodologies",
  otherSkill: "Other competencies",
  keyAchievement: "Key Achievement",
  technologies: "Technologies",
  noExperience: "*No employment history listed.*",
  noEducation: "*No formal education listed.*",
  present: "Present"
};

export class MarkdownRenderer implements ResumeRenderer<string> {
  private readonly defaultTemplatePath: string;

  constructor(defaultTemplatePath?: string) {
    this.defaultTemplatePath =
      defaultTemplatePath || path.resolve(process.cwd(), "templates", "ats-standard.md");
  }

  async render(resume: Resume, options?: MarkdownRendererOptions): Promise<string> {
    const templatePath = options?.templatePath || this.defaultTemplatePath;
    const labels = options?.lang === "en" ? LABELS_EN : LABELS_PT;

    let templateContent = "";
    try {
      templateContent = await fs.readFile(templatePath, "utf-8");
    } catch {
      // Fallback built-in template if file read fails
      templateContent = `# {{NAME}}\n**{{HEADLINE}}**\n\n{{CONTACT_INFO}}\n\n---\n\n## {{SUMMARY_HEADING}}\n{{SUMMARY}}\n\n---\n\n## {{SKILLS_HEADING}}\n{{SKILLS}}\n\n---\n\n## {{EXPERIENCE_HEADING}}\n{{EXPERIENCE}}\n\n---\n\n## {{EDUCATION_HEADING}}\n{{EDUCATION}}\n\n{{CERTIFICATIONS_SECTION}}\n\n{{PROJECTS_SECTION}}\n\n{{LANGUAGES_SECTION}}`;
    }

    try {
      const contactInfo = this.formatContactInfo(resume.personal);
      const skills = this.formatSkills(resume.skills, labels);
      const experience = this.formatExperience(resume.experience, labels);
      const education = this.formatEducation(resume.education, labels);
      const certificationsSection = this.formatCertifications(resume.certifications, labels);
      const projectsSection = this.formatProjects(resume.projects, labels);
      const languagesSection = this.formatLanguages(resume.languages, labels);

      let output = templateContent
        .replace("{{NAME}}", resume.personal.name)
        .replace("{{HEADLINE}}", resume.headline)
        .replace("{{CONTACT_INFO}}", contactInfo)
        .replace("{{SUMMARY_HEADING}}", labels.summaryHeading)
        .replace("{{SUMMARY}}", resume.summary)
        .replace("{{SKILLS_HEADING}}", labels.skillsHeading)
        .replace("{{SKILLS}}", skills)
        .replace("{{EXPERIENCE_HEADING}}", labels.experienceHeading)
        .replace("{{EXPERIENCE}}", experience)
        .replace("{{EDUCATION_HEADING}}", labels.educationHeading)
        .replace("{{EDUCATION}}", education)
        .replace("{{CERTIFICATIONS_SECTION}}", certificationsSection)
        .replace("{{PROJECTS_SECTION}}", projectsSection)
        .replace("{{LANGUAGES_SECTION}}", languagesSection)
        // Also replace legacy template headings if present in custom template files
        .replace("## PROFESSIONAL SUMMARY", `## ${labels.summaryHeading}`)
        .replace("## CORE COMPETENCIES & TECHNICAL SKILLS", `## ${labels.skillsHeading}`)
        .replace("## PROFESSIONAL EXPERIENCE", `## ${labels.experienceHeading}`)
        .replace("## EDUCATION", `## ${labels.educationHeading}`);

      // Clean up multiple excessive line breaks
      output = output.replace(/\n{3,}/g, "\n\n").trim();
      return output;
    } catch (err) {
      throw new RenderError(`Failed to render resume to Markdown: ${err instanceof Error ? err.message : String(err)}`, err);
    }
  }

  private formatContactInfo(p: Resume["personal"]): string {
    const parts: string[] = [];
    if (p.location) parts.push(p.location);
    if (p.email) parts.push(p.email);
    if (p.phone) parts.push(p.phone);
    if (p.linkedin) parts.push(`[LinkedIn](${p.linkedin})`);
    if (p.github) parts.push(`[GitHub](${p.github})`);
    if (p.website) parts.push(`[Website](${p.website})`);

    return parts.join(" • ");
  }

  private formatSkills(s: Resume["skills"], labels: RendererLabels): string {
    const lines: string[] = [];

    if (s.programmingLanguages && s.programmingLanguages.length > 0) {
      lines.push(`* **${labels.languagesSkill}:** ${s.programmingLanguages.join(", ")}`);
    }
    if (s.frameworks && s.frameworks.length > 0) {
      lines.push(`* **${labels.frameworksSkill}:** ${[...s.frameworks, ...(s.libraries || [])].join(", ")}`);
    } else if (s.libraries && s.libraries.length > 0) {
      lines.push(`* **${labels.librariesSkill}:** ${s.libraries.join(", ")}`);
    }
    if (s.databases && s.databases.length > 0) {
      lines.push(`* **${labels.databasesSkill}:** ${s.databases.join(", ")}`);
    }
    if (s.cloud && s.cloud.length > 0) {
      lines.push(`* **${labels.cloudSkill}:** ${[...s.cloud, ...(s.devops || [])].join(", ")}`);
    } else if (s.devops && s.devops.length > 0) {
      lines.push(`* **${labels.devopsSkill}:** ${s.devops.join(", ")}`);
    }
    if (s.tools && s.tools.length > 0) {
      lines.push(`* **${labels.toolsSkill}:** ${s.tools.join(", ")}`);
    }
    if (s.methodologies && s.methodologies.length > 0) {
      lines.push(`* **${labels.methodologiesSkill}:** ${s.methodologies.join(", ")}`);
    }
    if (s.other && s.other.length > 0) {
      lines.push(`* **${labels.otherSkill}:** ${s.other.join(", ")}`);
    }

    return lines.join("\n");
  }

  private formatExperience(experiences: Resume["experience"], labels: RendererLabels): string {
    if (!experiences || experiences.length === 0) return labels.noExperience;

    return experiences
      .map((exp) => {
        const header = `### ${exp.position} — ${exp.company}`;
        const endDateStr = exp.endDate || (exp.isCurrent ? labels.present : "");
        const metaParts = [exp.location, `${exp.startDate} – ${endDateStr}`].filter(Boolean);
        const meta = `*${metaParts.join(" | ")}*`;

        const bullets: string[] = [];
        if (exp.summary) {
          bullets.push(exp.summary);
        }
        for (const resp of exp.responsibilities || []) {
          bullets.push(`* ${resp}`);
        }
        for (const ach of exp.achievements || []) {
          bullets.push(`* **${labels.keyAchievement}:** ${ach}`);
        }

        let techLine = "";
        if (exp.technologies && exp.technologies.length > 0) {
          techLine = `\n*${labels.technologies}:* ${exp.technologies.join(", ")}`;
        }

        return `${header}\n${meta}\n\n${bullets.join("\n")}${techLine}`;
      })
      .join("\n\n");
  }

  private formatEducation(education: Resume["education"], labels: RendererLabels): string {
    if (!education || education.length === 0) return labels.noEducation;

    return education
      .map((edu) => {
        const degreeField =
          edu.fieldOfStudy && !edu.degree.toLowerCase().includes(edu.fieldOfStudy.toLowerCase())
            ? `${edu.degree} in ${edu.fieldOfStudy}`
            : edu.degree;
        const header = `### ${degreeField} — ${edu.institution}`;
        const metaParts = [edu.location, edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.endDate || edu.startDate].filter(Boolean);
        const meta = metaParts.length > 0 ? `*${metaParts.join(" | ")}*\n` : "";

        const achs = (edu.achievements || []).map((a) => `* ${a}`).join("\n");
        return `${header}\n${meta}${achs ? `\n${achs}` : ""}`.trim();
      })
      .join("\n\n");
  }

  private formatCertifications(certs: Resume["certifications"], labels: RendererLabels): string {
    if (!certs || certs.length === 0) return "";

    const items = certs
      .map((c) => {
        const dateStr = c.issueDate ? ` (${c.issueDate})` : "";
        const idStr = c.credentialId ? ` • ID: ${c.credentialId}` : "";
        return `* **${c.name}** – ${c.issuer}${dateStr}${idStr}`;
      })
      .join("\n");

    return `---\n\n## ${labels.certificationsHeading}\n${items}`;
  }

  private formatProjects(projects: Resume["projects"], labels: RendererLabels): string {
    if (!projects || projects.length === 0) return "";

    const items = projects
      .map((p) => {
        const link = p.url ? ` | [Link](${p.url})` : "";
        const role = p.role ? ` (${p.role})` : "";
        const tech = p.technologies && p.technologies.length > 0 ? `\n*${labels.technologies}:* ${p.technologies.join(", ")}` : "";
        const bullets = (p.highlights || []).map((h) => `* ${h}`).join("\n");

        return `### ${p.name}${role}${link}\n${p.description}${tech}${bullets ? `\n${bullets}` : ""}`;
      })
      .join("\n\n");

    return `---\n\n## ${labels.projectsHeading}\n${items}`;
  }

  private formatLanguages(languages: Resume["languages"], labels: RendererLabels): string {
    if (!languages || languages.length === 0) return "";

    const items = languages.map((l) => `**${l.language}:** ${l.proficiency}`).join(" • ");
    return `---\n\n## ${labels.languagesHeading}\n${items}`;
  }
}

