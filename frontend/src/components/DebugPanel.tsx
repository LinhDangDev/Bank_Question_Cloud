import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, Copy, Check } from 'lucide-react';

interface DebugInfo {
  error?: any;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: any;
  };
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

interface DebugPanelProps {
  debugInfo: DebugInfo;
  isVisible?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo, isVisible = false }) => {
  const [isExpanded, setIsExpanded] = useState(isVisible);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const renderSection = (title: string, content: any, sectionKey: string) => {
    if (!content) return null;

    const textContent = typeof content === 'string' ? content : formatJson(content);

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-700">{title}</h4>
          <button
            onClick={() => copyToClipboard(textContent, sectionKey)}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {copiedSection === sectionKey ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40 text-gray-800">
          {textContent}
        </pre>
      </div>
    );
  };

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-orange-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-orange-800">Debug Information</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-orange-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-orange-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-orange-200 bg-white">
          <div className="text-xs text-gray-500 mb-4">
            <div>Timestamp: {debugInfo.timestamp || new Date().toISOString()}</div>
            <div>URL: {debugInfo.url || window.location.href}</div>
            <div>User Agent: {debugInfo.userAgent || navigator.userAgent}</div>
          </div>

          {renderSection('Error Details', debugInfo.error, 'error')}
          
          {debugInfo.request && (
            <>
              {renderSection('Request URL', debugInfo.request.url, 'request-url')}
              {renderSection('Request Method', debugInfo.request.method, 'request-method')}
              {renderSection('Request Headers', debugInfo.request.headers, 'request-headers')}
              {renderSection('Request Body', debugInfo.request.body, 'request-body')}
            </>
          )}

          {debugInfo.response && (
            <>
              {renderSection('Response Status', `${debugInfo.response.status} ${debugInfo.response.statusText}`, 'response-status')}
              {renderSection('Response Headers', debugInfo.response.headers, 'response-headers')}
              {renderSection('Response Data', debugInfo.response.data, 'response-data')}
            </>
          )}

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This debug panel is only visible in development mode. 
              Copy the relevant information and share it with the development team for troubleshooting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
