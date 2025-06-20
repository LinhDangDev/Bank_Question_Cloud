import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, ArrowLeft, Book, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MathRenderer } from '@/components/MathRenderer';

interface ExamQuestion {
  id: string;
  number: number;
  content: string;
  chapter: string;
  chapterId: string;
  clo: string;
  cloId: string;
  difficulty: number;
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
  createdAt: string;
  questionCount: number;
  questions: ExamQuestion[];
  pdfUrl: string;
  docxUrl: string;
  creator: string;
}

interface CloCounts {
  [clo: string]: number;
}

interface ChapterCounts {
  [chapter: string]: number;
}

const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [examPackage, setExamPackage] = useState<ExamPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloCounts, setCloCounts] = useState<CloCounts>({});
  const [chapterCounts, setChapterCounts] = useState<ChapterCounts>({});

  useEffect(() => {
    if (id) {
      fetchExamPackage(id);
    }
  }, [id]);

  const fetchExamPackage = async (examId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/de-thi/packages/${examId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch exam package');
      }

      const data = await response.json();
      setExamPackage(data);

      // Calculate CLO and chapter statistics
      calculateStatistics(data.questions);
    } catch (error) {
      console.error('Error fetching exam package:', error);
      toast.error('Lỗi khi tải thông tin đề thi');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (questions: ExamQuestion[]) => {
    const cloStats: CloCounts = {};
    const chapterStats: ChapterCounts = {};

    questions.forEach(question => {
      // Count by CLO
      const cloName = question.clo || 'Không có CLO';
      cloStats[cloName] = (cloStats[cloName] || 0) + 1;

      // Count by chapter
      const chapterName = question.chapter || 'Không xác định';
      chapterStats[chapterName] = (chapterStats[chapterName] || 0) + 1;
    });

    setCloCounts(cloStats);
    setChapterCounts(chapterStats);
  };

  const downloadExam = (format: 'pdf' | 'docx') => {
    if (!examPackage) return;

    const url = `${API_BASE_URL}/de-thi/${examPackage.examId}/${format}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Dễ</Badge>;
      case 2: return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Trung bình</Badge>;
      case 3: return <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-50">Khó</Badge>;
      default: return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!examPackage) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16 text-gray-500">
          Không tìm thấy thông tin đề thi
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/exams')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách đề thi
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadExam('pdf')}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Tải PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadExam('docx')}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Tải DOCX
          </Button>
        </div>
      </div>

      <Card className="shadow-md border-0 mb-6">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            {examPackage.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Môn học</h3>
              <p className="text-lg font-medium flex items-center gap-2">
                <Book className="w-5 h-5 text-blue-600" />
                {examPackage.subject}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Người tạo</h3>
              <p className="text-lg font-medium">{examPackage.creator || 'Không xác định'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Ngày tạo</h3>
              <p>{formatDate(examPackage.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tổng số câu hỏi</h3>
              <p className="text-lg font-medium">{examPackage.questionCount} câu</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="questions">
        <TabsList className="mb-4">
          <TabsTrigger value="questions">Danh sách câu hỏi</TabsTrigger>
          <TabsTrigger value="statistics">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">STT</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Chương</TableHead>
                      <TableHead>CLO</TableHead>
                      <TableHead>Độ khó</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examPackage.questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">{question.number}</TableCell>
                        <TableCell>
                          <MathRenderer content={question.content} />
                          <div className="mt-2 pl-4 border-l-2 border-gray-200">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className={`mt-1 ${answer.isCorrect ? 'text-green-600 font-medium' : ''}`}
                              >
                                {answer.label}. <MathRenderer content={answer.content} />
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{question.chapter}</TableCell>
                        <TableCell>{question.clo || 'Không có CLO'}</TableCell>
                        <TableCell>{getDifficultyLabel(question.difficulty)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md border-0">
              <CardHeader className="bg-emerald-600 text-white">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5" />
                  Phân bố theo CLO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CLO</TableHead>
                      <TableHead className="text-right">Số câu hỏi</TableHead>
                      <TableHead className="text-right">Tỷ lệ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(cloCounts).map(([clo, count]) => (
                      <TableRow key={clo}>
                        <TableCell>{clo}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                        <TableCell className="text-right">
                          {Math.round((count / examPackage.questionCount) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5" />
                  Phân bố theo chương
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chương</TableHead>
                      <TableHead className="text-right">Số câu hỏi</TableHead>
                      <TableHead className="text-right">Tỷ lệ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(chapterCounts).map(([chapter, count]) => (
                      <TableRow key={chapter}>
                        <TableCell>{chapter}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                        <TableCell className="text-right">
                          {Math.round((count / examPackage.questionCount) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamDetail;
