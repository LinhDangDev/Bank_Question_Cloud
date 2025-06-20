import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, Book } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ExamPackage {
  examId: string;
  title: string;
  subject: string;
  createdAt: string;
  questionCount: number;
  pdfUrl: string;
  docxUrl: string;
  creator: string;
}

const Exams = () => {
  const navigate = useNavigate();
  const [examPackages, setExamPackages] = useState<ExamPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamPackages();
  }, []);

  const fetchExamPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/de-thi/packages/all`);

      if (!response.ok) {
        throw new Error('Failed to fetch exam packages');
      }

      const data = await response.json();
      setExamPackages(data);
    } catch (error) {
      console.error('Error fetching exam packages:', error);
      toast.error('Lỗi khi tải danh sách đề thi');
    } finally {
      setLoading(false);
    }
  };

  const downloadExam = (examId: string, format: 'pdf' | 'docx') => {
    const url = `${API_BASE_URL}/de-thi/${examId}/${format}`;
    window.open(url, '_blank');
  };

  const viewExamDetails = (examId: string) => {
    navigate(`/exams/${examId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            Danh sách đề thi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : examPackages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có đề thi nào. Hãy tạo đề thi mới từ công cụ rút trích.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đề thi</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Người tạo</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Số câu hỏi</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examPackages.map((exam) => (
                    <TableRow key={exam.examId}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.creator}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {formatDate(exam.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {exam.questionCount} câu
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewExamDetails(exam.examId)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadExam(exam.examId, 'pdf')}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadExam(exam.examId, 'docx')}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            DOCX
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Exams;
