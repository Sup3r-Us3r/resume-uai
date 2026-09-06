import type { Resume } from "../schemas/resume-schema.js";
import { ATS_SCORE_LEVELS, STRONG_ACTION_VERBS } from "../../shared/constants/ats.js";

export interface ATSCheckItem {
  id: string;
  name: string;
  category: "contact" | "sections" | "experience" | "skills" | "formatting";
  passed: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  impact: "critical" | "warning" | "info";
}

export interface ATSAnalysisResult {
  score: number;
  maxScore: number;
  level: "Poor" | "Needs Improvement" | "Good" | "Excellent";
  checks: ATSCheckItem[];
  passedCount: number;
  totalCount: number;
  suggestions: string[];
  metrics: {
    totalExperiences: number;
    totalSkills: number;
    actionVerbsFound: number;
    hasMetrics: boolean;
  };
}

export class ATSAnalyzer {
  public analyze(resume: Resume, rawText?: string): ATSAnalysisResult {
    const checks: ATSCheckItem[] = [];
    const suggestions: string[] = [];

    // --- 1. CONTACT INFORMATION (Max: 15) ---
    const hasName = Boolean(resume.personal.name && resume.personal.name.trim().length > 1);
    checks.push({
      id: "contact_name",
      name: "Full Name Identified",
      category: "contact",
      passed: hasName,
      score: hasName ? 4 : 0,
      maxScore: 4,
      feedback: hasName ? "Full candidate name is present." : "Candidate name is missing.",
      impact: "critical"
    });
    if (!hasName) suggestions.push("Add candidate full name at the top of the resume.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasEmail = Boolean(resume.personal.email && emailRegex.test(resume.personal.email));
    checks.push({
      id: "contact_email",
      name: "Valid Email Address",
      category: "contact",
      passed: hasEmail,
      score: hasEmail ? 4 : 0,
      maxScore: 4,
      feedback: hasEmail ? "Valid email found." : "Missing or invalid email address.",
      impact: "critical"
    });
    if (!hasEmail) suggestions.push("Include a valid, professional email address.");

    const hasPhone = Boolean(resume.personal.phone && resume.personal.phone.trim().length >= 7);
    checks.push({
      id: "contact_phone",
      name: "Phone Number",
      category: "contact",
      passed: hasPhone,
      score: hasPhone ? 3 : 0,
      maxScore: 3,
      feedback: hasPhone ? "Contact phone number provided." : "Phone number is missing.",
      impact: "warning"
    });
    if (!hasPhone) suggestions.push("Include a contact phone number with country/area code.");

    const hasLocation = Boolean(resume.personal.location && resume.personal.location.trim().length > 1);
    checks.push({
      id: "contact_location",
      name: "Location / Geographic Area",
      category: "contact",
      passed: hasLocation,
      score: hasLocation ? 2 : 0,
      maxScore: 2,
      feedback: hasLocation ? "Location provided." : "Location is missing.",
      impact: "info"
    });
    if (!hasLocation) suggestions.push("Include city and state/country for regional ATS filtering.");

    const hasProfileLinks = Boolean(
      (resume.personal.linkedin && resume.personal.linkedin.trim().length > 0) ||
      (resume.personal.github && resume.personal.github.trim().length > 0) ||
      (resume.personal.website && resume.personal.website.trim().length > 0)
    );
    checks.push({
      id: "contact_links",
      name: "Professional Profile Links (LinkedIn / GitHub)",
      category: "contact",
      passed: hasProfileLinks,
      score: hasProfileLinks ? 2 : 0,
      maxScore: 2,
      feedback: hasProfileLinks ? "Professional links present." : "No LinkedIn or professional links found.",
      impact: "info"
    });
    if (!hasProfileLinks) suggestions.push("Add a clean LinkedIn or GitHub profile link.");

    // --- 2. CORE SECTIONS (Max: 25) ---
    const hasHeadline = Boolean(resume.headline && resume.headline.trim().length >= 3);
    checks.push({
      id: "section_headline",
      name: "Professional Headline / Target Role",
      category: "sections",
      passed: hasHeadline,
      score: hasHeadline ? 5 : 0,
      maxScore: 5,
      feedback: hasHeadline ? "Clear professional headline present." : "Headline or target title is missing.",
      impact: "critical"
    });
    if (!hasHeadline) suggestions.push("Add a targeted professional headline (e.g., 'Senior Software Engineer | Cloud Architecture').");

    const hasSummary = Boolean(resume.summary && resume.summary.trim().length >= 40);
    checks.push({
      id: "section_summary",
      name: "Professional Summary",
      category: "sections",
      passed: hasSummary,
      score: hasSummary ? 5 : 0,
      maxScore: 5,
      feedback: hasSummary ? "Concise summary present." : "Professional summary is missing or too short.",
      impact: "warning"
    });
    if (!hasSummary) suggestions.push("Craft a 3-4 sentence summary emphasizing core value, seniority, and key domain skills.");

    const hasExperience = resume.experience && resume.experience.length > 0;
    checks.push({
      id: "section_experience",
      name: "Work Experience Section",
      category: "sections",
      passed: hasExperience,
      score: hasExperience ? 6 : 0,
      maxScore: 6,
      feedback: hasExperience ? `Found ${resume.experience.length} work experience entries.` : "No experience entries found.",
      impact: "critical"
    });
    if (!hasExperience) suggestions.push("Work experience is essential for ATS indexing. Include at least one role.");

    const totalSkillsCount = Object.values(resume.skills).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);
    const hasSkills = totalSkillsCount >= 5;
    checks.push({
      id: "section_skills",
      name: "Skills Section (Min 5 skills)",
      category: "sections",
      passed: hasSkills,
      score: hasSkills ? 5 : 0,
      maxScore: 5,
      feedback: hasSkills ? `Found ${totalSkillsCount} distinct skills.` : "Skills list is too sparse (< 5 skills).",
      impact: "critical"
    });
    if (!hasSkills) suggestions.push("Expand skills with core languages, frameworks, databases, and methodologies.");

    const hasEducation = resume.education && resume.education.length > 0;
    checks.push({
      id: "section_education",
      name: "Education Section",
      category: "sections",
      passed: hasEducation,
      score: hasEducation ? 4 : 0,
      maxScore: 4,
      feedback: hasEducation ? `Found ${resume.education.length} education entries.` : "No education entries found.",
      impact: "warning"
    });
    if (!hasEducation) suggestions.push("Add education history, degree, or ongoing relevant coursework.");

    // --- 3. EXPERIENCE QUALITY & ACTION VERBS (Max: 25) ---
    let actionVerbsFound = 0;
    let hasMetrics = false;
    let totalResponsibilities = 0;

    const metricRegex = /\b(\d+[%kKmMbB]?|\$\d+|\d+\+|\d+\.\d+)\b/;

    if (hasExperience) {
      for (const exp of resume.experience) {
        const bullets = [...(exp.responsibilities || []), ...(exp.achievements || [])];
        for (const bullet of bullets) {
          totalResponsibilities++;
          const lower = bullet.toLowerCase().trim();
          const firstWord = lower.split(/\s+/)[0]?.replace(/[^a-z]/g, "") || "";
          if (STRONG_ACTION_VERBS.includes(firstWord)) {
            actionVerbsFound++;
          }
          if (metricRegex.test(bullet)) {
            hasMetrics = true;
          }
        }
      }
    }

    const actionVerbRatio = totalResponsibilities > 0 ? actionVerbsFound / totalResponsibilities : 0;
    const hasGoodVerbs = actionVerbRatio >= 0.4 || actionVerbsFound >= 3;
    checks.push({
      id: "exp_action_verbs",
      name: "Strong Action Verbs in Experience Bullets",
      category: "experience",
      passed: hasGoodVerbs,
      score: hasGoodVerbs ? 10 : (actionVerbsFound > 0 ? 5 : 0),
      maxScore: 10,
      feedback: hasGoodVerbs
        ? `Identified strong action verbs (${actionVerbsFound} bullets).`
        : `Few strong action verbs identified (${actionVerbsFound} found). Use verbs like 'Architected', 'Optimized', 'Delivered'.`,
      impact: "warning"
    });
    if (!hasGoodVerbs) suggestions.push("Start bullet points with assertive past-tense action verbs (e.g., Developed, Orchestrated, Automated).");

    checks.push({
      id: "exp_quantifiable_metrics",
      name: "Quantifiable Results & Metrics",
      category: "experience",
      passed: hasMetrics,
      score: hasMetrics ? 8 : 2,
      maxScore: 8,
      feedback: hasMetrics
        ? "Bullet points contain measurable results (percentages, latency, throughput, scale)."
        : "No measurable metrics detected in experience bullets.",
      impact: "info"
    });
    if (!hasMetrics) suggestions.push("Include quantifiable accomplishments where available (e.g., latency reduction, revenue, uptime, volume).");

    const allExpHaveDates = hasExperience && resume.experience.every((e) => Boolean(e.startDate && e.startDate.trim()));
    checks.push({
      id: "exp_dates_consistency",
      name: "Complete Employment Dates",
      category: "experience",
      passed: allExpHaveDates,
      score: allExpHaveDates ? 7 : 0,
      maxScore: 7,
      feedback: allExpHaveDates ? "All work experiences contain explicit start/end dates." : "Some experiences lack start or end dates.",
      impact: "warning"
    });
    if (!allExpHaveDates) suggestions.push("Ensure every work experience has consistent start and end dates (e.g., '2021-03' or 'March 2021').");

    // --- 4. SKILLS CATEGORIZATION (Max: 15) ---
    const populatedCategories = Object.entries(resume.skills).filter(([_, arr]) => Array.isArray(arr) && arr.length > 0).length;
    const isCategorized = populatedCategories >= 2;
    checks.push({
      id: "skills_categorization",
      name: "Semantic Skills Categorization",
      category: "skills",
      passed: isCategorized,
      score: isCategorized ? 8 : 3,
      maxScore: 8,
      feedback: isCategorized
        ? `Skills are categorized across ${populatedCategories} semantic domains.`
        : "Skills are not categorized across multiple domains.",
      impact: "info"
    });
    if (!isCategorized) suggestions.push("Group skills into logical ATS groups (Languages, Frameworks, Cloud, Databases).");

    const hasSufficientSkills = totalSkillsCount >= 8;
    checks.push({
      id: "skills_depth",
      name: "Adequate Skills Breadth (8+ skills)",
      category: "skills",
      passed: hasSufficientSkills,
      score: hasSufficientSkills ? 7 : (totalSkillsCount >= 4 ? 4 : 0),
      maxScore: 7,
      feedback: hasSufficientSkills
        ? `Rich technical keywords found (${totalSkillsCount} items).`
        : `Low keyword density (${totalSkillsCount} items).`,
      impact: "warning"
    });

    // --- 5. ATS STRUCTURAL & FORMATTING INTEGRITY (Max: 20) ---
    const textToCheck = rawText || JSON.stringify(resume);

    // ATS rule: No Markdown/HTML tables
    const hasTables = /\|.*\|.*\|/.test(textToCheck) || /<table/i.test(textToCheck);
    checks.push({
      id: "format_no_tables",
      name: "No Tables in Resume Layout",
      category: "formatting",
      passed: !hasTables,
      score: !hasTables ? 5 : 0,
      maxScore: 5,
      feedback: !hasTables ? "Clean single-column flow without tables." : "Tables detected. Tables often confuse ATS text parsers.",
      impact: "critical"
    });
    if (hasTables) suggestions.push("Remove tables and replace with clear standard bullet points.");

    // ATS rule: No multi-column layout markers or complex columns
    const hasColumns = /column|sidebar|two-column|grid-template/i.test(textToCheck);
    checks.push({
      id: "format_no_columns",
      name: "Single-Column Linear Flow",
      category: "formatting",
      passed: !hasColumns,
      score: !hasColumns ? 5 : 0,
      maxScore: 5,
      feedback: !hasColumns ? "Single-column linear structure preserved." : "Potential multi-column layout artifacts detected.",
      impact: "critical"
    });
    if (hasColumns) suggestions.push("Ensure single-column vertical layout for standard ATS document ingestion.");

    // ATS rule: No problematic / replacement characters (e.g.  \uFFFD)
    const hasProblematicChars = /\uFFFD|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(textToCheck);
    checks.push({
      id: "format_clean_characters",
      name: "Clean Standard Encoding",
      category: "formatting",
      passed: !hasProblematicChars,
      score: !hasProblematicChars ? 5 : 0,
      maxScore: 5,
      feedback: !hasProblematicChars ? "Standard UTF-8 character encoding." : "Unrecognized or corrupted characters detected.",
      impact: "warning"
    });
    if (hasProblematicChars) suggestions.push("Clean non-standard or corrupted symbols from the original text.");

    // ATS rule: No graphics or image tags in text flow
    const hasImages = /!\[.*?\]\(.*?\)|<img/i.test(textToCheck);
    checks.push({
      id: "format_no_images",
      name: "No Image / Icon Artifacts",
      category: "formatting",
      passed: !hasImages,
      score: !hasImages ? 5 : 0,
      maxScore: 5,
      feedback: !hasImages ? "Text-only representation verified." : "Image/icon references found in content.",
      impact: "warning"
    });
    if (hasImages) suggestions.push("Avoid embedding profile photos or icons; ATS algorithms cannot parse image text.");

    // Compute total score
    const totalScore = Math.min(100, Math.max(0, checks.reduce((acc, c) => acc + c.score, 0)));
    const maxScore = 100;

    let level: "Poor" | "Needs Improvement" | "Good" | "Excellent" = "Poor";
    if (totalScore >= ATS_SCORE_LEVELS.EXCELLENT.min) {
      level = "Excellent";
    } else if (totalScore >= ATS_SCORE_LEVELS.GOOD.min) {
      level = "Good";
    } else if (totalScore >= ATS_SCORE_LEVELS.NEEDS_IMPROVEMENT.min) {
      level = "Needs Improvement";
    }

    const passedCount = checks.filter((c) => c.passed).length;

    return {
      score: totalScore,
      maxScore,
      level,
      checks,
      passedCount,
      totalCount: checks.length,
      suggestions,
      metrics: {
        totalExperiences: resume.experience.length,
        totalSkills: totalSkillsCount,
        actionVerbsFound,
        hasMetrics
      }
    };
  }

