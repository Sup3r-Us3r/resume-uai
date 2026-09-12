import puppeteer, { type Browser } from "puppeteer";
import type { ResumeRenderer } from "../../application/ports/resume-renderer.js";
import type { SupportedLanguage } from "../../application/ports/ai-provider.js";
import type { Resume } from "../../domain/schemas/resume-schema.js";
import { RenderError } from "../../shared/errors/app-error.js";

export interface PdfRendererOptions {
  lang?: SupportedLanguage;
}

interface PdfLabels {
  htmlLang: string;
  summaryHeading: string;
  skillsHeading: string;
  experienceHeading: string;
  educationHeading: string;
  certificationsHeading: string;
  projectsHeading: string;
  languagesHeading: string;
  languages: string;
  frameworks: string;
  databases: string;
  cloud: string;
  tools: string;
  ai: string;
  methodologies: string;
  other: string;
  technologies: string;
  present: string;
  degreeConnector: string;
}

const PDF_LABELS_PT: PdfLabels = {
  htmlLang: "pt-BR",
  summaryHeading: "Resumo Profissional",
  skillsHeading: "Competências Técnicas",
  experienceHeading: "Experiência Profissional",
  educationHeading: "Formação Acadêmica",
  certificationsHeading: "Certificações",
  projectsHeading: "Principais Projetos",
  languagesHeading: "Idiomas",
  languages: "Linguagens",
  frameworks: "Frameworks & Bibliotecas",
  databases: "Bancos de Dados",
  cloud: "Nuvem & DevOps",
  tools: "Ferramentas",
  ai: "Inteligência Artificial",
  methodologies: "Metodologias",
  other: "Outras",
  technologies: "Tecnologias",
  present: "Presente",
  degreeConnector: "em"
};

const PDF_LABELS_EN: PdfLabels = {
  htmlLang: "en",
  summaryHeading: "Professional Summary",
  skillsHeading: "Technical Skills",
  experienceHeading: "Professional Experience",
  educationHeading: "Education",
  certificationsHeading: "Certifications",
  projectsHeading: "Key Projects",
  languagesHeading: "Languages",
  languages: "Languages",
  frameworks: "Frameworks & Libraries",
  databases: "Databases",
  cloud: "Cloud & DevOps",
  tools: "Tools",
  ai: "Artificial Intelligence",
  methodologies: "Methodologies",
  other: "Other",
  technologies: "Technologies",
  present: "Present",
  degreeConnector: "in"
};

export class PdfRenderer implements ResumeRenderer<Buffer> {
  async render(resume: Resume, options?: PdfRendererOptions): Promise<Buffer> {
    const html = this.generateHtml(resume, options?.lang);

    let browser: Browser | null = null;
    try {
      const launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none"
      ];

      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

      browser = await puppeteer.launch({
        headless: true,
        args: launchArgs,
        executablePath
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdfUint8Array = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "15mm",
          bottom: "15mm",
          left: "15mm",
          right: "15mm"
        },
        preferCSSPageSize: true
      });

