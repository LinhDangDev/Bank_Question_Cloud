export const SAMPLE_QUESTIONS = {
    singleQuestion: `(CLO1) What is a database?
A. A collection of data
B. A software program  
C. A hardware device
D. A network protocol
[<br>]`,

    singleQuestionWithMedia: `(CLO2) Listen to the audio and answer the question. [audio: ./audio/database_intro.mp3]
Look at the diagram below. [image: ./images/database_schema.png]
What type of database relationship is shown?
A. One-to-One
B. One-to-Many
C. Many-to-Many
D. None of the above
[<br>]`,

    groupQuestion: `[<sg>]
(CLO2) Questions {<1>} –{<3>} refer to the following passage.
A database is a structured collection of data that is stored and organized in a way that allows for efficient retrieval, management, and updating. Database Management Systems (DBMS) are software applications that interact with users, applications, and the database itself to capture and analyze data. Popular DBMS include MySQL, PostgreSQL, Oracle, and SQL Server.
[<egc>]
(<1>) What is a database?
A. A collection of data
B. A software program
C. A hardware device
D. A network protocol
[<br>]
(<2>) What does DBMS stand for?
A. Database Management System
B. Data Base Management Software
C. Digital Base Management System
D. Database Monitoring System
[<br>]
(<3>) Which of the following is NOT mentioned as a popular DBMS?
A. MySQL
B. PostgreSQL
C. MongoDB
D. Oracle
[<br>]
[</sg>]`,

    fillInBlankQuestion: `[<sg>]
Complete the following sentences about databases.
A database is a {<1>}_____ collection of data. It can be managed by a {<2>}_____. Popular examples include {<3>}_____ and PostgreSQL.
[<egc>]
(<1>)
A. structured
B. random
C. temporary
D. simple
[<br>]
(<2>)
A. operating system
B. DBMS
C. web browser
D. text editor
[<br>]
(<3>)
A. Microsoft Word
B. MySQL
C. Google Chrome
D. Windows
[<br>]
[</sg>]`,

    mixedQuestions: `(CLO1) What is SQL?
A. Structured Query Language
B. Simple Query Language
C. Standard Query Language
D. System Query Language
[<br>]

[<sg>]
(CLO3) Questions {<1>} –{<2>} refer to the following audio. [audio: ./audio/sql_tutorial.mp3]
[<egc>]
(<1>) What is the primary purpose of SQL?
A. To design databases
B. To query databases
C. To create websites
D. To manage files
[<br>]
(<2>) Which SQL command is used to retrieve data?
A. INSERT
B. UPDATE
C. SELECT
D. DELETE
[<br>]
[</sg>]

(CLO2) Look at the image below and answer the question. [image: ./images/sql_syntax.png]
Which SQL clause is used to filter results?
A. SELECT
B. FROM
C. WHERE
D. ORDER BY
[<br>]`,

    complexFillInBlank: `[<sg>]
Complete the SQL query below to select all customers from the database.
{<1>}_____ * {<2>}_____ customers {<3>}_____ age > 18;
[<egc>]
(<1>)
A. SELECT
B. INSERT
C. UPDATE
D. DELETE
[<br>]
(<2>)
A. INTO
B. FROM
C. WHERE
D. ORDER
[<br>]
(<3>)
A. SELECT
B. FROM
C. WHERE
D. GROUP
[<br>]
[</sg>]`,

    questionWithCorrectAnswers: `(CLO1) Which of the following are database types?
A. Relational
B. NoSQL
C. Graph
D. All of the above
[<br>]`,

    vietnameseQuestion: `(CLO1) Cơ sở dữ liệu là gì?
A. Một tập hợp dữ liệu có cấu trúc
B. Một chương trình phần mềm
C. Một thiết bị phần cứng
D. Một giao thức mạng
[<br>]`,

    questionWithSpecialCharacters: `(CLO2) What is the result of 2 + 2 * 3?
A. 12
B. 8
C. 10
D. 6
[<br>]`,

    longGroupQuestion: `[<sg>]
(CLO4) Questions {<1>} –{<5>} refer to the following passage about database normalization.
Database normalization is the process of organizing data in a database to reduce redundancy and improve data integrity. The process involves dividing large tables into smaller, related tables and defining relationships between them. There are several normal forms, with the most commonly used being First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF). Each normal form has specific rules that must be followed to achieve that level of normalization.
[<egc>]
(<1>) What is database normalization?
A. A process to organize data
B. A type of database
C. A programming language
D. A hardware component
[<br>]
(<2>) What is the main goal of normalization?
A. To increase data size
B. To reduce redundancy
C. To slow down queries
D. To complicate the structure
[<br>]
(<3>) Which normal form is mentioned first?
A. 2NF
B. 3NF
C. 1NF
D. 4NF
[<br>]
(<4>) How many normal forms are commonly used according to the passage?
A. Two
B. Three
C. Four
D. Five
[<br>]
(<5>) What must be followed to achieve normalization?
A. Specific rules
B. General guidelines
C. Random procedures
D. Optional suggestions
[<br>]
[</sg>]`
};

export const SAMPLE_RESPONSES = {
    parseSuccess: {
        success: true,
        questions: [
            {
                type: 'single',
                clo: '1',
                content: 'What is a database?',
                answers: [
                    { letter: 'A', content: 'A collection of data', isCorrect: true, order: 0 },
                    { letter: 'B', content: 'A software program', isCorrect: false, order: 1 },
                    { letter: 'C', content: 'A hardware device', isCorrect: false, order: 2 },
                    { letter: 'D', content: 'A network protocol', isCorrect: false, order: 3 }
                ],
                mediaReferences: [],
                order: 1
            }
        ],
        mediaFiles: [],
        statistics: {
            totalQuestions: 1,
            singleQuestions: 1,
            groupQuestions: 0,
            fillInBlankQuestions: 0,
            questionsWithMedia: 0,
            totalMediaFiles: 0
        },
        errors: [],
        warnings: []
    },

    previewSuccess: {
        success: true,
        html: '<div class="questions-preview-container">...</div>',
        css: '<style>...</style>',
        questions: [],
        statistics: {
            totalQuestions: 1,
            questionsWithMedia: 0,
            mediaFilesFound: 0
        },
        errors: [],
        warnings: []
    }
};

export const API_ENDPOINTS = {
    parseText: '/question-parser/parse-text',
    previewText: '/question-parser/preview-text',
    validateAndPreview: '/question-parser/validate-and-preview',
    parseDocx: '/question-parser/parse-docx',
    convertLegacyMarkup: '/question-parser/convert-legacy-markup',
    testPatterns: '/question-parser/test-patterns'
};

export const USAGE_EXAMPLES = {
    parseTextRequest: {
        text: SAMPLE_QUESTIONS.singleQuestion,
        uploadMedia: false,
        generateThumbnails: false,
        convertImages: true,
        maxImageWidth: 400,
        maxImageHeight: 300
    },

    previewTextRequest: {
        text: SAMPLE_QUESTIONS.groupQuestion,
        includeMedia: true,
        maxImageWidth: 600,
        maxImageHeight: 400
    },

    convertLegacyMarkupRequest: {
        content: 'Listen to this audio [audio: ./audio/test.mp3] and look at this image [image: ./images/diagram.png]'
    }
};
