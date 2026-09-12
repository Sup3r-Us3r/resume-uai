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
  aiSkill: string;
  methodologiesSkill: string;
  otherSkill: string;
  technologies: string;
  noExperience: string;
  noEducation: string;
  present: string;
  degreeConnector: string;
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
  aiSkill: "Inteligência Artificial",
  methodologiesSkill: "Metodologias",
  otherSkill: "Outras competências",
  technologies: "Tecnologias",
  noExperience: "*Nenhum histórico profissional informado.*",
  noEducation: "*Nenhuma formação acadêmica informada.*",
  present: "Presente",
  degreeConnector: "em"
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
  aiSkill: "Artificial Intelligence",
  methodologiesSkill: "Methodologies",
  otherSkill: "Other competencies",
  technologies: "Technologies",
  noExperience: "*No employment history listed.*",
  noEducation: "*No formal education listed.*",
  present: "Present",
  degreeConnector: "in"
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
    if (p.phone) parts.push(this.formatPhone(p.phone));
    if (p.linkedin) {
      const displayUrl = p.linkedin.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      parts.push(`[${displayUrl}](${p.linkedin})`);
    }
    if (p.github) {
      const displayUrl = p.github.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      parts.push(`[${displayUrl}](${p.github})`);
    }
    if (p.website) {
      const displayUrl = p.website.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      parts.push(`[${displayUrl}](${p.website})`);
    }

    return parts.join(" • ");
  }

  private formatPhone(phone: string): string {
    const trimmed = phone.trim();
    if (!trimmed) return "";

    // If already formatted with international prefix (e.g. "+1 202-555-0143" or "+55 (31)..."), preserve it
    if (trimmed.startsWith("+") && /[\s()-]/.test(trimmed)) {
      return trimmed;
    }

    const digits = trimmed.replace(/\D/g, "");

    // Brazilian phone with 10 or 11 digits without country code (e.g. 31989486831 or 3189486831)
    if (digits.length === 11 && !digits.startsWith("1") && !digits.startsWith("0")) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10 && !digits.startsWith("1") && !digits.startsWith("0")) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 13 && digits.startsWith("55")) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 12 && digits.startsWith("55")) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    return phone;
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
    if (s.ai && s.ai.length > 0) {
      lines.push(`* **${labels.aiSkill}:** ${s.ai.join(", ")}`);
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
        const meta = `*${metaParts.join(" • ")}*`;

        const bullets: string[] = [];
        if (exp.summary) {
          bullets.push(exp.summary);
        }
        const expBullets = exp.responsibilities?.length ? exp.responsibilities : exp.achievements || [];
        for (const resp of expBullets) {
          bullets.push(`* ${resp}`);
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
        const degreeField = this.formatDegreeField(edu.degree, edu.fieldOfStudy, labels.degreeConnector);
        const header = `### ${degreeField} — ${edu.institution}`;
        const metaParts = [edu.location, edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.endDate || edu.startDate].filter(Boolean);
        const meta = metaParts.length > 0 ? `*${metaParts.join(" • ")}*\n` : "";

        const achs = (edu.achievements || []).map((a) => `* ${a}`).join("\n");
        return `${header}\n${meta}${achs ? `\n${achs}` : ""}`.trim();
      })
      .join("\n\n");
  }

  private formatDegreeField(degree: string, fieldOfStudy: string | undefined, connector: string): string {
    if (!fieldOfStudy) return degree;
    const cleanDegree = degree.trim();
    const cleanField = fieldOfStudy.trim();
    if (!cleanField) return cleanDegree;

    if (cleanDegree.toLowerCase().includes(cleanField.toLowerCase())) {
      return cleanDegree;
    }

    if (/\s+(?:in|em|de)$/i.test(cleanDegree)) {
      if (connector === "em" && /\s+in$/i.test(cleanDegree)) {
        return `${cleanDegree.slice(0, -2)}em ${cleanField}`;
      }
      return `${cleanDegree} ${cleanField}`;
    }

    if (/^(?:in|em|de)\s+/i.test(cleanField)) {
      if (connector === "em" && /^in\s+/i.test(cleanField)) {
        return `${cleanDegree} em ${cleanField.slice(3)}`;
      }
      return `${cleanDegree} ${cleanField}`;
    }

    return `${cleanDegree} ${connector} ${cleanField}`;
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
        const displayUrl = p.url ? p.url.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "") : "";
        const link = p.url ? ` • [${displayUrl}](${p.url})` : "";
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

