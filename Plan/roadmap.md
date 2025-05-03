# One-Month Software Development Roadmap: Question Bank System

## 1. Introduction

This document outlines a proposed one-month (4-week) development roadmap for the Question Bank Management System, designed for an IT graduation thesis. It assumes the frontend is largely complete, the database schema improvements proposed in `database_improvement_proposal.md` are adopted, and development focuses primarily on the backend, integration, and core features. The roadmap prioritizes delivering a stable, technically in-depth application suitable for demonstration and defense.

**Assumptions:**

*   Developer(s) have foundational knowledge of the core technologies (TypeScript, Node.js, SQL) and are ready to learn the specifics outlined in `technologies_to_study.md`.
*   Access to necessary resources (AWS account, Gemini API keys, development environment) is available.
*   The one-month period is dedicated development time.
*   Focus is on backend implementation and integration with existing frontend components.

## 2. Guiding Principles

*   **Iterative Development:** Build features incrementally, focusing on core functionality first.
*   **Test-Driven Approach (Recommended):** Write unit and integration tests alongside feature development to ensure stability.
*   **Prioritization:** Focus on features demonstrating technical depth (AI, Search, PDF Processing, Security) as required by the thesis.
*   **Modularity:** Design components (services, modules) with clear responsibilities for maintainability.
*   **Documentation:** Maintain clear code comments and potentially API documentation (e.g., using Swagger/OpenAPI with NestJS).

## 3. Weekly Breakdown

### Week 1: Foundation and Core Backend Setup

*   **Goal:** Establish the backend project structure, implement the improved database schema, set up core authentication/authorization, and build basic CRUD operations for key entities.
*   **Tasks:**
    *   **Project Setup:** Initialize NestJS project, configure environment variables, set up linters/formatters.
    *   **Database Migration:** Implement the improved database schema using TypeORM migrations. Create initial seed data (e.g., default roles, permissions, admin user).
    *   **Core Entities & CRUD:** Implement NestJS modules, services, controllers, and DTOs (Data Transfer Objects with validation using `class-validator`) for core entities: `Users`, `Roles`, `Permissions`, `Departments`, `Subjects`, `Sections` (`Phan`). Implement basic CRUD API endpoints.
    *   **Authentication:** Implement JWT-based authentication using Passport.js (`passport-jwt`, `passport-local`). Create login/registration endpoints.
    *   **Authorization (RBAC Setup):** Implement basic RBAC using NestJS Guards. Define core roles (Admin, Teacher/Contributor) and assign initial permissions based on the new schema (`UserRoles`, `RolePermissions`). Protect initial CRUD endpoints based on roles.
    *   **Initial Testing:** Write unit tests for services and controllers related to authentication and core CRUD operations.
*   **Deliverables:**
    *   Functional NestJS backend project structure.
    *   Database schema implemented via migrations.
    *   Working authentication (login/JWT generation).
    *   Basic RBAC protecting core CRUD endpoints.
    *   Unit tests for implemented features.
*   **Technologies to Focus On:** NestJS (Modules, Services, Controllers, Pipes, Guards), TypeORM (Migrations, Repositories), SQL Server, JWT, Passport.js, `class-validator`, Jest.

### Week 2: Question Management and PDF Processing Pipeline

*   **Goal:** Implement full CRUD for questions and answers, integrate PDF handling via AWS, and set up basic messaging.
*   **Tasks:**
    *   **Question/Answer CRUD:** Implement NestJS modules/services/controllers for `Questions`, `Answers`, `Tags`, `CLOs`, including relationships (e.g., linking questions to sections, tags, CLOs; answers to questions).
    *   **Hierarchical Questions:** Implement logic to handle parent-child question relationships (`MaCauHoiCha`).
    *   **File Upload Setup (S3):** Configure AWS SDK. Implement file upload endpoint (potentially using pre-signed URLs for direct browser upload to S3) for attaching files/images to questions.
    *   **PDF Processing Pipeline (Lambda, Textract):**
        *   Set up S3 event notification to trigger a Lambda function upon PDF upload.
        *   Develop Lambda function (Node.js) to call AWS Textract for document analysis.
        *   Implement logic within Lambda (or a dedicated NestJS service triggered by Lambda) to parse Textract results and attempt to structure extracted text into potential questions/answers.
        *   Update question status/content based on processing results.
    *   **Messaging (Kafka/Redis Decision & Setup):**
        *   Finalize choice between Kafka and Redis Pub/Sub based on robustness needs vs. simplicity.
        *   Set up the chosen system (local Docker instance or cloud service).
        *   Integrate the chosen messaging client into NestJS.
        *   Implement basic event publishing (e.g., `PDF_UPLOADED`, `QUESTION_CREATED`). Potentially use messaging to decouple Lambda from the main backend for result processing.
    *   **Testing:** Write unit/integration tests for Question/Answer CRUD and basic PDF upload trigger.
