import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileText, Download, Eye, Upload, BookOpen, GraduationCap, Calculator, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import ExamPackageCard from '@/components/ExamPackageCard';
import PDFPreview from '@/components/PDFPreview';
import TemplateUpload from '@/components/TemplateUpload';
import { examApi } from '@/services/api';

// Sample exam packages for UI demo
const examPackages = [
  {
    id: 1,
    title: "Toán học THPT",
    subject: "Toán",
    grade: "12",
    questionCount: 50,
    difficulty: "Khó",
    category: "math",
    description: "Bộ đề toán học lớp 12 với các dạng bài từ cơ bản đến nâng cao",
    topics: ["Đạo hàm", "Tích phân", "Hình học không gian", "Xác suất"],
    createdAt: new Date().toISOString(),
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
    topics: ["Văn học hiện đại", "Tác phẩm trong chương trình", "Nghị luận", "Làm văn"],
    createdAt: new Date().toISOString(),
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
    topics: ["Grammar", "Vocabulary", "Reading", "Listening"],
    createdAt: new Date().toISOString(),
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
    topics: ["Dao động", "Sóng", "Điện học", "Quang học"],
    createdAt: new Date().toISOString(),
  }
];

const PDF = () => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [examTitle, setExamTitle] = useState("Đề thi rút trích");
  const [examInstructions, setExamInstructions] = useState("Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.");
  const [realExams, setRealExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [isUsingRealExam, setIsUsingRealExam] = useState<boolean>(false);
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [loaiBoChuongPhan, setLoaiBoChuongPhan] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch real exams from the backend
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const response = await examApi.getApprovedExams();
        if (response.data && response.data.items) {
          setRealExams(response.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
        toast.error('Không thể tải danh sách đề thi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsUsingRealExam(false);
    setSelectedExamId("");
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

  const handleExamSelect = (examId: string) => {
    if (!examId) return;

    setSelectedExamId(examId);
    setIsUsingRealExam(true);
    setSelectedPackage(null);

    // Find the selected exam
    const selectedExam = realExams.find(exam => exam.MaDeThi === examId);
    if (selectedExam) {
      setExamTitle(selectedExam.TenDeThi || "Đề thi rút trích");
      toast.success(`Đã chọn đề thi: ${selectedExam.TenDeThi}`);
    }
  };

  const handleExportPDF = async () => {
    if (!isUsingRealExam && !selectedPackage) {
      toast.error("Vui lòng chọn một gói đề thi hoặc đề thi thực tế trước khi xuất PDF");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Đang tạo file PDF...", { autoClose: false });

      // Generate a payload for the PDF generation request
      const payload = {
        title: examTitle,
        instructions: examInstructions,
        hasAnswers: showAnswers,
        loaiBoChuongPhan: loaiBoChuongPhan,
        // Include examId if using a real exam
        ...(isUsingRealExam ? { examId: selectedExamId } : {
          questions: selectedQuestions.map(q => ({
            id: q.id,
            content: q.question,
            options: q.options,
            correctAnswerIndex: q.correct,
            topic: q.topic
          }))
        })
      };

      // Call the backend API to generate the PDF
      const response = await examApi.generateCustomPdf(payload);

      // Get the PDF file from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `${examTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);

      // Click the link to download the file
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.dismiss();
      toast.success(`Đã tạo và tải xuống file ${examTitle}.pdf thành công!`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.dismiss();
      toast.error("Không thể tạo file PDF. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDOCX = async () => {
    if (!isUsingRealExam && !selectedPackage) {
      toast.error("Vui lòng chọn một gói đề thi hoặc đề thi thực tế trước khi xuất DOCX");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Đang tạo file DOCX...", { autoClose: false });

      // Generate a payload for the DOCX generation request
      const payload = {
        title: examTitle,
        instructions: examInstructions,
        hasAnswers: showAnswers,
        loaiBoChuongPhan: loaiBoChuongPhan,
        // Include examId if using a real exam
        ...(isUsingRealExam ? { examId: selectedExamId } : {
          questions: selectedQuestions.map(q => ({
            id: q.id,
            content: q.question,
            options: q.options,
            correctAnswerIndex: q.correct,
            topic: q.topic
          }))
        })
      };

      // Call the backend API to generate the DOCX
      const response = await examApi.generateCustomDocx(payload);

      // Get the DOCX file from the response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `${examTitle.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);

      // Click the link to download the file
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.dismiss();
      toast.success(`Đã tạo và tải xuống file ${examTitle}.docx thành công!`);
    } catch (error) {
      console.error('DOCX generation failed:', error);
      toast.dismiss();
      toast.error("Không thể tạo file DOCX. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'math':
        return <Calculator className="mr-2" />;
      case 'literature':
        return <BookOpen className="mr-2" />;
      case 'english':
        return <Globe className="mr-2" />;
      default:
        return <GraduationCap className="mr-2" />;
    }
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tạo đề thi & Xuất PDF</h1>
        <p className="text-gray-500">Tạo và xuất đề thi theo định dạng PDF hoặc DOCX</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình đề thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exam-title">Tiêu đề đề thi</Label>
                <Input
                  id="exam-title"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Nhập tiêu đề đề thi"
                />
              </div>

              <div>
                <Label htmlFor="exam-instructions">Hướng dẫn làm bài</Label>
                <Textarea
                  id="exam-instructions"
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  placeholder="Nhập hướng dẫn làm bài"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="show-answers" className="mb-2 block">Hiển thị đáp án</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-answers"
                    checked={showAnswers}
                    onCheckedChange={setShowAnswers}
                  />
                  <Label htmlFor="show-answers">
                    {showAnswers ? 'Có' : 'Không'}
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="remove-chapters" className="mb-2 block">Cấu trúc đề thi</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remove-chapters"
                    checked={loaiBoChuongPhan}
                    onCheckedChange={setLoaiBoChuongPhan}
                  />
                  <Label htmlFor="remove-chapters">
                    {loaiBoChuongPhan ? 'Không phân cấp' : 'Phân cấp chương/phần'}
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {loaiBoChuongPhan
                    ? 'Đề thi không hiển thị cấu trúc chương/phần, chỉ hiển thị danh sách câu hỏi.'
                    : 'Đề thi sẽ được hiển thị theo cấu trúc chương/phần.'}
                </p>
              </div>

              <div className="pt-4">
                <Label htmlFor="real-exam" className="mb-2 block font-bold">Đề thi thực tế</Label>
                <Select
                  value={selectedExamId}
                  onValueChange={handleExamSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger id="real-exam" className="w-full">
                    <SelectValue placeholder="Chọn đề thi thực tế" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Chọn đề thi --</SelectItem>
                    {realExams.map(exam => (
                      <SelectItem key={exam.MaDeThi} value={exam.MaDeThi}>
                        {exam.TenDeThi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isUsingRealExam && (
                  <p className="text-sm text-green-600 mt-2">
                    Sử dụng câu hỏi từ đề thi thực tế
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-3 pt-6">
                <Button
                  onClick={handleExportPDF}
                  disabled={isLoading || (!isUsingRealExam && !selectedPackage)}
                  className="w-full"
                >
                  <FileText className="mr-2" size={16} />
                  Xuất PDF
                </Button>
                <Button
                  onClick={handleExportDOCX}
                  disabled={isLoading || (!isUsingRealExam && !selectedPackage)}
                  variant="secondary"
                  className="w-full"
                >
                  <FileText className="mr-2" size={16} />
                  Xuất DOCX
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{isUsingRealExam ? "Đề thi đã chọn" : "Gói đề thi mẫu"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isUsingRealExam ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-lg font-semibold mb-2">{examTitle}</h3>
                  <p className="text-sm text-gray-600 mb-4">ID: {selectedExamId}</p>
                  <div className="flex items-center">
                    <Badge variant="default" className="mr-2">Đề thi thực tế</Badge>
                    <span className="text-sm text-gray-500">
                      Đề thi này sẽ lấy dữ liệu câu hỏi từ hệ thống
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examPackages.map(pkg => (
                    <ExamPackageCard
                      key={pkg.id}
                      package={pkg}
                      isSelected={selectedPackage?.id === pkg.id}
                      onSelect={() => handlePackageSelect(pkg)}
                      icon={getCategoryIcon(pkg.category)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDF;
