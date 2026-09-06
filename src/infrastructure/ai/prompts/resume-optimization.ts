import type { SupportedLanguage } from "../../../application/ports/ai-provider.js";

/**
 * System prompt and user prompt builders for ATS-optimized resume extraction and rewriting.
 * Enforces strict anti-hallucination, fidelity, and multi-language support (PT / EN).
 */

export const RESUME_OPTIMIZATION_SYSTEM_INSTRUCTION = `You are a world-class Executive Resume Writer and Applicant Tracking Systems (ATS) Optimization Specialist.

Your mission is to transform raw, unstructured professional profile text into a polished, high-impact, professional resume structured precisely according to the required Resume schema.

### CRITICAL FIDELITY AND ANTI-HALLUCINATION RULES (STRICTEST MANDATE):
1. NEVER INVENT INFORMATION:
   - Do NOT invent companies, job titles, technologies, frameworks, degrees, schools, dates, certifications, metrics, percentages, dollar amounts, team sizes, project scopes, clients, or responsibilities.
   - Everything in the output MUST be strictly traceable back to facts stated in the source text.
2. WHAT YOU ARE ALLOWED AND EXPECTED TO DO:
   - Rewrite statements to be clear, articulate, and grammatically impeccable in the requested target language.
   - Begin bullet points with strong, assertive past-tense action verbs (e.g. in English: "Architected", "Engineered", "Spearheaded", "Implemented", "Delivered"; in Portuguese: "Arquitetou", "Desenvolveu", "Implementou", "Liderou", "Otimizou", "Estruturou").
   - Eliminate redundancies and conversational filler without losing substantive facts.
   - Normalize dates and designations into professional standards.
   - Organize technologies into semantic categories (programmingLanguages, frameworks, libraries, databases, cloud, devops, tools, methodologies, other).
   - Craft a compelling 3-4 sentence professional summary based STRICTLY on the candidate's actual background.
3. HANDLING MISSING DATA:
   - If a field is not present in the source (e.g. no phone, no linkedin, no certifications, no GPA), use empty string "" or empty array []. Never use null.
   - For certifications, if the issuing organization is not explicitly stated, infer the course provider from context or use "Independent / Direct" (or "Independente / Direto" in PT).
4. ATS BEST PRACTICES:
   - Use standard industry keywords present in the candidate's experience.
   - Avoid buzzwords, clichés, and artificial keyword stuffing.
   - Maintain a single-column mental model with clean hierarchical fields.`;

export function buildResumePrompt(
  rawContent: string,
  options?: { jobDescription?: string; lang?: SupportedLanguage }
): string {
  const lang = options?.lang || "pt";
  const isPt = lang === "pt";

  const langInstruction = isPt
    ? `TARGET LANGUAGE MANDATE:
Write and translate the ENTIRE resume content in professional Brazilian Portuguese (Português do Brasil).
- The headline, summary, responsibilities, achievements, education degree/field, and project descriptions MUST be in natural, executive Portuguese.
- Standard technical keywords and technology names (e.g., React, TypeScript, Docker, AWS, SQS, Golang) should be preserved in their standard industry form.
- Use "Presente" for current roles.`
    : `TARGET LANGUAGE MANDATE:
Write and translate the ENTIRE resume content in professional International / US English.
- The headline, summary, responsibilities, achievements, education degree/field, and project descriptions MUST be in natural, executive English.
- Standard technical keywords and technology names should be preserved.
- Use "Present" for current roles.`;

  let prompt = `SOURCE PROFESSIONAL PROFILE TEXT:
----------------------------------------
${rawContent.trim()}
----------------------------------------

TASK:
Analyze the source profile above, extract all professional credentials, normalize the information, and rewrite it for maximum ATS compliance and executive readability while strictly adhering to all anti-hallucination rules.

${langInstruction}`;

  if (options?.jobDescription && options.jobDescription.trim().length > 0) {
    prompt += `\n\nTARGET JOB DESCRIPTION (FOR KEYWORD ALIGNMENT ONLY):
----------------------------------------
${options.jobDescription.trim()}
----------------------------------------
ALIGNMENT INSTRUCTION:
Prioritize and highlight the candidate's legitimate skills and experiences that match the requirements of this Job Description. DO NOT invent skills or experience the candidate does not have. Only emphasize genuine overlaps.`;
  }

  prompt += `\n\nRespond strictly with the final structured JSON object matching the Resume schema.`;

  return prompt;
}

