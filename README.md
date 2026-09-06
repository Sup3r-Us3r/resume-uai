# Resume UAI 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![Google Genkit](https://img.shields.io/badge/Google_Genkit-1.42-orange.svg)](https://firebase.google.com/docs/genkit)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75B2.svg)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-yellow.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready Command-Line Interface (CLI) application built with **Node.js**, **TypeScript**, and **Google Genkit (Gemini API)** that transforms unstructured professional profiles into executive-level, **Applicant Tracking Systems (ATS)**-optimized resumes exported to **Markdown (.md)** and **searchable vector PDF (.pdf)**.

---

## ✨ Features

- **Multi-Format Input Ingestion**: Seamlessly extracts and normalizes text from `.txt`, `.md`, and `.pdf` files.
- **Native Bilingual Support (PT / EN)**: Generate ATS resumes in Brazilian Portuguese (`pt`, default) or English (`en`) via the `--lang` flag.
- **Google Genkit & Gemini Integration**: Powered by `@genkit-ai/google-genai` using `gemini-3.5-flash-lite` with automatic fallback to `gemini-3.5-flash` and exponential retry on rate limits (503 / spikes).
- **Strict Anti-Hallucination Guarantee**: Rigorous zero-hallucination prompt constraints ensure that all companies, dates, metrics, titles, and credentials strictly originate from the candidate's input.
- **Type-Safe Structured Output**: Validates AI-generated responses against a comprehensive Zod schema (`ResumeSchema`).
- **Deterministic ATS Compliance Engine**: Analyzes section integrity, contact info, action verbs, measurable metrics, and single-column hygiene while flagging ATS-hostile elements (tables, columns, graphics).
- **Internal ATS Diagnostic Scoring**: Computes a transparent 0–100 benchmark score (*Poor*, *Needs Improvement*, *Good*, *Excellent*) with actionable feedback.
- **High-Fidelity Document Generation**:
  - Clean, single-column **Markdown** formatted for ATS parsers and human recruiters.
  - Pixel-perfect, selectable vector **PDF** rendered via print-styled headless Chromium (Puppeteer).
- **Job Description Keyword Alignment**: Cross-reference target job descriptions to highlight and prioritize relevant skills and experiences.
- **Offline & Testing Friendly**: Includes a deterministic `MockAIProvider` (`--mock`) for offline use and testing without consuming API credits.

---

## 🏗️ Architecture

The project is structured according to **Clean Architecture** and **SOLID** principles, ensuring modularity, dependency inversion, and strict separation of concerns:

```text
┌────────────────────────────────────────────────────────┐
│                        CLI                             │
│       (Commander, CLI Options, Progress Spinners)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Application                         │
│           (Use Cases, Interfaces / Ports)              │
│  GenerateResume • ExtractResumeContent • ValidateResume│
└──────────────┬────────────────────────────┬────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│           Domain             │ │    Infrastructure     │
│  ResumeSchema (Zod)          │ │  GenkitProvider       │
│  Resume Entities             │ │  Parsers (PDF/MD/TXT) │
│  ATSAnalyzer (Scoring/Rules) │ │  Renderers (MD/PDF)   │
└──────────────────────────────┘ └───────────────────────┘
```

- **CLI Layer (`src/cli`)**: Parses user arguments, coordinates progress feedback with spinners, displays formatted diagnostic scorecards, and handles CLI errors gracefully.
- **Application Layer (`src/application`)**: Orchestrates the resume lifecycle via use cases (`GenerateResume`, `ExtractResumeContent`, `ValidateResume`) and defines abstraction ports (`AIProvider`, `FileParser`, `ResumeRenderer`).
- **Domain Layer (`src/domain`)**: Core business entities, the Zod `ResumeSchema`, and the deterministic `ATSAnalyzer` service.
- **Infrastructure Layer (`src/infrastructure`)**: Implements ports: Google Genkit provider (`GenkitProvider`), file extractors (`PdfParser`, `MarkdownParser`, `TextParser`), renderers (`MarkdownRenderer`, `PdfRenderer` via Puppeteer), and filesystem writers.
- **Shared Layer (`src/shared`)**: Domain errors (`AppError`), ATS constants, action verb dictionaries (PT & EN), and terminal utilities.

---

## 📋 Requirements

- **Node.js**: `v20.0.0` or later (tested on Node.js 22 and 25).
- **npm**: `v10.0.0` or later.
- **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Sup3r-Us3r/resume-uai.git
cd resume-uai
npm install
```

Build the TypeScript distribution:

```bash
npm run build
```

---

## ⚙️ Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure your `.env` file:

```env
# Google Gemini API Key (Required for live generation)
GEMINI_API_KEY=AIzaSy...