  public analyzeRawText(text: string): ATSAnalysisResult {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Extract Name (first line or first H1)
    let candidateName = "";
    const h1Match = text.match(/^#\s+(.+)$/m);
    if (h1Match) {
      candidateName = h1Match[1].replace(/[*_#]/g, "").trim();
    } else if (lines.length > 0) {
      candidateName = lines[0].replace(/[*_#]/g, "").trim();
    }

    // Extract Contact Info
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4}/);
    const linkedinMatch = text.match(/linkedin(?:\.com\/in\/[a-zA-Z0-9_-]+)?/i);
    const githubMatch = text.match(/github(?:\.com\/[a-zA-Z0-9_-]+)?/i);
    const websiteMatch = text.match(/https?:\/\/(?!linkedin|github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|portfolio/i);

    // Detect Location (e.g. "San Francisco, CA", "Seattle, WA", "Sao Paulo, Brazil")
    let detectedLocation = "";
    const locationRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/;
    for (const line of lines.slice(0, 10)) {
      const match = line.match(locationRegex);
      if (match && !match[0].includes("University") && !match[0].includes("College")) {
        detectedLocation = match[0].trim();
        break;
      }
    }

    // Detect Headline
    let headline = "";
    const headlineMatch = text.match(/^\*\*([^*]+)\*\*$/m) || text.match(/^##?\s*(?:Objective|Target Role|Headline)[:\s]+(.+)$/mi);
    if (headlineMatch) {
      headline = headlineMatch[1].trim();
    } else if (lines.length > 1 && !lines[1].includes("@")) {
      headline = lines[1].replace(/[*_#]/g, "").trim();
    }

    // Section split regex that matches both Markdown headers (## SECTION) and plain uppercase headers (SECTION\n)
    const summaryMatch = text.match(/(?:##\s*)?(?:PROFESSIONAL\s+SUMMARY|SUMMARY|RESUMO|ABOUT)[^\n]*\n+([\s\S]*?)(?=(?:##\s*)?(?:TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES|SKILLS|PROFESSIONAL\s+EXPERIENCE|EXPERIENCE|EDUCATION|$))/i);
    let summaryText = "";
    if (summaryMatch) {
      summaryText = summaryMatch[1].trim().replace(/\n+/g, " ");
    } else {
      const generalSummary = text.match(/(?:summary|resumo|perfil)[\s:]+([\s\S]{40,300})/i);
      if (generalSummary) summaryText = generalSummary[1].trim();
    }

    // Detect Skills
    const detectedLanguages: string[] = [];
    const detectedFrameworks: string[] = [];
    const detectedDatabases: string[] = [];
    const detectedCloud: string[] = [];
    const detectedTools: string[] = [];
    const detectedMethodologies: string[] = [];
    const detectedOther: string[] = [];

    const skillsSectionMatch = text.match(/(?:##\s*)?(?:CORE\s+COMPETENCIES(?:[^\n]*)?|TECHNICAL\s+SKILLS|SKILLS|HABILIDADES|COMPETÊNCIAS)[^\n]*\n+([\s\S]*?)(?=(?:##\s*)?(?:PROFESSIONAL\s+EXPERIENCE|EXPERIENCE|EDUCATION|CERTIFICATIONS|$))/i);
    if (skillsSectionMatch) {
      const skillsBody = skillsSectionMatch[1];
      const categoryLines = skillsBody.split("\n").filter((l) => l.trim().length > 0);

      for (const line of categoryLines) {
        const clean = line.replace(/^[*•\-]\s*/, "").trim();
        const parts = clean.split(":");
        const content = parts.length > 1 ? parts.slice(1).join(":") : parts[0];
        const items = content.split(/[,•|/]/).map((i) => i.replace(/[*_]/g, "").trim()).filter((i) => i.length > 1);

        const lowerLine = line.toLowerCase();
        if (lowerLine.includes("language") || lowerLine.includes("linguagen")) {
          detectedLanguages.push(...items);
        } else if (lowerLine.includes("framework") || lowerLine.includes("librar")) {
          detectedFrameworks.push(...items);
        } else if (lowerLine.includes("database") || lowerLine.includes("banco")) {
          detectedDatabases.push(...items);
        } else if (lowerLine.includes("cloud") || lowerLine.includes("infra") || lowerLine.includes("devops")) {
          detectedCloud.push(...items);
        } else if (lowerLine.includes("tool") || lowerLine.includes("ferramenta")) {
          detectedTools.push(...items);
        } else if (lowerLine.includes("methodolog") || lowerLine.includes("metodolog")) {
          detectedMethodologies.push(...items);
        } else {
          detectedOther.push(...items);
        }
      }
    }

    // Detect Experience Bullets & Dates
    const expBullets: string[] = [];
    const expSectionMatch = text.match(/(?:##\s*)?(?:PROFESSIONAL\s+EXPERIENCE|EXPERIENCE|EXPERIÊNCIA|HISTÓRICO)[^\n]*\n+([\s\S]*?)(?=(?:##\s*)?(?:EDUCATION|EDUCAÇÃO|FORMAÇÃO|CERTIFICATIONS|$))/i);
    const rawExp = expSectionMatch ? expSectionMatch[1] : "";
    const hasDatesInExp = /(?:19|20)\d{2}\s*(?:–|-|to|ate)\s*(?:Present|Atual|(?:19|20)\d{2})/i.test(
      rawExp || text
    );

    if (rawExp) {
      const expLines = rawExp.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      for (const l of expLines) {
        // Exclude role/company lines with dates
        if (/(?:19|20)\d{2}/.test(l) && (l.includes("—") || l.includes("|") || l.includes("-"))) {
          continue;
        }
        if (l.startsWith("Technologies:")) {
          continue;
        }
        if (/^[*•\-]\s+/.test(l)) {
          expBullets.push(l.replace(/^[*•\-]\s+/, "").replace(/^\*\*Key Achievement:\*\*\s*/i, "").trim());
        } else if (l.length > 20 && !l.endsWith(":")) {
          // Plain sentence or bullet in PDF
          expBullets.push(l.replace(/^Key Achievement:\s*/i, "").trim());
        }
      }
    } else {
      const allBullets = lines.filter((l) => /^[*•\-]\s+/.test(l));
      for (const b of allBullets) {
        expBullets.push(b.replace(/^[*•\-]\s+/, "").trim());
      }
    }

    // Detect Education
    const hasEducationSection = /(?:##\s*)?(?:EDUCATION|EDUCAÇÃO|FORMAÇÃO)/i.test(text) || /\b(?:bachelor|master|degree|phd|diploma|ensino superior|graduação)\b/i.test(text);

    const mockResume: Resume = {
      personal: {
        name: candidateName || "Candidate Name",
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
        location: detectedLocation,
        linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : "",
        github: githubMatch ? `https://${githubMatch[0]}` : "",
        website: websiteMatch ? websiteMatch[0] : ""
      },
      headline: headline || "Professional",
      summary: summaryText || (lines.length > 2 ? lines.slice(2, 6).join(" ") : ""),
      skills: {
        programmingLanguages: detectedLanguages.length > 0 ? detectedLanguages : (detectedOther.length > 0 ? detectedOther.slice(0, 3) : []),
        frameworks: detectedFrameworks,
        libraries: [],
        databases: detectedDatabases,
        cloud: detectedCloud,
        devops: [],
        tools: detectedTools,
        methodologies: detectedMethodologies,
        other: detectedOther
      },
      experience: expBullets.length > 0
        ? [
            {
              company: "Professional Organization",
              position: headline || "Role",
              location: detectedLocation,
              startDate: hasDatesInExp ? "2020-01" : "2020",
              endDate: "Present",
              isCurrent: true,
              summary: "",
              responsibilities: expBullets.slice(0, 10),
              achievements: expBullets.slice(10),
              technologies: []
            }
          ]
        : [],
      education: hasEducationSection
        ? [
            {
              institution: "Academic Institution",
              degree: "Degree",
              fieldOfStudy: "Field",
              location: detectedLocation,
              startDate: "2014",
              endDate: "2018",
              achievements: []
            }
          ]
        : [],
      certifications: [],
      languages: [],
      projects: []
    };

    return this.analyze(mockResume, text);
  }
}
