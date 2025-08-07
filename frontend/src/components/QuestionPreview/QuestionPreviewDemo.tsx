import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import EnhancedQuestionPreview from './EnhancedQuestionPreview';
import { QuestionType } from '../../enums/question-type.enum';

const QuestionPreviewDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('single');

  // Sample questions for demonstration
  const sampleQuestions = {
    single: {
      id: '1',
      type: QuestionType.SINGLE_CHOICE,
      clo: 'CLO1',
      content: 'Trong SQL, lệnh nào được sử dụng để truy vấn dữ liệu từ bảng?',
      answers: [
        { id: 'a1', content: 'SELECT', isCorrect: true, order: 0, letter: 'A' },
        { id: 'a2', content: 'INSERT', isCorrect: false, order: 1, letter: 'B' },
        { id: 'a3', content: 'UPDATE', isCorrect: false, order: 2, letter: 'C' },
        { id: 'a4', content: 'DELETE', isCorrect: false, order: 3, letter: 'D' }
      ]
    },

    multiChoice: {
      id: '2',
      type: QuestionType.MULTIPLE_CHOICE,
      clo: 'CLO2',
      content: 'Những loại cơ sở dữ liệu nào sau đây là phổ biến? (Chọn nhiều đáp án)',
      answers: [
        { id: 'a1', content: 'Relational Database (MySQL, PostgreSQL)', isCorrect: true, order: 0, letter: 'A' },
        { id: 'a2', content: 'NoSQL Database (MongoDB, Redis)', isCorrect: true, order: 1, letter: 'B' },
        { id: 'a3', content: 'Graph Database (Neo4j)', isCorrect: true, order: 2, letter: 'C' },
        { id: 'a4', content: 'Spreadsheet (Excel)', isCorrect: false, order: 3, letter: 'D' }
      ]
    },

    fillInBlank: {
      id: '3',
      type: QuestionType.FILL_IN_BLANK,
      clo: 'CLO3',
      content: 'Hoàn thành câu lệnh SQL sau: {<1>}_____ * {<2>}_____ users {<3>}_____ age > 18;',
      hasFillInBlanks: true,
      blankMarkers: ['{<1>}', '{<2>}', '{<3>}'],
      answers: [
        { id: 'a1', content: 'SELECT', isCorrect: true, order: 0 },
        { id: 'a2', content: 'FROM', isCorrect: true, order: 1 },
        { id: 'a3', content: 'WHERE', isCorrect: true, order: 2 }
      ]
    },

    group: {
      id: '4',
      type: QuestionType.GROUP,
      clo: 'CLO4',
      groupContent: `
        <p><strong>Đọc đoạn văn sau và trả lời các câu hỏi:</strong></p>
        <p>Cơ sở dữ liệu quan hệ (Relational Database) là một loại cơ sở dữ liệu lưu trữ và cung cấp quyền truy cập vào các điểm dữ liệu có liên quan đến nhau. Cơ sở dữ liệu quan hệ dựa trên mô hình dữ liệu quan hệ, một cách trực quan, đơn giản để biểu diễn dữ liệu trong bảng.</p>
        <p>Trong mô hình quan hệ, mỗi hàng trong bảng là một bản ghi với một ID duy nhất được gọi là khóa. Các cột của bảng chứa các thuộc tính của dữ liệu, và mỗi bản ghi thường có một giá trị cho mỗi thuộc tính, giúp dễ dàng thiết lập mối quan hệ giữa các điểm dữ liệu.</p>
      `,
      content: 'Nhóm câu hỏi về Cơ sở dữ liệu quan hệ',
      childQuestions: [
        {
          id: '4a',
          type: QuestionType.SINGLE,
          content: 'Cơ sở dữ liệu quan hệ dựa trên mô hình nào?',
          answers: [
            { id: 'a1', content: 'Mô hình dữ liệu quan hệ', isCorrect: true, order: 0, letter: 'A' },
            { id: 'a2', content: 'Mô hình dữ liệu phân cấp', isCorrect: false, order: 1, letter: 'B' },
            { id: 'a3', content: 'Mô hình dữ liệu mạng', isCorrect: false, order: 2, letter: 'C' },
            { id: 'a4', content: 'Mô hình dữ liệu hướng đối tượng', isCorrect: false, order: 3, letter: 'D' }
          ]
        },
        {
          id: '4b',
          type: QuestionType.SINGLE,
          content: 'Trong mô hình quan hệ, ID duy nhất của mỗi hàng được gọi là gì?',
          answers: [
            { id: 'a1', content: 'Khóa ngoại', isCorrect: false, order: 0, letter: 'A' },
            { id: 'a2', content: 'Khóa chính', isCorrect: true, order: 1, letter: 'B' },
            { id: 'a3', content: 'Chỉ mục', isCorrect: false, order: 2, letter: 'C' },
            { id: 'a4', content: 'Thuộc tính', isCorrect: false, order: 3, letter: 'D' }
          ]
        }
      ]
    },

    withMedia: {
      id: '5',
      type: QuestionType.SINGLE,
      clo: 'CLO2',
      content: 'Nghe đoạn audio sau và xem hình ảnh để trả lời câu hỏi. [audio: database_intro.mp3] [image: database_schema.png] Loại mối quan hệ nào được thể hiện trong sơ đồ?',
      answers: [
        { id: 'a1', content: 'One-to-One', isCorrect: false, order: 0, letter: 'A' },
        { id: 'a2', content: 'One-to-Many', isCorrect: true, order: 1, letter: 'B' },
        { id: 'a3', content: 'Many-to-Many', isCorrect: false, order: 2, letter: 'C' },
        { id: 'a4', content: 'Không có mối quan hệ', isCorrect: false, order: 3, letter: 'D' }
      ],
      mediaReferences: [
        { type: 'audio' as const, fileName: 'database_intro.mp3' },
        { type: 'image' as const, fileName: 'database_schema.png' }
      ]
    }
  };

  const demoOptions = [
    { key: 'single', label: 'Trắc nghiệm đơn', color: 'bg-blue-100 text-blue-800' },
    { key: 'multiChoice', label: 'Đa lựa chọn', color: 'bg-green-100 text-green-800' },
    { key: 'fillInBlank', label: 'Điền khuyết', color: 'bg-orange-100 text-orange-800' },
    { key: 'group', label: 'Câu hỏi nhóm', color: 'bg-purple-100 text-purple-800' },
    { key: 'withMedia', label: 'Có media', color: 'bg-pink-100 text-pink-800' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Question Preview Demo
        </h1>
        <p className="text-gray-600">
          Xem trước các loại câu hỏi với UI được cải thiện
        </p>
      </div>

      {/* Demo Selection */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Chọn loại câu hỏi để xem demo:</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {demoOptions.map((option) => (
            <Button
              key={option.key}
              variant={selectedDemo === option.key ? "default" : "outline"}
              onClick={() => setSelectedDemo(option.key)}
              className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3"
            >
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${option.color}`} />
              <span className="truncate">{option.label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Question Preview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Xem trước câu hỏi:</h2>
          <Badge variant="outline" className="text-sm">
            {demoOptions.find(opt => opt.key === selectedDemo)?.label}
          </Badge>
        </div>

        <EnhancedQuestionPreview
          question={sampleQuestions[selectedDemo as keyof typeof sampleQuestions]}
          showExpanded={true}
        />
      </div>

      {/* Features Highlight */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          ✨ Tính năng được cải thiện:
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>Phân biệt rõ ràng nội dung câu hỏi và đáp án</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>Đánh số đáp án (A, B, C, D) với visual indicators</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>Highlight đáp án đúng với màu xanh và checkmark</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>Hiển thị chỗ trống trong câu hỏi điền khuyết</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>Cấu trúc phân cấp cho câu hỏi nhóm</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>Badges cho loại câu hỏi và CLO</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuestionPreviewDemo;
