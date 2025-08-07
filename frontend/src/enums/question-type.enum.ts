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
    GROUP_START: '[<sg>]',
    GROUP_CONTENT_END: '[<egc>]',
    GROUP_END: '[</sg>]',
    QUESTION_SEPARATOR: '[<br>]',
    PLACEHOLDER_PATTERN: /\{<(\d+)>\}/g,
    FILL_IN_BLANK_PATTERN: /\{<(\d+)>\}_{5,}/g,
    AUDIO_PATTERN: /\[audio:\s*([^\]]+)\]/gi,
    IMAGE_PATTERN: /\[image:\s*([^\]]+)\]/gi,
    CLO_PATTERN: /^\(CLO\d+\)/,
    CHILD_QUESTION_PATTERN: /^\(<(\d+)>\)/,
    ANSWER_PATTERN: /^[A-Z]\.\s*/,
    CORRECT_ANSWER_PATTERN: /^[A-Z]\.\s*(.+)$/
} as const;
