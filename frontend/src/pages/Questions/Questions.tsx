import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Eye, Edit, Trash2, ChevronDown, ChevronRight, Users, RefreshCw, Upload, CheckCircle, Circle, XCircle, CheckSquare, Square, FileText, Table2, Archive, ArchiveRestore, SlidersHorizontal } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useThemeStyles, cx } from "../../utils/theme"
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { API_BASE_URL } from '@/config'
import QuestionItem, { Question as FrontendQuestionType } from '@/components/QuestionItem'
import PaginationBar from '@/components/PaginationBar'
import Filters, { FilterOptions } from '@/components/Filters'
import { renderLatex } from '@/utils/latex'
import { fetchWithAuth } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard, AdminOnly } from '@/components/PermissionGuard'
import LazyMediaPlayer from '@/components/LazyMediaPlayer'

// Define the type for the question filter
type QuestionType = 'single' | 'group';

// Define the Answer interface based on the API response
interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

// Updated Question interface to support group questions - using backend structure
interface BackendQuestion {
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
  TenCLO?: string;
  cloInfo?: {
    MaCLO: string;
    TenCLO: string;
  };
  answers: Answer[];
  LaCauHoiNhom?: boolean;
  LoaiBoChuongPhan?: boolean;
  CauHoiCon?: ChildQuestion[];
}

// Define ChildQuestion interface for group questions
interface ChildQuestion {
  MaCauHoi: string;
  MaSoCauHoi: number;
  NoiDung: string;
  CauTraLoi: Answer[];
}

interface ApiResponse {
  items: BackendQuestion[];
  meta: {
    total: number;
    page: string;
    limit: string;
    totalPages: number;
    availableLimits: number[];
  };
}

const typeColors: Record<string, string> = {
  'CLO 1': 'bg-green-100 text-green-700',
  'CLO 2': 'bg-blue-100 text-blue-700',
  'CLO 3': 'bg-purple-100 text-purple-700',
  'CLO 4': 'bg-orange-100 text-orange-700',
  'CLO 5': 'bg-yellow-100 text-yellow-700',
}

const statusColors: Record<string, string> = {
  'active': 'text-green-600',
  'deleted': 'text-red-500',
}


// Utility function to convert backend question to frontend question format
const convertToFrontendQuestion = (backendQuestion: BackendQuestion): FrontendQuestionType => {
  return {
    id: backendQuestion.MaCauHoi,
    content: backendQuestion.NoiDung,
    type: backendQuestion.LaCauHoiNhom ? 'group' : 'single-choice',
    clo: backendQuestion.cloInfo?.TenCLO || backendQuestion.TenCLO,
    capDo: backendQuestion.CapDo,
    answers: (backendQuestion.answers || []).map(answer => ({
      id: answer.MaCauTraLoi,
      content: answer.NoiDung,
      isCorrect: answer.LaDapAn,
      order: answer.ThuTu
    })),
    childQuestions: backendQuestion.CauHoiCon?.map(child => ({
      id: child.MaCauHoi,
      content: child.NoiDung,
      type: 'single-choice',
      answers: (child.CauTraLoi || []).map(answer => ({
        id: answer.MaCauTraLoi,
        content: answer.NoiDung,
        isCorrect: answer.LaDapAn,
        order: answer.ThuTu
      }))
    })),
    groupContent: backendQuestion.DoPhanCachCauHoi ? String(backendQuestion.DoPhanCachCauHoi) : undefined
  };
};

