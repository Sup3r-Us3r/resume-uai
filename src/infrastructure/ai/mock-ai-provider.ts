import type {
  AIProvider,
  GenerateResumeOptions
} from "../../application/ports/ai-provider.js";
import type { Resume } from "../../domain/schemas/resume-schema.js";

export class MockAIProvider implements AIProvider {
  private customResume?: Partial<Resume>;

  constructor(customResume?: Partial<Resume>) {
    this.customResume = customResume;
  }

  async generateResume(rawContent: string, options?: GenerateResumeOptions): Promise<Resume> {
    const isPt = options?.lang === "pt";
    const defaultResume: Resume = {
      personal: {
        name: "Alex Rivera",
        email: "alex.rivera@example.com",
        phone: "+1 (555) 349-2041",
        location: "San Francisco, CA",
        linkedin: "https://linkedin.com/in/alexrivera-dev",
        github: "https://github.com/alexrivera",
        website: "https://alexrivera.dev"
      },
      headline: isPt
        ? "Engenheiro de Software Sênior • Sistemas Distribuídos e Arquitetura Cloud"
        : "Senior Software Engineer • Distributed Systems & Cloud Architecture",
      summary:
        "Results-oriented Senior Software Engineer with over 8 years of hands-on experience designing, scaling, and maintaining mission-critical distributed systems. Proven track record of architecting resilient microservices in Node.js and TypeScript, reducing system latency by 35% and enhancing deployment automation across multi-cloud environments.",
      skills: {
        programmingLanguages: ["TypeScript", "JavaScript", "Go", "Python", "SQL"],
        frameworks: ["Node.js", "Express", "Fastify", "NestJS", "React"],
        libraries: ["Zod", "Prisma", "RxJS"],
        databases: ["PostgreSQL", "Redis", "MongoDB", "DynamoDB"],
        cloud: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform"],
        devops: ["CI/CD", "GitHub Actions", "Prometheus", "Grafana"],
        tools: ["Git", "Linux", "Postman", "Jest", "Vitest"],
        ai: ["LangChain", "LangGraph", "Google ADK", "Model Context Protocol (MCP)", "Prompt Engineering"],
        methodologies: ["Agile/Scrum", "TDD", "Domain-Driven Design", "Microservices"],
        other: ["System Architecture", "REST APIs", "GraphQL"]
      },
      experience: [
        {
          company: "CloudScale Technologies",
          position: "Staff Software Engineer",
          location: "San Francisco, CA",
          startDate: "2021-03",
          endDate: "Present",
          isCurrent: true,
          summary: "Lead engineer for the core platform infrastructure team.",
          responsibilities: [
            "Architected and deployed high-throughput event-driven microservices processing 45M daily transactions with 99.99% availability.",
            "Spearheaded the migration of legacy monolithic services to containerized Kubernetes workloads, cutting cloud compute costs by 28%.",
            "Mentored an engineering squad of 8 software engineers, establishing strict code quality standards, automated testing, and CI/CD pipelines."
          ],
          achievements: [
            "Reduced p99 API response times from 340ms to 45ms through distributed Redis caching and query plan optimizations.",
            "Awarded Engineering Excellence Award in 2023 for leading zero-downtime platform database migration."
          ],
          technologies: ["Node.js", "TypeScript", "Go", "Kubernetes", "AWS", "PostgreSQL", "Redis", "Kafka"]
        },
        {
          company: "DataFlow Systems",
          position: "Senior Software Engineer",
          location: "San Jose, CA",
          startDate: "2018-06",
          endDate: "2021-02",
          isCurrent: false,
          summary: "Built data ingestion pipelines and developer tooling.",
          responsibilities: [
            "Engineered distributed ingestion pipelines handling over 10TB of analytics data per day using Node.js and AWS SQS/Lambda.",
            "Implemented end-to-end telemetry and observability with OpenTelemetry, Prometheus, and Grafana across 40+ microservices.",
            "Refactored relational database schemas and queries in PostgreSQL, eliminating bottleneck deadlocks during peak loads."
          ],
          achievements: [
            "Boosted data processing throughput by 65% while reducing server memory footprints by 30%."
          ],
          technologies: ["TypeScript", "Node.js", "AWS", "PostgreSQL", "Docker", "Prometheus"]
        }
      ],
      education: [
        {
          institution: "University of California, Berkeley",
          degree: "Bachelor of Science in Computer Science",
          fieldOfStudy: "Computer Science",
          location: "Berkeley, CA",
          startDate: "2014",
          endDate: "2018",
          achievements: ["Dean's Honors List", "Focus on Distributed Systems and Operating Systems"]
        }
      ],
      certifications: [
        {
          name: "AWS Certified Solutions Architect – Professional",
          issuer: "Amazon Web Services",
          issueDate: "2022-08",
          expiryDate: "2025-08",
          credentialId: "AWS-PSA-94821",
          url: "https://aws.amazon.com/verification"
        },
        {
          name: "Certified Kubernetes Administrator (CKA)",
          issuer: "Cloud Native Computing Foundation",
          issueDate: "2023-01",
          expiryDate: "2026-01",
          credentialId: "CKA-77391",
          url: "https://www.cncf.io/certification/cka/"
        }
      ],
      languages: [
        { language: "English", proficiency: "Native" },
        { language: "Spanish", proficiency: "Professional Working" }
      ],
      projects: [
        {
          name: "OpenStream Orchestrator",
          description: "Open-source lightweight stream processor for real-time telemetry and metrics collection.",
          role: "Creator & Maintainer",
          technologies: ["TypeScript", "Node.js", "Kafka", "Docker"],
          url: "https://github.com/alexrivera/openstream",
          highlights: [
            "Achieved 1,200+ GitHub stars with active community contributors.",
            "Designed pluggable adapter interface supporting Redis Streams, Kafka, and RabbitMQ."
          ]
        }
      ]
    };

    // If custom profile supplied, merge
    if (this.customResume) {
      return {
        ...defaultResume,
        ...this.customResume,
        personal: { ...defaultResume.personal, ...(this.customResume.personal || {}) },
        skills: { ...defaultResume.skills, ...(this.customResume.skills || {}) }
      };
    }

    // Heuristic: If rawContent mentions a specific name or role, adapt headline
    if (rawContent.includes("Product Manager") || rawContent.includes("Gerente de Produto")) {
      return {
        ...defaultResume,
        headline: "Lead Product Manager • B2B SaaS & Growth",
        summary:
          "Strategic Lead Product Manager with 7+ years delivering customer-centric SaaS products from discovery to scale. Proven history driving $12M ARR expansion, leading cross-functional squads of engineers, designers, and marketers.",
        skills: {
          programmingLanguages: ["SQL", "Python"],
          frameworks: [],
          libraries: [],
          databases: ["PostgreSQL", "Snowflake"],
          cloud: ["AWS", "Mixpanel", "Amplitude"],
          devops: ["Jira", "Confluence"],
          tools: ["Figma", "Tableau", "Segment", "Notion"],
          ai: [],
          methodologies: ["Scrum", "Product Discovery", "Dual-Track Agile", "OKR Frameworks"],
          other: ["User Research", "Go-To-Market Strategy", "A/B Testing", "Pricing & Packaging"]
        }
      };
    }

    return defaultResume;
  }
}
