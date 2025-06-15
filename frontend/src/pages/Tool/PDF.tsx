import React, { useState, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Eye, Upload, BookOpen, GraduationCap, Calculator, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ExamPackageCard from '@/components/ExamPackageCard';
import PDFPreview from '@/components/PDFPreview';
import TemplateUpload from '@/components/TemplateUpload';

// Define types for our data structures
interface Topic {
  id: number;
  title: string;
  subject: string;
  grade: string;
  questionCount: number;
  difficulty: string;
  category: string;
  description: string;
  topics: string[];
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  topic: string;
}

const examPackages: Topic[] = [
  {
    id: 1,
    title: "Toán học THPT",
    subject: "Toán",
    grade: "12",
    questionCount: 50,
    difficulty: "Khó",
    category: "math",
    description: "Bộ đề toán học lớp 12 với các dạng bài từ cơ bản đến nâng cao",
    topics: ["Đạo hàm", "Tích phân", "Hình học không gian", "Xác suất"]
  },
  {
    id: 2,
    title: "Ngữ văn THPT",
    subject: "Ngữ văn",
    grade: "12",
    questionCount: 40,
    difficulty: "Trung bình",
    category: "literature",
    description: "Tuyển tập câu hỏi ngữ văn 12 theo chương trình mới",
    topics: ["Văn học hiện đại", "Tác phẩm trong chương trình", "Nghị luận", "Làm văn"]
  },
  {
    id: 3,
    title: "Tiếng Anh THPT",
    subject: "Tiếng Anh",
    grade: "12",
    questionCount: 60,
    difficulty: "Trung bình",
    category: "english",
    description: "Đề thi tiếng Anh với các kỹ năng nghe, nói, đọc, viết",
    topics: ["Grammar", "Vocabulary", "Reading", "Listening"]
  },
  {
    id: 4,
    title: "Vật lý THPT",
    subject: "Vật lý",
    grade: "12",
    questionCount: 45,
    difficulty: "Khó",
    category: "physics",
    description: "Bộ câu hỏi vật lý 12 bao gồm các chương quan trọng",
    topics: ["Dao động", "Sóng", "Điện học", "Quang học"]
  }
];

const PDF: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<Topic | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [customTemplate, setCustomTemplate] = useState<File | null>(null);
  const [examTitle, setExamTitle] = useState("Đề thi rút trích");
  const [examInstructions, setExamInstructions] = useState("Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.");

  const handlePackageSelect = (pkg: Topic) => {
    setSelectedPackage(pkg);
    // Generate sample questions for the selected package
    const sampleQuestions = Array.from({ length: Math.min(pkg.questionCount, 10) }, (_, i) => ({
      id: i + 1,
      question: `Câu ${i + 1}: Đây là câu hỏi mẫu cho môn ${pkg.subject}. Nội dung câu hỏi sẽ được hiển thị tại đây.`,
      options: ["A. Đáp án A", "B. Đáp án B", "C. Đáp án C", "D. Đáp án D"],
      correct: 0,
      topic: pkg.topics[i % pkg.topics.length]
    }));
    setSelectedQuestions(sampleQuestions);
    toast.success(`Đã chọn gói đề: ${pkg.title}`);
  };

  const handleExportPDF = () => {
    if (!selectedPackage) {
      toast.error("Vui lòng chọn một gói đề trước khi xuất PDF");
      return;
    }

    // Simulate PDF export
    toast.success("Đang xuất PDF...", {
      description: "File PDF sẽ được tải xuống trong giây lát"
    });

    setTimeout(() => {
      toast.success("Xuất PDF thành công!", {
        description: `Đã tạo file ${examTitle}.pdf`
      });
    }, 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'math': return <Calculator className="h-5 w-5" />;
      case 'literature': return <BookOpen className="h-5 w-5" />;
      case 'english': return <Globe className="h-5 w-5" />;
      case 'physics': return <GraduationCap className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const filteredPackages = examPackages;

  return (
    <div className="min-h-screen  from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">

        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Chọn đề thi
            </TabsTrigger>
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

          {/* Package Selection Tab */}
          <TabsContent value="packages" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPackages.map((pkg) => (
                <ExamPackageCard
                  key={pkg.id}
                  package={pkg}
                  isSelected={selectedPackage?.id === pkg.id}
                  onSelect={() => handlePackageSelect(pkg)}
                  icon={getCategoryIcon(pkg.category)}
                />
              ))}
            </div>
          </TabsContent>

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

            {selectedPackage && (
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách câu hỏi - {selectedPackage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedQuestions.map((question) => (
                      <div key={question.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{question.question}</h4>
                          <Badge variant="outline">{question.topic}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {question.options.map((option, idx) => (
                            <div key={idx}>{option}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <PDFPreview
              examTitle={examTitle}
              examInstructions={examInstructions}
              selectedPackage={selectedPackage}
              questions={selectedQuestions}
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
            className=" from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
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
