import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroupItem } from '@/components/ui/radio-group';
import MathRenderer from '@/components/MathRenderer';
import MediaPlayer from '@/components/MediaPlayer';
import { Image, FileText, Music, Video } from 'lucide-react';
import * as mediaMarkupUtils from '@/utils/mediaMarkup';
import { toast } from 'sonner';

type QuestionItemProps = {
  question: any;
  isSelected?: boolean;
  onSelect?: (question: any) => void;
  showAnswers?: boolean;
  isPreview?: boolean;
  onEdit?: (question: any) => void;
};

// Tạo component Tooltip đơn giản vì không có trong UI components
const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded p-1">
        {content}
      </div>
    </div>
  );
};

export default function QuestionItem({
  question,
  isSelected = false,
  onSelect,
  showAnswers = true, // Always show answers
  isPreview = false,
  onEdit
}: QuestionItemProps) {
  const [expandedChildQuestions, setExpandedChildQuestions] = useState<{ [key: string]: boolean }>({});

  // Format the content to handle LaTeX expressions
  const renderContent = (content: string) => {
    // First process media markup
    const processedContent = mediaMarkupUtils.processMediaMarkup ?
      mediaMarkupUtils.processMediaMarkup(content) : content;

    // Check if content contains LaTeX
    if (question.has_latex || content.match(/\$|\\\(|\\\[|\\begin\{|\\frac|\\sqrt/)) {
      return <MathRenderer content={processedContent} />;
    }

    // Process chemical formulas
    if (content.match(/\\ce\{|H_\d+O|(H|C|O|N|P|S|Cl|Na|K|Ca|Fe|Mg)_\d+|\d+(H|C|O|N|P|S|Cl|Na|K|Ca|Fe|Mg)|CH_\d+|C\dH\d+/)) {
      return <MathRenderer content={processedContent} />;
    }

    // Handle fill-in-blank questions by highlighting the blanks
    if (question.type === 'fill-in-blank' || content.match(/_{2,}|\.{3,}|\(\s*\.\.\.\s*\)|\[\s*\.\.\.\s*\]|\<\s*\.\.\.\s*\>|\(\s*\_+\s*\)|\[\s*\_+\s*\]|\<\s*\_+\s*\>|\(\s*blank\s*\)|\[\s*blank\s*\]|\<\s*blank\s*\>|\(\s*điền\s*\)|\[\s*điền\s*\]|\<\s*điền\s*\>/i)) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: processedContent
              .replace(/_{2,}/g, '<span class="blank-space">_____</span>')
              .replace(/\.{3,}/g, '<span class="blank-space">_____</span>')
              .replace(/\(\s*\.\.\.\s*\)/g, '<span class="blank-space">(___)</span>')
              .replace(/\[\s*\.\.\.\s*\]/g, '<span class="blank-space">[___]</span>')
              .replace(/\<\s*\.\.\.\s*\>/g, '<span class="blank-space">&lt;___&gt;</span>')
              .replace(/\(\s*\_+\s*\)/g, '<span class="blank-space">(___)</span>')
              .replace(/\[\s*\_+\s*\]/g, '<span class="blank-space">[___]</span>')
              .replace(/\<\s*\_+\s*\>/g, '<span class="blank-space">&lt;___&gt;</span>')
              .replace(/\(\s*blank\s*\)/gi, '<span class="blank-space">(___)</span>')
              .replace(/\[\s*blank\s*\)/gi, '<span class="blank-space">[___]</span>')
              .replace(/\<\s*blank\s*\>/gi, '<span class="blank-space">&lt;___&gt;</span>')
              .replace(/\(\s*điền\s*\)/gi, '<span class="blank-space">(điền)</span>')
              .replace(/\[\s*điền\s*\]/gi, '<span class="blank-space">[điền]</span>')
              .replace(/\<\s*điền\s*\>/gi, '<span class="blank-space">&lt;điền&gt;</span>')
          }}
          className="fill-in-blank-content"
        />
      );
    }

    // Default rendering
    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  const toggleChildQuestion = (id: string) => {
    setExpandedChildQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Tính năng đang phát triển", {
      description: "Chức năng chỉnh sửa câu hỏi đang được hoàn thiện.",
      duration: 3000,
    });
  };

  // Render any media files attached to the question
  const renderMediaFiles = (files: any[]) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="media-files mt-4">
        <h4 className="text-sm font-medium mb-2">Tài liệu đính kèm:</h4>
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => {
            // Determine file type and render appropriate component
            if (file.fileType === 1) { // Audio
              return <MediaPlayer key={file.id} file={file} type="audio" />;
            } else if (file.fileType === 2) { // Image
              return (
                <div key={file.id} className="image-container w-full max-w-md">
                  <img
                    src={file.cdnUrl || file.spacesUrl}
                    alt={`Image ${index + 1}`}
                    className="rounded border border-gray-200 max-h-64 object-contain"
                  />
                </div>
              );
            } else if (file.fileType === 4) { // Video
              return <MediaPlayer key={file.id} file={file} type="video" />;
            } else {
              // Other file types
              return (
                <a
                  key={file.id}
                  href={file.cdnUrl || file.spacesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link flex items-center gap-1 p-2 bg-gray-100 rounded text-sm"
                >
                  <FileText /> {file.originalName || file.fileName}
                </a>
              );
            }
          })}
        </div>
      </div>
    );
  };

  // Render file type indicators
  const renderFileTypeIndicators = (files: any[]) => {
    if (!files || files.length === 0) return null;

    const fileTypes = {
      image: files.some(f => f.fileType === 2),
      audio: files.some(f => f.fileType === 1),
      video: files.some(f => f.fileType === 4),
      document: files.some(f => f.fileType === 3)
    };

    return (
      <div className="file-indicators flex gap-1 mt-2">
        {fileTypes.image && (
          <Tooltip content="Có hình ảnh">
            <Badge variant="outline"><Image size={14} /></Badge>
          </Tooltip>
        )}
        {fileTypes.audio && (
          <Tooltip content="Có âm thanh">
            <Badge variant="outline"><Music size={14} /></Badge>
          </Tooltip>
        )}
        {fileTypes.video && (
          <Tooltip content="Có video">
            <Badge variant="outline"><Video size={14} /></Badge>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <Card
      className={`mb-4 overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect && onSelect(question)}
    >
      <CardHeader className="flex flex-wrap justify-between items-start gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          {onSelect && (
            isPreview ? (
              <RadioGroupItem
                value={question.MaCauHoi?.toString() || ''}
                checked={isSelected}
                onClick={() => onSelect(question)}
              />
            ) : (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(question)}
              />
            )
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-base">
                Câu {question.questionNumber || ''}
              </span>

              {question.type === 'group' && (
                <Badge variant="outline">Câu hỏi nhóm</Badge>
              )}

              {question.type === 'fill-in-blank' && (
                <Badge variant="outline">Điền khuyết</Badge>
              )}

              {question.has_latex && (
                <Badge variant="outline">LaTeX</Badge>
              )}

              {renderFileTypeIndicators(question.files)}
            </div>

            {question.clo && (
              <div className="text-sm mt-1">
                CLO: {question.clo}
              </div>
            )}
          </div>
        </div>

        {/* Hide edit buttons
        <div className="flex gap-2">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(question);
              }}
            >
              Chỉnh sửa
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="bg-gray-50 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              toggleShowAnswers();
            }}
          >
            {showAllAnswers ? 'Ẩn đáp án' : 'Hiển đáp án'}
          </Button>
        </div>
        */}
      </CardHeader>

      <CardContent className="pt-4">
        <div className="question-content">
          {renderContent(question.content)}
        </div>

        {renderMediaFiles(question.files)}

        {question.answers && question.answers.length > 0 && (
          <div className="answers-container mt-4">
            <div className="grid gap-2">
              {question.answers.map((answer: any, index: number) => (
                <div
                  key={answer.id || index}
                  className={`p-2 rounded ${answer.isCorrect ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[24px]">{String.fromCharCode(65 + index)}.</span>
                    <div className="w-full">{renderContent(answer.content)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'group' && question.childQuestions && question.childQuestions.length > 0 && (
          <div className="child-questions mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Câu hỏi con ({question.childQuestions.length})</h3>

            {question.childQuestions.map((child: any) => (
              <div key={child.id} className="child-question border-l-2 pl-3 py-2 mb-3">
                <div
                  className="flex justify-between cursor-pointer"
                  onClick={() => toggleChildQuestion(child.id)}
                >
                  <h4 className="font-medium">
                    {question.questionNumber}.{child.questionNumber || ''}
                    {child.type === 'fill-in-blank' && (
                      <Badge variant="outline" className="ml-2">Điền khuyết</Badge>
                    )}
                    {child.has_latex && (
                      <Badge variant="outline" className="ml-2">LaTeX</Badge>
                    )}
                  </h4>
                  <Button size="sm" variant="outline">
                    {expandedChildQuestions[child.id] ? 'Thu gọn' : 'Mở rộng'}
                  </Button>
                </div>

                {(expandedChildQuestions[child.id] || isPreview) && (
                  <div className="mt-2">
                    <div className="question-content">
                      {renderContent(child.content)}
                    </div>

                    {renderMediaFiles(child.files)}

                    {child.answers && child.answers.length > 0 && (
                      <div className="answers-container mt-2">
                        <div className="grid gap-2">
                          {child.answers.map((answer: any, index: number) => (
                            <div
                              key={answer.id || index}
                              className={`p-2 rounded ${answer.isCorrect ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-medium min-w-[24px]">{String.fromCharCode(65 + index)}.</span>
                                <div className="w-full">{renderContent(answer.content)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
