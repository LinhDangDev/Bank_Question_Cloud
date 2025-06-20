import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Eye, Upload, BookOpen, GraduationCap, Calculator, Globe } from 'lucide-react';
import { toast } from 'sonner';
import PDFPreview from '@/components/PDFPreview';
import TemplateUpload from '@/components/TemplateUpload';
import { API_BASE_URL } from '@/config';

// Updated interfaces to match backend
interface ExamQuestion {
  id: string;
  number: number;
  content: string;
  answers: {
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
  }[];
}

interface ExamPackage {
  examId: string;
  title: string;
  subject: string;
  questions: ExamQuestion[];
}

const PDF: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [examPackage, setExamPackage] = useState<ExamPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [customTemplate, setCustomTemplate] = useState<File | null>(null);
  const [examTitle, setExamTitle] = useState("Đề thi rút trích");
  const [examInstructions, setExamInstructions] = useState("Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.");

  useEffect(() => {
    const lastGeneratedExamId = localStorage.getItem('lastGeneratedExamId');
    const examId = id || lastGeneratedExamId;

    if (examId) {
      fetchExamPackage(examId);
    } else {
      setLoading(false);
      toast.info("Không có đề thi nào được chọn", {
        description: "Vui lòng tạo một đề thi trước khi xem trước PDF."
      });
    }
  }, [id]);

  const fetchExamPackage = async (examId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/de-thi/packages/${examId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exam package');
      }
      const data: ExamPackage = await response.json();
      setExamPackage(data);
      setExamTitle(data.title);
    } catch (error) {
      console.error('Error fetching exam package:', error);
      toast.error("Lỗi khi tải dữ liệu đề thi");
    } finally {
      setLoading(false);
    }
  };


  const handleExportPDF = () => {
    if (!examPackage) {
      toast.error("Vui lòng chọn một gói đề trước khi xuất PDF");
      return;
    }
    const url = `${API_BASE_URL}/de-thi/${examPackage.examId}/pdf`;
    window.open(url, '_blank');
    toast.success("Đang tải xuống file PDF...");
  };

  const getCategoryIcon = (subject: string) => {
    const lowerSubject = subject.toLowerCase();
    if (lowerSubject.includes('toán')) return <Calculator className="h-5 w-5" />;
    if (lowerSubject.includes('văn')) return <BookOpen className="h-5 w-5" />;
    if (lowerSubject.includes('anh')) return <Globe className="h-5 w-5" />;
    if (lowerSubject.includes('lý')) return <GraduationCap className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Đang tải dữ liệu đề thi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Tùy chỉnh
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Xem trước
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Template
            </TabsTrigger>
          </TabsList>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tùy chỉnh thông tin đề thi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exam-title">Tiêu đề đề thi</Label>
                    <Input
                      id="exam-title"
                      value={examTitle}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setExamTitle(e.target.value)}
                      placeholder="Nhập tiêu đề đề thi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exam-time">Thời gian làm bài</Label>
                    <Input
                      id="exam-time"
                      placeholder="VD: 90 phút"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="exam-instructions">Hướng dẫn làm bài</Label>
                  <Textarea
                    id="exam-instructions"
                    value={examInstructions}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setExamInstructions(e.target.value)}
                    placeholder="Nhập hướng dẫn làm bài"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <PDFPreview
              examTitle={examTitle}
              examInstructions={examInstructions}
              selectedPackage={examPackage}
              questions={examPackage?.questions || []}
            />
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template">
            <TemplateUpload onTemplateUpload={setCustomTemplate} />
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleExportPDF}
            size="lg"
            disabled={!examPackage || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDF;
