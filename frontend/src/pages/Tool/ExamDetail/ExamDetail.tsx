import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '@/services/api';
import { ArrowLeft, Download, Edit, Printer, Clock, Book, AlertTriangle, Eye, EyeOff, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import QuestionItem from '@/components/QuestionItem';
import { useAuth } from '@/context/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Exam {
  MaDeThi: string;
  TenDeThi: string;
  NgayTao: string;
  DaDuyet: boolean;
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showAnswers, setShowAnswers] = useState(true);
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
        const [examResponse, detailsResponse] = await Promise.all([
          examApi.getExamById(id),
          examApi.getExamDetails(id)
        ]);

        setExam(examResponse.data);

        // Kiểm tra nếu dữ liệu trả về là object có thuộc tính items, hoặc là array
        if (detailsResponse.data && typeof detailsResponse.data === 'object') {
          if (Array.isArray(detailsResponse.data)) {
            setExamDetails(detailsResponse.data);
          } else if (detailsResponse.data.items && Array.isArray(detailsResponse.data.items)) {
            setExamDetails(detailsResponse.data.items);
          } else {
            console.error("Unexpected response format:", detailsResponse.data);
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
    if (exam && !exam.DaDuyet && id && isAdmin) {
      navigate(`/exams/edit/${id}`);
    } else {
      toast.warning("Không thể chỉnh sửa đề thi đã được duyệt");
    }
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
          return `
            <div class="question">
              <div class="question-number">Câu ${index + 1}: ${question.NoiDung || ''}</div>
              ${question.CauTraLoi ? question.CauTraLoi.map((answer, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `
                  <div class="answer ${answer.LaDapAn ? 'correct-answer' : ''}">
                    <span class="answer-letter">${letter}.</span> ${answer.NoiDung || ''}
                  </div>
                `;
              }).join('') : ''}
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;
  };

  const handleDownloadExam = () => {
    if (id) {
      window.open(`/api/de-thi/${id}/download`, '_blank');
    }
  };

  const handleDownloadPDF = () => {
    if (id) {
      window.open(`/api/de-thi/${id}/pdf`, '_blank');
    }
  };

  const handleBack = () => {
    navigate('/exams');
  };

  const handleEditAllQuestions = () => {
    if (id) {
      navigate(`/exams/edit-questions/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" />
            <p>{error}</p>
          </div>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2" size={16} />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p>Không tìm thấy thông tin đề thi</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2" size={16} />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Đảm bảo examDetails là mảng trước khi dùng reduce
  const detailsArray = Array.isArray(examDetails) ? examDetails : [];

  // Group questions by chapter (phan)
  const groupedQuestions: GroupedQuestions = detailsArray.reduce((acc: GroupedQuestions, detail) => {
    const phanId = detail.MaPhan;
    if (!acc[phanId]) {
      acc[phanId] = {
        phan: detail.Phan,
        questions: []
      };
    }
    acc[phanId].questions.push(detail);
    return acc;
  }, {});

  // Transform CauHoi to the format expected by QuestionItem
  const transformQuestion = (cauHoi: BackendCauHoi, showAnswers: boolean): CauHoi => {
    return {
      id: cauHoi.MaCauHoi,
      content: cauHoi.NoiDung || '',
      clo: cauHoi.MaCLO ? `CLO ${cauHoi.MaCLO}` : null,
      type: 'single-choice', // Default, adjust based on your data
      answers: cauHoi.CauTraLoi?.map((answer, idx) => ({
        id: answer.MaCauTraLoi,
        content: answer.NoiDung || '',
        isCorrect: showAnswers ? answer.LaDapAn : false, // Ẩn đáp án nếu không hiển thị
        order: answer.ThuTu || idx
      })) || [],
      capDo: cauHoi.CapDo
    };
  };

  return (
    <div className="p-6">
      {/* Hidden iframe for printing */}
      <iframe
        ref={printFrameRef}
        style={{ display: 'none' }}
        title="print-frame"
      />

      <div className="flex items-center mb-6 space-x-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2" size={16} />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold flex-grow">{exam.TenDeThi}</h1>
        <div className="flex space-x-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleEditExam}>
                <Edit className="mr-2" size={16} />
                Chỉnh sửa
              </Button>
              <Button variant="outline" onClick={handleEditAllQuestions}>
                <Pencil className="mr-2" size={16} />
                Chỉnh sửa câu hỏi
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handlePrintExam}>
            <Printer className="mr-2" size={16} />
            In
          </Button>
          <Button onClick={handleDownloadExam}>
            <Download className="mr-2" size={16} />
            Tải Word
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <FileText className="mr-2" size={16} />
            Tải PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin đề thi</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Môn học</p>
                <p className="font-medium">{exam.MonHoc?.TenMonHoc || 'Không có thông tin'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Ngày tạo</p>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  <p>{new Date(exam.NgayTao).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Số câu hỏi</p>
                <div className="flex items-center">
                  <Book size={16} className="mr-2 text-gray-500" />
                  <p>{examDetails.length} câu</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Trạng thái</p>
                <Badge className={exam.DaDuyet ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {exam.DaDuyet ? 'Đã duyệt' : 'Chưa duyệt'}
                </Badge>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="show-answers"
                  checked={showAnswers}
                  onCheckedChange={setShowAnswers}
                />
                <Label htmlFor="show-answers">
                  {showAnswers ? (
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Hiển thị đáp án
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <EyeOff className="w-4 h-4 mr-1" />
                      Ẩn đáp án
                    </div>
                  )}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Nội dung đề thi</h2>

            <Tabs defaultValue="questions" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="questions">Danh sách câu hỏi</TabsTrigger>
                <TabsTrigger value="summary">Tóm tắt</TabsTrigger>
              </TabsList>

              <TabsContent value="questions">
                <div className="space-y-6">
                  {Object.values(groupedQuestions).map((group, index) => (
                    <div key={group.phan.MaPhan || index}>
                      <h3 className="font-semibold border-b pb-2 mb-4">
                        {group.phan.TenPhan || 'Chương không xác định'}
                      </h3>
                      <div className="space-y-4">
                        {group.questions.map((detail, qIndex) => (
                          <QuestionItem
                            key={detail.MaCauHoi}
                            question={transformQuestion(detail.CauHoi, showAnswers)}
                            index={qIndex + 1}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="space-y-4">
                  {Object.values(groupedQuestions).map((group, index) => (
                    <div key={group.phan.MaPhan || index} className="p-4 border rounded-md">
                      <h3 className="font-semibold">{group.phan.TenPhan || 'Chương không xác định'}</h3>
                      <p className="text-sm text-gray-600">Số câu hỏi: {group.questions.length}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamDetail;
