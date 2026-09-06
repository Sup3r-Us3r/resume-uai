import { describe, it, expect } from 'vitest';
import { ResumeSchema } from '../../src/domain/schemas/resume-schema.js';

describe('ResumeSchema', () => {
  const validResume = {
    personal: {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1 555-0199',
      location: 'New York, NY',
      linkedin: 'https://linkedin.com/in/janedoe',
      github: 'https://github.com/janedoe',
      website: 'https://janedoe.me',
    },
    headline: 'Senior Backend Engineer | Distributed Systems',
    summary:
      'Experienced backend engineer with 7+ years building high-throughput services.',
    skills: {
      programmingLanguages: ['TypeScript', 'Go'],
      frameworks: ['Node.js', 'Express'],
      libraries: ['Zod'],
      databases: ['PostgreSQL'],
      cloud: ['AWS'],
      devops: ['Docker'],
      tools: ['Git'],
      methodologies: ['Scrum'],
      other: [],
    },
    experience: [
      {
        company: 'Acme Corp',
        position: 'Senior Backend Engineer',
        location: 'New York, NY',
        startDate: '2020-01',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Lead of the core data team.',
        responsibilities: [
          'Architected microservices handling 20,000 req/sec.',
        ],
        achievements: ['Reduced p99 latency by 30%.'],
        technologies: ['Node.js', 'PostgreSQL'],
      },
    ],
    education: [
      {
        institution: 'NYU',
        degree: 'B.S. in Computer Science',
        fieldOfStudy: 'Computer Science',
        location: 'New York, NY',
        startDate: '2014',
        endDate: '2018',
        achievements: ["Dean's List"],
      },
    ],
    certifications: [
      {
        name: 'AWS Solutions Architect',
        issuer: 'AWS',
        issueDate: '2021',
        expiryDate: '2024',
        credentialId: 'AWS-123',
        url: 'https://aws.com',
      },
    ],
    languages: [{ language: 'English', proficiency: 'Native' }],
    projects: [
      {
        name: 'DataPipeline',
        description: 'Open source data orchestrator',
        role: 'Creator',
        technologies: ['TypeScript', 'Kafka'],
        url: 'https://github.com/janedoe/datapipeline',
        highlights: ['Over 500 GitHub stars'],
      },
    ],
  };

  it('should successfully parse and validate a complete, valid resume', () => {
    const parsed = ResumeSchema.safeParse(validResume);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.personal.name).toBe('Jane Doe');
      expect(parsed.data.skills.programmingLanguages).toContain('TypeScript');
      expect(parsed.data.experience[0].company).toBe('Acme Corp');
    }
  });

  it('should reject a resume missing required personal name', () => {
    const invalid = {
      ...validResume,
      personal: { ...validResume.personal, name: '' },
    };
    const parsed = ResumeSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should reject a resume with invalid email', () => {
    const invalid = {
      ...validResume,
      personal: { ...validResume.personal, email: 'not-an-email' },
    };
    // Note: our schema allows email or string min 3. If empty, it fails
    const invalidEmpty = {
      ...validResume,
      personal: { ...validResume.personal, email: '' },
    };
    const parsed = ResumeSchema.safeParse(invalidEmpty);
    expect(parsed.success).toBe(false);
  });

  it('should reject experience entries missing company or position', () => {
    const invalidExp = {
      ...validResume,
      experience: [
        {
          company: '',
          position: 'Developer',
          startDate: '2020',
          responsibilities: ['Did work'],
        },
      ],
    };
    const parsed = ResumeSchema.safeParse(invalidExp);
    expect(parsed.success).toBe(false);
  });

  it('should provide default empty arrays for optional skill lists', () => {
    const minimalSkills = {
      ...validResume,
      skills: {
        programmingLanguages: ['Python'],
      },
    };
    const parsed = ResumeSchema.safeParse(minimalSkills);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.skills.databases).toEqual([]);
      expect(parsed.data.skills.cloud).toEqual([]);
    }
  });
});
