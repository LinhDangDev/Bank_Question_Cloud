import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import NewQuestionPreview from './NewQuestionPreview';

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

const NewQuestionPreviewDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('single');

  // Sample questions based on the format provided
  const sampleQuestions: Record<string, ParsedQuestion> = {
    single: {
      type: 'single',
      content: 'Tìm từ khác nghĩa với các từ còn lại',
      clo: '1',
      order: 1,
      answers: [
        { letter: 'A', content: 'Good bye', isCorrect: true, order: 0 },
        { letter: 'B', content: 'こんにちは.', isCorrect: false, order: 1 },
        { letter: 'C', content: '안녕하세요.', isCorrect: false, order: 2 },
        { letter: 'D', content: '你好.', isCorrect: false, order: 3 }
      ]
    },
    group: {
      type: 'parent',
      content: 'Questions {<1>} – {<2>} refer to the following passage.<br/>Probably the most important factor governing the severity of forest fires is weather. Hot, dry weather lowers the moisture content of fuels. Once a fire has started, wind is extremely critical because it influences the oxygen supply and the rate of spread...',
      order: 1,
      answers: [],
      hasFillInBlanks: false,
      childQuestions: [
        {
          type: 'group',
          content: 'In this passage, the author\'s main purpose is to …',
          clo: '1',
          order: 1,
          placeholderNumber: 1,
          answers: [
            { letter: 'A', content: 'argue', isCorrect: false, order: 0 },
            { letter: 'B', content: '<u>inform</u>', isCorrect: true, order: 1 },
            { letter: 'C', content: 'persuade', isCorrect: false, order: 2 },
            { letter: 'D', content: 'entertain', isCorrect: false, order: 3 }
          ]
        },
        {
          type: 'group',
          content: 'Which of the following best describes the organization of the passage?',
          clo: '1',
          order: 2,
          placeholderNumber: 2,
          answers: [
            { letter: 'A', content: 'A comparison and contrast of the factors governing forest fires is followed by a list of causes.', isCorrect: false, order: 0 },
            { letter: 'B', content: '<strong>A description of the conditions affecting forest fires is followed by a description of the causes.</strong>', isCorrect: true, order: 1 },
            { letter: 'C', content: 'An analysis of factors related to forest fires is followed by an argument against the causes of fires.', isCorrect: false, order: 2 },
            { letter: 'D', content: 'Several generalizations about forest fires are followed by a series of conclusions.', isCorrect: false, order: 3 }
          ]
        }
      ]
    },
    fillBlank: {
      type: 'parent',
      content: 'Questions {<1>} – {<5>} refer to the following passage.<br/>Travelling to all corners of the world gets easier and easier. We live in a global village, but this {<1>}_____ mean that we all behave the same way. Many countries have rules about what you should and {<2>} _____ do. In Asian and Muslim countries, you shouldn\'t reveal your body, especially women who should wear long-sleeved blouses and skirts {<3>} _____ the knee. In Japan, you should take off your shoes when {<4>} _____ a house or a restaurant. Remember {<5>} _____ them neatly together facing the door you came in. This is also true in China, Korea and Thailand.',
      clo: '3',
      order: 1,
      answers: [],
      hasFillInBlanks: true,
      childQuestions: [
        {
          type: 'fill-in-blank',
          content: 'Chỗ trống số 1',
          order: 1,
          placeholderNumber: 1,
          answers: [
            { letter: 'A', content: '<u>doesn\'t</u>', isCorrect: true, order: 0 },
            { letter: 'B', content: 'didn\'t', isCorrect: false, order: 1 },
            { letter: 'C', content: 'don\'t', isCorrect: false, order: 2 },
            { letter: 'D', content: 'isn\'t', isCorrect: false, order: 3 }
          ]
        },
        {
          type: 'fill-in-blank',
          content: 'Chỗ trống số 2',
          order: 2,
          placeholderNumber: 2,
          answers: [
            { letter: 'A', content: 'may not', isCorrect: false, order: 0 },
            { letter: 'B', content: '<b>shouldn\'t</b>', isCorrect: true, order: 1 },
            { letter: 'C', content: 'don\'t', isCorrect: false, order: 2 },
            { letter: 'D', content: 'can\'t', isCorrect: false, order: 3 }
          ]
        },
        {
          type: 'fill-in-blank',
          content: 'Chỗ trống số 3',
          order: 3,
          placeholderNumber: 3,
          answers: [
            { letter: 'A', content: 'above', isCorrect: false, order: 0 },
            { letter: 'B', content: 'over', isCorrect: false, order: 1 },
            { letter: 'C', content: 'on', isCorrect: false, order: 2 },
            { letter: 'D', content: '__below__', isCorrect: true, order: 3 }
          ]
        },
        {
          type: 'fill-in-blank',
          content: 'Chỗ trống số 4',
          order: 4,
          placeholderNumber: 4,
          answers: [
            { letter: 'A', content: 'going', isCorrect: false, order: 0 },
            { letter: 'B', content: 'walking', isCorrect: false, order: 1 },
            { letter: 'C', content: '<strong>entering</strong>', isCorrect: true, order: 2 },
            { letter: 'D', content: 'coming', isCorrect: false, order: 3 }
          ]
        },
        {
          type: 'fill-in-blank',
          content: 'Chỗ trống số 5',
          order: 5,
          placeholderNumber: 5,
          answers: [
            { letter: 'A', content: 'placing', isCorrect: false, order: 0 },
            { letter: 'B', content: '<u>to place</u>', isCorrect: true, order: 1 },
            { letter: 'C', content: 'place', isCorrect: false, order: 2 },
            { letter: 'D', content: 'placed', isCorrect: false, order: 3 }
          ]
        }
      ]
    }
  };

  const demoOptions = [
    { key: 'single', label: 'Câu hỏi đơn (DON)', description: 'Câu hỏi trắc nghiệm đơn giản với 4 lựa chọn' },
    { key: 'group', label: 'Câu hỏi nhóm (NHOM)', description: 'Câu hỏi nhóm với đoạn văn và nhiều câu hỏi con' },
    { key: 'fillBlank', label: 'Câu hỏi điền khuyết (DIENKHUYET)', description: 'Câu hỏi điền vào chỗ trống với nhiều lựa chọn' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Demo Xem Trước Câu Hỏi Mới
        </h1>
        <p className="text-gray-600">
          Xem trước các loại câu hỏi với format mới: (DON), (NHOM), (DIENKHUYET)
        </p>
      </div>

      {/* Demo Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Chọn loại câu hỏi để xem demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDemo} onValueChange={setSelectedDemo}>
            <TabsList className="grid w-full grid-cols-3">
              {demoOptions.map((option) => (
                <TabsTrigger key={option.key} value={option.key} className="text-sm">
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {demoOptions.map((option) => (
              <TabsContent key={option.key} value={option.key} className="mt-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-1">{option.label}</h3>
                  <p className="text-sm text-blue-700">{option.description}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Question Preview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Xem trước câu hỏi:</h2>
          <Badge variant="outline" className="text-sm">
            {demoOptions.find(opt => opt.key === selectedDemo)?.label}
          </Badge>
        </div>

        <NewQuestionPreview
          question={sampleQuestions[selectedDemo]}
          showExpanded={true}
        />
      </div>

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Tính năng mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✅ Đã cải thiện:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Nhận diện đúng marker (DON), (NHOM), (DIENKHUYET)</li>
                <li>• Hiển thị CLO information</li>
                <li>• Highlight đáp án đúng với nhiều format</li>
                <li>• Hỗ trợ underline, bold, strong tags</li>
                <li>• Hiển thị câu hỏi nhóm có thể thu gọn/mở rộng</li>
                <li>• Phân biệt rõ ràng các loại câu hỏi</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">🔧 Kỹ thuật:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Enhanced parsing logic</li>
                <li>• Python mammoth integration</li>
                <li>• Image extraction support</li>
                <li>• Better error handling</li>
                <li>• Improved UI components</li>
                <li>• TypeScript type safety</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewQuestionPreviewDemo;
