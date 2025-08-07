export enum QuestionType {
    SINGLE = 'single',
    SINGLE_CHOICE = 'SINGLE_CHOICE',
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    TRUE_FALSE = 'TRUE_FALSE',
    ESSAY = 'ESSAY',
    GROUP = 'group',
    FILL_IN_BLANK = 'fill_in_blank',
    MATCHING = 'MATCHING',
    ORDERING = 'ORDERING',
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
    MATH = 'MATH',
    CODE = 'CODE',
    MULTIMEDIA = 'MULTIMEDIA',
    PARENT = 'parent'
}

export enum MediaType {
    AUDIO = 'audio',
    IMAGE = 'image'
}

export const QuestionTypeLabels = {
    [QuestionType.SINGLE]: 'Single Question',
    [QuestionType.GROUP]: 'Group Question',
    [QuestionType.FILL_IN_BLANK]: 'Fill-in-Blank Question',
    [QuestionType.PARENT]: 'Parent Question'
};

export const MediaTypeLabels = {
    [MediaType.AUDIO]: 'Audio',
    [MediaType.IMAGE]: 'Image'
};

export const QUESTION_MARKERS = {
    // Question type markers
    SINGLE_QUESTION_MARKER: '(DON)',
    GROUP_QUESTION_MARKER: '(NHOM)',
    FILL_IN_BLANK_MARKER: '(DIENKHUYET)',

    // Group question structure
    GROUP_START: '[<sg>]',
    GROUP_CONTENT_END: '[<egc>]',
    GROUP_END: '[</sg>]',
    QUESTION_SEPARATOR: '[<br>]',

    // Fill-in-blank patterns
    PLACEHOLDER_PATTERN: /\{<(\d+)>\}/g,
    FILL_IN_BLANK_PATTERN: /\{<(\d+)>\}_{5,}/g,

    // Media patterns
    AUDIO_PATTERN: /\[audio:\s*([^\]]+)\]/gi,
    IMAGE_PATTERN: /\[image:\s*([^\]]+)\]/gi,

    // Question identification patterns
    CLO_PATTERN: /\(CLO(\d+)\)/,
    SINGLE_QUESTION_PATTERN: /\(DON\)/,
    GROUP_QUESTION_PATTERN: /\(NHOM\)/,
    FILL_IN_BLANK_QUESTION_PATTERN: /\(DIENKHUYET\)/,

    // Child question patterns
    CHILD_QUESTION_PATTERN: /^\(<(\d+)>\)/,
    GROUP_CHILD_PATTERN: /\(NHOM\s*[–-]\s*(\d+)\)/,
    FILL_BLANK_CHILD_PATTERN: /\(DIENKHUYET\s*[–-]\s*(\d+)\)/,

    // Answer patterns
    ANSWER_PATTERN: /^[A-Z]\.\s*/,
    CORRECT_ANSWER_PATTERN: /^[A-Z]\.\s*(.+)$/,

    // End markers
    GROUP_END_MARKER: '(KETTHUCNHOM)',
    FILL_BLANK_END_MARKER: '(KETTHUCDIENKHUYET)'
} as const;
