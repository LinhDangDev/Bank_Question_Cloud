import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ZipUploadResult } from '../../types/question-parser.types';
import { useToast } from '../ui/use-toast';
import { questionParserService } from '../../services/questionParserService';
import { useQuestionUpload } from '../../hooks/useQuestionUpload';

interface ZipUploadComponentProps {
  onUploadComplete?: (result: ZipUploadResult) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  onUploadProgress?: (progress: number) => void;
  uploadToSpaces?: boolean;
  saveToDatabase?: boolean;
  className?: string;
  showDropzone?: boolean;
  acceptMimeTypes?: string[];
  maxFileSizeMB?: number;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

interface ZipPreviewData {
  wordDocuments: string[];
  mediaFiles: string[];
  estimatedQuestions: number;
  totalSize: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

export const ZipUploadComponent: React.FC<ZipUploadComponentProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadError,
  onUploadProgress,
  uploadToSpaces = true,
  saveToDatabase = true,
  className = '',
  showDropzone = true,
  acceptMimeTypes = ['application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSizeMB = 50,
  buttonVariant = 'default',
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ZipPreviewData | null>(null);
  const { uploadZipPackage } = useQuestionUpload({
    uploadToSpaces,
    saveToDatabase,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Kiểm tra kích thước file
    if (selectedFile.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File quá lớn. Kích thước tối đa là ${maxFileSizeMB}MB.`);
      if (onUploadError) onUploadError(`File quá lớn. Kích thước tối đa là ${maxFileSizeMB}MB.`);
      return;
    }

    // Kiểm tra loại file
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'docx') {
      // Nếu là file DOCX, hiển thị thông báo và cho phép upload trực tiếp
      setFile(selectedFile);
      setError(null);
      toast({
        title: "File DOCX đã sẵn sàng",
        description: "Nhấn 'Upload' để bắt đầu xử lý.",
        variant: "default",
      });
    } else if (fileExtension === 'zip') {
      // Nếu là file ZIP, hiển thị preview nội dung
      setFile(selectedFile);
      setError(null);
      previewZipContents(selectedFile);
    } else if (fileExtension === 'rar') {
      setError('RAR files must be processed by the backend. Please upload the RAR file directly to the server.');
      if (onUploadError) onUploadError('RAR files are not supported for preview in browser. Please upload directly to server for processing.');
    } else {
      setError('Chỉ hỗ trợ file ZIP hoặc DOCX.');
      if (onUploadError) onUploadError('Chỉ hỗ trợ file ZIP hoặc DOCX.');
    }
  };

  const previewZipContents = async (file: File) => {
    try {
      setIsLoading(true);
      const result = await questionParserService.previewZipContents(file);

      setPreviewData(result.contents);
      setShowPreview(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to preview ZIP contents');
      if (onUploadError) onUploadError(err.message || 'Failed to preview ZIP contents');
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      if (onUploadStart) onUploadStart();

      // Xử lý upload dựa vào loại file
      if (file.name.toLowerCase().endsWith('.docx')) {
        // Upload DOCX file trực tiếp
        toast({
          title: "Đang xử lý file DOCX",
          description: "Vui lòng đợi trong khi chúng tôi phân tích câu hỏi...",
          variant: "default"
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadMedia', uploadToSpaces.toString());
        formData.append('saveToDatabase', saveToDatabase.toString());

        // Gọi API upload và parse DOCX
        const response = await fetch('/api/question-parser/parse-docx', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Error uploading DOCX: ${response.statusText}`);
        }

        const result = await response.json();

        toast({
          title: "Phân tích hoàn tất",
          description: `Đã phân tích ${result.questions.length} câu hỏi từ file DOCX.`,
          variant: "success",
        });

        if (onUploadComplete) onUploadComplete(result);
      } else {
        // Upload ZIP file
        const result = await uploadZipPackage(
          file,
          {
            uploadToSpaces,
            saveToDatabase: saveToDatabase, // Preview mode
            onProgress: onUploadProgress,
          }
        );

        if (result) {
          if (onUploadComplete) onUploadComplete(result);

          toast({
            title: "Upload thành công",
            description: `Đã tải lên ${result.questions.length} câu hỏi.`,
            variant: "success",
          });
        }
      }

      // Reset UI state
      setShowPreview(false);
      setFile(null);
      setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Error uploading file');
      if (onUploadError) onUploadError(err.message || 'Error uploading file');

      toast({
        title: "Upload thất bại",
        description: err.message || 'Error uploading file',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setFile(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`zip-upload-component ${className}`}>
      {!showPreview && (
        <>
          {showDropzone && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-all mb-4"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>

              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Kéo và thả file vào đây
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Hoặc click để chọn file (ZIP hoặc DOCX, tối đa {maxFileSizeMB}MB)
              </p>

              {file && (
                <div className="mt-3">
                  <Badge variant="outline" className="text-sm">
                    {file.name} ({formatFileSize(file.size)})
                  </Badge>
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={acceptMimeTypes.join(',')}
            onChange={handleFileChange}
          />

          {!showDropzone && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={buttonVariant}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Chọn file
              </Button>

              {file && (
                <Badge variant="outline" className="text-sm">
                  {file.name} ({formatFileSize(file.size)})
                </Badge>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {file && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? 'Đang tải...' : 'Upload'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium mb-4">Preview nội dung file ZIP</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-blue-700 mb-1">File Word</p>
              <div className="text-2xl font-bold text-blue-600">{previewData.wordDocuments.length}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-700 mb-1">File media</p>
              <div className="text-2xl font-bold text-green-600">{previewData.mediaFiles.length}</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-purple-700 mb-1">Câu hỏi ước tính</p>
              <div className="text-2xl font-bold text-purple-600">{previewData.estimatedQuestions}</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-sm text-orange-700 mb-1">Tổng kích thước</p>
              <div className="text-2xl font-bold text-orange-600">{formatFileSize(previewData.totalSize)}</div>
            </div>
          </div>

          <div className="space-y-4">
            {previewData.wordDocuments.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  File Word ({previewData.wordDocuments.length})
                </h4>

                <ul className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {previewData.wordDocuments.map((doc, index) => (
                    <li key={index} className="mb-1 last:mb-0">
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {previewData.mediaFiles.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  File media ({previewData.mediaFiles.length})
                </h4>

                <ul className="text-sm text-gray-600 bg-gray-50 p-3 rounded grid grid-cols-1 md:grid-cols-2 gap-1">
                  {previewData.mediaFiles.slice(0, 10).map((media, index) => {
                    const isImage = media.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isAudio = media.match(/\.(mp3|wav|ogg)$/i);

                    return (
                      <li key={index} className="flex items-center">
                        {isImage && <span className="mr-1 text-green-500">🖼️</span>}
                        {isAudio && <span className="mr-1 text-blue-500">🔊</span>}
                        {!isImage && !isAudio && <span className="mr-1">📄</span>}
                        <span className="truncate">{media}</span>
                      </li>
                    );
                  })}
                </ul>

                {previewData.mediaFiles.length > 10 && (
                  <p className="text-sm text-gray-500 mt-1">
                    ... và {previewData.mediaFiles.length - 10} file khác
                  </p>
                )}
              </div>
            )}

            {previewData.wordDocuments.length === 0 && previewData.mediaFiles.length === 0 && (
              <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded">
                Không tìm thấy file Word hoặc file media trong ZIP.
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isLoading || (previewData.wordDocuments.length === 0 && previewData.mediaFiles.length === 0)}
            >
              {isLoading ? 'Đang tải...' : 'Upload & Xử lý'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
