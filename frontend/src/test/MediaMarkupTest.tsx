/**
 * Media Markup Test Component
 * Author: Linh Dang Dev
 * 
 * Test component to verify media markup conversion functionality
 */

import React from 'react';
import { convertMediaMarkupToHtml, hasMediaMarkup } from '../utils/mediaMarkup';

const MediaMarkupTest: React.FC = () => {
  const testCases = [
    {
      name: "Image markup",
      input: "Xem hình ảnh sau: [IMAGE: er_diagram.webp] và trả lời câu hỏi.",
      expected: "Should show an image"
    },
    {
      name: "Audio markup", 
      input: "Nghe đoạn audio: [AUDIO: sample.mp3] và chọn đáp án đúng.",
      expected: "Should show an audio player"
    },
    {
      name: "Mixed markup",
      input: "Xem [IMAGE: diagram.png] và nghe [AUDIO: explanation.wav] để hiểu bài học.",
      expected: "Should show both image and audio"
    },
    {
      name: "No markup",
      input: "Đây là câu hỏi thông thường không có media.",
      expected: "Should show plain text"
    }
  ];

  const renderTestCase = (testCase: any, index: number) => {
    const hasMedia = hasMediaMarkup(testCase.input);
    const convertedHtml = convertMediaMarkupToHtml(testCase.input);

    return (
      <div key={index} className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-2 text-blue-600">{testCase.name}</h3>
        
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-700 mb-1">Input:</h4>
          <code className="bg-gray-100 p-2 rounded text-sm block">{testCase.input}</code>
        </div>

        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-700 mb-1">Has Media: {hasMedia ? 'Yes' : 'No'}</h4>
        </div>

        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-700 mb-1">Expected:</h4>
          <p className="text-sm text-gray-600">{testCase.expected}</p>
        </div>

        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-700 mb-1">Converted HTML:</h4>
          <code className="bg-gray-100 p-2 rounded text-xs block overflow-x-auto">{convertedHtml}</code>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-1">Rendered Result:</h4>
          <div 
            className="border p-3 rounded bg-gray-50 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: convertedHtml }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Media Markup Test</h1>
      <p className="text-gray-600 mb-6">
        This page tests the media markup conversion functionality. 
        Images should display properly and audio should have working controls.
      </p>
      
      <div className="space-y-4">
        {testCases.map((testCase, index) => renderTestCase(testCase, index))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Images should display with proper styling and error handling</li>
          <li>• Audio players should have controls and multiple format support</li>
          <li>• Media containers should have proper spacing and borders</li>
          <li>• Filenames should be displayed below media elements</li>
          <li>• Error states should be handled gracefully</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaMarkupTest;
