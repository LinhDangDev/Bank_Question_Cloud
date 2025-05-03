# Database Schema Improvement Proposal

## 1. Introduction

This document outlines proposed improvements to the existing SQL Server database schema (`Bankquestion Offical.sql`) for the Question Bank Management System. The recommendations are based on the project requirements, including the need for scalability, performance, robust feature support (AI generation, advanced search, RBAC, audit logging), and maintainability. The goal is to create a more standardized, comprehensive, and optimized schema suitable for the application's lifecycle and graduation thesis requirements.

## 2. Analysis of Existing Schema

The current schema provides a foundational structure for questions, answers, exams, and organizational hierarchy (departments, subjects). Key observations include:

*   **Naming Convention:** Uses Vietnamese names (e.g., `CauHoi`, `MaPhan`). While functional, switching to English enhances clarity, standardization, and maintainability, especially if collaborating or using standard ORM conventions.
*   **Primary Keys:** Utilizes `uniqueidentifier` (GUIDs), which is suitable for distributed environments but requires attention to indexing for optimal performance.
*   **Relationships:** Foreign keys establish core relationships, although some constraints might need review (e.g., cascade options).
*   **Feature Support:** Includes basic structures for hierarchical questions, soft deletes, and timestamps. However, it lacks dedicated tables for crucial features like RBAC, tags, CLOs, audit logging, and detailed AI generation tracking.
*   **Stored Procedures:** Extensive use of stored procedures for data manipulation. While potentially performant, this can tightly couple logic to the database and complicate application-level testing and evolution. Migrating business logic to the NestJS application layer using an ORM is generally recommended.

## 3. Proposed Improvements

### 3.1. Standardization and Naming Conventions

*   **Recommendation:** Rename all tables and columns to use consistent English names following standard conventions (e.g., PascalCase for tables, camelCase or snake_case for columns). This improves readability and aligns better with ORM mapping.
*   **Example Renaming:**
    *   `CauHoi` -> `Questions`
    *   `CauTraLoi` -> `Answers`
    *   `MonHoc` -> `Subjects`
    *   `Khoa` -> `Departments`
    *   `DeThi` -> `Exams`
    *   `ChiTietDeThi` -> `ExamQuestions` (or `ExamDetails`)
    *   `Phan` -> `Sections` (or `Chapters`)
    *   `MaCauHoi` -> `questionId`
    *   `NoiDung` -> `content`
    *   `NgayTao` -> `createdAt`
    *   `XoaTamCauHoi` -> `isDeleted`
*   **Action:** Provide a full mapping table from old Vietnamese names to new English names in the project documentation.

### 3.2. New Tables for Enhanced Functionality

Introduce the following new tables to support required features:

*   **`Roles`**: Stores user roles.
    *   `roleId` (uniqueidentifier, PK)
    *   `roleName` (nvarchar(100), unique, not null)
    *   `description` (nvarchar(255))
*   **`Permissions`**: Stores granular permissions.
    *   `permissionId` (uniqueidentifier, PK)
    *   `permissionName` (nvarchar(100), unique, not null) (e.g., `CREATE_QUESTION`, `APPROVE_AI_QUESTION`, `DELETE_USER`)
    *   `description` (nvarchar(255))
*   **`UserRoles`**: Maps users to roles (Many-to-Many).
    *   `userId` (uniqueidentifier, FK to Users, PK)
    *   `roleId` (uniqueidentifier, FK to Roles, PK)
*   **`RolePermissions`**: Maps roles to permissions (Many-to-Many).
    *   `roleId` (uniqueidentifier, FK to Roles, PK)
    *   `permissionId` (uniqueidentifier, FK to Permissions, PK)
*   **`Tags`**: Stores tags for categorizing questions.
    *   `tagId` (uniqueidentifier, PK)
    *   `tagName` (nvarchar(100), unique, not null)
*   **`QuestionTags`**: Maps questions to tags (Many-to-Many).
    *   `questionId` (uniqueidentifier, FK to Questions, PK)
    *   `tagId` (uniqueidentifier, FK to Tags, PK)
*   **`CourseLearningOutcomes` (CLOs)**: Stores CLO details.
    *   `cloId` (uniqueidentifier, PK)
    *   `cloCode` (nvarchar(50), not null)
    *   `description` (nvarchar(max), not null)
    *   `subjectId` (uniqueidentifier, FK to Subjects, not null)
*   **`AuditLogs`**: Records significant system events.
    *   `logId` (bigint identity, PK) or `logId` (uniqueidentifier, PK)
    *   `timestamp` (datetime, not null, default GETDATE())
    *   `userId` (uniqueidentifier, FK to Users, nullable for system actions)
    *   `actionType` (nvarchar(100), not null) (e.g., `QUESTION_CREATED`, `USER_LOGIN_FAILED`, `EXAM_EXPORTED`)
    *   `targetEntityType` (nvarchar(100), nullable)
    *   `targetEntityId` (nvarchar(255), nullable) -- Use nvarchar to accommodate different ID types (GUIDs, integers)
    *   `changeDetails` (nvarchar(max)) -- Store details, potentially as JSON

### 3.3. Refinements to Existing Tables (Using Proposed English Names)