# Primary Gemini Model (Optional, defaults to gemini-3.5-flash-lite)
GEMINI_MODEL=gemini-3.5-flash-lite

# Fallback Gemini Model on high demand/retry (Optional, defaults to gemini-3.5-flash)
GEMINI_FALLBACK_MODEL=gemini-3.5-flash

# Default Resume Language: pt | en (Optional, defaults to pt)
DEFAULT_LANG=pt

# Logging verbosity: debug | info | warn | error
LOG_LEVEL=info
```

---

## 💻 Usage

### 1. Generating an ATS-Optimized Resume

Transform a profile into optimized Markdown and PDF:

```bash
# In Portuguese (default)
npm run dev -- generate ./examples/backend-engineer.md

# In English
npm run dev -- generate ./examples/senior-software-engineer.md --lang en

# Or using the built binary
node dist/cli/index.js generate ./examples/senior-software-engineer.md --lang en
```

#### CLI Options:

```bash
Options:
  -o, --output <dir>       Output directory for generated files (default: "./output")
  -t, --template <path>    Path to a custom Markdown template (default: "./templates/ats-standard.md")
  -m, --model <model>      Gemini model to use (default: env GEMINI_MODEL or "gemini-3.5-flash-lite")
  -j, --job <path>         Target Job Description file for keyword alignment
  -l, --lang <lang>        Target language: pt | en (default: env DEFAULT_LANG or "pt")
  --mock                   Use deterministic Mock AI provider (offline / demo mode)
  -v, --verbose            Display detailed debug logs and stack traces
  -h, --help               Display command help
```

#### Practical Examples:

```bash
# Generate in Portuguese to a custom directory
npm run dev -- generate ./examples/backend-engineer.md -o ./my-resumes -l pt

# Generate in English aligning with a job description
npm run dev -- generate ./examples/senior-software-engineer.md --job ./examples/job-description.txt --lang en

# Run offline with the mock AI provider (no API key required)
npm run dev -- generate ./examples/product-manager.md --mock
```

---

### 2. Validating an Existing Resume

Analyze any existing `.md`, `.pdf`, or `.txt` resume against ATS rules:

```bash
npm run dev -- validate ./output/resume.md
```

Example diagnostic output:

```text
┌────────────────────────────────────────────────────────┐
│  ATS Diagnostics Summary                               │
├────────────────────────────────────────────────────────┤
│  File Analyzed:  ./output/resume.md                    │
│  Overall Score:  94/100 (Excellent)                    │
│  Passed Checks:  14 of 14                              │
│  Extracted Text: 3412 characters                       │
└────────────────────────────────────────────────────────┘

Detailed Check Results:
  ✔ Full Name Identified [4/4 pts]
  ✔ Valid Email Address [4/4 pts]
  ✔ Phone Number [3/3 pts]
  ✔ Location / Geographic Area [2/2 pts]
  ✔ Professional Profile Links [2/2 pts]
  ✔ Professional Headline / Target Role [5/5 pts]
  ✔ Professional Summary [5/5 pts]
  ✔ Work Experience Section [6/6 pts]
  ✔ Skills Section (Min 5 skills) [5/5 pts]
  ✔ Education Section [4/4 pts]
  ✔ Strong Action Verbs in Experience Bullets [10/10 pts]
  ✔ Quantifiable Results & Metrics [8/8 pts]
  ✔ Complete Employment Dates [7/7 pts]
  ✔ Semantic Skills Categorization [8/8 pts]
  ✔ No Tables in Resume Layout [5/5 pts]
  ✔ Single-Column Linear Flow [5/5 pts]
  ✔ Clean Standard Encoding [5/5 pts]
  ✔ No Image / Icon Artifacts [5/5 pts]
