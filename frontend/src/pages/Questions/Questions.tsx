import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Eye, Edit, Trash2, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useThemeStyles, cx } from "../../utils/theme"
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { API_BASE_URL } from '@/config'
import QuestionItem, { Question as FrontendQuestionType } from '@/components/QuestionItem'
import PaginationBar from '@/components/PaginationBar'
import Filters from '@/components/Filters'
import { renderLatex } from '@/utils/latex'

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
  const [frontendQuestions, setFrontendQuestions] = useState<FrontendQuestionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [availableLimits, setAvailableLimits] = useState<number[]>([5, 10, 20, 50, 100]);
  // Add state for expanded group questions
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchQuestions = useCallback(async () => {
      try {
        setLoading(true);

      // Fetch regular questions with full details
        const response = await fetch(`${API_BASE_URL}/cau-hoi?page=${page}&limit=${limit}&includeAnswers=true`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();

      // Process regular questions to add metadata
      const regularQuestionsWithDetails = await Promise.all(
        data.items.map(async (question) => {
          try {
            // Fetch full details for each question
            const detailsResponse = await fetch(`${API_BASE_URL}/cau-hoi/${question.MaCauHoi}/full-details`);
            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              return {
                ...question,
                ...details.question,
                cloInfo: details.clo,
                answers: details.answers || question.answers,
              };
            }
            return question;
          } catch (err) {
            console.error(`Error fetching details for question ${question.MaCauHoi}:`, err);
            return question;
          }
        })
      );

      // Now fetch group questions with all details
        const groupResponse = await fetch(`${API_BASE_URL}/cau-hoi/group?page=${page}&limit=${limit}`);
        if (!groupResponse.ok) {
          throw new Error(`HTTP error fetching group questions! Status: ${groupResponse.status}`);
        }
        const groupData = await groupResponse.json();

      // Process group questions to add metadata and child questions with answers
      const groupQuestionsWithDetails = await Promise.all(
          groupData.items.map(async (groupQuestion: BackendQuestion) => {
          try {
            // Fetch full details for the group question
            const detailsResponse = await fetch(`${API_BASE_URL}/cau-hoi/${groupQuestion.MaCauHoi}/full-details`);
            if (!detailsResponse.ok) {
              return { ...groupQuestion, LaCauHoiNhom: true };
            }

            const details = await detailsResponse.json();

            // Fetch child questions
            const childQuestionsResponse = await fetch(`${API_BASE_URL}/cau-hoi/con/${groupQuestion.MaCauHoi}?limit=50`);
            if (!childQuestionsResponse.ok) {
              return {
                ...groupQuestion,
                ...details.question,
                cloInfo: details.clo,
                LaCauHoiNhom: true,
                CauHoiCon: []
              };
            }

            const childQuestionsData = await childQuestionsResponse.json();

            // Fetch answers for each child question
            const childQuestionsWithAnswers = await Promise.all(
              childQuestionsData.items.map(async (childQ: any) => {
                try {
                  const answersResponse = await fetch(`${API_BASE_URL}/cau-tra-loi/cau-hoi/${childQ.MaCauHoi}`);
                  if (answersResponse.ok) {
                    const answersData = await answersResponse.json();
                    return {
                      ...childQ,
                      CauTraLoi: answersData.items || []
                    };
                  }
                  return { ...childQ, CauTraLoi: [] };
                } catch (err) {
                  console.error(`Error fetching answers for child question ${childQ.MaCauHoi}:`, err);
                  return { ...childQ, CauTraLoi: [] };
                }
              })
            );

            return {
              ...groupQuestion,
              ...details.question,
              cloInfo: details.clo,
              LaCauHoiNhom: true,
              CauHoiCon: childQuestionsWithAnswers
            };
          } catch (err) {
            console.error(`Error fetching details for group question ${groupQuestion.MaCauHoi}:`, err);
            return { ...groupQuestion, LaCauHoiNhom: true };
          }
        })
      );

        // Combine regular and group questions and sort by creation date
        const allQuestionsBackend = [...regularQuestionsWithDetails, ...groupQuestionsWithDetails]
          .sort((a, b) => new Date(b.NgayTao).getTime() - new Date(a.NgayTao).getTime());

        // Store backend questions for API operations
        setBackendQuestions(allQuestionsBackend);

        // Convert to frontend format for rendering
        const allQuestionsFrontend = allQuestionsBackend.map(convertToFrontendQuestion);
        setFrontendQuestions(allQuestionsFrontend);

        // Update pagination data
      setTotalPages(Math.max(data.meta.totalPages, groupData.meta.totalPages));
        setTotalItems(data.meta.total + groupData.meta.total); // Approximate count
        setAvailableLimits(data.meta.availableLimits || [5, 10, 20, 50, 100]);

        setLoading(false);
        setError(null);
      } catch (err: any) {
        setLoading(false);
        setError('Error loading questions: ' + (err.message || 'Unknown error'));
        console.error("Error fetching questions:", err);
      }
  }, [page, limit]);

  // Fetch questions when component mounts or dependencies change
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Function to toggle expanded state for group questions
  const toggleGroup = (questionId: string) => {
    setExpandedGroups(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Functions for searching and filtering
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const handleFilter = () => {
    // Implement filter functionality
  };

  // Function to render a single question
  const renderQuestion = (question: BackendQuestion, index: number) => {
    const isExpanded = expandedGroups.includes(question.MaCauHoi);
    const isGroupQuestion = question.SoCauHoiCon > 0 || question.LaCauHoiNhom;
    return (
      <Card key={question.MaCauHoi} className="mb-3">
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-full text-xs bg-gray-100">
                #{(page - 1) * limit + index + 1}
              </Badge>

              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                Tạo: {new Date(question.NgayTao).toLocaleDateString('vi-VN')}
              </Badge>

              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                Sửa: {new Date(question.NgaySua).toLocaleDateString('vi-VN')}
              </Badge>

              {question.cloInfo?.TenCLO && (
                <Badge variant="outline" className={`text-xs ${typeColors[question.cloInfo.TenCLO] || 'bg-gray-100'}`}>
                  {question.cloInfo.TenCLO}
                </Badge>
              )}

              <Badge variant="outline" className={`text-xs ${isGroupQuestion ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                {isGroupQuestion ? 'Nhóm' : 'Đơn'}
              </Badge>

              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                Đã sử dụng: {question.SoLanDuocThi || 0}
              </Badge>

              {isGroupQuestion && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                  {question.CauHoiCon?.length || question.SoCauHoiCon || 0} câu con
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/questions/${question.MaCauHoi}`)}>
                <Eye className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/questions/edit/${question.MaCauHoi}`)}>
                <Edit className="h-4 w-4 text-blue-500" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => console.log('Delete question', question.MaCauHoi)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>

              {isGroupQuestion && (
                <Button variant="outline" size="sm" onClick={() => toggleGroup(question.MaCauHoi)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3">
          {/* Render content differently based on question type */}
          {isGroupQuestion ? (
            <>
              {/* Group question content only shown once */}
              <div className="mb-3" dangerouslySetInnerHTML={{ __html: renderLatex(question.NoiDung) }}></div>

              {/* Only show child questions if expanded */}
              {isExpanded && question.CauHoiCon && question.CauHoiCon.length > 0 && (
                <div className="mt-4 space-y-4 border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm font-medium text-purple-700">
                      Câu hỏi nhóm - {question.CauHoiCon.length} câu con
                    </div>
                  </div>
                  {question.CauHoiCon.map((childQ, childIdx) => (
                    <div key={childQ.MaCauHoi} className="border-l-4 border-l-purple-300 rounded-md bg-gray-50 p-3">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Badge className="rounded-full text-xs bg-purple-100 text-purple-700">
                          Câu {childIdx + 1}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <div dangerouslySetInnerHTML={{ __html: renderLatex(childQ.NoiDung) }}></div>
                      </div>

                      {childQ.CauTraLoi && childQ.CauTraLoi.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {childQ.CauTraLoi.map((answer, idx) => (
                            <div
                              key={answer.MaCauTraLoi}
                              className={`flex items-center p-2 rounded-md ${
                                answer.LaDapAn
                                  ? 'bg-green-50 border border-green-300'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                                answer.LaDapAn
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <div className="flex-1 min-w-0">
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
              <div className="mb-3" dangerouslySetInnerHTML={{ __html: renderLatex(question.NoiDung) }}></div>

              {/* Render answers for non-group questions */}
              {question.answers && question.answers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {question.answers.map((answer, idx) => (
                    <div
                      key={answer.MaCauTraLoi}
                      className={`flex items-center p-2 rounded-md ${
                        answer.LaDapAn
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                        answer.LaDapAn
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 min-w-0">
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
      {/* Fixed Header */}
      <div className="flex justify-between items-center mb-3 px-4 pt-4 pb-2">
        <h1 className={cx("text-xl font-bold", styles.textHeading)}>Ngân hàng câu hỏi</h1>
        <Button
          variant="primary"
          className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate('/questions/create')}
        >
          <Plus className="w-4 h-4 mr-1" />
          Thêm câu hỏi
        </Button>
      </div>

      {/* Fixed Filter Bar */}
      <div className="px-4 pb-3">
        <Filters onSearch={handleSearch} onFilter={handleFilter} />
      </div>

      {/* Scrollable Question List Container */}
      <div className="flex-1 overflow-hidden border-t border-b" style={{ maxHeight: 'calc(100% - 120px)' }}>
        <div className="h-full overflow-y-auto p-4">
        {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
          ) : backendQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có câu hỏi nào</div>
          ) : (
            <div className="space-y-2">
              {backendQuestions.map((question, index) => renderQuestion(question, index))}
                        </div>
                      )}
                    </div>
      </div>

      {/* Fixed Pagination Bar */}
      <div className="px-4 py-3 bg-gray-50 border-t shadow-sm">
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

      {/* KaTeX Styles for LaTeX */}
      <style>{`
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
