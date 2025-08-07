import React from 'react';
import { Modal } from './Modal/Modal';
import { AlertTriangle, FileX, Wifi, Settings, HelpCircle, RefreshCw } from 'lucide-react';
import DebugPanel from './DebugPanel';

interface ErrorInfo {
  type: 'file_corrupted' | 'format_invalid' | 'network_error' | 'server_error' | 'media_missing' | 'latex_error' | 'size_limit' | 'permission_denied' | 'unknown';
  title: string;
  message: string;
  details?: string;
  suggestions: string[];
  canRetry?: boolean;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: ErrorInfo | null;
  debugInfo?: any;
}

const getErrorIcon = (type: string) => {
  switch (type) {
    case 'file_corrupted':
    case 'format_invalid':
      return <FileX className="h-8 w-8 text-red-500" />;
    case 'network_error':
      return <Wifi className="h-8 w-8 text-orange-500" />;
    case 'server_error':
      return <Settings className="h-8 w-8 text-red-500" />;
    case 'media_missing':
      return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    default:
      return <HelpCircle className="h-8 w-8 text-gray-500" />;
  }
};

const getErrorColor = (type: string) => {
  switch (type) {
    case 'file_corrupted':
    case 'format_invalid':
    case 'server_error':
    case 'permission_denied':
      return 'border-red-200 bg-red-50';
    case 'network_error':
    case 'size_limit':
      return 'border-orange-200 bg-orange-50';
    case 'media_missing':
    case 'latex_error':
      return 'border-yellow-200 bg-yellow-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  error,
  debugInfo
}) => {
  if (!error) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lỗi xử lý file"
      size="lg"
    >
      <div className="p-6">
        {/* Error Header */}
        <div className={`border rounded-lg p-4 mb-6 ${getErrorColor(error.type)}`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getErrorIcon(error.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error.title}
              </h3>
              <p className="text-gray-700 mb-3">
                {error.message}
              </p>
              {error.details && (
                <div className="bg-white bg-opacity-50 rounded p-3 text-sm text-gray-600">
                  <strong>Chi tiết:</strong> {error.details}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
            Hướng dẫn khắc phục
          </h4>
          <ul className="space-y-2">
            {error.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Đóng
          </button>
          {error.canRetry && onRetry && (
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Thử lại</span>
            </button>
          )}
        </div>

        {/* Debug Panel */}
        {debugInfo && (
          <div className="mt-6">
            <DebugPanel debugInfo={debugInfo} />
          </div>
        )}
      </div>
    </Modal>
  );
};

// Error classification utility
export const classifyError = (error: any, context: 'word' | 'zip' = 'word'): ErrorInfo => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const statusCode = error?.status || error?.response?.status;

  // File corruption or format issues
  if (errorMessage.includes('corrupted') || errorMessage.includes('invalid format') ||
      errorMessage.includes('not a valid') || errorMessage.includes('cannot read')) {
    return {
      type: 'file_corrupted',
      title: 'File bị hỏng hoặc không hợp lệ',
      message: 'File bạn tải lên có thể bị hỏng hoặc không đúng định dạng.',
      details: errorMessage,
      suggestions: [
        'Kiểm tra lại file Word có mở được bình thường không',
        'Thử lưu lại file với định dạng .docx mới',
        'Đảm bảo file không bị mã hóa hoặc bảo vệ bằng mật khẩu',
        'Thử tạo file Word mới và copy nội dung sang'
      ],
      canRetry: true
    };
  }

  // Network errors
  if (statusCode >= 500 || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      type: 'network_error',
      title: 'Lỗi kết nối mạng',
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.',
      details: errorMessage,
      suggestions: [
        'Kiểm tra kết nối internet của bạn',
        'Thử tải lại trang và upload lại',
        'Liên hệ quản trị viên nếu vấn đề vẫn tiếp tục'
      ],
      canRetry: true
    };
  }

  // File size limit
  if (errorMessage.includes('size') || errorMessage.includes('large') || statusCode === 413) {
    const maxSize = context === 'zip' ? '100MB' : '50MB';
    return {
      type: 'size_limit',
      title: 'File quá lớn',
      message: `File vượt quá giới hạn cho phép (${maxSize}).`,
      details: errorMessage,
      suggestions: [
        `Giảm kích thước file xuống dưới ${maxSize}`,
        'Nén hình ảnh trong file Word',
        'Loại bỏ các media file không cần thiết',
        'Chia nhỏ file thành nhiều phần',
        context === 'zip' ? 'Thử sử dụng định dạng RAR để nén tốt hơn' : ''
      ].filter(Boolean),
      canRetry: false
    };
  }

  // Media missing
  if (errorMessage.includes('media') || errorMessage.includes('image') || errorMessage.includes('audio')) {
    return {
      type: 'media_missing',
      title: 'Thiếu file media',
      message: 'Một số file hình ảnh hoặc âm thanh được tham chiếu trong Word không tìm thấy.',
      details: errorMessage,
      suggestions: [
        'Kiểm tra tất cả file media có trong thư mục ZIP',
        'Đảm bảo tên file trong Word khớp với tên file thực tế',
        'Sử dụng đường dẫn tương đối trong markup [IMAGE:] và [AUDIO:]',
        'Kiểm tra định dạng file media được hỗ trợ'
      ],
      canRetry: true
    };
  }

  // LaTeX errors
  if (errorMessage.includes('latex') || errorMessage.includes('math') || errorMessage.includes('formula')) {
    return {
      type: 'latex_error',
      title: 'Lỗi công thức toán học',
      message: 'Có lỗi khi xử lý công thức toán học hoặc LaTeX trong file.',
      details: errorMessage,
      suggestions: [
        'Kiểm tra cú pháp LaTeX trong file Word',
        'Đảm bảo công thức toán được viết đúng định dạng',
        'Thử sử dụng Math Editor trong Word',
        'Liên hệ hỗ trợ kỹ thuật nếu cần'
      ],
      canRetry: true
    };
  }

  // Permission denied
  if (statusCode === 403 || errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return {
      type: 'permission_denied',
      title: 'Không có quyền truy cập',
      message: 'Bạn không có quyền thực hiện thao tác này.',
      details: errorMessage,
      suggestions: [
        'Đăng nhập lại vào hệ thống',
        'Liên hệ quản trị viên để cấp quyền',
        'Kiểm tra vai trò người dùng của bạn'
      ],
      canRetry: false
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    title: 'Lỗi không xác định',
    message: 'Đã xảy ra lỗi không mong muốn khi xử lý file.',
    details: errorMessage,
    suggestions: [
      'Thử tải lại trang và upload lại',
      'Kiểm tra định dạng file có đúng không',
      'Liên hệ hỗ trợ kỹ thuật nếu vấn đề vẫn tiếp tục',
      'Gửi file mẫu để được hỗ trợ'
    ],
    canRetry: true
  };
};
