import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class UploadErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UploadErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Show toast notification
    toast.error('Đã xảy ra lỗi trong quá trình upload. Vui lòng thử lại.');
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    } else {
      window.history.back();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Lỗi Upload File
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              Đã xảy ra lỗi trong quá trình upload file. Điều này có thể do file bị hỏng, 
              kết nối mạng không ổn định, hoặc server đang bận.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Gợi ý khắc phục:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Kiểm tra kết nối internet</li>
                <li>• Đảm bảo file không bị hỏng</li>
                <li>• Thử lại với file khác</li>
                <li>• Liên hệ quản trị viên nếu vấn đề tiếp tục</li>
              </ul>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32">
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Stack trace</summary>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </button>
              
              <button
                onClick={this.handleGoBack}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default UploadErrorBoundary;
