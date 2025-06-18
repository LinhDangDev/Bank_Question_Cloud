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
import QuestionItem, { Question as QuestionType } from '@/components/QuestionItem'
import PaginationBar from '@/components/PaginationBar'
import Filters from '@/components/Filters'

// Define the Answer interface based on the API response
interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

// Updated Question interface to support group questions
interface Question {
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
  items: QuestionType[];
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

// Define helper functions for displaying question difficulty
const getDifficultyColor = (level: number) => {
  if (!level || level <= 2) return "bg-green-100 text-green-800";
  if (level <= 4) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

const getDifficultyText = (level: number) => {
  if (!level || level <= 2) return "Dễ";
  if (level <= 4) return "Trung bình";
  return "Khó";
}

const Questions = () => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100);
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
                // khoa: details.khoa,
                // monHoc: details.monHoc,
                // phan: details.phan,
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
        groupData.items.map(async (groupQuestion: any) => {
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
                // khoa: details.khoa,
                // monHoc: details.monHoc,
                // phan: details.phan,
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
            //   khoa: details.khoa,
            //   monHoc: details.monHoc,
            //   phan: details.phan,
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

        // Combine regular and group questions
      const allQuestions = [...regularQuestionsWithDetails, ...groupQuestionsWithDetails];

        setQuestions(allQuestions);
      setTotalPages(Math.max(data.meta.totalPages, groupData.meta.totalPages));
        setTotalItems(data.meta.total + groupData.meta.total);
        setAvailableLimits(data.meta.availableLimits);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again later.');
        setLoading(false);
      }
  }, [page, limit]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Toggle group question expansion
  const toggleGroup = (questionId: string) => {
    setExpandedGroups(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log('Search query:', query);
  };

  const handleFilter = () => {
    // TODO: Implement filter functionality
    console.log('Filter button clicked');
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Fixed Header */}
      <div className="flex justify-between items-center mb-3 px-4 pt-4 pb-2">
        <h1 className={cx("text-xl font-bold", styles.isDark ? 'text-gray-200' : '')}>Danh sách câu hỏi</h1>
        <Button
          variant="primary"
          className="h-9 px-3"
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
      <div className="flex-1 overflow-hidden border-t border-b">
        <div className="h-full overflow-y-auto">
        {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có câu hỏi nào</div>
          ) : (
            <div className="divide-y">
              {questions.map((question, index) => (
                <QuestionItem
                  key={question.MaCauHoi}
                  question={question}
                  index={index}
                  page={page}
                  limit={limit}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  refetchQuestions={fetchQuestions}
                />
                          ))}
                        </div>
                      )}
                    </div>
      </div>

      {/* Fixed Pagination Bar */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t shadow-sm">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={totalItems}
          availableLimits={availableLimits}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1); // Reset to first page when changing limit
          }}
        />
      </div>

      <style>{`
        .katex-formula .katex {
          display: inline-block;
          font-size: 1em;
        }

        /* Additional styles for better LaTeX rendering */
        .katex-display {
          display: block;
          margin: 0.5em 0;
          text-align: center;
        }

        /* Fix for fractions */
        .katex .mfrac .frac-line {
          border-bottom-width: 1px;
        }

        /* Fix for matrices */
        .katex .mord.mtable {
          vertical-align: middle;
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

export default Questions