*   **`Questions`**: 
    *   Add `isAIGenerated` (bit, not null, default 0).
    *   Add `aiGenerationPrompt` (nvarchar(max), nullable).
    *   Add `reviewStatus` (smallint, not null, default 0) -- Define meanings (0: Draft/Pending, 1: Approved, 2: Rejected).
    *   Add `reviewerUserId` (uniqueidentifier, FK to Users, nullable).
    *   Add `reviewTimestamp` (datetime, nullable).
    *   Add `qdrantPointId` (varchar(50), nullable, unique) -- Store the ID used in the Qdrant vector database.
    *   Modify `cloId` (FK to `CourseLearningOutcomes`, nullable or not null based on requirements).
    *   Consider removing `questionNumber` (`MaSoCauHoi`) if ordering is handled contextually.
    *   Consider removing `timesUsedInExam` (`SoLanDuocThi`) and `timesAnsweredCorrectly` (`SoLanDung`) if detailed analytics are planned elsewhere; otherwise, ensure application logic/triggers update them correctly.
*   **`Users`**: 
    *   Increase `passwordHash` (`Password`) length to `nvarchar(256)` or more to accommodate modern hashing algorithms.
    *   Ensure `passwordSalt` is adequately sized (`nvarchar(128)` or more).
*   **`Files`**: 
    *   Replace `fileName` (`TenFile`) with `s3Bucket` (nvarchar(255)) and `s3Key` (nvarchar(1024)).
    *   Add `originalFileName` (nvarchar(255)).
    *   Add `fileSize` (bigint).
    *   Add `mimeType` (nvarchar(100)).
    *   Clarify `fileType` (`LoaiFile`) integer values or change to a descriptive `nvarchar` type.
*   **`Sections` (`Phan`)**: 
    *   Remove `numberOfQuestions` (`SoLuongCauHoi`) to avoid denormalization. Calculate this count dynamically when needed.
*   **`YeuCauRutTrich`**: 
    *   Evaluate if this table's purpose can be merged into a more general `ExamGenerationRequests` or `ExportJobs` table, linking to `Users` and `Exams`.

### 3.4. Indexing Strategy

*   **Primary Keys:** Maintain clustered indexes on primary keys (default behavior).
*   **Foreign Keys:** Create non-clustered indexes on all foreign key columns to optimize joins (e.g., `Questions.sectionId`, `Questions.cloId`, `Answers.questionId`, `Subjects.departmentId`, `UserRoles.roleId`, `QuestionTags.tagId`, etc.).
*   **Common Filters/Sorts:** Add non-clustered indexes on columns frequently used in `WHERE` clauses and `ORDER BY` clauses:
    *   `Questions`: `difficultyLevel`, `isDeleted`, `reviewStatus`, `createdAt`, `subjectId` (via `Sections`).
    *   `Subjects`: `subjectCode`, `subjectName`, `departmentId`.
    *   `Users`: `loginName`, `email`, `isLockedOut`.
    *   `AuditLogs`: `timestamp`, `userId`, `actionType`, `targetEntityType`, `targetEntityId`.
    *   `Tags`: `tagName`.
*   **Composite Indexes:** Create composite indexes where queries filter/sort on multiple columns simultaneously (e.g., `Questions(sectionId, isDeleted, difficultyLevel)`).
*   **Optimization:** Use SQL Server's execution plan analysis tools to identify missing indexes and optimize existing ones based on actual application query patterns.

### 3.5. Stored Procedures and Logic Migration

*   **Recommendation:** Migrate business logic (CRUD operations, validation, complex workflows like exam generation) from stored procedures to the NestJS application layer (services/repositories) using an ORM like TypeORM.
*   **Benefits:** Improved testability (unit/integration tests in NestJS), better separation of concerns, easier maintenance, consistency with application code.
*   **Exceptions:** Retain stored procedures only for highly performance-critical bulk operations or complex queries that are demonstrably faster than ORM-generated equivalents, after careful profiling.

### 3.6. Scalability and Performance

*   **Foundation:** The proposed normalization, indexing, and logic migration form the basis for good performance and scalability.
*   **Read Replicas:** Design the application architecture to support directing read-heavy queries (like searching questions, viewing exams) to potential future read replicas.
*   **Query Tuning:** Regularly monitor query performance and optimize slow queries identified through SQL Server tools.
*   **Archiving:** Plan a strategy for archiving old data (e.g., old audit logs, soft-deleted records) if the database is expected to grow very large over time.

### 3.7. Security Enhancements

*   **RBAC Implementation:** Utilize the new Roles/Permissions tables to enforce granular access control within the NestJS application (e.g., using Guards).
*   **Encryption at Rest:** Enable Transparent Data Encryption (TDE) in SQL Server for enhanced data protection.
*   **Audit Logging:** Ensure the application consistently logs critical activities to the `AuditLogs` table.

## 4. Conclusion

Implementing these database improvements will result in a more robust, maintainable, scalable, and secure foundation for the Question Bank Management System. It aligns the schema with modern best practices and directly supports the required application features, including AI integration, advanced search, and comprehensive security controls. Careful planning and execution of these changes, ideally through scripted migrations (using TypeORM migrations or other tools), are crucial.
