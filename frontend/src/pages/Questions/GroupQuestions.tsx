import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStyles, cx } from '../../utils/theme';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/config';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import PageContainer from '@/components/PageContainer';
import PaginationBar from '@/components/PaginationBar';
import { formatChildQuestionContent, formatParentQuestionContent, cleanContent } from '@/utils/latex';

// Define the Answer interface
interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

// Define ChildQuestion interface for group questions
interface ChildQuestion {
  MaCauHoi: string;
  MaSoCauHoi: number;
  NoiDung: string;
  CauTraLoi: Answer[];
}

// Define Group Question interface
interface GroupQuestion {
  MaCauHoi: string;
  MaPhan: string;
  MaSoCauHoi: number;
  NoiDung: string;
  HoanVi: boolean;
  CapDo: number;
  SoCauHoiCon: number;
  MaCauHoiCha: string | null;
  XoaTamCauHoi: boolean;
  SoLanDuocThi: number;
  SoLanDung: number;
  NgayTao: string;
  NgaySua: string;
  MaCLO: string;
  TenCLO?: string;
  LaCauHoiNhom: boolean;
  DoPhanCachCauHoi?: number | null;
  CauHoiCon?: ChildQuestion[];
}

interface ApiResponse {
  items: GroupQuestion[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Helper functions
const getDifficultyText = (level: number) => {
  switch (level) {
    case 1:
      return 'Dễ';
    case 2:
      return 'Trung bình';
    case 3:
      return 'Khó';
    default:
      return 'Không xác định';
  }
};

const getDifficultyColor = (level: number) => {
  switch (level) {
    case 1:
      return 'bg-green-100 text-green-800';
    case 2:
      return 'bg-yellow-100 text-yellow-800';
    case 3:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const GroupQuestionsPage = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStyles();
  const [groupQuestions, setGroupQuestions] = useState<GroupQuestion[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetchGroupQuestions();
  }, [page, limit]);

  const fetchGroupQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cau-hoi/group?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách câu hỏi nhóm');
      }

      const data: ApiResponse = await response.json();
      setGroupQuestions(data.items);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error('Error fetching group questions:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải danh sách câu hỏi nhóm');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (questionId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      return 'Không xác định';
    }
  };

  const renderLatex = (content: string) => {
    return <MathRenderer content={content} />;
  };

  const handleCreateGroupQuestion = () => {
    navigate('/questions/create-group');
  };

  const handleEditGroupQuestion = (questionId: string) => {
    navigate(`/questions/group/edit/${questionId}`);
  };

  const handleDeleteGroupQuestion = async (questionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi nhóm này?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cau-hoi/${questionId}/soft-delete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể xóa câu hỏi nhóm');
      }

      // Cập nhật danh sách sau khi xóa
      fetchGroupQuestions();
    } catch (err) {
      console.error('Error deleting group question:', err);
      alert('Đã xảy ra lỗi khi xóa câu hỏi nhóm');
    }
  };

  return (
    <PageContainer title="Câu hỏi nhóm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Câu hỏi nhóm</h1>
        <Button onClick={handleCreateGroupQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo câu hỏi nhóm
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : groupQuestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Chưa có câu hỏi nhóm nào</p>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {groupQuestions.map((question) => (
              <div key={question.MaCauHoi} className={cx(
                'border-b last:border-b-0',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              )}>
                <div
                  className={cx(
                    'p-4 flex items-start justify-between cursor-pointer',
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  )}
                  onClick={() => toggleGroup(question.MaCauHoi)}
                >
                  <div className="flex items-start flex-1">
                    <div className="mr-2 mt-1">
                      {expandedGroups[question.MaCauHoi] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">#{question.MaSoCauHoi}</span>
                        <span className={cx(
                          'text-xs px-2 py-1 rounded-full',
                          getDifficultyColor(question.CapDo)
                        )}>
                          {getDifficultyText(question.CapDo)}
                        </span>
                        {question.TenCLO && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {question.TenCLO}
                          </span>
                        )}
                      </div>
                      <div className="mb-1" dangerouslySetInnerHTML={{
                        __html: renderLatex(formatParentQuestionContent(question.NoiDung))
                      }} />
                      <div className="text-sm text-gray-500">
                        <span>{formatDate(question.NgayTao)}</span>
                        <span className="mx-2">•</span>
                        <span>{question.SoCauHoiCon} câu hỏi con</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="text"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroupQuestion(question.MaCauHoi);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="text"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroupQuestion(question.MaCauHoi);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedGroups[question.MaCauHoi] && question.CauHoiCon && (
                  <div className={cx(
                    'p-4 pl-12 border-t',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <h3 className="font-medium mb-4">Câu hỏi con:</h3>
                    <div className="space-y-4">
                      {question.CauHoiCon.map((childQuestion, index) => (
                        <div key={childQuestion.MaCauHoi} className={cx(
                          'p-4 rounded-lg',
                          isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
                        )}>
                          <div className="font-medium mb-2">
                            <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-sm font-semibold mr-2">
                              Câu {index + 1}
                            </span>
                            <span dangerouslySetInnerHTML={{
                              __html: renderLatex(formatChildQuestionContent(childQuestion.NoiDung, index + 1))
                            }} />
                          </div>
                          <div className="pl-4 space-y-2">
                            {childQuestion.CauTraLoi.map((answer) => (
                              <div key={answer.MaCauTraLoi} className={cx(
                                'p-2 rounded',
                                answer.LaDapAn
                                  ? (isDark ? 'bg-green-900 text-white' : 'bg-green-100')
                                  : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                              )}>
                                {renderLatex(answer.NoiDung)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              limit={limit}
              availableLimits={[5, 10, 20, 50, 100]}
              onLimitChange={setLimit}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default GroupQuestionsPage;
