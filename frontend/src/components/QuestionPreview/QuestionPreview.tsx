import React, { useState, useEffect } from 'react';
import {
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  BarChart3,
  FileText,
  Users,
  Image,
  Volume2,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { QuestionPreviewProps, QuestionType, MediaType } from '../../types/question-parser.types';

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  questions,
  onQuestionSelect,
  selectedQuestionIds = [],
  showStatistics = true,
  showErrors = true,
  errors = [],
  warnings = [],
  isLoading = false,
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewCss, setPreviewCss] = useState<string>('');

  // Calculate statistics
  const statistics = React.useMemo(() => {
    const stats = {
      totalQuestions: questions.length,
      singleQuestions: 0,
      groupQuestions: 0,
      fillInBlankQuestions: 0,
      questionsWithMedia: 0,
      totalMediaFiles: 0,
      cloDistribution: {} as Record<string, number>,
      difficultyDistribution: {} as Record<string, number>
    };

    questions.forEach(question => {
      // Count question types
      switch (question.type) {
        case QuestionType.SINGLE:
          stats.singleQuestions++;
          break;
        case QuestionType.GROUP:
          stats.groupQuestions++;
          break;
        case QuestionType.FILL_IN_BLANK:
          stats.fillInBlankQuestions++;
          break;
      }

      // Count media files
      if (question.mediaReferences && question.mediaReferences.length > 0) {
        stats.questionsWithMedia++;
        stats.totalMediaFiles += question.mediaReferences.length;
      }

      // Count CLO distribution
      if (question.clo) {
        stats.cloDistribution[question.clo] = (stats.cloDistribution[question.clo] || 0) + 1;
      }

      // Count child questions for groups
      if (question.childQuestions) {
        question.childQuestions.forEach(child => {
          if (child.clo) {
            stats.cloDistribution[child.clo] = (stats.cloDistribution[child.clo] || 0) + 1;
          }
          if (child.mediaReferences && child.mediaReferences.length > 0) {
            stats.questionsWithMedia++;
            stats.totalMediaFiles += child.mediaReferences.length;
          }
        });
      }
    });

    return stats;
  }, [questions]);

  const toggleGroupExpansion = (questionId: string) => {
    setExpandedGroups(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleQuestionSelect = (questionId: string, selected: boolean) => {
    if (onQuestionSelect) {
      onQuestionSelect(questionId);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.SINGLE:
        return 'Đơn lựa chọn';
      case QuestionType.GROUP:
        return 'Nhóm câu hỏi';
      case QuestionType.FILL_IN_BLANK:
        return 'Điền khuyết';
      case QuestionType.PARENT:
        return 'Câu hỏi cha';
      default:
        return 'Không xác định';
    }
  };

  const getQuestionTypeBadgeColor = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.SINGLE:
        return 'bg-blue-100 text-blue-800';
      case QuestionType.GROUP:
        return 'bg-green-100 text-green-800';
      case QuestionType.FILL_IN_BLANK:
        return 'bg-orange-100 text-orange-800';
      case QuestionType.PARENT:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCloColor = (clo: string): string => {
    const cloNumber = clo.match(/\d+/)?.[0];
    switch (cloNumber) {
      case '1': return 'bg-green-100 text-green-700';
      case '2': return 'bg-blue-100 text-blue-700';
      case '3': return 'bg-purple-100 text-purple-700';
      case '4': return 'bg-orange-100 text-orange-700';
      case '5': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-indigo-100 text-indigo-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang xử lý câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có câu hỏi nào</h3>
        <p className="text-gray-600">Tải lên file Word hoặc nhập nội dung để xem trước câu hỏi</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Section */}
      {showStatistics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Thống kê câu hỏi</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalQuestions}</div>
              <div className="text-sm text-gray-600">Tổng câu hỏi</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.singleQuestions}</div>
              <div className="text-sm text-gray-600">Đơn lựa chọn</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.groupQuestions}</div>
              <div className="text-sm text-gray-600">Nhóm câu hỏi</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{statistics.fillInBlankQuestions}</div>
              <div className="text-sm text-gray-600">Điền khuyết</div>
            </div>
          </div>

          {/* Media Statistics */}
          {statistics.totalMediaFiles > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                <span>{statistics.questionsWithMedia} câu hỏi có media</span>
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className="w-4 h-4" />
                <span>{statistics.totalMediaFiles} file media</span>
              </div>
            </div>
          )}

          {/* CLO Distribution */}
          {Object.keys(statistics.cloDistribution).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Phân bố CLO:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statistics.cloDistribution).map(([clo, count]) => (
                  <span key={clo} className={`px-2 py-1 rounded-full text-xs font-medium ${getCloColor(clo)}`}>
                    {clo}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Errors and Warnings */}
      {showErrors && (errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-3">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">Lỗi ({errors.length})</h4>
              </div>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Cảnh báo ({warnings.length})</h4>
              </div>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.order || index} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Question Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {onQuestionSelect && (
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(question.order?.toString() || index.toString())}
                      onChange={(e) => handleQuestionSelect(
                        question.order?.toString() || index.toString(),
                        e.target.checked
                      )}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeBadgeColor(question.type)}`}>
                      {getQuestionTypeLabel(question.type)}
                    </span>
                    {question.clo && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCloColor(question.clo)}`}>
                        {question.clo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Group Question Toggle */}
                {(question.type === QuestionType.GROUP || question.type === QuestionType.PARENT) && (
                  <button
                    onClick={() => toggleGroupExpansion(question.order?.toString() || index.toString())}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                  >
                    {expandedGroups.includes(question.order?.toString() || index.toString()) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {question.childQuestions ? `${question.childQuestions.length} câu con` : 'Xem chi tiết'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Content */}
            <div className="p-4">
              <div className="prose max-w-none">
                <div
                  className="question-content"
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />
              </div>

              {/* Media References */}
              {question.mediaReferences && question.mediaReferences.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.mediaReferences.map((media, mediaIndex) => (
                    <div key={mediaIndex} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                      {media.type === MediaType.AUDIO ? (
                        <Volume2 className="w-3 h-3" />
                      ) : (
                        <Image className="w-3 h-3" />
                      )}
                      <span>{media.fileName}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Answers for single questions */}
              {question.type === QuestionType.SINGLE && question.answers && question.answers.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.answers.map((answer, answerIndex) => (
                    <div
                      key={answerIndex}
                      className={`flex items-center p-3 rounded-lg border ${
                        answer.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-3 ${
                        answer.isCorrect
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {answer.letter}
                      </div>
                      <div className="flex-1">
                        <div dangerouslySetInnerHTML={{ __html: answer.content }} />
                      </div>
                      {answer.isCorrect && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Child Questions for Group Questions */}
              {(question.type === QuestionType.GROUP || question.type === QuestionType.PARENT) &&
               expandedGroups.includes(question.order?.toString() || index.toString()) &&
               question.childQuestions && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  {question.childQuestions.map((childQuestion, childIndex) => (
                    <div key={childIndex} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Câu {childIndex + 1}
                        </span>
                        {childQuestion.clo && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCloColor(childQuestion.clo)}`}>
                            {childQuestion.clo}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getQuestionTypeBadgeColor(childQuestion.type)}`}>
                          {getQuestionTypeLabel(childQuestion.type)}
                        </span>
                      </div>

                      <div className="prose max-w-none mb-3">
                        <div dangerouslySetInnerHTML={{ __html: childQuestion.content }} />
                      </div>

                      {/* Child Question Answers */}
                      {childQuestion.answers && childQuestion.answers.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {childQuestion.answers.map((answer, answerIndex) => (
                            <div
                              key={answerIndex}
                              className={`flex items-center p-2 rounded border ${
                                answer.isCorrect
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                                answer.isCorrect
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {answer.letter}
                              </div>
                              <div className="flex-1 text-sm">
                                <div dangerouslySetInnerHTML={{ __html: answer.content }} />
                              </div>
                              {answer.isCorrect && (
                                <CheckCircle className="w-3 h-3 text-green-600 ml-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionPreview;
