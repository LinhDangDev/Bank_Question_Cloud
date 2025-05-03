# Technologies and Areas for Study

Based on the project requirements and the specified technology stack, the following areas require focused study and understanding for successful implementation within the one-month timeframe:

## 1. Backend Development (NestJS)

*   **Core Concepts:** Deep dive into NestJS modules, controllers, services, providers, dependency injection, and lifecycle events.
*   **API Design:** Best practices for designing RESTful APIs (or GraphQL if chosen) for managing questions, users, roles, exams, etc. Focus on clear endpoints, request/response structures, and versioning.
*   **Database Integration:** Using TypeORM (or another preferred ORM) effectively with SQL Server. Understand migrations, repositories, complex queries, and transaction management.
*   **Asynchronous Operations:** Handling asynchronous tasks like PDF processing, AI generation, and potentially Kafka message consumption using techniques like async/await, Promises, and potentially NestJS queues or workers.

## 2. Database (SQL Server)

*   **Schema Design & Normalization:** Review and refine the existing schema (`Bankquestion Offical.sql`) based on application features. Ensure proper normalization and relationships.
*   **Indexing Strategies:** Learn about different index types (clustered, non-clustered, covering, filtered) and how to apply them effectively to optimize query performance for searching, filtering, and joining question data.
*   **Query Optimization:** Analyze query execution plans, identify bottlenecks, and rewrite queries for better performance, especially for large datasets.
*   **Scalability Concepts:** Understand basic concepts of read replicas and potentially sharding, even if full implementation is out of scope for one month. Focus on designing the schema with scalability in mind.
*   **Security:** Implementing Transparent Data Encryption (TDE) if required, and ensuring secure connections (SSL/TLS).

## 3. AI Integration (Gemini)

*   **Gemini API:** Study the official documentation for the Gemini API, including authentication methods, available models, request parameters (especially for controlling output format and constraints), response handling, and error codes.
*   **Prompt Engineering:** Develop effective prompts to guide Gemini in generating questions that adhere to specific Course Learning Outcomes (CLOs), difficulty levels, and question types.
*   **Integration Pattern:** Design and implement an adapter or service layer within NestJS to encapsulate Gemini API calls, making it potentially swappable with other LLMs in the future.
*   **Workflow:** Define the workflow for AI question generation: user input -> prompt creation -> API call -> response parsing -> validation/review -> saving to database.

## 4. Search (Qdrant)

*   **Vector Embeddings:** Understand what vector embeddings are and how they represent text data for semantic search. Choose and integrate an embedding model (could be from Gemini or a dedicated model like Sentence-BERT).
*   **Qdrant Fundamentals:** Learn Qdrant's core concepts: collections, points (vectors + payloads), search methods (similarity search), and filtering.
*   **Client Integration:** Use the official Qdrant client library (e.g., for TypeScript/JavaScript) within the NestJS backend to index questions (both embeddings and metadata) and perform hybrid searches (combining vector similarity with keyword filters based on metadata like category, tags, CLOs).
*   **Indexing Strategy:** Implement the planned strategy: indexing embeddings in a dense collection and metadata/keywords in a sparse collection (or using Qdrant's payload indexing and filtering capabilities for hybrid search).

## 5. PDF & Document Handling (AWS S3, Lambda, Textract)

*   **AWS SDK:** Familiarize yourself with the AWS SDK for JavaScript (v3) to interact with S3, Lambda, and Textract from the NestJS backend or dedicated Lambda functions.
*   **S3:** Configure S3 buckets, manage object uploads (potentially using pre-signed URLs for direct browser uploads), and set up event notifications to trigger Lambda.
*   **Lambda:** Write Lambda functions (Node.js runtime) to handle S3 triggers, orchestrate Textract jobs, and process results.
*   **Textract API:** Understand how to use Textract for document analysis (detecting text, forms, tables). Learn to handle both synchronous and asynchronous operations for larger documents. Parse the JSON output effectively to extract structured question data.

## 6. Messaging & Asynchronicity (Kafka vs. Redis Pub/Sub)

*   **Core Differences:** Understand the trade-offs: Kafka offers durability, ordering guarantees, and high throughput suitable for critical event streams or decoupling long processes. Redis Pub/Sub is simpler, faster for basic notifications, but lacks persistence.
*   **Chosen Technology:** 
    *   **If Kafka:** Learn Kafka concepts (topics, partitions, consumer groups), set up brokers (or use a managed service), and integrate using a NestJS Kafka client library (e.g., `@nestjs/microservices`). Use cases: Triggering PDF processing, AI generation, audit logging.
    *   **If Redis Pub/Sub:** Learn Redis Pub/Sub commands and integrate using a NestJS Redis client. Use cases: Real-time notifications (e.g., processing complete), simple event decoupling.
*   **Decision:** Re-evaluate based on the need for guaranteed delivery and event history (favors Kafka) versus simplicity and lower overhead (favors Redis Pub/Sub). Given the PDF/AI processing, Kafka might be more robust, but Redis could suffice if occasional message loss during processing is acceptable.

## 7. Caching (Redis)

*   **Caching Strategies:** Learn common patterns like cache-aside, read-through, write-through.
*   **NestJS Integration:** Implement caching using NestJS's built-in `CacheModule` or directly with a Redis client library.
*   **Use Cases:** Identify data to cache: frequently accessed questions, user permissions, configuration data.

## 8. Security

*   **Authentication/Authorization:** Implement JWT (JSON Web Tokens) or OAuth2 for user login and API protection. Use libraries like Passport.js with NestJS strategies (`passport-jwt`, `passport-local`).
*   **RBAC (Role-Based Access Control):** Implement guards and decorators in NestJS to enforce permissions based on user roles.
*   **API Security:** Input validation (using `class-validator`), rate limiting, Helmet for security headers, CORS configuration.
*   **Data Encryption:** Ensure sensitive data is encrypted in transit (HTTPS/TLS) and at rest (database TDE, application-level encryption if needed).
*   **Audit Logging:** Design and implement a system to log important actions (e.g., question creation/modification, exam generation, login attempts).

## 9. Monitoring (Prometheus & Grafana)

*   **Instrumentation:** Add a Prometheus client library (e.g., `prom-client`) to the NestJS application to expose key metrics (HTTP request duration/count, error rates, database query times, queue lengths).
*   **Setup:** Configure Prometheus to scrape the metrics endpoint of the application.
*   **Visualization:** Set up Grafana, connect it to Prometheus as a data source, and build dashboards to visualize application health and performance.
*   **Logging:** Implement structured logging (e.g., JSON format using Winston or Pino) to facilitate easier log searching and analysis in a potential log aggregation system (though setting up ELK/Loki might be out of scope for one month).

## 10. Export Engine

*   **Format Design:** Define a clear and comprehensive structure for the export file (likely JSON or XML) that includes all necessary question data, metadata, CLOs, and potentially exam structure information.
*   **Implementation:** Develop a module/service in NestJS to query the required data, format it according to the defined structure, and package it (e.g., into a zip file if needed).

## 11. General Software Engineering

*   **Version Control (Git):** Effective branching, merging, and commit practices.
*   **Testing:** Unit testing (Jest), integration testing, and potentially end-to-end testing strategies for NestJS applications.
*   **CI/CD:** Basic understanding of Continuous Integration/Continuous Deployment concepts (automating build, test, deployment), although full pipeline setup might be out of scope.