*   **Deliverables:**
    *   Full CRUD API for Questions, Answers, Tags, CLOs.
    *   Working file upload to S3.
    *   Basic PDF processing pipeline triggered by S3 upload (Lambda + Textract integration).
    *   Chosen messaging system integrated and basic events published.
    *   Tests for new features.
*   **Technologies to Focus On:** NestJS, TypeORM, AWS SDK (S3, Lambda, Textract), AWS Lambda (Node.js), Kafka or Redis Pub/Sub, Jest.

### Week 3: AI Integration and Search Implementation

*   **Goal:** Integrate Gemini for AI question generation and Qdrant for advanced search capabilities.
*   **Tasks:**
    *   **AI Generation Service (Gemini):**
        *   Develop a dedicated NestJS service/module to interact with the Gemini API.
        *   Implement prompt engineering logic based on user inputs (CLOs, difficulty, topic).
        *   Create API endpoint(s) for users to trigger AI question generation.
        *   Implement the workflow: generate -> parse response -> allow user review/edit -> save approved question (updating `isAIGenerated`, `reviewStatus`, etc.).
    *   **Vector Embeddings:** Choose an embedding model. Implement logic (potentially within the AI service or a separate indexing service) to generate embeddings for question content.
    *   **Search Integration (Qdrant):**
        *   Set up Qdrant (local Docker instance or cloud service).
        *   Integrate Qdrant client into NestJS.
        *   Implement indexing logic: When questions are created/updated, generate embeddings and index them along with relevant metadata (payloads) in Qdrant.
        *   Develop search API endpoint(s) in NestJS that query Qdrant (using vector similarity search and metadata filtering for hybrid search).
    *   **Refine PDF Processing:** Improve the parsing logic for Textract output based on testing with various PDF formats. Handle potential errors gracefully.
    *   **Testing:** Write integration tests for AI generation workflow and search functionality.
*   **Deliverables:**
    *   Working AI question generation feature using Gemini.
    *   Questions indexed in Qdrant upon creation/update.
    *   Functional search API leveraging Qdrant for semantic/hybrid search.
    *   Improved PDF processing logic.
    *   Integration tests for AI and Search.
*   **Technologies to Focus On:** NestJS, Gemini API, Qdrant Client, Vector Embedding Models, Prompt Engineering techniques, Jest.

### Week 4: Export, Monitoring, Security Hardening & Refinement

*   **Goal:** Implement the exam export feature, set up basic monitoring, enhance security, perform thorough testing, and refine the application.
*   **Tasks:**
    *   **Export Engine:**
        *   Define the export file format (JSON recommended).
        *   Develop a NestJS service to gather exam/question data based on specified criteria (e.g., selected questions, auto-generated exam based on parameters).
        *   Implement logic to format data into the defined structure and provide it as a downloadable file.
    *   **Monitoring Setup (Prometheus & Grafana):**
        *   Instrument the NestJS application using `prom-client` to expose key metrics (request latency, error rates, DB query times, queue size if applicable).
        *   Set up Prometheus to scrape the metrics endpoint.
        *   Set up Grafana, connect to Prometheus, and create a basic dashboard visualizing application health.
    *   **Security Hardening:**
        *   Review and refine RBAC rules. Ensure all endpoints have appropriate guards.
        *   Implement input validation thoroughly across all API endpoints.
        *   Add security headers using Helmet.
        *   Configure CORS properly.
        *   Implement basic rate limiting.
        *   Set up Audit Logging: Integrate a logging mechanism (e.g., using messaging or directly writing to the `AuditLogs` table) for critical actions.
    *   **Testing & Bug Fixing:** Conduct thorough integration testing across all features. Perform manual testing focusing on user workflows. Fix identified bugs.
    *   **Documentation Review:** Update README, add API documentation (Swagger), ensure code comments are clear.
    *   **Thesis Preparation:** Prepare documentation and presentation materials for the thesis defense.
*   **Deliverables:**
    *   Functional exam/question export feature.
    *   Basic monitoring setup with Prometheus and Grafana dashboard.
    *   Hardened security measures (RBAC, validation, headers, rate limiting, audit logs).
    *   Comprehensive test suite (unit & integration).
    *   Bug fixes and overall application refinement.
    *   Updated project documentation.
*   **Technologies to Focus On:** NestJS, Prometheus (`prom-client`), Grafana, Helmet, `class-validator`, Jest, Documentation tools.

## 4. Buffer and Contingency

This roadmap is ambitious for one month. It's crucial to allocate buffer time within each week (e.g., half a day) or reserve the last few days of Week 4 specifically for unexpected issues, debugging, and final polishing. If certain features prove too complex, prioritize the core requirements and those demonstrating the most technical depth for the thesis.

## 5. Conclusion

Following this roadmap provides a structured approach to developing a comprehensive and technically sound Question Bank Management System within a one-month timeframe. Consistent effort, adherence to best practices, and proactive problem-solving will be key to success. Remember to frequently commit code, test thoroughly, and document progress.