const Questions = () => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [backendQuestions, setBackendQuestions] = useState<BackendQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [availableLimits, setAvailableLimits] = useState<number[]>([5, 10, 20, 50, 100]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({ isDeleted: false });
  const [processedGroupIds, setProcessedGroupIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [questionType, setQuestionType] = useState<QuestionType>('single');
  const { token } = useAuth();
  const { isAdmin, isTeacher } = usePermissions();

  const fetchQuestions = useCallback(async () => {
      if (isRefreshing) return;

      setIsRefreshing(true);
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        queryParams.append('includeAnswers', 'true');
        queryParams.append('isDeleted', filters.isDeleted ? 'true' : 'false');

        if (searchQuery && searchQuery.trim() !== '') {
          queryParams.append('search', searchQuery.trim());
        }
        if (filters.clo) queryParams.append('maCLO', filters.clo);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.difficulty) queryParams.append('capDo', filters.difficulty.toString());

        const endpoint = questionType === 'group' ? '/cau-hoi/group' : '/cau-hoi';
        const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
        setAvailableLimits(data.meta.availableLimits);

        const newProcessedIds = new Set<string>();
        const processedQuestions = data.items
          .filter(q => {
            if (newProcessedIds.has(q.MaCauHoi)) return false;
            newProcessedIds.add(q.MaCauHoi);
            return true;
          })
          .filter(q => !q.MaCauHoiCha) // Ensure only parent questions are shown
          .sort((a, b) => new Date(b.NgayTao).getTime() - new Date(a.NgayTao).getTime());

        setBackendQuestions(processedQuestions);
        setProcessedGroupIds(newProcessedIds);

        if (processedQuestions.length === 0) {
            setError('Không tìm thấy câu hỏi nào phù hợp.');
        }

      } catch (err: any) {
        setError('Lỗi khi tải câu hỏi: ' + (err.message || 'Lỗi không xác định'));
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
  }, [
    page,
    limit,
    searchQuery,
    questionType,
    filters.isDeleted,
    filters.clo,
    filters.startDate,
    filters.endDate,
    filters.difficulty
  ]);

  useEffect(() => {
    if (token) {
        fetchQuestions();
    } else {
        setError('Authentication required. Please log in.');
        setLoading(false);
    }
  }, [fetchQuestions, token]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    setPage(1); // Reset page to 1 when changing question type
  }

  // Function to toggle expanded state for group questions
  const toggleGroup = (questionId: string) => {
    setExpandedGroups(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Function to restore a deleted question
  const handleRestoreQuestion = async (questionId: string) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/cau-hoi/${questionId}/restore`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchQuestions();
      } else {
        console.error('Failed to restore question');
      }
    } catch (error) {
      console.error('Error restoring question:', error);
    }
  };

  // Handling question selection
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const selectAllQuestions = () => {
    if (selectedQuestions.size === backendQuestions.length) {
      // If all are selected, deselect all
      setSelectedQuestions(new Set());
    } else {
      // Otherwise select all
      const allIds = backendQuestions.map(q => q.MaCauHoi);
      setSelectedQuestions(new Set(allIds));
    }
  };

  // Function to handle delete confirmation
  const confirmDeleteSelected = () => {
    if (selectedQuestions.size === 0) return;
    setShowDeleteConfirm(true);
  };

  // Function to cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Function to soft delete questions
  const handleSoftDeleteQuestions = async () => {
    if (selectedQuestions.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedQuestions).map(id =>
          fetchWithAuth(`${API_BASE_URL}/cau-hoi/${id}/soft-delete`, {
            method: 'PATCH',
          })
        )
      );

      setSelectedQuestions(new Set());
      fetchQuestions();
    } catch (error) {
      console.error('Error soft deleting questions:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Function to permanently delete questions
  const handlePermanentDeleteQuestions = async () => {
    if (selectedQuestions.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedQuestions).map(id =>
          fetchWithAuth(`${API_BASE_URL}/cau-hoi/${id}`, {
            method: 'DELETE',
          })
        )
      );

      setSelectedQuestions(new Set());
      fetchQuestions();
    } catch (error) {
      console.error('Error permanently deleting questions:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Function to render a single question
  const renderQuestion = (question: BackendQuestion, index: number) => {
    const isExpanded = expandedGroups.includes(question.MaCauHoi);
    const isGroupQuestion = question.SoCauHoiCon > 0 || question.LaCauHoiNhom;
    const isSelected = selectedQuestions.has(question.MaCauHoi);

    return (
      <Card
        key={question.MaCauHoi}
        className={`mb-4 transition-all duration-200 ${
          question.XoaTamCauHoi
            ? 'border-red-200 bg-red-50/30'
            : isSelected
              ? 'border-blue-400 bg-blue-50/30 shadow-md'
              : 'border-gray-200 hover:border-blue-200 hover:shadow'
        }`}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Selection button */}
              <button
                onClick={() => toggleQuestionSelection(question.MaCauHoi)}
                className={`flex-shrink-0 p-0.5 transition-colors ${
                  isSelected ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'
                }`}
                title={isSelected ? "Bỏ chọn" : "Chọn câu hỏi này"}
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>

              <Badge variant="outline" className="rounded-full text-xs font-medium bg-gray-100">
                #{(page - 1) * limit + index + 1}
              </Badge>

              <Badge variant="outline" className="text-xs font-medium bg-gray-100 text-gray-700">
                {new Date(question.NgayTao).toLocaleDateString('vi-VN')}
              </Badge>

              {question.cloInfo?.TenCLO && (
                <Badge variant="outline" className={`text-xs font-medium ${typeColors[question.cloInfo.TenCLO] || 'bg-gray-100'}`}>
                  {question.cloInfo.TenCLO}
                </Badge>
              )}

              <Badge variant="outline" className={`text-xs font-medium ${isGroupQuestion ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                {isGroupQuestion ? 'Nhóm' : 'Đơn'}
              </Badge>

              <Badge variant="outline" className="text-xs font-medium bg-blue-100 text-blue-700">
                Đã sử dụng: {question.SoLanDuocThi || 0}
              </Badge>

              {isGroupQuestion && (
                <Badge variant="outline" className="text-xs font-medium bg-purple-100 text-purple-700">
                  {question.CauHoiCon?.length || question.SoCauHoiCon || 0} câu con
                </Badge>
              )}

              {/* Hiển thị trạng thái xóa tạm */}
              {question.XoaTamCauHoi && (
                <Badge variant="outline" className="text-xs font-medium bg-red-100 text-red-700">
                  Đã xóa tạm
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/questions/${question.MaCauHoi}`)}
                title="Xem chi tiết"
              >
                <Eye className="h-4 w-4 text-gray-500" />
              </button>

              <button
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
                onClick={() => {
                  const editPath = isGroupQuestion
                    ? `/questions/edit-group/${question.MaCauHoi}`
                    : `/questions/edit/${question.MaCauHoi}`;
                  navigate(editPath);
                }}
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4 text-blue-500" />
              </button>

              {/* Hiển thị nút xóa tạm hoặc khôi phục tùy theo trạng thái */}
              {question.XoaTamCauHoi ? (
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-green-100 transition-colors"
                  onClick={() => handleRestoreQuestion(question.MaCauHoi)}
                  title="Khôi phục câu hỏi"
                >
                  <RefreshCw className="h-4 w-4 text-green-500" />
                </button>
              ) : (
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                  onClick={() => {
                    setSelectedQuestions(new Set([question.MaCauHoi]));
                    setShowDeleteConfirm(true);
                  }}
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}

              {isGroupQuestion && (
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => toggleGroup(question.MaCauHoi)}
                  title={isExpanded ? "Thu gọn câu hỏi nhóm" : "Mở rộng câu hỏi nhóm"}
                >
                  {isExpanded ?
                    <ChevronDown className="h-4 w-4" /> :
                    <ChevronRight className="h-4 w-4" />
                  }
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {/* Render content differently based on question type */}
          {isGroupQuestion ? (
            <>
              {/* Group question content only shown once */}
              <div className="mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderLatex(question.NoiDung) }}></div>

              {/* Multimedia content for group question */}
              <div className="mb-3">
                <LazyMediaPlayer maCauHoi={question.MaCauHoi} showFileName={false} />
              </div>

              {/* Only show child questions if expanded */}
              {isExpanded && question.CauHoiCon && question.CauHoiCon.length > 0 && (
                <div className="mt-4 space-y-3 border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm font-medium text-purple-700">
                      Câu hỏi nhóm - {question.CauHoiCon.length} câu con
                    </div>
                  </div>
                  {question.CauHoiCon.map((childQ, childIdx) => (
                    <div key={childQ.MaCauHoi} className="border-l-4 border-l-purple-300 rounded-md bg-gray-50/80 p-3 hover:bg-gray-50 transition-colors">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Badge className="rounded-full text-xs bg-purple-100 text-purple-700">
                          Câu {childIdx + 1}
                        </Badge>
                      </div>

                      <div className="mb-3 prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: renderLatex(childQ.NoiDung) }}></div>
                      </div>

                      {/* Multimedia content for child question */}
                      <div className="mb-3">
                        <LazyMediaPlayer maCauHoi={childQ.MaCauHoi} showFileName={false} />
                      </div>

                      {childQ.CauTraLoi && childQ.CauTraLoi.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {childQ.CauTraLoi.map((answer, idx) => (
                            <div
                              key={answer.MaCauTraLoi}
                              className={`flex items-center p-2 rounded-md transition-colors ${
                                answer.LaDapAn
                                  ? 'bg-green-50 border border-green-300 hover:bg-green-100'
                                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                                answer.LaDapAn
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <div className="flex-1 min-w-0 prose prose-sm max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }}></div>
                              </div>
                              {answer.LaDapAn && (
                                <div className="flex-shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded ml-2 font-medium">
                                  Đáp án
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Standard question content */}
              <div className="mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderLatex(question.NoiDung) }}></div>

              {/* Multimedia content for standard question */}
              <div className="mb-3">
                <LazyMediaPlayer maCauHoi={question.MaCauHoi} showFileName={false} />
              </div>

              {/* Render answers for non-group questions */}
              {question.answers && question.answers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {question.answers.map((answer, idx) => (
                    <div
                      key={answer.MaCauTraLoi}
                      className={`flex items-center p-2 rounded-md transition-colors ${
                        answer.LaDapAn
                          ? 'bg-green-50 border border-green-300 hover:bg-green-100'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                        answer.LaDapAn
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 min-w-0 prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }}></div>
                      </div>
                      {answer.LaDapAn && (
                        <div className="flex-shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded ml-2 font-medium">
                          Đáp án
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-[calc(94vh-56px)] overflow-hidden">
      {/* Header với tiêu đề và nút tạo câu hỏi */}
      <div className="bg-white border-b px-6 py-3 flex flex-wrap justify-between items-center gap-y-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ngân hàng câu hỏi</h1>
          {isTeacher() && (
            <p className="text-sm text-gray-600 mt-0.5">
              Hiển thị câu hỏi đã được duyệt
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isTeacher() && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => navigate('/questions/approval')}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Câu hỏi chờ duyệt
            </Button>
          )}
          <AdminOnly>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => navigate('/questions/create-group')}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Tạo câu hỏi nhóm
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/questions/create')}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm câu hỏi
            </Button>
          </AdminOnly>
        </div>
      </div>

      {/* Tab điều hướng: Câu hỏi hoạt động/đã xóa tạm */}
      <div className="bg-white border-b">
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium text-sm relative ${
              !filters.isDeleted
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setFilters({ ...filters, isDeleted: false })}
          >
            Đang hoạt động
            {!filters.isDeleted && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm relative ${
              filters.isDeleted
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setFilters({ ...filters, isDeleted: true })}
          >
            Đã xóa tạm
            {filters.isDeleted && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
        </div>

        {/* Thanh tìm kiếm và lọc */}
        <div className="px-6 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                className="pl-10 pr-4 h-9 w-full border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              />
              <button
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
                onClick={() => handleSearch(searchQuery)}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                className="h-9 w-9 flex items-center justify-center rounded-lg border text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
                onClick={() => {
                  // Đây là nơi để mở modal bộ lọc nếu cần
                  // Tạm thời giữ nguyên chức năng khi nhấn nút này
                }}
                title="Bộ lọc nâng cao"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>

              <div className="h-9 flex rounded-lg border overflow-hidden divide-x">
                <button
                  className={`px-2.5 flex items-center justify-center transition-colors ${
                    questionType === 'single'
                    ? 'bg-indigo-50 text-indigo-600 border-r border-indigo-300'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  onClick={() => handleQuestionTypeChange('single')}
                  title="Câu hỏi đơn"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  className={`px-2.5 flex items-center justify-center transition-colors ${
                    questionType === 'group'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  onClick={() => handleQuestionTypeChange('group')}
                  title="Câu hỏi nhóm"
                >
                  <Table2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh công cụ chọn/xóa */}
      <div className="bg-gray-50 border-b px-6 py-2.5 flex flex-wrap justify-between items-center gap-y-2">
        <button
          onClick={selectAllQuestions}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            selectedQuestions.size > 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {selectedQuestions.size === backendQuestions.length && backendQuestions.length > 0 ? (
            <>
              <CheckSquare className="h-5 w-5" />
              <span className="text-sm font-medium">Bỏ chọn tất cả</span>
            </>
          ) : (
            <>
              <Square className="h-5 w-5" />
              <span className="text-sm font-medium">Chọn tất cả</span>
            </>
          )}
        </button>

        {selectedQuestions.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-600">
              Đã chọn {selectedQuestions.size} câu hỏi
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={confirmDeleteSelected}
              className="h-8 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Xóa đã chọn
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedQuestions(new Set())}
              className="h-8"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Bỏ chọn
            </Button>
          </div>
        )}
      </div>

      {/* Danh sách câu hỏi */}
      <div className="flex-1 overflow-hidden" style={{ maxHeight: 'calc(100% - 180px)' }}>
        <div className="h-full overflow-y-auto px-6 py-4 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <div className="text-gray-500 font-medium">Đang tải dữ liệu...</div>
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
              <div className="text-red-500 mb-2 font-medium">{error}</div>
            </div>
          ) : backendQuestions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
              <div className="text-gray-500 font-medium mb-2">Không có câu hỏi nào</div>
              <p className="text-gray-500">Không tìm thấy câu hỏi nào phù hợp với tiêu chí tìm kiếm</p>
            </div>
          ) : (
            <div>
              {backendQuestions.map((question, index) => renderQuestion(question, index))}
            </div>
          )}
        </div>
      </div>

      {/* Phân trang */}
      <div className="sticky bottom-0 w-full px-6 py-2.5 bg-white border-t z-10">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          availableLimits={availableLimits}
          totalItems={totalItems}
        />
      </div>

      {/* Dialog xác nhận xóa */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-3">
              Xác nhận xóa {selectedQuestions.size} câu hỏi
            </h3>
            <p className="mb-5 text-gray-600">
              Bạn có chắc muốn xóa {selectedQuestions.size > 1 ? 'những' : ''} câu hỏi đã chọn không?
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <button
                onClick={handleSoftDeleteQuestions}
                className="w-full py-2.5 px-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-md flex items-center justify-between border border-yellow-200 transition-colors"
              >
                <span className="font-medium flex items-center"><Trash2 className="h-4 w-4 mr-2" /> Xóa tạm thời</span>
                <span className="text-sm">Có thể khôi phục sau</span>
              </button>

              {isAdmin() && (
                <button
                  onClick={handlePermanentDeleteQuestions}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-800 rounded-md flex items-center justify-between border border-red-200 transition-colors"
                >
                  <span className="font-medium flex items-center"><XCircle className="h-4 w-4 mr-2" /> Xóa vĩnh viễn</span>
                  <span className="text-sm">Không thể khôi phục</span>
                </button>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={cancelDelete}>Hủy</Button>
            </div>
          </div>
        </div>
      )}

      {/* Styles cho các thành phần */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .katex-display {
          display: block;
          margin: 1em 0;
          text-align: center;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .katex {
          font-size: 1.1em;
        }

        /* Cải thiện hiển thị cho phân số */
        .katex .mfrac .frac-line {
          border-bottom-width: 1px;
        }

        /* Cải thiện hiển thị cho ma trận */
        .katex .mord.mtable {
          vertical-align: middle;
        }

        /* Cải thiện hiển thị cho công thức hóa học */
        .katex .msupsub {
          text-align: left;
        }

        /* Cải thiện hiển thị cho lũy thừa */
        .katex .msup {
          vertical-align: baseline;
        }

        /* Cải thiện hiển thị cho chỉ số dưới */
        .katex .msub {
          vertical-align: baseline;
        }
      `}</style>
    </div>
  );
};

export default Questions;
