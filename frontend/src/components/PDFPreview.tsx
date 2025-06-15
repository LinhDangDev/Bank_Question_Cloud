import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Clock, BookOpen } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  topic: string;
}

interface ExamPackage {
  id: number;
  title: string;
  subject: string;
  grade: string;
  questionCount: number;
  difficulty: string;
}

interface PDFPreviewProps {
  examTitle: string;
  examInstructions: string;
  selectedPackage: ExamPackage | null;
  questions: Question[];
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  examTitle,
  examInstructions,
  selectedPackage,
  questions
}) => {
  if (!selectedPackage) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>Vui lòng chọn một gói đề để xem trước</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Xem trước PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-inner max-h-[70vh] overflow-y-auto">
            {/* PDF Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {examTitle}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Môn: {selectedPackage.subject}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Lớp: {selectedPackage.grade}</span>
                </div>
              </div>
              <Badge className="mb-4">{selectedPackage.difficulty}</Badge>
            </div>

            <Separator className="mb-6" />

            {/* Instructions */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Hướng dẫn làm bài:</h3>
              <p className="text-sm text-gray-700">{examInstructions}</p>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-800 flex-1">
                      {question.question}
                    </h4>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {question.topic}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 ml-4">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`text-sm p-2 rounded ${
                          optionIndex === question.correct
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>

                  {index < questions.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>Đề thi được tạo bởi Hệ thống rút trích đề thi PDF</p>
              <p>Tổng số câu hỏi: {questions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFPreview;
