export type {
  Resume,
  PersonalInfo,
  SkillCategories,
  ExperienceItem,
  EducationItem,
  CertificationItem,
  LanguageItem,
  ProjectItem
} from "../schemas/resume-schema.js";

export interface ResumeGenerationOptions {
  outputDir?: string;
  templatePath?: string;
  model?: string;
  jobDescriptionPath?: string;
  verbose?: boolean;
}
