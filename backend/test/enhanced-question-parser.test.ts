import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedQuestionParserService } from '../src/services/enhanced-question-parser.service';
import { QuestionType } from '../src/enums/question-type.enum';

describe('EnhancedQuestionParserService', () => {
  let service: EnhancedQuestionParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnhancedQuestionParserService],
    }).compile();

    service = module.get<EnhancedQuestionParserService>(EnhancedQuestionParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseSingleQuestion', () => {
    it('should parse a single question correctly', async () => {
      const questionText = `(DON)
(CLO1) Tìm từ khác nghĩa với các từ còn lại
A. Good bye
B. こんにちは.
C. 안녕하세요.
D. 你好.`;

      const result = await service.parseSingleQuestion(questionText, 1);

      expect(result).toBeDefined();
      expect(result?.type).toBe(QuestionType.SINGLE);
      expect(result?.clo).toBe('1');
      expect(result?.content).toContain('Tìm từ khác nghĩa');
      expect(result?.answers).toHaveLength(4);
      expect(result?.answers[0].letter).toBe('A');
      expect(result?.answers[0].content).toBe('Good bye');
    });

    it('should detect correct answers with underline formatting', async () => {
      const questionText = `(DON)
(CLO1) Câu hỏi test
A. <u>Đáp án đúng</u>
B. Đáp án sai
C. Đáp án sai khác
D. Đáp án sai nữa`;

      const result = await service.parseSingleQuestion(questionText, 1);

      expect(result?.answers[0].isCorrect).toBe(true);
      expect(result?.answers[1].isCorrect).toBe(false);
      expect(result?.answers[2].isCorrect).toBe(false);
      expect(result?.answers[3].isCorrect).toBe(false);
    });
  });

  describe('parseGroupQuestion', () => {
    it('should parse a group question correctly', async () => {
      const questionText = `(NHOM)
[<sg>]
Questions {<1>} – {<2>} refer to the following passage.
Probably the most important factor governing the severity of forest fires is weather.
[<egc>]
(NHOM – 1) (CLO1) In this passage, the author's main purpose is to …
A. argue
B. <u>inform</u>
C. persuade
D. entertain
[<br>]
(NHOM – 2)(CLO1) Which of the following best describes the organization?
A. A comparison and contrast
B. <strong>A description of the conditions</strong>
C. An analysis of factors
D. Several generalizations
[<br>]
[</sg>]
(KETTHUCNHOM)`;

      const result = await service.parseGroupQuestion(questionText, 1);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuestionType.PARENT);
      expect(result[0].content).toContain('Questions {<1>} – {<2>}');
      expect(result[0].childQuestions).toHaveLength(2);
      expect(result[0].childQuestions![0].type).toBe(QuestionType.GROUP);
      expect(result[0].childQuestions![0].clo).toBe('1');
      expect(result[0].childQuestions![0].answers[1].isCorrect).toBe(true);
      expect(result[0].childQuestions![1].answers[1].isCorrect).toBe(true);
    });
  });

  describe('parseFillInBlankQuestion', () => {
    it('should parse a fill-in-blank question correctly', async () => {
      const questionText = `(DIENKHUYET)
[<sg>]
(CLO3) Questions {<1>} – {<5>} refer to the following passage.
Travelling to all corners of the world gets easier and easier. We live in a global village, but this {<1>}_____ mean that we all behave the same way.
[<egc>]
(DIENKHUYET – 1)
A. <u>doesn't</u>
B. didn't
C. don't
D. isn't
[<br>]
(DIENKHUYET – 2)
A. may not
B. <b>shouldn't</b>
C. don't
D. can't
[<br>]
[</sg>]
(KETTHUCDIENKHUYET)`;

      const result = await service.parseFillInBlankQuestion(questionText, 1);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuestionType.PARENT);
      expect(result[0].hasFillInBlanks).toBe(true);
      expect(result[0].childQuestions).toHaveLength(2);
      expect(result[0].childQuestions![0].type).toBe(QuestionType.FILL_IN_BLANK);
      expect(result[0].childQuestions![0].placeholderNumber).toBe(1);
      expect(result[0].childQuestions![0].answers[0].isCorrect).toBe(true);
      expect(result[0].childQuestions![1].answers[1].isCorrect).toBe(true);
    });
  });

  describe('parseQuestionsFromText', () => {
    it('should parse mixed question types from text', async () => {
      const mixedText = `(DON)
(CLO1) Câu hỏi đơn
A. <u>Đáp án A</u>
B. Đáp án B
C. Đáp án C
D. Đáp án D

(NHOM)
[<sg>]
Đoạn văn cho câu hỏi nhóm
[<egc>]
(NHOM – 1) (CLO2) Câu hỏi nhóm 1
A. Đáp án A
B. <strong>Đáp án B</strong>
C. Đáp án C
D. Đáp án D
[<br>]
[</sg>]
(KETTHUCNHOM)

(DIENKHUYET)
[<sg>]
(CLO3) Đoạn văn với chỗ trống {<1>}_____ và {<2>}_____
[<egc>]
(DIENKHUYET – 1)
A. __đáp án 1__
B. đáp án 2
C. đáp án 3
D. đáp án 4
[<br>]
[</sg>]
(KETTHUCDIENKHUYET)`;

      const result = await service.parseQuestionsFromText(mixedText);

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(3);
      expect(result.statistics.singleQuestions).toBe(1);
      expect(result.statistics.groupQuestions).toBe(1);
      expect(result.statistics.fillInBlankQuestions).toBe(1);
      expect(result.statistics.totalQuestions).toBe(3);
    });
  });

  describe('media reference extraction', () => {
    it('should extract audio and image references', async () => {
      const questionText = `(DON)
(CLO1) Câu hỏi có media [AUDIO: test.mp3] và [IMAGE: test.jpg]
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D`;

      const result = await service.parseSingleQuestion(questionText, 1);

      expect(result?.mediaReferences).toHaveLength(2);
      expect(result?.mediaReferences[0].type).toBe('audio');
      expect(result?.mediaReferences[0].fileName).toBe('test.mp3');
      expect(result?.mediaReferences[1].type).toBe('image');
      expect(result?.mediaReferences[1].fileName).toBe('test.jpg');
    });
  });

  describe('error handling', () => {
    it('should handle malformed questions gracefully', async () => {
      const malformedText = `(DON)
Câu hỏi không có CLO
A. Đáp án A`;

      const result = await service.parseSingleQuestion(malformedText, 1);

      expect(result).toBeDefined();
      expect(result?.clo).toBeUndefined();
      expect(result?.answers).toHaveLength(1);
    });

    it('should handle empty text', async () => {
      const result = await service.parseQuestionsFromText('');

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(0);
      expect(result.statistics.totalQuestions).toBe(0);
    });
  });
});
