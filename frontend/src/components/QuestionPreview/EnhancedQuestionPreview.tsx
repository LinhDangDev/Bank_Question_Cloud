import React, { useEffect, useState } from 'react';
import MediaRenderer from './MediaRenderer';
import { renderLatexInElement } from '../../utils/latex';
import { QuestionType } from '../../enums/question-type.enum';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ChildQuestion {
  id: string;
  content: string;
  options: Option[];
  type: QuestionType;
  correctAnswer?: string;
}

interface QuestionData {
  id?: string;
  content: string;
  type: QuestionType;
  options?: Option[];
  correctAnswer?: string;
  groupContent?: string;
  childQuestions?: ChildQuestion[];
  fillInBlankAnswers?: string[];
}

interface EnhancedQuestionPreviewProps {
  question: QuestionData;
  showAnswers?: boolean;
  highlightCorrectAnswers?: boolean;
  selectedAnswers?: Record<string, string | string[]>;
  onAnswerSelect?: (questionId: string, answerId: string | string[]) => void;
  questionIndex?: number;
  className?: string;
}

const EnhancedQuestionPreview: React.FC<EnhancedQuestionPreviewProps> = ({
  question,
  showAnswers = true,
  highlightCorrectAnswers = true,
  selectedAnswers = {},
  onAnswerSelect,
  questionIndex,
  className = '',
}) => {
  const [renderedContent, setRenderedContent] = useState(question.content);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      renderLatexInElement(containerRef.current);
    }
  }, [question, renderedContent]);

  useEffect(() => {
    // Xử lý nội dung câu hỏi để hiển thị
    let processedContent = question.content;

    // Check for CLO information and make it stand out
    const cloPattern = /\(CLO(\d+)\)/i;
    if (processedContent && cloPattern.test(processedContent)) {
      processedContent = processedContent.replace(
        cloPattern,
        '<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">$&</span>'
      );
    }

    // Xử lý đặc biệt cho các loại câu hỏi
    const questionType = question.type.toString().toUpperCase();

    // For group questions, keep the markers visible if they exist
    if (questionType === QuestionType.GROUP.toUpperCase()) {
      if (processedContent.includes('(NHOM)')) {
        processedContent = processedContent.replace(
          '(NHOM)',
          '<span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">(NHÓM)</span>'
        );
      }
    }
    // For single choice questions, make the marker visible
    else if (questionType === QuestionType.SINGLE_CHOICE.toUpperCase() ||
             questionType === QuestionType.SINGLE.toUpperCase()) {
      if (processedContent.includes('(DON)')) {
        processedContent = processedContent.replace(
          '(DON)',
          '<span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded font-semibold">(ĐƠN)</span>'
        );
      }
    }
    // For fill-in-blank questions, make the marker visible
    else if (questionType === QuestionType.FILL_IN_BLANK.toUpperCase()) {
      if (processedContent.includes('(DIENKHUYET)')) {
        processedContent = processedContent.replace(
          '(DIENKHUYET)',
          '<span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">(ĐIỀN KHUYẾT)</span>'
        );
      }
    }

    setRenderedContent(processedContent);
  }, [question]);

  const renderOptions = (options: Option[], questionId: string) => {
    const selectedAnswer = selectedAnswers[questionId];

    return (
      <div className="mt-2 space-y-2">
        {options.map((option) => {
          const isSelected = Array.isArray(selectedAnswer)
            ? selectedAnswer.includes(option.id)
            : selectedAnswer === option.id;

          const isCorrect = option.isCorrect;
          const shouldHighlight = showAnswers && highlightCorrectAnswers;

          let optionClass = 'p-2 border rounded flex items-start gap-2 transition-colors';

          if (shouldHighlight) {
            if (isCorrect) {
              optionClass += ' bg-green-50 border-green-300';
            } else if (isSelected && !isCorrect) {
              optionClass += ' bg-red-50 border-red-300';
            }
          } else if (isSelected) {
            optionClass += ' bg-blue-50 border-blue-300';
          }

          // Nếu tìm thấy đáp án có gạch chân
          const hasUnderline = option.text.includes('_') || option.text.includes('__');
          if (hasUnderline) {
            optionClass += ' font-bold';
          }

          return (
            <div
              key={option.id}
              className={optionClass}
              onClick={() => {
                if (onAnswerSelect) {
                  onAnswerSelect(questionId, option.id);
                }
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
              <div className="flex-grow">
                <MediaRenderer content={option.text} />
              </div>
              {shouldHighlight && isCorrect && (
                <div className="flex-shrink-0 text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleChoiceQuestion = () => {
    return (
      <div>
        <div className="question-content mb-4">
          <MediaRenderer content={renderedContent} />
        </div>
        {question.options && renderOptions(question.options, question.id || 'question')}
      </div>
    );
  };

  const renderGroupQuestion = () => {
    if (!question.childQuestions || !question.groupContent) {
      return <div className="text-red-500">Câu hỏi nhóm không hợp lệ: thiếu nội dung hoặc câu hỏi con</div>;
    }

    return (
      <div>
        <div className="group-content mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <MediaRenderer content={question.groupContent} />
        </div>
        <div className="child-questions space-y-8">
          {question.childQuestions.map((childQuestion, index) => (
            <div key={childQuestion.id || index} className="child-question p-4 border border-gray-200 rounded-lg">
              <div className="question-number font-semibold text-gray-700 mb-2">
                Câu {index + 1}:
              </div>
              <div className="question-content mb-4">
                <MediaRenderer content={childQuestion.content} />
              </div>
              {childQuestion.options && renderOptions(childQuestion.options, childQuestion.id || `child-${index}`)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFillInBlankQuestion = () => {
    if (!question.childQuestions || !question.fillInBlankAnswers) {
      return <div className="text-red-500">Câu hỏi điền khuyết không hợp lệ: thiếu câu hỏi con hoặc đáp án</div>;
    }

    // Xử lý nội dung để hiển thị các ô điền khuyết với dấu {...}
    const placeholderRegex = /\{<(\d+)>\}/g;
    const content = question.content.replace(placeholderRegex, (match, index) => {
      const i = parseInt(index, 10) - 1;

      // Kiểm tra xem index có hợp lệ không
      if (i >= 0 && i < question.fillInBlankAnswers!.length) {
        const selectedAnswer = selectedAnswers[`blank-${i}`];
        const correctAnswer = question.fillInBlankAnswers![i];
        const isCorrect = selectedAnswer === correctAnswer;

        let answerDisplay = '';
        let bgClass = 'bg-gray-100';

        if (selectedAnswer) {
          answerDisplay = selectedAnswer as string;
          bgClass = isCorrect ? 'bg-green-100' : 'bg-red-100';
        }

        if (showAnswers && !selectedAnswer) {
          answerDisplay = correctAnswer;
          bgClass = 'bg-green-100';
        }

        return `<span class="inline-block px-2 py-1 mx-1 border ${bgClass} rounded min-w-[60px]">${answerDisplay || '___'}</span>`;
      }

      return match;
    });

    return (
      <div>
        <div className="fill-blank-content mb-6">
          <MediaRenderer content={content} />
        </div>
        <div className="child-questions space-y-6">
          {question.childQuestions.map((childQuestion, index) => (
            <div key={childQuestion.id || index} className="child-question p-4 border border-gray-200 rounded-lg">
              <div className="question-number font-semibold text-gray-700 mb-2">
                Điền khuyết {index + 1}:
              </div>
              <div className="question-content mb-4">
                <MediaRenderer content={childQuestion.content} />
              </div>
              {childQuestion.options && renderOptions(childQuestion.options, `blank-${index}`)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    // Convert question type to uppercase for comparison
    const questionType = question.type.toString().toUpperCase();

    // Map both the uppercase/lowercase enum values to correct renderer
    if (questionType === QuestionType.SINGLE_CHOICE.toUpperCase() ||
        questionType === QuestionType.SINGLE.toUpperCase()) {
        return renderSingleChoiceQuestion();
    } else if (questionType === QuestionType.GROUP.toUpperCase()) {
        return renderGroupQuestion();
    } else if (questionType === QuestionType.FILL_IN_BLANK.toUpperCase()) {
        return renderFillInBlankQuestion();
    } else {
        return (
            <div className="text-red-500">
                Loại câu hỏi không được hỗ trợ: {question.type}
                <div className="mt-2 p-4 border border-gray-300 rounded bg-gray-50">
                    <div className="font-semibold mb-2">Debug info:</div>
                    <div>Question type: {JSON.stringify(question.type)}</div>
                    <div>Normalized type: {questionType}</div>
                    <div>Has child questions: {question.childQuestions ? 'Yes' : 'No'}</div>
                    <div>Has group content: {question.groupContent ? 'Yes' : 'No'}</div>
                </div>
            </div>
        );
    }
};

  return (
    <div
      ref={containerRef}
      className={`enhanced-question-preview ${className}`}
      data-question-id={question.id}
      data-question-type={question.type}
    >
      {questionIndex !== undefined && (
        <div className="question-index font-bold text-lg text-gray-800 mb-3">
          Câu {questionIndex + 1}
        </div>
      )}
      {renderQuestion()}
    </div>
  );
};

export default EnhancedQuestionPreview;
