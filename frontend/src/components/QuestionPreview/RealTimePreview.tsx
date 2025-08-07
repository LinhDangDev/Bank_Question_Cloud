import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Eye, EyeOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { questionParserService } from '../../services/questionParserService';
import { QuestionPreviewResult } from '../../types/question-parser.types';

interface RealTimePreviewProps {
  text: string;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onPreviewResult?: (result: QuestionPreviewResult | null) => void;
  className?: string;
}

const RealTimePreview: React.FC<RealTimePreviewProps> = ({
  text,
  isEnabled,
  onToggle,
  onPreviewResult,
  className = ''
}) => {
  const [previewResult, setPreviewResult] = useState<QuestionPreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPreviewText, setLastPreviewText] = useState('');

  // Debounced preview function
  const debouncedPreview = useCallback(
    debounce(async (textToPreview: string) => {
      if (!textToPreview.trim() || !isEnabled) {
        setPreviewResult(null);
        setError(null);
        if (onPreviewResult) onPreviewResult(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await questionParserService.previewText({
          text: textToPreview,
          includeMedia: true,
          maxImageWidth: 400,
          maxImageHeight: 300
        });

        setPreviewResult(result);
        setLastPreviewText(textToPreview);
        if (onPreviewResult) onPreviewResult(result);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tạo preview');
        setPreviewResult(null);
        if (onPreviewResult) onPreviewResult(null);
      } finally {
        setIsLoading(false);
      }
    }, 1500), // 1.5 second delay
    [isEnabled, onPreviewResult]
  );

  // Effect to trigger preview when text changes
  useEffect(() => {
    if (isEnabled && text !== lastPreviewText) {
      debouncedPreview(text);
    }

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedPreview.cancel();
    };
  }, [text, isEnabled, debouncedPreview, lastPreviewText]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await questionParserService.previewText({
        text,
        includeMedia: true,
        maxImageWidth: 400,
        maxImageHeight: 300
      });

      setPreviewResult(result);
      setLastPreviewText(text);
      if (onPreviewResult) onPreviewResult(result);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo preview');
      setPreviewResult(null);
      if (onPreviewResult) onPreviewResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    onToggle(newEnabled);

    if (!newEnabled) {
      // Cancel any pending preview and clear results
      debouncedPreview.cancel();
      setPreviewResult(null);
      setError(null);
      setIsLoading(false);
      if (onPreviewResult) onPreviewResult(null);
    } else if (text.trim()) {
      // Immediately trigger preview when enabling
      debouncedPreview(text);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Xem trước thời gian thực</h3>
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={!text.trim() || isLoading}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Làm mới preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isEnabled ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Đang bật</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Đã tắt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!isEnabled ? (
          <div className="text-center py-8 text-gray-500">
            <EyeOff className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium mb-2">Preview đã tắt</p>
            <p className="text-sm">Bật preview để xem câu hỏi được hiển thị như thế nào</p>
          </div>
        ) : !text.trim() ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium mb-2">Chưa có nội dung</p>
            <p className="text-sm">Nhập nội dung câu hỏi để xem preview</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-gray-600">Đang tạo preview...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
            <p className="text-red-600 font-medium mb-2">Lỗi tạo preview</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        ) : previewResult ? (
          <div className="space-y-4">
            {/* Preview Statistics */}
            {previewResult.statistics && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Thống kê nhanh</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{previewResult.statistics.totalQuestions}</div>
                    <div className="text-blue-700">Câu hỏi</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">{previewResult.statistics.questionsWithMedia}</div>
                    <div className="text-green-700">Có media</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">{previewResult.statistics.mediaFilesFound || 0}</div>
                    <div className="text-purple-700">File media</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-600">{previewResult.errors.length}</div>
                    <div className="text-orange-700">Lỗi</div>
                  </div>
                </div>
              </div>
            )}

            {/* Errors and Warnings */}
            {(previewResult.errors.length > 0 || previewResult.warnings.length > 0) && (
              <div className="space-y-2">
                {previewResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h5 className="font-medium text-red-800 mb-1">Lỗi ({previewResult.errors.length})</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {previewResult.errors.slice(0, 3).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {previewResult.errors.length > 3 && (
                        <li className="text-red-600">... và {previewResult.errors.length - 3} lỗi khác</li>
                      )}
                    </ul>
                  </div>
                )}

                {previewResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h5 className="font-medium text-yellow-800 mb-1">Cảnh báo ({previewResult.warnings.length})</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {previewResult.warnings.slice(0, 2).map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                      {previewResult.warnings.length > 2 && (
                        <li className="text-yellow-600">... và {previewResult.warnings.length - 2} cảnh báo khác</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* HTML Preview */}
            {previewResult.html && (
              <div className="mb-6 relative">
                <div className="absolute top-0 right-0 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-bl">
                  Đã phân tích {previewResult.statistics?.totalQuestions || 0} câu hỏi
                </div>
                <div
                  className="preview-content p-4 border rounded-lg"
                  dangerouslySetInnerHTML={{ __html: previewResult.html }}
                />
              </div>
            )}

            {/* Success Message */}
            {previewResult.success && previewResult.errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">Preview thành công!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Đã phân tích {previewResult.statistics.totalQuestions} câu hỏi
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RealTimePreview;
