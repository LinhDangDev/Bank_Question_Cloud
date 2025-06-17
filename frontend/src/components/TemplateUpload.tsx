import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, File, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateUploadProps {
  onTemplateUpload: (template: File | null) => void;
}

const TemplateUpload: React.FC<TemplateUploadProps> = ({ onTemplateUpload }) => {
  const [uploadedTemplate, setUploadedTemplate] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Định dạng file không được hỗ trợ", {
        description: "Vui lòng chọn file PDF hoặc Word (.doc, .docx)"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File quá lớn", {
        description: "Vui lòng chọn file có kích thước nhỏ hơn 10MB"
      });
      return;
    }

    setUploadedTemplate(file);
    onTemplateUpload(file);
    toast.success("Upload template thành công!", {
      description: `Đã tải lên file ${file.name}`
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeTemplate = () => {
    setUploadedTemplate(null);
    onTemplateUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("Đã xóa template");
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="h-8 w-8 text-blue-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Template Tùy Chỉnh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Tải lên template PDF hoặc Word của bạn để sử dụng làm mẫu cho đề thi.
            Hệ thống sẽ sử dụng template này thay vì template mặc định.
          </p>

          {!uploadedTemplate ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Kéo thả file vào đây
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                hoặc click để chọn file
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadedTemplate.name)}
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {uploadedTemplate.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadedTemplate.size)}
                    </p>
                  </div>
                  <Badge variant="secondary">Template đã tải</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Xem trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeTemplate}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>Định dạng hỗ trợ: PDF, DOC, DOCX</p>
            <p>Kích thước tối đa: 10MB</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Mặc Định</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">Template Chuẩn</h4>
                  <p className="text-sm text-gray-500">Layout truyền thống</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Template cơ bản với header, thông tin đề thi và danh sách câu hỏi
              </p>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-medium">Template Hiện Đại</h4>
                  <p className="text-sm text-gray-500">Layout đẹp mắt</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Template với thiết kế hiện đại, màu sắc và typography đẹp
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateUpload;
