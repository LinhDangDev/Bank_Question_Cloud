import React from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, Users, Edit3, FileText, Volume2, Image as ImageIcon } from 'lucide-react';
import MediaRenderer from './MediaRenderer';

interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
  letter?: string;
}

interface Question {
  id: string;
  content: string;
  type: 'single' | 'group' | 'fill-in-blank' | 'multi-choice';
  answers?: Answer[];
  childQuestions?: Question[];
  groupContent?: string;
  clo?: string;
  hasFillInBlanks?: boolean;
  blankMarkers?: string[];
  questionNumber?: number;
  mediaReferences?: Array<{
    type: 'audio' | 'image';
    fileName: string;
    uploadedUrl?: string;
  }>;
}

// Utility function to render content with media and fill-in-blank highlighting
export const renderQuestionContent = (content: string, hasFillInBlanks = false) => {
  if (!content) return null;

  let processedContent = content;

  // Process media references
  processedContent = processedContent.replace(
    /\[audio:\s*([^\]]+)\]/gi,
    '<div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md border border-blue-300 my-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.617l3.766-2.793a1 1 0 011.617.793z"></path><path d="M14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z"></path></svg><span class="text-sm font-medium">Audio: $1</span></div>'
  );

  processedContent = processedContent.replace(
    /\[image:\s*([^\]]+)\]/gi,
    '<div class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-md border border-green-300 my-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg><span class="text-sm font-medium">Hình ảnh: $1</span></div>'
  );

  // Highlight fill-in-blank placeholders
  if (hasFillInBlanks) {
    processedContent = processedContent.replace(
      /\{<(\d+)>\}_{5,}|\{<(\d+)>\}/g,
      '<span class="inline-flex items-center px-2 py-1 mx-1 text-sm font-bold bg-yellow-200 text-yellow-900 rounded-md border-2 border-yellow-400 shadow-sm">Chỗ trống $1$2</span>'
    );

    // Also highlight underscores used as blanks
    processedContent = processedContent.replace(
      /_{3,}/g,
      '<span class="inline-flex items-center px-2 py-1 mx-1 text-sm font-bold bg-yellow-200 text-yellow-900 rounded-md border-2 border-yellow-400 shadow-sm">_____</span>'
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

// Single Choice Question Renderer
export const SingleChoiceRenderer: React.FC<{ question: Question }> = ({ question }) => {
  const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="space-y-4">
      {/* Question Content */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Circle className="w-4 h-4" />
          Câu hỏi trắc nghiệm đơn:
        </h4>
        <div className="prose prose-sm max-w-none text-gray-800">
          {renderQuestionContent(question.content, question.hasFillInBlanks)}
        </div>
      </div>

      {/* Media Files */}
      {question.mediaReferences && question.mediaReferences.length > 0 && (
        <MediaRenderer mediaReferences={question.mediaReferences} />
      )}

      {/* Answers */}
      {question.answers && question.answers.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-700">Các lựa chọn:</h5>
          {question.answers.map((answer, index) => {
            const letter = answerLetters[index] || `${index + 1}`;
            const isCorrect = answer.isCorrect;

            return (
              <div
                key={answer.id}
                className={`flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                  isCorrect
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-md ring-2 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCorrect
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {letter}
                </div>

                <div className="flex-1 min-w-0">
                  {renderQuestionContent(answer.content)}
                </div>

                {isCorrect && (
                  <div className="flex-shrink-0 flex items-center gap-2 sm:ml-auto">
                    <div className="relative">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 drop-shadow-sm" />
                      <div className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border border-green-400 font-semibold text-xs sm:text-sm">
                      ✓ Đáp án đúng
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Group Question Renderer
export const GroupQuestionRenderer: React.FC<{ question: Question }> = ({ question }) => {
  return (
    <div className="space-y-6">
      {/* Group Content */}
      {question.groupContent && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Nội dung nhóm câu hỏi:
          </h4>
          <div className="prose prose-sm max-w-none text-gray-800 bg-white p-4 rounded border">
            {renderQuestionContent(question.groupContent, question.hasFillInBlanks)}
          </div>
        </div>
      )}

      {/* Child Questions */}
      {question.childQuestions && question.childQuestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Các câu hỏi con ({question.childQuestions.length})
          </h4>
          {question.childQuestions.map((child, index) => (
            <div key={child.id} className="ml-4 p-4 border-l-4 border-purple-300 bg-purple-50/30 rounded-r-lg">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 font-semibold">
                  Câu {index + 1}
                </Badge>
                {child.clo && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    {child.clo}
                  </Badge>
                )}
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Nội dung:</h5>
                <div className="bg-white p-3 rounded-md border">
                  {renderQuestionContent(child.content, child.hasFillInBlanks)}
                </div>
              </div>

              {/* Child Question Answers */}
              {child.answers && child.answers.length > 0 && (
                <SingleChoiceRenderer question={child} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Fill-in-Blank Question Renderer
export const FillInBlankRenderer: React.FC<{ question: Question }> = ({ question }) => {
  return (
    <div className="space-y-4">
      {/* Question Content with highlighted blanks */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
          <Edit3 className="w-4 h-4" />
          Câu hỏi điền khuyết:
        </h4>
        <div className="prose prose-sm max-w-none text-gray-800 bg-white p-4 rounded border">
          {renderQuestionContent(question.content, true)}
        </div>
      </div>

      {/* Blank markers info */}
      {question.blankMarkers && question.blankMarkers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h5 className="text-sm font-semibold text-yellow-800 mb-2">
            Các chỗ trống được đánh dấu:
          </h5>
          <div className="flex flex-wrap gap-2">
            {question.blankMarkers.map((marker, index) => (
              <Badge key={index} variant="outline" className="bg-yellow-100 text-yellow-800">
                {marker}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Answers for fill-in-blank */}
      {question.answers && question.answers.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-700">Đáp án cho các chỗ trống:</h5>
          {question.answers.map((answer, index) => (
            <div
              key={answer.id}
              className="flex items-start gap-3 p-3 rounded-lg border-2 border-green-500 bg-green-50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-green-500 text-white">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {renderQuestionContent(answer.content)}
              </div>

              <div className="flex-shrink-0">
                <Badge className="bg-green-500 text-white">
                  Đáp án đúng
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Multi-Choice Question Renderer
export const MultiChoiceRenderer: React.FC<{ question: Question }> = ({ question }) => {
  const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const correctAnswers = question.answers?.filter(a => a.isCorrect) || [];

  return (
    <div className="space-y-4">
      {/* Question Content */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Câu hỏi đa lựa chọn ({correctAnswers.length} đáp án đúng):
        </h4>
        <div className="prose prose-sm max-w-none text-gray-800">
          {renderQuestionContent(question.content, question.hasFillInBlanks)}
        </div>
      </div>

      {/* Answers */}
      {question.answers && question.answers.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-700">Các lựa chọn:</h5>
          {question.answers.map((answer, index) => {
            const letter = answerLetters[index] || `${index + 1}`;
            const isCorrect = answer.isCorrect;

            return (
              <div
                key={answer.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                  isCorrect
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-md ring-2 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCorrect
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {letter}
                </div>

                <div className="flex-1 min-w-0">
                  {renderQuestionContent(answer.content)}
                </div>

                {isCorrect && (
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className="relative">
                      <CheckCircle className="w-6 h-6 text-green-500 drop-shadow-sm" />
                      <div className="absolute inset-0 w-6 h-6 bg-green-400 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border border-green-400 font-semibold">
                      ✓ Đáp án đúng
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
