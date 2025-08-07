import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Users, 
  Edit3, 
  FileText,
  Volume2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface ParsedAnswer {
  letter: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

interface ParsedQuestion {
  type: 'single' | 'group' | 'fill-in-blank' | 'parent';
  content: string;
  answers: ParsedAnswer[];
  clo?: string;
  order: number;
  mediaReferences?: string[];
  placeholderNumber?: number;
  childQuestions?: ParsedQuestion[];
  hasFillInBlanks?: boolean;
}

interface NewQuestionPreviewProps {
  question: ParsedQuestion;
  showExpanded?: boolean;
  className?: string;
}

const NewQuestionPreview: React.FC<NewQuestionPreviewProps> = ({
  question,
  showExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(showExpanded);

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'single':
        return {
          label: 'Câu hỏi đơn',
          icon: <FileText className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'group':
        return {
          label: 'Câu hỏi nhóm',
          icon: <Users className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'fill-in-blank':
        return {
          label: 'Điền khuyết',
          icon: <Edit3 className="w-4 h-4" />,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'parent':
        return {
          label: question.hasFillInBlanks ? 'Câu hỏi điền khuyết' : 'Câu hỏi nhóm',
          icon: question.hasFillInBlanks ? <Edit3 className="w-4 h-4" /> : <Users className="w-4 h-4" />,
          color: question.hasFillInBlanks ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-green-100 text-green-800 border-green-200'
        };
      default:
        return {
          label: 'Câu hỏi',
          icon: <FileText className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const renderMediaReferences = (mediaRefs: string[]) => {
    if (!mediaRefs || mediaRefs.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {mediaRefs.map((ref, index) => {
          const isAudio = ref.toLowerCase().includes('audio') || ref.toLowerCase().includes('.mp3') || ref.toLowerCase().includes('.wav');
          const isImage = ref.toLowerCase().includes('image') || ref.toLowerCase().includes('.jpg') || ref.toLowerCase().includes('.png');
          
          return (
            <Badge key={index} variant="outline" className="text-xs">
              {isAudio && <Volume2 className="w-3 h-3 mr-1" />}
              {isImage && <ImageIcon className="w-3 h-3 mr-1" />}
              {ref}
            </Badge>
          );
        })}
      </div>
    );
  };

  const renderAnswers = (answers: ParsedAnswer[]) => {
    if (!answers || answers.length === 0) return null;

    return (
      <div className="space-y-2 mt-3">
        {answers.map((answer, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              answer.isCorrect
                ? 'bg-green-50 border-green-200 text-green-900'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {answer.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium text-sm">
                {answer.letter}.
              </span>
            </div>
            <div className="flex-1">
              <div 
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: answer.content }}
              />
              {answer.isCorrect && (
                <Badge variant="default" className="mt-1 text-xs bg-green-600">
                  Đáp án đúng
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSingleQuestion = () => {
    const typeInfo = getQuestionTypeInfo(question.type);

    return (
      <Card className={`${className} border-l-4 border-l-blue-500`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${typeInfo.color} border`}>
                {typeInfo.icon}
                <span className="ml-1">{typeInfo.label}</span>
              </Badge>
              {question.clo && (
                <Badge variant="outline" className="text-xs">
                  CLO{question.clo}
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-500">#{question.order}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="text-sm leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: question.content }}
          />
          
          {question.mediaReferences && renderMediaReferences(question.mediaReferences)}
          {renderAnswers(question.answers)}
        </CardContent>
      </Card>
    );
  };

  const renderParentQuestion = () => {
    const typeInfo = getQuestionTypeInfo(question.type);
    const hasChildQuestions = question.childQuestions && question.childQuestions.length > 0;

    return (
      <Card className={`${className} border-l-4 ${question.hasFillInBlanks ? 'border-l-purple-500' : 'border-l-green-500'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${typeInfo.color} border`}>
                {typeInfo.icon}
                <span className="ml-1">{typeInfo.label}</span>
              </Badge>
              {hasChildQuestions && (
                <Badge variant="outline" className="text-xs">
                  {question.childQuestions!.length} câu con
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">#{question.order}</span>
              {hasChildQuestions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="text-sm leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: question.content }}
          />
          
          {question.mediaReferences && renderMediaReferences(question.mediaReferences)}
          
          {hasChildQuestions && isExpanded && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>Câu hỏi con:</span>
              </div>
              {question.childQuestions!.map((childQuestion, index) => (
                <div key={index} className="ml-4 border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {question.hasFillInBlanks ? `Chỗ trống ${childQuestion.placeholderNumber || index + 1}` : `Câu ${index + 1}`}
                    </Badge>
                    {childQuestion.clo && (
                      <Badge variant="outline" className="text-xs">
                        CLO{childQuestion.clo}
                      </Badge>
                    )}
                  </div>
                  <div 
                    className="text-sm leading-relaxed mb-2"
                    dangerouslySetInnerHTML={{ __html: childQuestion.content }}
                  />
                  {renderAnswers(childQuestion.answers)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (question.type === 'parent') {
    return renderParentQuestion();
  } else {
    return renderSingleQuestion();
  }
};

export default NewQuestionPreview;