      return Buffer.from(pdfUint8Array);
    } catch (err) {
      throw new RenderError(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`, err);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  public generateHtml(resume: Resume, lang?: SupportedLanguage): string {
    const labels = lang === "en" ? PDF_LABELS_EN : PDF_LABELS_PT;
    const p = resume.personal;
    const contactItems: string[] = [];
    if (p.location) contactItems.push(`<span>${this.escapeHtml(p.location)}</span>`);
    if (p.email) contactItems.push(`<a href="mailto:${this.escapeHtml(p.email)}">${this.escapeHtml(p.email)}</a>`);
    if (p.phone) contactItems.push(`<span>${this.escapeHtml(this.formatPhone(p.phone))}</span>`);
    if (p.linkedin) {
      const displayUrl = p.linkedin.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      contactItems.push(`<a href="${this.escapeHtml(p.linkedin)}">${this.escapeHtml(displayUrl)}</a>`);
    }
    if (p.github) {
      const displayUrl = p.github.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      contactItems.push(`<a href="${this.escapeHtml(p.github)}">${this.escapeHtml(displayUrl)}</a>`);
    }
    if (p.website) {
      const displayUrl = p.website.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      contactItems.push(`<a href="${this.escapeHtml(p.website)}">${this.escapeHtml(displayUrl)}</a>`);
    }

    const skillsHtml = this.renderSkillsHtml(resume.skills, labels);
    const experienceHtml = this.renderExperienceHtml(resume.experience, labels);
    const educationHtml = this.renderEducationHtml(resume.education, labels);
    const certificationsHtml = this.renderCertificationsHtml(resume.certifications, labels);
    const projectsHtml = this.renderProjectsHtml(resume.projects, labels);
    const languagesHtml = this.renderLanguagesHtml(resume.languages, labels);

    return `<!DOCTYPE html>
<html lang="${labels.htmlLang}">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(p.name)} - Resume</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #1a1a1a;
      background-color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      text-align: center;
      margin-bottom: 14pt;
      border-bottom: 1.5pt solid #1a1a1a;
      padding-bottom: 8pt;
    }
    h1 {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin-bottom: 3pt;
      text-transform: uppercase;
    }
    .headline {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6pt;
    }
    .contact-info {
      font-size: 9pt;
      color: #475569;
    }
    .contact-info span, .contact-info a {
      margin: 0 4pt;
      color: #334155;
      text-decoration: none;
    }
    .contact-info a:hover {
      text-decoration: underline;
    }
    .section {
      margin-bottom: 12pt;
    }
    h2 {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
      border-bottom: 0.75pt solid #cbd5e1;
      padding-bottom: 2pt;
      margin-bottom: 6pt;
    }
    p.summary {
      font-size: 9.5pt;
      text-align: justify;
      color: #27272a;
    }
    .entry {
      margin-bottom: 9pt;
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5pt;
    }
    .entry-title {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
    }
    .entry-meta {
      font-size: 9pt;
      font-style: italic;
      color: #475569;
    }
    ul {
      list-style-type: disc;
      padding-left: 14pt;
      margin-top: 3pt;
    }
    li {
      font-size: 9.5pt;
      margin-bottom: 2.5pt;
      color: #27272a;
    }
    .technologies {
      font-size: 9pt;
      color: #475569;
      margin-top: 3pt;
      font-style: italic;
    }
    .skill-category {
      margin-bottom: 3.5pt;
      font-size: 9.5pt;
    }
    .skill-category strong {
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(p.name)}</h1>
    <div class="headline">${this.escapeHtml(resume.headline)}</div>
    <div class="contact-info">
      ${contactItems.join(" • ")}
    </div>
  </div>

  <div class="section">
    <h2>${this.escapeHtml(labels.summaryHeading)}</h2>
    <p class="summary">${this.escapeHtml(resume.summary)}</p>
  </div>

  ${skillsHtml}
  ${experienceHtml}
  ${educationHtml}
  ${certificationsHtml}
  ${projectsHtml}
  ${languagesHtml}
