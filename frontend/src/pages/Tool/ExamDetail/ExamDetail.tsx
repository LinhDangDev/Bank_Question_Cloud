import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '@/services/api';
import { ArrowLeft, Download, Edit, Printer, Clock, Book, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import QuestionItem from '@/components/QuestionItem';
import { useAuth } from '@/context/AuthContext';

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

interface CauHoi {
  id: string;
  content: string;
  clo?: string | null;
  type: 'single-choice' | 'multi-choice' | 'fill-blank' | 'group';
  answers: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
  childQuestions?: any[];
  groupContent?: string;
  capDo?: number;
}

interface ExamDetail {
  MaDeThi: string;
  MaPhan: string;
  MaCauHoi: string;
  ThuTu: number;
  Phan: Phan;
  CauHoi: CauHoi;
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
        setExamDetails(detailsResponse.data);
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
    window.print();
  };

  const handleDownloadExam = () => {
    if (id) {
      window.open(`/api/de-thi/${id}/download`, '_blank');
    }
  };

  const handleBack = () => {
    navigate('/exams');
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

  // Group questions by chapter (phan)
  const groupedQuestions: GroupedQuestions = examDetails.reduce((acc: GroupedQuestions, detail) => {
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
  const transformQuestion = (cauHoi: any): CauHoi => {
    return {
      id: cauHoi.MaCauHoi,
      content: cauHoi.NoiDung || '',
      clo: cauHoi.MaCLO ? `CLO ${cauHoi.MaCLO}` : null,
      type: 'single-choice', // Default, adjust based on your data
      answers: cauHoi.CauTraLoi?.map((answer: any, idx: number) => ({
        id: answer.MaCauTraLoi,
        content: answer.NoiDung || '',
        isCorrect: answer.LaDapAn,
        order: answer.ThuTu || idx
      })) || [],
      capDo: cauHoi.CapDo
    };
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6 space-x-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2" size={16} />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold flex-grow">{exam.TenDeThi}</h1>
        <div className="flex space-x-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleEditExam}>
              <Edit className="mr-2" size={16} />
              Chỉnh sửa
            </Button>
          )}
          <Button variant="outline" onClick={handlePrintExam}>
            <Printer className="mr-2" size={16} />
            In
          </Button>
          <Button onClick={handleDownloadExam}>
            <Download className="mr-2" size={16} />
            Tải xuống
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
                            question={transformQuestion(detail.CauHoi)}
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