```

---

## 📂 Input Formats

The application accepts three primary file types:

1. **`.txt` (Plain Text)**: Read directly with whitespace and line-break normalization. Ideal for quick exports from text editors or notes.
2. **`.md` (Markdown)**: Parses markdown documents, preserving section headers, bullet lists, and links.
3. **`.pdf` (Portable Document Format)**: Extracts raw selectable text using `pdf-parse`. If the PDF consists solely of scanned images with no selectable text, an explicit `EmptyFileError` is thrown alerting the user.

---

## 🎯 ATS Strategy

Applicant Tracking Systems are automated parsers designed to ingest, categorize, and rank candidate resumes. Most candidate rejections occur due to formatting parsing errors rather than candidate qualification deficiencies.

This application enforces:

1. **Single-Column Linear Model**: No sidebars, tables, or complex CSS flex grids that scramble the parser's reading order.
2. **Standard Section Headers**: Uses universally recognized headings (`PROFESSIONAL SUMMARY` / `RESUMO PROFISSIONAL`, `TECHNICAL SKILLS` / `HABILIDADES TÉCNICAS`, `PROFESSIONAL EXPERIENCE` / `EXPERIÊNCIA PROFISSIONAL`, `EDUCATION` / `FORMAÇÃO ACADÊMICA`, `CERTIFICATIONS` / `CERTIFICAÇÕES`).
3. **Semantic Skills Categorization**: Groups skills logically into Languages, Frameworks, Databases, Cloud & Infrastructure, Tools, and Methodologies so search algorithms can match specific criteria.
4. **Action-Verb Driven Bullet Points**: Formats experience statements starting with strong past-tense action verbs (*Architected*, *Desenvolveu*, *Engineered*, *Liderou*, *Reduced*, *Otimizou*).
5. **Standardized Dates**: Ensures employment dates are clear and consistently formatted (`YYYY-MM` or `YYYY`).
6. **Zero Graphic Obstacles**: No icons, avatars, background patterns, or emojis that could corrupt character tokenization.

---

## 🧠 AI Strategy & Reliability

The AI model acts as a precision **Executive Resume Writer & ATS Specialist**.

Instead of uncoordinated multi-turn chats, the application executes **one primary structured inference call** per resume:

1. The raw text and optional target job description are embedded into an explicit system prompt.
2. Google Genkit is invoked with structured JSON schema output enforcement.
3. Gemini interprets the candidate's career trajectory, normalizes inconsistent dates, eliminates verbal fluff, strengthens bullet points, and categorizes competencies.
4. **Smart Retry & Fallback**: If the primary model (`gemini-3.5-flash-lite`) encounters temporary high demand (503), the engine retries with exponential backoff and automatically switches to the fallback model (`gemini-3.5-flash`).
5. The output is validated against `ResumeSchema` using Zod.

---

## 🛡️ Anti-Hallucination Guarantee

A core tenet of this system is **absolute factual fidelity**:

> **Rule:** The AI must NEVER invent companies, titles, degrees, dates, metrics, percentages, dollar amounts, team sizes, project scopes, clients, or responsibilities.

### What the AI is allowed to do:
- Rephrase passive descriptions into active voice.
- Fix grammar, typos, and awkward phrasing in the chosen language (Portuguese or English).
- Group technologies into clean semantic categories.
- Condense repetitive entries into concise, impact-oriented bullet points.

### What the AI is strictly prohibited from doing:
- If a candidate writes: *"Built APIs with Node.js."*, the model will refine this to: *"Developed backend APIs using Node.js."*
- The model will **NEVER** fabricate: *"Architected high-scale microservices processing 10 million daily requests."*
- If a section (e.g., Certifications or Phone) is absent in the input, the output leaves it empty. It will never generate fictitious placeholders.

---

## 📤 Output

Every generation run produces two artifacts in the designated output folder (default `./output/`):

1. **`resume.md`**: Clean, single-column Markdown file formatted for ATS parsers and human recruiters.
2. **`resume.pdf`**: Print-styled, vector PDF generated through headless Chromium (Puppeteer). All text is 100% selectable and searchable, with standardized A4 margins and accessible typography.

---

## 📁 Examples & Templates

- **Examples**:
  - [`examples/senior-software-engineer.md`](examples/senior-software-engineer.md): Staff/Senior engineer specializing in Go, distributed systems, Kafka, and Kubernetes.
  - [`examples/backend-engineer.md`](examples/backend-engineer.md): Senior backend developer profile focusing on TypeScript, Node.js, NestJS, and PostgreSQL.
  - [`examples/product-manager.md`](examples/product-manager.md): Director of Product Management demonstrating that the engine accommodates non-engineering career paths.
  - [`examples/job-description.txt`](examples/job-description.txt): Sample job description for keyword alignment testing.
- **Templates**:
  - [`templates/ats-standard.md`](templates/ats-standard.md): The default ATS-compliant template. Custom templates can be passed via the `--template <path>` option.

---

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for comprehensive unit and integration testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage includes:
- **`parsers.test.ts`**: Verifies text extraction from `.txt`, `.md`, and `.pdf`, file existence guards, and unsupported format detection.
- **`schema.test.ts`**: Tests `ResumeSchema` validation, required fields, and default values.
- **`ats-analyzer.test.ts`**: Tests deterministic scoring, action verb detection, metrics recognition, table violations, and raw text diagnostics.
- **`markdown-renderer.test.ts`**: Validates markdown formatting, absence of tables, bilingual headers, and template hydration.
- **`pipeline.test.ts`**: End-to-end integration test validating the entire pipeline in both English and Portuguese (`file -> extraction -> mock AI -> schema -> ATS analyzer -> markdown -> PDF`).

---

## 📁 Project Structure

```text
resume-uai/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── generate.ts          # 'generate <file>' command handler
│   │   │   └── validate.ts          # 'validate <file>' command handler
│   │   ├── cli.ts                   # Commander CLI setup
│   │   └── index.ts                 # CLI executable entry point
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── generate-resume.ts         # Main pipeline orchestrator
│   │   │   ├── extract-resume-content.ts  # File text extraction orchestrator
│   │   │   └── validate-resume.ts         # ATS validation orchestrator
│   │   └── ports/
│   │       ├── ai-provider.ts       # AI Provider abstraction interface & types
│   │       ├── file-parser.ts       # File parser port
│   │       └── resume-renderer.ts   # Output renderer port
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   └── resume.ts            # Domain types and interfaces
│   │   ├── schemas/
│   │   │   └── resume-schema.ts     # Zod schema definitions
│   │   └── services/
│   │       └── ats-analyzer.ts      # Deterministic ATS analyzer & scoring
│   │
│   ├── infrastructure/
│   │   ├── ai/
│   │   │   ├── genkit-provider.ts   # Google Genkit implementation with fallback & retry
│   │   │   ├── gemini-provider.ts   # Backward-compatible GeminiProvider wrapper
│   │   │   ├── mock-ai-provider.ts  # Offline deterministic mock provider
│   │   │   └── prompts/
│   │   │       └── resume-optimization.ts # Anti-hallucination & bilingual prompt definitions
│   │   ├── parsers/
│   │   │   ├── file-parser-factory.ts # Extension-to-parser factory
│   │   │   ├── text-parser.ts       # .txt parser
│   │   │   ├── markdown-parser.ts   # .md parser
│   │   │   └── pdf-parser.ts        # .pdf parser
│   │   ├── renderers/
│   │   │   ├── markdown-renderer.ts # Template-based Markdown generator (PT/EN)
│   │   │   └── pdf-renderer.ts      # Headless Chromium PDF generator (PT/EN)
│   │   ├── filesystem/
│   │   │   └── file-writer.ts       # Safe filesystem operations
│   │   └── config/
│   │       └── env.ts               # Validated environment configuration
│   │
│   └── shared/
│       ├── errors/
│       │   └── app-error.ts         # Custom domain & operational errors
│       ├── constants/
│       │   └── ats.ts               # Action verbs (PT/EN), scoring thresholds, sections
│       └── utils/
│           └── logger.ts            # Formatted terminal logger with spinners
│
├── templates/
│   └── ats-standard.md              # Default ATS markdown template
├── examples/
│   ├── senior-software-engineer.md  # Tech lead sample (EN)
│   ├── backend-engineer.md          # Backend engineer sample (PT/EN)
│   ├── product-manager.md           # Product manager sample
│   └── job-description.txt          # Sample job description for alignment
├── tests/
│   ├── unit/
│   │   ├── parsers.test.ts
│   │   ├── schema.test.ts
│   │   ├── ats-analyzer.test.ts
│   │   └── markdown-renderer.test.ts
│   └── integration/
│       └── pipeline.test.ts         # End-to-end integration tests (PT & EN)
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## ⚠️ Limitations

> [!NOTE]
> **Important Note Regarding ATS Scores**:
> There is **no universal, standard ATS scoring algorithm** used across the recruitment industry. Different applicant tracking software (Workday, Greenhouse, Lever, Taleo, iCIMS, Ashby) use varying parsers, heuristics, and search indexing techniques.
>
> The score generated by this application (0–100) is an **internal structural and semantic compliance benchmark**. It evaluates document readability, single-column integrity, presence of key sections, action verb usage, and absence of parsing roadblocks. Achieving a score of 95+ guarantees your document is structured according to best practices, but does not guarantee interview shortlisting by any third-party ATS.

---

## 🔮 Future Improvements

- [ ] **Interactive CLI Wizard (`resume-uai init`)**: Guided terminal prompts to construct a profile interactively.
- [ ] **Alternative LLM Providers**: Add `AnthropicProvider` and `OpenAIProvider` implementations without modifying existing use cases.
- [ ] **Job Description Gap Analysis**: Detailed visual diff highlighting skills present in a job description that are missing from the resume.
- [ ] **Multiple Curated Templates**: Modern Minimalist, Executive Academic, and Compact 1-Page layouts.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
