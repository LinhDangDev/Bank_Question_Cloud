import React, { useState, useEffect } from 'react';
import { Modal } from './Modal/Modal';
import { MediaPreview } from './MediaPreview';
import { archivePreviewService, ArchivePreviewResult, MediaFile } from '../services/zipPreviewService';
import {
  FileText,
  Music,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Eye,
  BarChart3
} from 'lucide-react';

interface ArchivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUpload: () => void;
  archiveFile: File | null;
}

// Backward compatibility
type ZipPreviewModalProps = ArchivePreviewModalProps;

export const ZipPreviewModal: React.FC<ZipPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmUpload,
  archiveFile
}) => {
  const [previewResult, setPreviewResult] = useState<ArchivePreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'validation'>('overview');
  const [validMediaFiles, setValidMediaFiles] = useState<MediaFile[]>([]);
  const [invalidMediaFiles, setInvalidMediaFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    if (isOpen && archiveFile) {
      previewArchiveFile();
    }

    return () => {
      // Cleanup when modal closes
      if (previewResult) {
        archivePreviewService.cleanupPreview(previewResult);
      }
    };
  }, [isOpen, archiveFile]);

  const previewArchiveFile = async () => {
    if (!archiveFile) return;

    setIsLoading(true);
    try {
      const result = await archivePreviewService.previewArchiveFile(archiveFile);
      setPreviewResult(result);
    } catch (error) {
      console.error('Error previewing archive file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaValidated = (valid: MediaFile[], invalid: MediaFile[]) => {
    setValidMediaFiles(valid);
    setInvalidMediaFiles(invalid);
  };

  const handleConfirmUpload = () => {
    if (previewResult) {
      archivePreviewService.cleanupPreview(previewResult);
    }
    onConfirmUpload();
  };

  const handleClose = () => {
    if (previewResult) {
      archivePreviewService.cleanupPreview(previewResult);
    }
    onClose();
  };

  const getValidationStatus = () => {
    if (!previewResult) return 'loading';

    const hasErrors = previewResult.errors.length > 0;
    const hasWordDoc = previewResult.structure.hasWordDocument;
    const hasMedia = previewResult.audioFiles.length > 0 || previewResult.imageFiles.length > 0;

    if (hasErrors || !hasWordDoc) return 'error';
    if (!hasMedia) return 'warning';
    return 'success';
  };

  const renderOverview = () => {
    if (!previewResult) return null;

    const stats = archivePreviewService.getStatistics(previewResult);
    const status = getValidationStatus();

    return (
      <div className="space-y-6">
        {/* Status Summary */}
        <div className={`border rounded-lg p-4 ${
          status === 'success' ? 'border-green-200 bg-green-50' :
          status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            <h3 className={`font-medium ${
              status === 'success' ? 'text-green-800' :
              status === 'warning' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              {status === 'success' && 'Gói đề thi hợp lệ'}
              {status === 'warning' && 'Gói đề thi cần kiểm tra'}
              {status === 'error' && 'Gói đề thi có lỗi'}
            </h3>
          </div>

          {previewResult.errors.length > 0 && (
            <ul className="text-sm space-y-1">
              {previewResult.errors.map((error, index) => (
                <li key={index} className="text-red-700">• {error}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Archive Type */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              Loại file: {previewResult.structure.archiveType.toUpperCase()}
            </span>
          </div>
        </div>

        {/* File Structure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Word Document</h4>
            </div>
            <div className="text-sm text-gray-600">
              {previewResult.wordDocument ? (
                <div>
                  <p className="text-green-600 font-medium">✓ Tìm thấy</p>
                  <p>{previewResult.wordDocument.name}</p>
                </div>
              ) : (
                <p className="text-red-600">✗ Không tìm thấy</p>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Music className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium">Audio Files</h4>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{stats.audioCount} files</p>
              {stats.audioCount > 0 && (
                <p className="text-green-600">✓ Có sẵn</p>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ImageIcon className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Image Files</h4>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{stats.imageCount} files</p>
              {stats.imageCount > 0 && (
                <p className="text-green-600">✓ Có sẵn</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium">Thống kê</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Loại file</p>
              <p className="font-medium uppercase">{previewResult.structure.archiveType}</p>
            </div>
            <div>
              <p className="text-gray-600">Tổng files</p>
              <p className="font-medium">{stats.totalFiles}</p>
            </div>
            <div>
              <p className="text-gray-600">Tổng dung lượng</p>
              <p className="font-medium">{stats.totalSize}</p>
            </div>
            <div>
              <p className="text-gray-600">Audio files</p>
              <p className="font-medium">{stats.audioCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Image files</p>
              <p className="font-medium">{stats.imageCount}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMediaPreview = () => {
    if (!previewResult) return null;

    const allMediaFiles = [...previewResult.audioFiles, ...previewResult.imageFiles];

    return (
      <div className="space-y-4">
        <MediaPreview
          mediaFiles={allMediaFiles}
          onMediaValidated={handleMediaValidated}
        />
      </div>
    );
  };

  const renderValidation = () => {
    if (!previewResult) return null;

    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Kiểm tra tính hợp lệ</h4>

          <div className="space-y-3">
            {/* Word Document Check */}
            <div className="flex items-center space-x-2">
              {previewResult.structure.hasWordDocument ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={previewResult.structure.hasWordDocument ? 'text-green-700' : 'text-red-700'}>
                File Word document (.docx)
              </span>
            </div>

            {/* Media Files Check */}
            <div className="flex items-center space-x-2">
              {(previewResult.audioFiles.length > 0 || previewResult.imageFiles.length > 0) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <span className={(previewResult.audioFiles.length > 0 || previewResult.imageFiles.length > 0) ? 'text-green-700' : 'text-yellow-700'}>
                Media files (audio/image)
              </span>
            </div>

            {/* Valid Media Files */}
            <div className="flex items-center space-x-2">
              {validMediaFiles.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <span className={validMediaFiles.length > 0 ? 'text-green-700' : 'text-yellow-700'}>
                {validMediaFiles.length} media files hợp lệ
              </span>
            </div>

            {/* Invalid Media Files */}
            {invalidMediaFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">
                  {invalidMediaFiles.length} media files không hợp lệ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="font-medium mb-3 text-blue-800">Khuyến nghị</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Đảm bảo tất cả media files được tham chiếu trong Word document</li>
            <li>• Sử dụng định dạng [AUDIO: filename] và [IMAGE: filename] trong Word</li>
            <li>• Kiểm tra tên file media khớp với markup trong Word</li>
            <li>• Sử dụng đường dẫn tương đối trong markup</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Preview Gói Đề Thi ${previewResult?.structure.archiveType ? `(${previewResult.structure.archiveType.toUpperCase()})` : ''}`}
      size="xl"
    >
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang phân tích gói đề thi...</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                  activeTab === 'overview'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                  activeTab === 'media'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Music className="h-4 w-4 inline mr-2" />
                Media Preview
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                  activeTab === 'validation'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Kiểm tra
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'media' && renderMediaPreview()}
              {activeTab === 'validation' && renderValidation()}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={getValidationStatus() === 'error'}
                className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                  getValidationStatus() === 'error'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Xác nhận Upload</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