</body>
</html>`;
  }

  private renderSkillsHtml(s: Resume["skills"], labels: PdfLabels): string {
    const categories: string[] = [];
    if (s.programmingLanguages?.length) {
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.languages)}:</strong> ${s.programmingLanguages.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.frameworks?.length || s.libraries?.length) {
      const all = [...(s.frameworks || []), ...(s.libraries || [])];
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.frameworks)}:</strong> ${all.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.databases?.length) {
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.databases)}:</strong> ${s.databases.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.cloud?.length || s.devops?.length) {
      const infra = [...(s.cloud || []), ...(s.devops || [])];
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.cloud)}:</strong> ${infra.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.tools?.length) {
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.tools)}:</strong> ${s.tools.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.ai?.length) {
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.ai)}:</strong> ${s.ai.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.methodologies?.length) {
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.methodologies)}:</strong> ${s.methodologies.map(this.escapeHtml).join(", ")}</div>`);
    }
    if (s.other?.length) {
      categories.push(`<div class="skill-category"><strong>${this.escapeHtml(labels.other)}:</strong> ${s.other.map(this.escapeHtml).join(", ")}</div>`);
    }

    if (categories.length === 0) return "";

    return `
  <div class="section">
    <h2>${this.escapeHtml(labels.skillsHeading)}</h2>
    ${categories.join("\n")}
  </div>`;
  }

  private renderExperienceHtml(experiences: Resume["experience"], labels: PdfLabels): string {
    if (!experiences?.length) return "";

    const items = experiences.map((exp) => {
      const dates = `${this.escapeHtml(exp.startDate)} – ${this.escapeHtml(exp.endDate || (exp.isCurrent ? labels.present : ""))}`;
      const location = exp.location ? ` • ${this.escapeHtml(exp.location)}` : "";
      const expBullets = exp.responsibilities?.length ? exp.responsibilities : exp.achievements || [];
      const bullets = expBullets.map((b) => `<li>${this.escapeHtml(b)}</li>`).join("\n");

      const techLine = exp.technologies?.length
        ? `<div class="technologies">${this.escapeHtml(labels.technologies)}: ${exp.technologies.map(this.escapeHtml).join(", ")}</div>`
        : "";

      return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${this.escapeHtml(exp.position)} — ${this.escapeHtml(exp.company)}</span>
          <span class="entry-meta">${dates}${location}</span>
        </div>
        ${exp.summary ? `<p style="font-size: 9pt; margin-bottom: 3pt; color: #475569;">${this.escapeHtml(exp.summary)}</p>` : ""}
        <ul>
          ${bullets}
        </ul>
        ${techLine}
      </div>`;
    });

    return `
  <div class="section">
    <h2>${this.escapeHtml(labels.experienceHeading)}</h2>
    ${items.join("\n")}
  </div>`;
  }

  private renderEducationHtml(education: Resume["education"], labels: PdfLabels): string {
    if (!education?.length) return "";

    const items = education.map((edu) => {
      const formattedDegree = this.formatDegreeField(edu.degree, edu.fieldOfStudy, labels.degreeConnector);
      const degreeStr = this.escapeHtml(formattedDegree);
      const dates = edu.endDate ? this.escapeHtml(edu.endDate) : this.escapeHtml(edu.startDate || "");
      const location = edu.location ? ` • ${this.escapeHtml(edu.location)}` : "";
      const bullets = (edu.achievements || []).map((a) => `<li>${this.escapeHtml(a)}</li>`).join("\n");

      return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${degreeStr} — ${this.escapeHtml(edu.institution)}</span>
          <span class="entry-meta">${dates}${location}</span>
        </div>
        ${bullets ? `<ul>${bullets}</ul>` : ""}
      </div>`;
    });

    return `
  <div class="section">
    <h2>${this.escapeHtml(labels.educationHeading)}</h2>
    ${items.join("\n")}
  </div>`;
  }

  private renderCertificationsHtml(certs: Resume["certifications"], labels: PdfLabels): string {
    if (!certs?.length) return "";

    const items = certs
      .map((c) => {
        const date = c.issueDate ? ` (${this.escapeHtml(c.issueDate)})` : "";
        const id = c.credentialId ? ` • ID: ${this.escapeHtml(c.credentialId)}` : "";
        return `<li><strong>${this.escapeHtml(c.name)}</strong> – ${this.escapeHtml(c.issuer)}${date}${id}</li>`;
      })
      .join("\n");

    return `
  <div class="section">
    <h2>${this.escapeHtml(labels.certificationsHeading)}</h2>
    <ul>
      ${items}
    </ul>
  </div>`;
  }

  private renderProjectsHtml(projects: Resume["projects"], labels: PdfLabels): string {
    if (!projects?.length) return "";

    const items = projects.map((p) => {
      const role = p.role ? ` (${this.escapeHtml(p.role)})` : "";
      const displayUrl = p.url ? p.url.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "") : "";
      const link = p.url ? ` • <a href="${this.escapeHtml(p.url)}" style="color: #334155;">${this.escapeHtml(displayUrl)}</a>` : "";
      const tech = p.technologies?.length
        ? `<div class="technologies">${this.escapeHtml(labels.technologies)}: ${p.technologies.map(this.escapeHtml).join(", ")}</div>`
        : "";
      const bullets = (p.highlights || []).map((h) => `<li>${this.escapeHtml(h)}</li>`).join("\n");

      return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${this.escapeHtml(p.name)}${role}</span>
          <span class="entry-meta">${link}</span>
        </div>
        <p style="font-size: 9.5pt; color: #27272a;">${this.escapeHtml(p.description)}</p>
        ${bullets ? `<ul>${bullets}</ul>` : ""}
        ${tech}
      </div>`;
    });

    return `
  <div class="section">
    <h2>${this.escapeHtml(labels.projectsHeading)}</h2>
    ${items.join("\n")}
  </div>`;
  }

  private renderLanguagesHtml(languages: Resume["languages"], labels: PdfLabels): string {
    if (!languages?.length) return "";

    const items = languages
      .map((l) => `<strong>${this.escapeHtml(l.language)}:</strong> ${this.escapeHtml(l.proficiency)}`)
      .join(" • ");

    return `
  <div class="section">
    <h2>${this.escapeHtml(labels.languagesHeading)}</h2>
    <p style="font-size: 9.5pt; color: #27272a;">${items}</p>
  </div>`;
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

  private escapeHtml(str: string): string {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
