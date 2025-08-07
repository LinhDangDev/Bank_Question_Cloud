import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Search, Plus, ArrowLeft, RefreshCw, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

import 'katex/dist/katex.min.css'
import katex from 'katex'
import { phanApi, cauHoiApi } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { renderLatex as utilsRenderLatex, parseGroupQuestionContent, formatChildQuestionContent, formatParentQuestionContent, cleanContent, smartRenderLatex } from '@/utils/latex'
import { convertMediaMarkupToHtml } from '@/utils/mediaMarkup'
import { processMediaContent } from '@/utils/mediaContentProcessor'

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
    NguoiTao?: string;
    MaNguoiTao?: string;
    cloInfo?: {
      MaCLO: string;
      TenCLO: string;
    };
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

const typeColors: Record<string, string> = {
  'CLO 1': 'bg-green-100 text-green-700',
  'CLO 2': 'bg-blue-100 text-blue-700',
  'CLO 3': 'bg-purple-100 text-purple-700',
  'CLO 4': 'bg-orange-100 text-orange-700',
  'CLO 5': 'bg-yellow-100 text-yellow-700',
  'CLO 6': 'bg-indigo-100 text-indigo-700',
  'CLO 7': 'bg-pink-100 text-pink-700',
  'CLO 8': 'bg-teal-100 text-teal-700',
  'CLO 9': 'bg-cyan-100 text-cyan-700',
  'CLO 10': 'bg-lime-100 text-lime-700',
  'CLO 11': 'bg-sky-100 text-sky-700',
  'CLO 12': 'bg-amber-100 text-amber-700',
  'CLO 13': 'bg-violet-100 text-violet-700',
  'CLO 14': 'bg-fuchsia-100 text-fuchsia-700',
  'CLO 15': 'bg-emerald-100 text-emerald-700',
  'CLO 16': 'bg-rose-100 text-rose-700',
  'CLO 17': 'bg-slate-100 text-slate-700',
  'CLO 18': 'bg-gray-100 text-gray-700',
  'CLO 19': 'bg-green-200 text-green-800',
  'CLO 20': 'bg-blue-200 text-blue-800'
}

