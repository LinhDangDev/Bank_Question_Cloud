import React, { useState } from 'react';
import { convertMediaMarkupToHtml, hasMediaMarkup } from '../utils/mediaMarkup';

interface MediaMarkupTestProps {
  content?: string;
}

const MediaMarkupTest: React.FC<MediaMarkupTestProps> = ({ 
  content = "Test content with [IMAGE: er_diagram.webp] and [AUDIO: sample.mp3]" 
}) => {
  const [testContent, setTestContent] = useState(content);
  const [showRaw, setShowRaw] = useState(false);

  const convertedContent = convertMediaMarkupToHtml(testContent);
  const hasMedia = hasMediaMarkup(testContent);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Media Markup Test Component</h2>
      
      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Test Content:</label>
        <textarea
          value={testContent}
          onChange={(e) => setTestContent(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Enter content with [AUDIO: filename] or [IMAGE: filename] markup"
        />
      </div>

      {/* Controls */}
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showRaw ? 'Show Rendered' : 'Show Raw HTML'}
        </button>
        <span className={`px-3 py-1 rounded text-sm ${hasMedia ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {hasMedia ? 'Has Media Markup' : 'No Media Markup'}
        </span>
      </div>

      {/* Output Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Original Content:</h3>
          <div className="p-3 bg-gray-100 rounded border">
            <code className="text-sm">{testContent}</code>
          </div>
        </div>

        {showRaw ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">Converted HTML:</h3>
            <div className="p-3 bg-gray-100 rounded border">
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                {convertedContent}
              </pre>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-2">Rendered Output:</h3>
            <div className="p-4 bg-white border rounded-lg">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: convertedContent }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Cases */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Quick Test Cases:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Listen to [AUDIO: sample.mp3]",
            "View [IMAGE: diagram.png]", 
            "Study [IMAGE: chart.jpg] and listen to [AUDIO: explanation.wav]",
            "No media content here",
            "Multiple images: [IMAGE: before.png] and [IMAGE: after.png]"
          ].map((testCase, index) => (
            <button
              key={index}
              onClick={() => setTestContent(testCase)}
              className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded border text-sm"
            >
              {testCase}
            </button>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold mb-2">Debug Information:</h4>
        <div className="text-sm space-y-1">
          <div><strong>Has Media:</strong> {hasMedia.toString()}</div>
          <div><strong>Original Length:</strong> {testContent.length}</div>
          <div><strong>Converted Length:</strong> {convertedContent.length}</div>
          <div><strong>Contains Audio Tags:</strong> {convertedContent.includes('<audio').toString()}</div>
          <div><strong>Contains Image Tags:</strong> {convertedContent.includes('<img').toString()}</div>
        </div>
      </div>

      {/* CSS Styles for Media */}
      <style jsx>{`
        .media-container {
          margin: 12px 0;
        }
        .audio-container {
          background-color: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 12px;
        }
        .image-container {
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
        }
        .media-filename {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          display: flex;
          align-items: center;
        }
        .media-error {
          font-size: 14px;
          color: #ef4444;
          font-style: italic;
          padding: 8px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default MediaMarkupTest;
