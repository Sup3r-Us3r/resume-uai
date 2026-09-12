import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').or(z.string().min(3)),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  github: z.string().optional().default(''),
  website: z.string().optional().default(''),
});

export const SkillCategoriesSchema = z.object({
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  libraries: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  cloud: z.array(z.string()).default([]),
  devops: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  ai: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  other: z.array(z.string()).default([]),
});

export const ExperienceItemSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  location: z.string().optional().default(''),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().default('Present'),
  isCurrent: z.boolean().optional().default(false),
  summary: z.string().optional().default(''),
  responsibilities: z
    .array(z.string())
    .min(1, 'At least one responsibility is required'),
  achievements: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().optional().default(''),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  achievements: z.array(z.string()).default([]),
});

export const CertificationItemSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().optional().default(''),
  expiryDate: z.string().optional().default(''),
  credentialId: z.string().optional().default(''),
  url: z.string().optional().default(''),
});

export const LanguageItemSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  proficiency: z.string().min(1, 'Proficiency is required'),
});

export const ProjectItemSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  role: z.string().optional().default(''),
  technologies: z.array(z.string()).default([]),
  url: z.string().optional().default(''),
  highlights: z.array(z.string()).default([]),
});

export const ResumeSchema = z.object({
  personal: PersonalInfoSchema,
  headline: z.string().min(1, 'Headline is required'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  skills: SkillCategoriesSchema,
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type SkillCategories = z.infer<typeof SkillCategoriesSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type CertificationItem = z.infer<typeof CertificationItemSchema>;
export type LanguageItem = z.infer<typeof LanguageItemSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