const ChapterQuestions = () => {
  const navigate = useNavigate()
  const { chapterId } = useParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [questionsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [childQuestions, setChildQuestions] = useState<{[key: string]: any[]}>({})
  const { user } = useAuth()
  const { isAdmin } = usePermissions()

  const fetchChapter = async () => {
    try {
      const response = await phanApi.getPhanById(chapterId as string);
      setChapter(response.data)
    } catch (error) {
      toast.error('Không thể tải thông tin chương')
      console.error('Error fetching chapter:', error)
    }
  }

  const fetchQuestions = async (page: number = currentPage) => {
    try {
      setIsLoading(true)
      const limit = showAllQuestions ? 1000 : questionsPerPage;
      const response = await cauHoiApi.getByChapterWithAnswers(chapterId as string, limit, page);
      console.log('API Response:', response.data)

      // Filter questions based on user role if we're not an admin
      let filteredQuestions = Array.isArray(response.data.items) ? response.data.items : [];

      // If user is not admin, only show questions created by this user
      if (!isAdmin() && user) {
        filteredQuestions = filteredQuestions.filter((item: Question) =>
          item.question.NguoiTao === user.userId || item.question.MaNguoiTao === user.userId
        );
      }

      setQuestions(filteredQuestions)

      // Handle pagination properly
      if (showAllQuestions) {
        setTotalQuestions(filteredQuestions.length)
        setTotalPages(1)
      } else {
        setTotalQuestions(response.data.meta?.total || filteredQuestions.length)
        setTotalPages(response.data.meta?.totalPages || Math.ceil((response.data.meta?.total || filteredQuestions.length) / questionsPerPage))
      }

      // Cập nhật current page nếu cần
      if (page !== currentPage) {
        setCurrentPage(page)
      }
    } catch (error) {
      toast.error('Không thể tải danh sách câu hỏi')
      setQuestions([])
      setTotalQuestions(0)
      setTotalPages(0)
      console.error('Error fetching questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (chapterId) {
      setCurrentPage(1) // Reset về trang 1 khi chuyển chương
      fetchChapter()
      fetchQuestions(1)
    }

    // Cleanup function to avoid memory leaks and handle component unmounting
    return () => {
      // Nothing to cleanup yet
    }
  }, [chapterId])

  // Refetch when showAllQuestions changes
  useEffect(() => {
    if (chapterId) {
      setCurrentPage(1)
      fetchQuestions(1)
    }
  }, [showAllQuestions])

  // Use the enhanced LaTeX rendering function from utils
  const renderLatex = utilsRenderLatex;

  const handleDeleteQuestion = async (maCauHoi: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      await cauHoiApi.softDelete(maCauHoi);
      toast.success('Xóa câu hỏi thành công');
      fetchQuestions();
    } catch (error) {
      toast.error('Không thể xóa câu hỏi');
      console.error('Error deleting question:', error);
    }
  };

  const canEdit = (question: any) => {
    return isAdmin() || (user && (question.NguoiTao === user.userId || question.MaNguoiTao === user.userId));
  };

  const canDelete = (question: any) => {
    return isAdmin() || (user && (question.NguoiTao === user.userId || question.MaNguoiTao === user.userId));
  };

  const toggleQuestionExpansion = async (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
        // Lấy câu hỏi con khi expand
        if (!childQuestions[questionId]) {
          fetchChildQuestions(questionId);
        }
      }
      return newSet;
    });
  };

  const fetchChildQuestions = async (parentQuestionId: string) => {
    try {
      const response = await cauHoiApi.getChildQuestions(parentQuestionId);
      console.log('Child questions response:', response.data);

      // API trả về dữ liệu với cấu trúc items, mỗi item có question và answers
      const childQuestionsData = response.data?.items || response.data || [];

      setChildQuestions(prev => ({
        ...prev,
        [parentQuestionId]: childQuestionsData
      }));

      console.log(`Loaded ${childQuestionsData.length} child questions for parent ${parentQuestionId}`);
    } catch (error) {
      console.error('Error fetching child questions:', error);
      toast.error('Không thể tải câu hỏi con');
      // Fallback: set empty array to prevent repeated calls
      setChildQuestions(prev => ({
        ...prev,
        [parentQuestionId]: []
      }));
    }
  };

  // Function to format child question content
  const formatChildQuestionContent = (content: string, questionNumber: number) => {
    // Remove the (<number>) pattern from the beginning
    const cleanContent = content.replace(/^\(<\d+>\)\s*/, '');
    return cleanContent;
  };

  // Function to format fill-in-blank questions with proper ordering
  const formatFillInBlankContent = (content: string) => {
    // First, find all placeholders and sort them
    const placeholders: { match: string; number: number; index: number }[] = [];
    let match;
    const regex = /\{<(\d+)>\}/g;

    while ((match = regex.exec(content)) !== null) {
      placeholders.push({
        match: match[0],
        number: parseInt(match[1]),
        index: match.index
      });
    }

    // Sort placeholders by their position in text (not by number)
    placeholders.sort((a, b) => a.index - b.index);

    // Replace placeholders in order of appearance
    let result = content;
    placeholders.forEach((placeholder, index) => {
      const correctNumber = index + 1; // Sequential numbering based on appearance
      const styledBlank = `<span class="inline-block min-w-[60px] border-b-2 border-blue-400 mx-1 text-center font-medium text-blue-600">___${correctNumber}___</span>`;
      result = result.replace(placeholder.match, styledBlank);
    });

    return result;
  };

  const filteredQuestions = questions.filter(q =>
    q.question.NoiDung?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date from ISO string to local date format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[calc(94vh-56px)] overflow-hidden">
      {/* Header với tiêu đề và nút tạo câu hỏi */}
      <div className="bg-white border-b px-6 py-3 flex flex-wrap justify-between items-center gap-y-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Câu hỏi - {chapter?.TenPhan || 'Đang tải...'}
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {chapter?.MonHoc && (
              <>
                {chapter.MonHoc.TenMonHoc} - {chapter.MonHoc.Khoa.TenKhoa}
              </>
            )}
            {totalQuestions > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {totalQuestions} câu hỏi
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} size="sm" className="h-9">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate(`/questions/create?maPhan=${chapterId}`)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showAllQuestions ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowAllQuestions(true)}
              className="h-9"
            >
              Tất cả
            </Button>
            <Button
              variant={!showAllQuestions ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowAllQuestions(false)}
              className="h-9"
            >
              Phân trang
            </Button>
          </div>

          {filteredQuestions.length > 0 && (
            <div className="text-sm text-gray-600">
              {showAllQuestions ? (
                <>
                  Hiển thị <span className="font-semibold text-blue-600">{filteredQuestions.length}</span>
                  {filteredQuestions.length !== totalQuestions && (
                    <span> / {totalQuestions}</span>
                  )} câu hỏi
                </>
              ) : (
                <>
                  Trang <span className="font-semibold text-blue-600">{currentPage}</span> / {totalPages} -
                  <span className="font-semibold text-blue-600"> {filteredQuestions.length}</span> / {totalQuestions} câu hỏi
                </>
              )}
            </div>
          )}
          <Button
            variant={showAllQuestions ? "primary" : "outline"}
            onClick={() => {
              setShowAllQuestions(!showAllQuestions);
              setCurrentPage(1); // Reset về trang 1
              // Tự động reload khi thay đổi mode
              setTimeout(() => fetchQuestions(1), 100);
            }}
            size="sm"
            className="h-9"
            title={showAllQuestions ? "Chuyển sang phân trang" : "Hiển thị tất cả"}
          >
            {showAllQuestions ? "Tất cả" : "Phân trang"}
          </Button>
          <Button variant="outline" onClick={() => fetchQuestions()} disabled={isLoading} size="sm" className="h-9">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {isAdmin()
                ? 'Không có câu hỏi nào trong chương này'
                : 'Không có câu hỏi nào của bạn trong chương này'}
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách chương
            </Button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {filteredQuestions.map((item, index) => {
                const isGroupQuestion = item.question.SoCauHoiCon > 0;
                const isExpanded = expandedQuestions.has(item.question.MaCauHoi);

                // Debug logging
                if (isGroupQuestion) {
                  console.log(`Group question ${index + 1}:`, {
                    id: item.question.MaCauHoi,
                    soCauHoiCon: item.question.SoCauHoiCon,
                    noiDung: item.question.NoiDung,
                    isExpanded,
                    hasChildQuestions: !!childQuestions[item.question.MaCauHoi]
                  });
                }

                return (
                  <Card
                    key={item.question.MaCauHoi}
                    className={`transition-all duration-200 ${
                      item.question.XoaTamCauHoi
                        ? 'border-red-200 bg-red-50/30'
                        : isGroupQuestion
                          ? 'border-purple-200 hover:border-purple-300 hover:shadow-md bg-purple-50/20'
                          : 'border-gray-200 hover:border-blue-200 hover:shadow'
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-500 font-medium">#{index + 1}</span>
                          <span className="text-sm text-gray-500">#{item.question.MaSoCauHoi}</span>
                          {item.question.MaCLO && (
                            <Badge className={`text-xs ${
                              item.question.cloInfo?.TenCLO ? typeColors[item.question.cloInfo.TenCLO] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {item.question.cloInfo?.TenCLO || 'CLO'}
                            </Badge>
                          )}
                          {isGroupQuestion && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              Câu hỏi nhóm ({item.question.SoCauHoiCon} câu)
                            </Badge>
                          )}
                          <Badge variant={item.question.XoaTamCauHoi ? 'destructive' : 'default'}>
                            {item.question.XoaTamCauHoi ? 'Đã xóa' : 'Hoạt động'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {canEdit(item.question) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/questions/edit/${item.question.MaCauHoi}`)}
                              className="p-2"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete(item.question) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteQuestion(item.question.MaCauHoi)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {isGroupQuestion ? (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleQuestionExpansion(item.question.MaCauHoi)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between p-2 h-auto">
                              <div className="prose prose-sm max-w-none text-left">
                                <div dangerouslySetInnerHTML={{
                                  __html: renderLatex(formatFillInBlankContent(formatParentQuestionContent(processMediaContent(item.question.NoiDung))))
                                }} />
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                              {childQuestions[item.question.MaCauHoi] ? (
                                childQuestions[item.question.MaCauHoi].length > 0 ? (
                                  childQuestions[item.question.MaCauHoi].map((childItem: any, childIndex: number) => {
                                    // Xử lý cấu trúc dữ liệu từ API
                                    const childQuestion = childItem.question || childItem;
                                    const childAnswers = childItem.answers || childQuestion.CauTraLoi || [];

                                    return (
                                      <div key={childQuestion.MaCauHoi} className="bg-white border border-purple-100 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                            Câu {childIndex + 1}
                                          </span>
                                          <span className="text-xs text-gray-500">#{childQuestion.MaSoCauHoi}</span>
                                        </div>
                                        <div className="prose prose-sm max-w-none mb-2">
                                          <div dangerouslySetInnerHTML={{
                                            __html: renderLatex(formatChildQuestionContent(processMediaContent(childQuestion.NoiDung), childIndex + 1))
                                          }} />
                                        </div>
                                        {childAnswers && childAnswers.length > 0 && (
                                          <div className="grid grid-cols-1 gap-1 mt-2">
                                            {childAnswers.map((answer: any, answerIdx: number) => (
                                              <div
                                                key={answer.MaCauTraLoi}
                                                className={`flex items-center p-1.5 rounded text-sm ${
                                                  answer.LaDapAn
                                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                                                }`}
                                              >
                                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium mr-2 bg-white border">
                                                  {String.fromCharCode(65 + answerIdx)}
                                                </span>
                                                <div className="flex-1 prose prose-sm max-w-none">
                                                  <div dangerouslySetInnerHTML={{ __html: renderLatex(processMediaContent(answer.NoiDung)) }} />
                                                </div>
                                                {answer.LaDapAn && (
                                                  <span className="text-xs font-medium text-green-600">✓</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-sm text-gray-500 italic">
                                    Không có câu hỏi con nào được tìm thấy
                                  </div>
                                )
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-sm text-purple-600 font-medium">
                                    <div className="animate-pulse">Đang tải câu hỏi con...</div>
                                  </div>
                                  {/* Fallback: Hiển thị thông tin từ nội dung câu hỏi cha */}
                                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    <strong>Thông tin:</strong> Câu hỏi nhóm có {item.question.SoCauHoiCon} câu hỏi con.
                                    {item.question.NoiDung.includes('{<') && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                          📝 Câu hỏi điền khuyết
                                        </span>
                                      </div>
                                    )}
                                    <div className="mt-1 text-xs">
                                      <button
                                        onClick={() => fetchChildQuestions(item.question.MaCauHoi)}
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        Thử tải lại câu hỏi con
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <>
                          <div className="prose prose-sm max-w-none mb-3">
                            <div dangerouslySetInnerHTML={{
                              __html: smartRenderLatex(formatFillInBlankContent(processMediaContent(cleanContent(item.question.NoiDung))))
                            }} />
                          </div>

                          {/* Hiển thị answers cho câu hỏi thường (không phải câu hỏi nhóm) */}
                          {item.answers && item.answers.length > 0 && !isGroupQuestion && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                              {item.answers.map((answer, idx) => (
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
                                    <div dangerouslySetInnerHTML={{ __html: smartRenderLatex(processMediaContent(answer.NoiDung)) }}></div>
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

                          {/* Thông báo cho câu hỏi nhóm */}
                          {isGroupQuestion && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 text-blue-700">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">
                                  Đây là câu hỏi nhóm. Mở rộng để xem các câu hỏi con và đáp án chi tiết.
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Cấp độ: {item.question.CapDo}</span>
                          <span>Số lần thi: {item.question.SoLanDuocThi}</span>
                          <span>Số lần đúng: {item.question.SoLanDung}</span>
                        </div>
                        <div>
                          {formatDate(item.question.NgayTao)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Enhanced Pagination */}
            {!showAllQuestions && totalPages > 1 && (
              <div className="mt-6 bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Trang <span className="font-semibold text-blue-600">{currentPage}</span> / {totalPages} -
                    Hiển thị <span className="font-semibold text-blue-600">{questions.length}</span> / {totalQuestions} câu hỏi
                  </div>

                  <div className="flex items-center gap-2">
                    {/* First page */}
                    {currentPage > 3 && totalPages > 5 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchQuestions(1)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          1
                        </Button>
                        <span className="text-gray-400">...</span>
                      </>
                    )}

                    {/* Previous page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchQuestions(currentPage - 1)}
                      disabled={currentPage <= 1 || isLoading}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Trước
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "primary" : "outline"}
                            size="sm"
                            onClick={() => fetchQuestions(pageNum)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                    {/* Next page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchQuestions(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoading}
                      className="h-8 px-3"
                    >
                      Sau
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>

                    {/* Last page */}
                    {currentPage < totalPages - 2 && totalPages > 5 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchQuestions(totalPages)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick page jump */}
                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                  <span className="text-gray-500">Chuyển đến trang:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        fetchQuestions(page);
                      }
                    }}
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                  <span className="text-gray-500">/ {totalPages}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        /* Enhanced LaTeX rendering styles */
        .katex-formula .katex {
          display: inline-block;
          font-size: 1.1em;
          line-height: 1.4;
        }

        .katex-display {
          display: block;
          margin: 0.8em 0;
          text-align: center;
        }

        .katex-display .katex {
          font-size: 1.2em;
        }

        /* Better fraction rendering */
        .katex .mfrac .frac-line {
          border-bottom-width: 1px;
          margin: 0.1em 0;
        }

        /* Improved matrix rendering */
        .katex .mord.mtable {
          vertical-align: middle;
          margin: 0.2em;
        }

        /* Better integral symbols */
        .katex .mop {
          margin-right: 0.2em;
        }

        /* Improved subscripts and superscripts */
        .katex .msupsub {
          vertical-align: baseline;
        }

        /* Better spacing for math operators */
        .katex .mbin, .katex .mrel {
          margin: 0 0.3em;
        }

        /* Enhanced question content styling */
        .prose .katex-formula {
          margin: 0 0.1em;
        }

        .prose .katex-display {
          margin: 1em 0;
        }

        /* Fix for inline math in answers */
        .answer-content .katex-formula {
          vertical-align: middle;
        }

        /* Better rendering for common symbols */
        .katex .mord + .mord {
          margin-left: 0.05em;
        }

        /* Fix for chemical formulas */
        .katex .msupsub {
          text-align: left;
        }

        /* Fix for superscripts */
        .katex .msup {
          vertical-align: baseline;
        }

        /* Fix for subscripts */
        .katex .msub {
          vertical-align: baseline;
        }
      `}</style>
    </div>
  )
}

export default ChapterQuestions
