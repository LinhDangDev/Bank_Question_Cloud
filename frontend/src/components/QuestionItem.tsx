import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { getCloColor, getDifficultyColor, getDifficultyText } from '../utils/theme';
import LazyMediaPlayer from './LazyMediaPlayer';
import { formatChildQuestionContent, formatParentQuestionContent, cleanContent } from '../utils/latex';
import { convertMediaMarkupToHtml, hasMediaMarkup } from '../utils/mediaMarkup';
import { processMediaContent, detectMediaFormat } from '../utils/mediaContentProcessor';

export interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: string;
  content: string;
  clo?: string | null;
  type: 'single-choice' | 'multi-choice' | 'fill-blank' | 'group';
  answers: Answer[];
  childQuestions?: Question[];
  groupContent?: string;
  capDo?: number;
}

interface QuestionItemProps {
  question: Question;
  index: number;
  selected?: boolean;
  onSelect?: (questionId: string, selected: boolean) => void;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  selected = false,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Render content with LaTeX and media (supports both HTML tags and markup)
  const renderContent = (content: string, isChildQuestion = false, questionNumber = 0) => {
    let processedContent = content;

    // Detect media format and check if content has any media
    const mediaFormat = detectMediaFormat(content);
    const hasMedia = mediaFormat.formatType !== 'none';

    if (hasMedia) {
      // Process media content (handles both HTML tags and markup)
      processedContent = processMediaContent(processedContent);

      // Then apply LaTeX formatting
      if (isChildQuestion) {
        processedContent = formatChildQuestionContent(processedContent, questionNumber);
      } else if (question.isGroup) {
        processedContent = formatParentQuestionContent(processedContent);
      } else {
        processedContent = cleanContent(processedContent);
      }

      // Render HTML directly for media content
      return (
        <div
          className="question-content prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      );
    } else {
      // For content without media, use MathRenderer as before
      if (isChildQuestion) {
        processedContent = formatChildQuestionContent(processedContent, questionNumber);
      } else if (question.isGroup) {
        processedContent = formatParentQuestionContent(processedContent);
      } else {
        processedContent = cleanContent(processedContent);
      }

      return <MathRenderer content={processedContent} />;
    }
  };

  // Function to preprocess content for better LaTeX rendering
  const preprocessLatex = (content: string): string => {
    if (!content) return '';

    // Replace LaTeX expressions with proper markdown math format
    let result = content;

    // Convert $...$ to markdown math inline format
    result = result.replace(/\$([^$]+)\$/g, '$$$1$$');

    // Convert \(...\) to markdown math inline format
    result = result.replace(/\\\(([^)]+)\\\)/g, '$$$1$$');

    // Convert \[...\] or $$...$$ to markdown math block format
    result = result.replace(/\\\[([^]]+)\\\]/g, '$$$$1$$$$');
    result = result.replace(/\$\$([^$]+)\$\$/g, '$$$$1$$$$');

    // Handle specific LaTeX commands that might need special handling
    result = result.replace(/\\forall/g, '$\\forall$');
    result = result.replace(/\\exists/g, '$\\exists$');
    result = result.replace(/\\in/g, '$\\in$');
    result = result.replace(/\\subset/g, '$\\subset$');
    result = result.replace(/\\cup/g, '$\\cup$');
    result = result.replace(/\\cap/g, '$\\cap$');
    result = result.replace(/\\rightarrow/g, '$\\rightarrow$');
    result = result.replace(/\\Rightarrow/g, '$\\Rightarrow$');

    return result;
  };

  // Render a single answer
  const renderAnswer = (answer: Answer, idx: number) => {
    return (
      <div
        key={answer.id}
        className={`flex items-center p-2 rounded-md ${
          answer.isCorrect
            ? 'bg-green-50 border border-green-300'
            : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
          answer.isCorrect
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {String.fromCharCode(65 + idx)}
        </div>
        <div className="flex-1 min-w-0">
          {renderContent(answer.content)}
        </div>
        {answer.isCorrect && (
          <div className="flex-shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded ml-2 font-medium">
            Đáp án
          </div>
        )}
      </div>
    );
  };

  // Render a child question (for group questions)
  const renderChildQuestion = (childQuestion: Question, childIdx: number) => {
    return (
      <div key={childQuestion.id} className="border rounded-md bg-gray-50 p-3 mb-3">
        <div className="font-medium mb-2 flex items-center gap-2">
          <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
            Câu {childIdx + 1}
          </div>
          {childQuestion.clo && (
            <span className={`${getCloColor(childQuestion.clo)} text-xs rounded px-2 py-0.5`}>
              {childQuestion.clo}
            </span>
          )}
        </div>

        <div className="mb-3">
          {renderContent(childQuestion.content, true, childIdx + 1)}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {childQuestion.answers.map((answer, idx) => renderAnswer(answer, idx))}
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white mb-4">
      {/* Question header */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2 flex-1">
          {onSelect && (
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={selected}
              onChange={(e) => onSelect(question.id, e.target.checked)}
            />
          )}
          <div className="text-sm font-medium text-gray-700">#{index + 1}</div>
          {question.clo && (
            <span className={`${getCloColor(question.clo)} text-xs rounded px-2 py-0.5`}>
              {question.clo}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            question.type === 'fill-blank'
              ? 'bg-blue-100 text-blue-700'
              : question.type === 'multi-choice'
                ? 'bg-yellow-100 text-yellow-700'
                : question.type === 'group'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-green-100 text-green-700'
          }`}>
            {question.type === 'fill-blank'
              ? 'Điền khuyết'
              : question.type === 'multi-choice'
                ? 'Nhiều lựa chọn'
                : question.type === 'group'
                  ? 'Câu hỏi nhóm'
                  : 'Đơn lựa chọn'}
          </span>
          {question.capDo && (
            <span className={`${getDifficultyColor(question.capDo)} text-xs rounded px-2 py-0.5`}>
              {getDifficultyText(question.capDo)}
            </span>
          )}
        </div>
        </div>

      {/* Question content */}
      <div className="p-4">
        <div className="mb-3 text-gray-800">
          {renderContent(question.content)}
        </div>

        {/* Multimedia content */}
        <div className="mb-3">
          <LazyMediaPlayer maCauHoi={question.id} showFileName={false} />
        </div>

        {/* For group questions */}
        {question.type === 'group' && (
          <>
            {question.groupContent && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
                {renderContent(question.groupContent)}
          </div>
        )}

            {/* Button to toggle showing child questions */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full border border-gray-200 flex items-center justify-between p-2 rounded-md bg-white hover:bg-gray-50 mb-3"
          >
              <span className="text-sm">
                {expanded ? 'Ẩn câu hỏi con' : `Xem ${question.childQuestions?.length || 0} câu hỏi con`}
              </span>
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Child questions */}
            {expanded && question.childQuestions && (
              <div className="space-y-2">
                {question.childQuestions.map((childQuestion, idx) =>
                  renderChildQuestion(childQuestion, idx)
          )}
        </div>
            )}
          </>
        )}

        {/* For non-group questions */}
        {question.type !== 'group' && question.answers && question.answers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.answers.map((answer, idx) => renderAnswer(answer, idx))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionItem;
