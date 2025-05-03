# Potential Thesis Defense / Interview Questions

This document presents a series of potential questions that might arise during your IT graduation thesis defense or related technical interviews concerning the Question Bank Management System project. These questions are designed to probe your understanding of the architecture, technology choices, implementation details, and problem-solving approaches employed throughout the project. Preparing thoughtful answers to these will significantly strengthen your defense.

## 1. Overall Architecture and Design Choices

Could you begin by providing a high-level overview of the system architecture? Explain the primary components (frontend, backend, database, AWS services, AI, search) and how they interact with each other. What were the key factors influencing your choice of a microservices-inspired approach (even if monolithic initially) versus a strict monolith for the backend? Discuss the rationale behind selecting NestJS as the backend framework over other Node.js options like Express or Koa. Similarly, why was React chosen for the frontend? Considering the various components involved (database, cache, message queue, vector DB), how did you ensure maintainability and manage complexity within the system?

## 2. Backend Implementation (NestJS)

Describe how you structured the NestJS application. What principles guided your organization of modules, controllers, and services? Explain your approach to dependency injection within NestJS and how it benefited the project. How did you handle request validation and data transformation between the API layer and the service layer, particularly using DTOs and pipes like `ValidationPipe`? Discuss the asynchronous operations within the application (e.g., interacting with AWS, Gemini, Qdrant) and the patterns (async/await, Promises) you used to manage them effectively. How did you implement the adapter layer for the AI service (Gemini) to allow for potential future integration of other LLMs?

## 3. Database Design and Optimization (SQL Server)

Walk us through the key improvements you proposed or implemented for the initial database schema. What specific problems did these changes address (e.g., naming conventions, missing tables for RBAC/Audit/Tags)? Explain your indexing strategy. Which columns did you choose to index and why? How do these indexes improve query performance for common operations like searching questions or loading exam details? Discuss the trade-offs of using `uniqueidentifier` (GUIDs) as primary keys versus sequential integers, especially concerning index fragmentation and insertion performance. How did you approach migrating the database schema changes using TypeORM migrations? What considerations did you make regarding database scalability (e.g., read replicas, potential sharding) even if not fully implemented?

## 4. AI Integration (Gemini)

Explain the workflow for generating questions using the Gemini API. How is the process initiated, and what steps are involved from user request to saving an approved question? Discuss your prompt engineering strategy. How did you design prompts to ensure the generated questions align with specific Course Learning Outcomes (CLOs), difficulty levels, and desired formats? What challenges did you encounter when integrating with the Gemini API, and how did you overcome them (e.g., handling rate limits, parsing varied responses, ensuring consistency)? How does the system facilitate the review and approval process for AI-generated questions?

## 5. Search Implementation (Qdrant)

Why was a dedicated vector database like Qdrant chosen for search instead of relying solely on SQL Server's full-text search capabilities? Explain the concept of vector embeddings in the context of this project. How are embeddings generated for the questions, and which model did you use? Describe the indexing process in Qdrant. How are both the vector embeddings and the associated metadata (payloads) stored? Explain how you implemented hybrid search, combining semantic (vector) search with traditional keyword filtering based on metadata (like tags, CLOs, difficulty). What are the advantages of this hybrid approach?

## 6. PDF Processing Pipeline (AWS S3, Lambda, Textract)

Describe the end-to-end process for handling PDF uploads. How does an upload to S3 trigger the processing? Explain the role of the AWS Lambda function in this pipeline. How does it interact with AWS Textract? What challenges did you face when parsing the output from Textract, especially considering the potential variability in PDF structures and formats? How does the system handle potential errors during PDF processing or Textract analysis? How is the status of the processing communicated back to the user or the main application?

## 7. Messaging (Kafka vs. Redis Pub/Sub)

Discuss the role of messaging in your architecture. Which system did you ultimately choose (Kafka or Redis Pub/Sub) and why? What were the key factors (e.g., durability, throughput, complexity, cost) influencing your decision? Provide specific examples of how messaging is used within the application (e.g., decoupling PDF processing, triggering notifications, logging events). If you chose Kafka, explain concepts like topics, partitions, and consumer groups in the context of your implementation. If you chose Redis Pub/Sub, discuss its limitations regarding message persistence.

## 8. Caching (Redis)

What was your caching strategy? Which data did you identify as suitable for caching (e.g., frequently accessed questions, user permissions, configuration)? How did you implement caching within the NestJS application (e.g., using `CacheModule` or a direct client)? Explain the cache invalidation strategy you employed to ensure data consistency between the cache and the database.

## 9. Security

How is user authentication handled in the system? Explain the JWT workflow (issuance, validation, storage). Describe your implementation of Role-Based Access Control (RBAC). How are roles and permissions defined, assigned, and enforced using NestJS Guards? What measures were taken to secure API endpoints beyond authentication and authorization (e.g., input validation, rate limiting, security headers via Helmet)? How is sensitive data protected, both in transit (HTTPS) and at rest (e.g., password hashing, potential database encryption like TDE)? Explain the purpose and implementation of the audit logging feature.

## 10. Monitoring (Prometheus & Grafana)

Why is monitoring important for an application like this? How did you instrument the NestJS application to expose metrics for Prometheus? What key metrics are being tracked (e.g., request latency, error rates, database performance)? How does Prometheus collect these metrics? Describe the role of Grafana and provide examples of visualizations you created on your dashboard to monitor application health and performance. How would you approach debugging an issue identified through monitoring?

## 11. Scalability and Performance

Beyond database indexing, what other considerations were made for application performance and scalability? How does the architecture support handling an increasing number of users or questions? Discuss potential bottlenecks in the system (e.g., database, AI API calls, PDF processing) and how you might address them if the application needed to scale significantly. How did you test or measure the performance of critical parts of the application?

## 12. Project Management and Challenges

Reflecting on the one-month timeline, what were the biggest technical challenges you faced during development? How did you overcome them? Were there any features you initially planned but had to de-scope due to time constraints? How did you manage your time and prioritize tasks based on the roadmap and milestones? What aspects of the project are you most proud of from a technical standpoint? What would you do differently if you had more time or resources?
