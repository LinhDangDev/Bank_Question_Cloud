import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, deThiApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FileText, Book, Clock, Calendar, User, Bookmark, Download, ArrowLeft, Edit, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import QuestionItem from '@/components/QuestionItem';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { processMediaMarkup } from '@/utils/mediaMarkup';
import { toast } from 'sonner';
import { ExamWordExportDialog } from '@/components/ExamWordExportDialog';
import { SimpleExamWordExportDialog } from '@/components/SimpleExamWordExportDialog';

interface Exam {
  MaDeThi: string;
  TenDeThi: string;
  NgayTao: string;
  DaDuyet: boolean;
  LoaiBoChuongPhan: boolean;
  MonHoc?: {
    TenMonHoc: string;
  };
}

interface Phan {
  MaPhan: string;
  TenPhan: string;
}

interface BackendCauTraLoi {
  MaCauTraLoi: string;
  NoiDung: string;
  LaDapAn: boolean;
  ThuTu: number;
}

interface BackendCauHoi {
  MaCauHoi: string;
  NoiDung: string;
  MaCLO?: string;
  CapDo?: number;
  CauTraLoi?: BackendCauTraLoi[];
  CLO?: {
    MaCLO: string;
    TenCLO: string;
  };
  // Group question properties
  SoCauHoiCon?: number;
  MaCauHoiCha?: string | null;
  LaCauHoiNhom?: boolean;
  CauHoiCon?: BackendChildQuestion[];
}

interface BackendChildQuestion {
  MaCauHoi: string;
  MaSoCauHoi: number;
  NoiDung: string;
  CauTraLoi: BackendCauTraLoi[];
}

interface ExamDetail {
  MaDeThi: string;
  MaPhan: string;
  MaCauHoi: string;
  ThuTu: number;
  Phan: Phan;
  CauHoi: BackendCauHoi;
}

interface GroupedQuestions {
  [key: string]: {
    phan: Phan;
    questions: ExamDetail[];
  };
}

