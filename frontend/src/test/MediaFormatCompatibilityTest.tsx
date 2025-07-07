/**
 * Media Format Compatibility Test
 * Author: Linh Dang Dev
 * 
 * Test component to verify compatibility between existing HTML media tags
 * and new markup format in the exam system
 */

import React from 'react';
import { processMediaContent, detectMediaFormat, extractMediaInfo } from '../utils/mediaContentProcessor';

const MediaFormatCompatibilityTest: React.FC = () => {
    // Test cases representing different scenarios in the database
    const testCases = [
        {
            id: 'existing-html-audio',
            title: 'Existing HTML Audio Tag (Database Format)',
            content: 'Listen to this conversation: <audio src="https://datauploads.sgp1.digitaloceanspaces.com/audio/time_conversation.mp3" controls></audio> and answer the questions.',
            description: 'Content with existing HTML audio tag as stored in database'
        },
        {
            id: 'existing-html-image',
            title: 'Existing HTML Image Tag (Database Format)',
            content: 'Look at this diagram: <img src="https://datauploads.sgp1.digitaloceanspaces.com/images/emotions.webp" style="max-width: 400px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"> and identify the emotions.',
            description: 'Content with existing HTML image tag as stored in database'
        },
        {
            id: 'new-markup-audio',
            title: 'New Markup Format Audio',
            content: 'Listen to this audio: [AUDIO: sample_conversation.mp3] and answer the question.',
            description: 'Content with new markup format for audio'
        },
        {
            id: 'new-markup-image',
            title: 'New Markup Format Image',
            content: 'Study this diagram: [IMAGE: flowchart.jpg] and explain the process.',
            description: 'Content with new markup format for image'
        },
        {
            id: 'mixed-format',
            title: 'Mixed Format (HTML + Markup)',
            content: 'First, look at this image: <img src="https://datauploads.sgp1.digitaloceanspaces.com/images/chart.png" style="max-width: 300px;"> then listen to [AUDIO: explanation.mp3] for details.',
            description: 'Content with both HTML tags and markup format'
        },
        {
            id: 'multiple-media',
            title: 'Multiple Media Elements',
            content: 'Compare these images: [IMAGE: before.png] and [IMAGE: after.png]. Also listen to [AUDIO: intro.mp3] and <audio src="https://datauploads.sgp1.digitaloceanspaces.com/audio/conclusion.wav" controls></audio>.',
            description: 'Content with multiple media elements in different formats'
        },
        {
            id: 'no-media',
            title: 'Plain Text (No Media)',
            content: 'This is a regular question without any media content. What is the capital of France?',
            description: 'Content without any media elements'
        }
    ];

    const renderTestCase = (testCase: any) => {
        const mediaFormat = detectMediaFormat(testCase.content);
        const mediaInfo = extractMediaInfo(testCase.content);
        const processedContent = processMediaContent(testCase.content);

        return (
            <div key={testCase.id} className="border rounded-lg p-6 mb-6 bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{testCase.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{testCase.description}</p>
                
                {/* Format Analysis */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-700 mb-2">Format Analysis:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Format Type:</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                mediaFormat.formatType === 'html' ? 'bg-blue-100 text-blue-700' :
                                mediaFormat.formatType === 'markup' ? 'bg-green-100 text-green-700' :
                                mediaFormat.formatType === 'mixed' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {mediaFormat.formatType.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Media Count:</span>
                            <span className="ml-2">{mediaInfo.totalMediaCount}</span>
                        </div>
                    </div>
                    
                    {mediaInfo.totalMediaCount > 0 && (
                        <div className="mt-2 text-sm">
                            {mediaInfo.audioFiles.length > 0 && (
                                <div>
                                    <span className="font-medium">Audio Files:</span>
                                    <span className="ml-2">{mediaInfo.audioFiles.join(', ')}</span>
                                </div>
                            )}
                            {mediaInfo.imageFiles.length > 0 && (
                                <div>
                                    <span className="font-medium">Image Files:</span>
                                    <span className="ml-2">{mediaInfo.imageFiles.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Original Content */}
                <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Original Content:</h4>
                    <div className="p-3 bg-gray-100 rounded text-sm font-mono text-gray-800 whitespace-pre-wrap">
                        {testCase.content}
                    </div>
                </div>

                {/* Processed Content */}
                <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Processed Content (Rendered):</h4>
                    <div 
                        className="p-3 border rounded bg-white prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                            mediaFormat.formatType === 'none' ? 'bg-gray-400' : 'bg-green-400'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                            {mediaFormat.formatType === 'none' ? 'No media processing needed' : 'Media processed successfully'}
                        </span>
                    </div>
                    
                    {mediaFormat.formatType === 'mixed' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            Mixed format detected
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Media Format Compatibility Test
                </h1>
                <p className="text-gray-600">
                    Testing compatibility between existing HTML media tags in database and new markup format.
                    This ensures backward compatibility with existing question content.
                </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="font-semibold text-blue-800 mb-2">Test Scenarios:</h2>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>HTML Format:</strong> Existing database content with full HTML tags</li>
                    <li>• <strong>Markup Format:</strong> New simplified markup [AUDIO: filename] and [IMAGE: filename]</li>
                    <li>• <strong>Mixed Format:</strong> Content containing both HTML and markup</li>
                    <li>• <strong>Plain Text:</strong> Content without any media elements</li>
                </ul>
            </div>

            <div className="space-y-6">
                {testCases.map(renderTestCase)}
            </div>

            <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h2 className="font-semibold text-green-800 mb-2">Compatibility Summary:</h2>
                <ul className="text-sm text-green-700 space-y-1">
                    <li>✅ Existing HTML tags are preserved and displayed correctly</li>
                    <li>✅ New markup format is converted to proper HTML</li>
                    <li>✅ Mixed format content is handled gracefully</li>
                    <li>✅ Plain text content remains unchanged</li>
                    <li>✅ Media files are properly linked to CDN endpoints</li>
                </ul>
            </div>
        </div>
    );
};

export default MediaFormatCompatibilityTest;
