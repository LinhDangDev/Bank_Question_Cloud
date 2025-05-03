# Project Timeline and Milestones (One Month)

This document provides a detailed timeline with specific milestones for the one-month development roadmap outlined in `roadmap.md`. Each milestone represents a key deliverable or capability checkpoint, ensuring progress is measurable and aligned with the thesis goals.

## Week 1: Foundation and Core Backend

*   **Goal:** Establish a functional backend structure with core entity management and secure authentication/authorization.
*   **Timeline:** Day 1 - Day 7
*   **Milestones:**
    *   **Milestone 1.1 (Day 2):** NestJS project initialized, configured, and basic structure established. Version control (Git) set up.
    *   **Milestone 1.2 (Day 4):** Database schema implemented using TypeORM migrations. Initial seed data (roles, permissions, admin user) populated.
    *   **Milestone 1.3 (Day 6):** Core CRUD API endpoints for `Users`, `Roles`, `Permissions`, `Departments`, `Subjects`, `Sections` are functional and tested (unit tests).
    *   **Milestone 1.4 (Day 7):** JWT authentication (login, token generation/validation) is implemented and working. Basic RBAC guards are applied to core endpoints, protecting them based on user roles.

## Week 2: Question Management & PDF Processing

*   **Goal:** Enable full question lifecycle management and integrate the initial PDF-to-question processing pipeline.
*   **Timeline:** Day 8 - Day 14
*   **Milestones:**
    *   **Milestone 2.1 (Day 9):** Full CRUD API endpoints for `Questions`, `Answers`, `Tags`, `CLOs` are functional, including handling relationships and hierarchical questions. Unit tests completed.
    *   **Milestone 2.2 (Day 11):** File upload functionality to AWS S3 is implemented and integrated (e.g., attaching images to questions).
    *   **Milestone 2.3 (Day 13):** Basic PDF processing pipeline is operational: S3 upload triggers Lambda, Lambda calls Textract, basic parsing logic attempts to create draft questions. Chosen messaging system (Kafka/Redis) integrated for basic event notification (e.g., `PDF_UPLOADED`).
    *   **Milestone 2.4 (Day 14):** Integration points between frontend and new backend APIs (CRUD, file upload) are identified and potentially tested if frontend developers are available.

## Week 3: AI Integration & Search

*   **Goal:** Implement AI-driven question generation and advanced search capabilities, demonstrating key technical depth.
*   **Timeline:** Day 15 - Day 21
*   **Milestones:**
    *   **Milestone 3.1 (Day 17):** Gemini API integration is complete. A dedicated NestJS service handles prompt generation, API calls, and response parsing. API endpoint allows triggering generation.
    *   **Milestone 3.2 (Day 18):** AI question generation workflow is functional: generate -> review -> approve/reject -> save to DB with appropriate status flags.
    *   **Milestone 3.3 (Day 20):** Qdrant integration is complete. Questions (embeddings + metadata) are automatically indexed upon creation/update. Vector embedding generation is implemented.
    *   **Milestone 3.4 (Day 21):** Search API endpoint is functional, performing hybrid searches (vector + keyword filtering) via Qdrant and returning relevant results. Integration tests for AI generation and search are passing.

## Week 4: Export, Monitoring, Security & Refinement

*   **Goal:** Deliver the export feature, implement monitoring, harden security, and ensure overall application stability and polish.
*   **Timeline:** Day 22 - Day 28 (with Day 29-30 as buffer/thesis prep)
*   **Milestones:**
    *   **Milestone 4.1 (Day 23):** Exam/Question export engine is functional, generating downloadable files (JSON format) based on user criteria.
    *   **Milestone 4.2 (Day 25):** Basic monitoring is set up: NestJS application exposes metrics via `prom-client`, Prometheus scrapes metrics, and a basic Grafana dashboard visualizes key health indicators.
    *   **Milestone 4.3 (Day 27):** Security hardening measures implemented: RBAC rules reviewed/refined, input validation applied thoroughly, Helmet headers added, CORS configured, basic rate limiting active, critical actions logged to `AuditLogs` table.
    *   **Milestone 4.4 (Day 28):** Comprehensive testing (unit, integration, manual workflow testing) completed. Major bugs fixed. Code reviewed and documentation (README, API docs) updated.
    *   **Final Milestone (Day 28-30):** Application is stable and feature-complete according to the roadmap. Ready for thesis demonstration and defense preparation. Buffer days used for final fixes, deployment practice, and documentation polish.

This timeline provides clear checkpoints throughout the month. Regular review of progress against these milestones is recommended to ensure the project stays on track.