const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [examDetails, setExamDetails] = useState<ExamDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showAnswers, setShowAnswers] = useState(true); // Always show answers
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!id) {
        setError("ID đề thi không hợp lệ");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Use the hierarchical questions endpoint instead
        const [examResponse, hierarchicalResponse] = await Promise.all([
          examApi.getExamById(id),
          deThiApi.getHierarchicalQuestions(id)
        ]);
        setExam(examResponse.data);
        // Process the hierarchical questions response
        if (hierarchicalResponse.data && typeof hierarchicalResponse.data === 'object') {
          // Extract questions from the hierarchical structure
          const questions = hierarchicalResponse.data.questions;

          if (Array.isArray(questions)) {
            setExamDetails(questions);
          } else if (questions && questions.items && Array.isArray(questions.items)) {
            setExamDetails(questions.items);
          } else {
            console.error("Unexpected questions format:", hierarchicalResponse.data);
            setExamDetails([]);
            setError("Định dạng dữ liệu không hợp lệ");
          }
        } else {
          setExamDetails([]);
          setError("Không có dữ liệu chi tiết đề thi");
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
        setError("Không thể tải thông tin đề thi. Vui lòng thử lại sau.");
        toast.error("Không thể tải thông tin đề thi");
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id]);

  const handleEditExam = () => {
    toast.info("Tính năng đang phát triển", {
      description: "Chức năng chỉnh sửa đề thi đang được hoàn thiện.",
      duration: 3000,
    });
  };

  const handleApproveExam = async () => {
    toast.info("Tính năng đang phát triển", {
      description: "Chức năng phê duyệt đề thi đang được hoàn thiện.",
      duration: 3000,
    });
  };

  const handlePrintExam = () => {
    // Tạo nội dung trang in chuyên nghiệp
    const printContent = generatePrintableHTML();

    // Sử dụng iframe để in đề thi
    if (printFrameRef.current) {
      const frameWindow = printFrameRef.current.contentWindow;
      if (frameWindow) {
        frameWindow.document.open();
        frameWindow.document.write(printContent);
        frameWindow.document.close();
        setTimeout(() => {
          frameWindow.print();
        }, 500);
      }
    } else {
      // Fallback nếu iframe không khả dụng
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }
    }
  };

  const generatePrintableHTML = () => {
    // Đảm bảo examDetails là mảng
    const detailsArray = Array.isArray(examDetails) ? examDetails : [];

    // Sắp xếp câu hỏi theo thứ tự
    const sortedQuestions = [...detailsArray].sort((a, b) => a.ThuTu - b.ThuTu);

    // Tạo HTML cho trang in
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${exam?.TenDeThi || 'Đề thi'}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .school-info {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .exam-title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
          }
          .exam-info {
            font-size: 12px;
            font-style: italic;
          }
          .question {
            margin-bottom: 15px;
          }
          .question-number {
            font-weight: bold;
          }
          .group-question {
            border-left: 3px solid #8B5CF6;
            padding-left: 15px;
            margin-bottom: 20px;
          }
          .group-content {
            margin: 10px 0;
            padding: 10px;
            background-color: #F8F9FA;
            border-radius: 5px;
          }
          .child-question {
            margin: 10px 0;
            padding-left: 20px;
          }
          .child-question-number {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .answer {
            margin-left: 20px;
            margin-bottom: 5px;
          }
          .answer-letter {
            font-weight: bold;
          }
          .correct-answer {
            font-weight: ${showAnswers ? 'bold' : 'normal'};
            color: ${showAnswers ? '#008000' : 'inherit'};
          }
          .page-break {
            page-break-after: always;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-info">
            <div>BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div>TRƯỜNG ĐẠI HỌC HUTECH</div>
          </div>
          <div class="exam-title">${exam?.TenDeThi || 'ĐỀ THI'}</div>
          <div class="exam-info">
            <div>Môn: ${exam?.MonHoc?.TenMonHoc || ''}</div>
            <div>Thời gian: 90 phút</div>
          </div>
        </div>

        ${sortedQuestions.map((detail, index) => {
          const question = detail.CauHoi;
          const isGroupQuestion = (question.SoCauHoiCon && question.SoCauHoiCon > 0) ||
                                 question.LaCauHoiNhom ||
                                 (question.CauHoiCon && question.CauHoiCon.length > 0);

          if (isGroupQuestion) {
            // Handle group questions - clean parent content
            const cleanedParentContent = cleanGroupQuestionParentContent(question.NoiDung || '', question.CauHoiCon);

            return `
              <div class="question group-question">
                <div class="question-number">Câu ${index + 1} - ${index + (question.CauHoiCon?.length || question.SoCauHoiCon || 5)}: Câu hỏi nhóm</div>
                <div class="group-content">${processMediaMarkup(cleanedParentContent)}</div>

                ${question.CauHoiCon ? question.CauHoiCon.map((childQ, childIdx) => {
                  const cleanedChildContent = cleanChildQuestionContent(childQ.NoiDung || '');
                  return `
                    <div class="child-question">
                      <div class="child-question-number">Câu ${index + childIdx + 1}: ${processMediaMarkup(cleanedChildContent)}</div>
                      ${childQ.CauTraLoi ? childQ.CauTraLoi.map((answer, ansIdx) => {
                        const letter = String.fromCharCode(65 + ansIdx);
                        const processedAnswer = processMediaMarkup(answer.NoiDung || '');
                        return `
                          <div class="answer ${answer.LaDapAn ? 'correct-answer' : ''}">
                            <span class="answer-letter">${letter}.</span> ${processedAnswer}
                          </div>
                        `;
                      }).join('') : ''}
                    </div>
                  `;
                }).join('') : ''}
              </div>
            `;
          } else {
            // Handle regular questions
            const processedContent = processMediaMarkup(question.NoiDung || '');
            return `
              <div class="question">
                <div class="question-number">Câu ${index + 1}: ${processedContent}</div>
                ${question.CauTraLoi ? question.CauTraLoi.map((answer, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const processedAnswer = processMediaMarkup(answer.NoiDung || '');
                  return `
                    <div class="answer ${answer.LaDapAn ? 'correct-answer' : ''}">
                      <span class="answer-letter">${letter}.</span> ${processedAnswer}
                    </div>
                  `;
                }).join('') : ''}
              </div>
            `;
          }
        }).join('')}
      </body>
      </html>
    `;
  };

  const handleDownloadExam = async () => {
    if (!id) return;

    try {
      const response = await examApi.downloadExam(id, 'docx');
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-${id}.docx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading DOCX:", error);
      toast.error("Không thể tải xuống tệp DOCX");
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;

    try {
      const response = await examApi.downloadExam(id, 'pdf');
      const blob = new Blob([response.data], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Không thể tải xuống tệp PDF");
    }
  };

  const handleBack = () => {
    navigate('/exams');
  };

  const handleEditAllQuestions = () => {
    toast.info("Tính năng đang phát triển", {
      description: "Chức năng chỉnh sửa tất cả câu hỏi đang được hoàn thiện.",
      duration: 3000,
    });
  };

  const handleFeatureUnderDevelopment = () => {
    toast.info("Tính năng đang phát triển", {
      description: "Chức năng này đang được hoàn thiện.",
      duration: 3000,
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !exam) {
    return <ErrorDisplay message={error || "Không tìm thấy thông tin đề thi"} />;
  }

  // Đảm bảo examDetails là mảng trước khi dùng reduce
  const detailsArray = Array.isArray(examDetails) ? examDetails : [];

  // Group questions by chapter (phan) or combine all if LoaiBoChuongPhan is true
  const groupedQuestions: GroupedQuestions = detailsArray.reduce((acc: GroupedQuestions, detail) => {
    // If LoaiBoChuongPhan is true, use a single group for all questions
    const phanId = exam.LoaiBoChuongPhan ? 'all-questions' : detail.MaPhan;

    if (!acc[phanId]) {
      acc[phanId] = {
        phan: exam.LoaiBoChuongPhan
          ? { MaPhan: 'all-questions', TenPhan: 'Tất cả câu hỏi' }
          : detail.Phan,
        questions: []
      };
    }

    acc[phanId].questions.push(detail);
    return acc;
  }, {});

  // Interface for QuestionItem component's expected format
  interface CauHoi {
    id: string;
    content: string;
    clo: string | null;
    type: 'single-choice' | 'multi-choice' | 'fill-blank' | 'group';
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
      order: number;
    }[];
    childQuestions?: CauHoi[];
    capDo?: number;
  }

  // Helper function to clean group question parent content
  const cleanGroupQuestionParentContent = (content: string, childQuestions?: BackendChildQuestion[]): string => {
    if (!content) return '';

    // Extract content between [<sg>] and [<egc>] - this is the parent question content only
    const sgMatch = content.match(/\[<sg>\]([\s\S]*?)\[<egc>\]/);
    let parentContent = sgMatch ? sgMatch[1].trim() : content;

    // Remove all markup tags
    parentContent = parentContent
      .replace(/\[<[^>]*>\]/g, '') // Remove [<markup>] patterns
      .replace(/\[<\/[^>]*>\]/g, '') // Remove [</markup>] patterns
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Handle fill-in-blank: Replace {<1>}, {<2>}, etc. with question numbers
    if (childQuestions && childQuestions.length > 0) {
      childQuestions.forEach((_, index) => {
        const questionNumber = index + 1;
        const pattern = new RegExp(`\\{<${questionNumber}>\\}`, 'g');
        parentContent = parentContent.replace(pattern, `_____(${questionNumber})_____`);
      });
    }

    return parentContent;
  };

  // Helper function to clean child question content
  const cleanChildQuestionContent = (content: string): string => {
    if (!content) return '';

    // Remove the (<number>) pattern from the beginning
    let cleanContent = content.replace(/^\s*\(<\d+>\)\s*/, '');

    // Remove any remaining markup
    cleanContent = cleanContent
      .replace(/\[<[^>]*>\]/g, '') // Remove [<markup>] patterns
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return cleanContent;
  };

  // Transform CauHoi to the format expected by QuestionItem
  const transformQuestion = (cauHoi: BackendCauHoi, showAnswers: boolean): CauHoi => {
    // Determine if this is a group question
    const isGroupQuestion = (cauHoi.SoCauHoiCon && cauHoi.SoCauHoiCon > 0) ||
                           cauHoi.LaCauHoiNhom ||
                           (cauHoi.CauHoiCon && cauHoi.CauHoiCon.length > 0);

    // Clean content based on question type
    let cleanedContent = cauHoi.NoiDung || '';
    if (isGroupQuestion) {
      cleanedContent = cleanGroupQuestionParentContent(cleanedContent, cauHoi.CauHoiCon);
    }

    return {
      id: cauHoi.MaCauHoi,
      content: cleanedContent,
      clo: cauHoi.CLO?.TenCLO || null,
      type: isGroupQuestion ? 'group' : 'single-choice',
      answers: cauHoi.CauTraLoi?.map((answer, idx) => ({
        id: answer.MaCauTraLoi,
        content: answer.NoiDung || '',
        isCorrect: showAnswers ? answer.LaDapAn : false,
        order: answer.ThuTu || idx
      })) || [],
      // Transform child questions for group questions
      childQuestions: cauHoi.CauHoiCon?.map((childQ) => ({
        id: childQ.MaCauHoi,
        content: cleanChildQuestionContent(childQ.NoiDung || ''),
        clo: null,
        type: 'single-choice' as const,
        answers: childQ.CauTraLoi?.map((answer, idx) => ({
          id: answer.MaCauTraLoi,
          content: answer.NoiDung || '',
          isCorrect: showAnswers ? answer.LaDapAn : false,
          order: answer.ThuTu || idx
        })) || [],
        capDo: cauHoi.CapDo
      })) || [],
      capDo: cauHoi.CapDo
    };
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold flex-1">{exam.TenDeThi}</h1>

        {/* Hide edit buttons */}
        {/*
        <div className="flex gap-2">
          {isAdmin && (
            <>
              {!exam.DaDuyet ? (
                <Button
                  onClick={handleApproveExam}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Duyệt đề thi
                </Button>
              ) : null}
              <Button
                onClick={handleEditExam}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit size={16} />
                Chỉnh sửa
              </Button>
            </>
          )}

          <Button
            onClick={() => {
              console.log('TEST BUTTON CLICKED!');
              alert('Button hoat dong!');
            }}
          >
            TEST
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={exportLoading}
            onClick={async () => {
              if (!id || !exam) {
                alert('Khong co thong tin de thi');
                return;
              }

              setExportLoading(true);

              console.log('� Starting Word export for exam:', id);

              try {
                const exportOptions = {
                  examTitle: exam.TenDeThi || 'ĐỀ THI',
                  subject: 'Cơ Sở Dữ Liệu',
                  course: 'Khoa CNTT',
                  semester: 'Học kỳ 1',
                  academicYear: '2024-2025',
                  examDate: new Date().toLocaleDateString('vi-VN'),
                  duration: '90 phút',
                  instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
                  allowMaterials: false,
                  showAnswers: false,
                  separateAnswerSheet: false,
                  studentInfo: {
                    studentId: '',
                    studentName: '',
                    className: ''
                  }
                };

                console.log('📋 Export options:', exportOptions);

                const response = await fetch(`/api/exam-word-export/${id}/export`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(exportOptions)
                });

                console.log('📡 Response status:', response.status);

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Export failed: ${errorText}`);
                }

                const blob = await response.blob();
                console.log('📁 File blob size:', blob.size, 'bytes');

                // Download file
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${exam.TenDeThi || 'ĐỀ_THI'}_${Date.now()}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                console.log('✅ Export successful!');
                alert('Tải file Word thành công!');

              } catch (error: any) {
                console.error('Export error:', error);
                alert('Loi: ' + error.message);
              } finally {
                setExportLoading(false);
              }
            }}
          >
            <Download size={16} />
            {exportLoading ? 'Dang tai...' : 'Tai Word'}
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Tải PDF
          </Button>
        </div>
        */}

        {/* Show download buttons with notifications */}
        <div className="flex gap-2">
          <Button
            onClick={handleFeatureUnderDevelopment}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Tải Word
          </Button>
          <Button
            onClick={handleFeatureUnderDevelopment}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Tải PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500 mb-1">Môn học</p>
                  <div className="flex items-center">
                    <Book size={16} className="mr-2 text-blue-500" />
                    <p className="font-medium">{exam.MonHoc?.TenMonHoc || 'Không có thông tin'}</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-blue-500" />
                    <p className="font-medium">{new Date(exam.NgayTao).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500 mb-1">Thời gian tạo</p>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-blue-500" />
                    <p className="font-medium">{new Date(exam.NgayTao).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500 mb-1">Cấu trúc đề thi</p>
                  <Badge className={exam.LoaiBoChuongPhan ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                    {exam.LoaiBoChuongPhan ? 'Không phân cấp chương' : 'Phân cấp theo chương'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {exam.LoaiBoChuongPhan
                      ? 'Câu hỏi không được chia theo chương/phần'
                      : 'Câu hỏi được phân chia theo chương/phần'}
                  </p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500 mb-1">Thống kê câu hỏi</p>
                  <div className="space-y-2 mt-2">
                    {(() => {
                      const detailsArray = Array.isArray(examDetails) ? examDetails : [];
                      const groupQuestions = detailsArray.filter(q =>
                        (q.CauHoi.SoCauHoiCon && q.CauHoi.SoCauHoiCon > 0) ||
                        q.CauHoi.LaCauHoiNhom ||
                        (q.CauHoi.CauHoiCon && q.CauHoi.CauHoiCon.length > 0)
                      );
                      const singleQuestions = detailsArray.filter(q =>
                        !((q.CauHoi.SoCauHoiCon && q.CauHoi.SoCauHoiCon > 0) ||
                          q.CauHoi.LaCauHoiNhom ||
                          (q.CauHoi.CauHoiCon && q.CauHoi.CauHoiCon.length > 0))
                      );
                      const totalChildQuestions = groupQuestions.reduce((sum, q) =>
                        sum + (q.CauHoi.CauHoiCon?.length || q.CauHoi.SoCauHoiCon || 0), 0
                      );

                      return (
                        <>
                          <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tổng số câu hỏi:</span>
                            <span className="font-semibold text-lg">{detailsArray.length}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 p-2 rounded-md">
                              <div className="text-xs text-blue-600">Câu hỏi đơn</div>
                              <div className="font-medium text-blue-700">{singleQuestions.length}</div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded-md">
                              <div className="text-xs text-purple-600">Câu hỏi nhóm</div>
                              <div className="font-medium text-purple-700">{groupQuestions.length}</div>
                            </div>
                            {groupQuestions.length > 0 && (
                              <div className="bg-indigo-50 p-2 rounded-md col-span-2">
                                <div className="text-xs text-indigo-600">Câu hỏi con</div>
                                <div className="font-medium text-indigo-700">{totalChildQuestions}</div>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Hide answer toggle
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Hiển thị đáp án</p>
                    <Switch
                      id="show-answers"
                      checked={showAnswers}
                      onCheckedChange={setShowAnswers}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {showAnswers
                      ? 'Đáp án đúng được hiển thị trong danh sách câu hỏi'
                      : 'Đáp án đúng bị ẩn trong danh sách câu hỏi'}
                  </p>
                </div>
                */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="questions" className="flex-1 max-w-[200px]">
                <FileText className="mr-2" size={16} />
                Danh sách câu hỏi
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex-1 max-w-[200px]">
                <Book className="mr-2" size={16} />
                Tóm tắt đề thi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions">
              <div className="space-y-6">
                {(() => {
                  // Flatten all questions into a single array for continuous numbering
                  const allQuestions = Object.values(groupedQuestions).flatMap(group => group.questions);
                  return allQuestions.map((detail, qIndex) => (
                    <Card key={detail.MaCauHoi} className="overflow-hidden">
                      <CardContent className="pt-6 pb-6">
                        <QuestionItem
                          key={detail.MaCauHoi}
                          question={{
                            ...transformQuestion(detail.CauHoi, showAnswers),
                            questionNumber: qIndex + 1
                          }}
                        />
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Thống kê tổng quan</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(() => {
                          const detailsArray = Array.isArray(examDetails) ? examDetails : [];
                          const groupQuestions = detailsArray.filter(q =>
                            (q.CauHoi.SoCauHoiCon && q.CauHoi.SoCauHoiCon > 0) ||
                            q.CauHoi.LaCauHoiNhom ||
                            (q.CauHoi.CauHoiCon && q.CauHoi.CauHoiCon.length > 0)
                          );
                          const singleQuestions = detailsArray.filter(q =>
                            !((q.CauHoi.SoCauHoiCon && q.CauHoi.SoCauHoiCon > 0) ||
                              q.CauHoi.LaCauHoiNhom ||
                              (q.CauHoi.CauHoiCon && q.CauHoi.CauHoiCon.length > 0))
                          );


                          return (
                            <>
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-700">{detailsArray.length}</div>
                                <div className="text-sm text-blue-600">Tổng số câu hỏi</div>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{singleQuestions.length}</div>
                                <div className="text-sm text-green-600">Câu hỏi đơn</div>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-purple-700">{groupQuestions.length}</div>
                                <div className="text-sm text-purple-600">Câu hỏi nhóm</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Phân bố theo chương</h3>
                      <div className="space-y-3">
                        {Object.entries(groupedQuestions).map(([phanId, group]) => (
                          <div key={phanId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{group.phan.TenPhan}</span>
                            <Badge variant="outline">{group.questions.length} câu hỏi</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Thông tin đề thi</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tên đề thi:</span>
                            <span className="font-medium">{exam?.TenDeThi}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Môn học:</span>
                            <span className="font-medium">{exam?.MonHoc?.TenMonHoc || 'Không có thông tin'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ngày tạo:</span>
                            <span className="font-medium">{new Date(exam?.NgayTao || '').toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trạng thái:</span>
                            <Badge className={exam?.DaDuyet ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {exam?.DaDuyet ? 'Đã duyệt' : 'Chờ duyệt'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cấu trúc:</span>
                            <Badge className={exam?.LoaiBoChuongPhan ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                              {exam?.LoaiBoChuongPhan ? 'Không phân cấp' : 'Phân cấp chương'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Hidden print iframe */}
      <iframe
        ref={printFrameRef}
        style={{ display: 'none' }}
        title="Print Frame"
      />
    </div>
  );
};

export default ExamDetail;
