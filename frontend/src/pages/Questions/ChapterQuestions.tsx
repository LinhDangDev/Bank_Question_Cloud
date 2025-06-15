import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react'
import PageContainer from '@/components/ui/PageContainer'
import axios from 'axios'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

interface Question {
  question: {
    MaCauHoi: string;
    MaPhan: string;
    MaSoCauHoi: number;
    NoiDung: string;
    HoanVi: boolean;
    CapDo: number;
    SoCauHoiCon: number;
    DoPhanCachCauHoi: number | null;
    MaCauHoiCha: string | null;
    XoaTamCauHoi: boolean;
    SoLanDuocThi: number;
    SoLanDung: number;
    NgayTao: string;
    NgaySua: string;
    MaCLO: string;
  };
  answers: Answer[];
}

interface Chapter {
  MaPhan: string;
  TenPhan: string;
  MaMonHoc: string;
  MonHoc: {
    MaMonHoc: string;
    TenMonHoc: string;
    Khoa: {
      TenKhoa: string;
    }
  }
}

const ChapterQuestions = () => {
  const navigate = useNavigate()
  const { maPhan } = useParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchChapter = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/phan/${maPhan}`)
      setChapter(response.data)
    } catch (error) {
      toast.error('Không thể tải thông tin chương')
      console.error('Error fetching chapter:', error)
    }
  }

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`http://localhost:3000/cau-hoi/phan/${maPhan}/with-answers`)
      setQuestions(Array.isArray(response.data.items) ? response.data.items : [])
    } catch (error) {
      toast.error('Không thể tải danh sách câu hỏi')
      setQuestions([])
      console.error('Error fetching questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (maPhan) {
      fetchChapter()
      fetchQuestions()
    }
  }, [maPhan])

  // Render LaTeX content in questions and answers
  const renderLatex = (content: string) => {
    if (!content) return '';

    try {
      // Find LaTeX expressions surrounded by $ signs
      return content.replace(/\$(.*?)\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            output: 'html',
            displayMode: false
          });
        } catch (e) {
          console.error('Error rendering LaTeX:', latex, e);
          return match;
        }
      });
    } catch (e) {
      console.error('Error processing content:', content, e);
      return content;
    }
  };

  const handleDeleteQuestion = async (maCauHoi: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      await axios.patch(`http://localhost:3000/cau-hoi/${maCauHoi}/soft-delete`);
      toast.success('Xóa câu hỏi thành công');
      fetchQuestions();
    } catch (error) {
      toast.error('Không thể xóa câu hỏi');
      console.error('Error deleting question:', error);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.question.NoiDung?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(`/chapters/${chapter?.MaMonHoc || ''}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">
            Câu hỏi - {chapter?.TenPhan || 'Đang tải...'}
            {chapter?.MonHoc && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                ({chapter.MonHoc.TenMonHoc} - {chapter.MonHoc.Khoa.TenKhoa})
              </span>
            )}
          </h1>
        </div>
        <Button onClick={() => navigate(`/questions/create?maPhan=${maPhan}`)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={fetchQuestions} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có câu hỏi nào trong chương này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredQuestions.map((item) => (
            <Card key={item.question.MaCauHoi} className={item.question.XoaTamCauHoi ? 'opacity-50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  Câu hỏi #{item.question.MaSoCauHoi}
                </CardTitle>
                <Badge variant={item.question.XoaTamCauHoi ? 'destructive' : 'default'}>
                  {item.question.XoaTamCauHoi ? 'Đã xóa' : 'Đang hoạt động'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div
                    className="text-base"
                    dangerouslySetInnerHTML={{ __html: renderLatex(item.question.NoiDung) }}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Đáp án:</h3>
                  <ul className="space-y-2">
                    {item.answers.map((answer) => (
                      <li
                        key={answer.MaCauTraLoi}
                        className={`p-2 rounded-md ${answer.LaDapAn ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                      >
                        <div
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }}
                        />
                        {answer.LaDapAn && (
                          <Badge className="mt-1" variant="default">Đáp án đúng</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p>Cấp độ: {item.question.CapDo}</p>
                  <p>Ngày tạo: {new Date(item.question.NgayTao).toLocaleDateString('vi-VN')}</p>
                  <p>Ngày sửa: {new Date(item.question.NgaySua).toLocaleDateString('vi-VN')}</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => navigate(`/questions/view/${item.question.MaCauHoi}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem chi tiết
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => navigate(`/questions/edit/${item.question.MaCauHoi}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center"
                    onClick={() => handleDeleteQuestion(item.question.MaCauHoi)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

export default ChapterQuestions
