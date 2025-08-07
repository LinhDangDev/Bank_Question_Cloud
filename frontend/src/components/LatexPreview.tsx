import React, { useState, useEffect } from 'react';
import { MathRenderer, containsMath, extractLatexExpressions, validateLatex } from './MathRenderer';
import { Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Code } from 'lucide-react';

interface LatexPreviewProps {
  content: string;
  title?: string;
  showValidation?: boolean;
  className?: string;
}

interface LatexValidationResult {
  expression: string;
  isValid: boolean;
  error?: string;
}

export const LatexPreview: React.FC<LatexPreviewProps> = ({
  content,
  title = "LaTeX Preview",
  showValidation = true,
  className = ""
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const [validationResults, setValidationResults] = useState<LatexValidationResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (showValidation && containsMath(content)) {
      const expressions = extractLatexExpressions(content);
      const results = expressions.map(expr => ({
        expression: expr,
        isValid: validateLatex(expr),
        error: validateLatex(expr) ? '' : 'Invalid LaTeX syntax'
      }));
      setValidationResults(results);
    }
  }, [content, showValidation]);

  const hasMath = containsMath(content);
  const validExpressions = validationResults.filter(r => r.isValid).length;
  const invalidExpressions = validationResults.filter(r => !r.isValid).length;

  if (!hasMath) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          <Code className="h-4 w-4" />
          <span className="text-sm">Không có công thức toán học trong nội dung này</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">{title}</h3>
            <div className="flex items-center space-x-1">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="text-sm text-blue-600">Chứa LaTeX</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showValidation && validationResults.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                {validExpressions > 0 && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{validExpressions}</span>
                  </div>
                )}
                {invalidExpressions > 0 && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{invalidExpressions}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {showRaw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showRaw ? 'Ẩn mã' : 'Xem mã'}</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Thu gọn' : 'Mở rộng'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {showRaw ? (
          <div className="space-y-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">{content}</pre>
            </div>

            {showValidation && validationResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Kiểm tra LaTeX:</h4>
                {validationResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-2 p-3 rounded-lg ${
                      result.isValid
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                        {result.expression}
                      </code>
                      {!result.isValid && result.error && (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`${isExpanded ? '' : 'max-h-64 overflow-y-auto'}`}>
            <div className="prose max-w-none">
              <MathRenderer content={content} />
            </div>

            {!isExpanded && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem toàn bộ nội dung
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with statistics */}
      {showValidation && validationResults.length > 0 && (
        <div className="bg-gray-50 border-t px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Tổng biểu thức: {validationResults.length}</span>
              <span className="text-green-600">Hợp lệ: {validExpressions}</span>
              {invalidExpressions > 0 && (
                <span className="text-red-600">Lỗi: {invalidExpressions}</span>
              )}
            </div>

            {invalidExpressions > 0 && (
              <div className="flex items-center space-x-1 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Cần kiểm tra lại</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for inline LaTeX preview in question lists
export const InlineLatexPreview: React.FC<{ content: string; maxLength?: number }> = ({
  content,
  maxLength = 100
}) => {
  const hasMath = containsMath(content);

  if (!hasMath) {
    return <span>{content.length > maxLength ? `${content.substring(0, maxLength)}...` : content}</span>;
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <MathRenderer content={content.length > maxLength ? `${content.substring(0, maxLength)}...` : content} />
      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" title="Chứa công thức toán học"></span>
    </div>
  );
};

// Component for LaTeX expression editor
export const LatexEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "Nhập biểu thức LaTeX...", className = "" }) => {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (value.trim()) {
      const validation = validateLatex(value);
      setIsValid(validation);
      setError(validation ? '' : 'Invalid LaTeX syntax');
    } else {
      setIsValid(true);
      setError('');
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 border rounded-lg font-mono text-sm resize-none ${
            isValid
              ? 'border-gray-300 focus:border-blue-500'
              : 'border-red-300 focus:border-red-500'
          }`}
          rows={3}
        />
        <div className="absolute top-2 right-2">
          {value.trim() && (
            isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )
          )}
        </div>
      </div>

      {!isValid && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value.trim() && isValid && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <MathRenderer content={value} />
        </div>
      )}
    </div>
  );
};
