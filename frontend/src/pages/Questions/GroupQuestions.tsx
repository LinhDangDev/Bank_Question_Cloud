import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, Edit, Trash2, Users } from 'lucide-react';
import { useThemeStyles, cx } from "../../utils/theme";
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { API_BASE_URL } from '@/config';

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
  if (!level || level <= 2) return "Dễ";
  if (level <= 4) return "Trung bình";
  return "Khó";
};

const cloColors: Record<string, string> = {
  'CLO1': 'bg-green-100 text-green-700',
  'CLO2': 'bg-blue-100 text-blue-700',
  'CLO3': 'bg-purple-100 text-purple-700',
  'CLO4': 'bg-orange-100 text-orange-700',
  'CLO5': 'bg-yellow-100 text-yellow-700',
};

const GroupQuestionsPage = () => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [groupQuestions, setGroupQuestions] = useState<GroupQuestion[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchGroupQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/cau-hoi/group?page=${page}&limit=10`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        setGroupQuestions(data.items);
        setTotalPages(data.meta.totalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching group questions:', err);
        setError('Failed to load group questions. Please try again later.');
        setLoading(false);
      }
    };

    fetchGroupQuestions();
  }, [page]);

  // Toggle group question expansion
  const toggleGroup = (questionId: string) => {
    setExpandedGroups(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Enhanced LaTeX rendering function
  const renderLatex = (content: string) => {
    if (!content) return '';

    try {
      // Process LaTeX formulas enclosed in $ signs
      return content.replace(/\$(.*?)\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false
          });
        } catch (e) {
          console.error('LaTeX rendering error:', e);
          return match;
        }
      });
    } catch (e) {
      console.error('Content processing error:', e);
      return content;
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className={cx("text-2xl font-bold", styles.isDark ? 'text-gray-200' : '')}>
          Danh sách câu hỏi nhóm
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate('/questions')}
        >
          Quay lại
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          {groupQuestions.map((question) => (
            <div
              key={question.MaCauHoi}
              className={cx(
                "border rounded-lg overflow-hidden",
                styles.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              )}
            >
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-wrap gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">
                      #{question.MaSoCauHoi}
                    </span>
                    {question.TenCLO && (
                      <span className={cx(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        cloColors[question.TenCLO] || "bg-gray-100 text-gray-700"
                      )}>
                        {question.TenCLO}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      Câu hỏi nhóm ({question.SoCauHoiCon})
                    </span>
                    <span className={cx(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      question.XoaTamCauHoi ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {question.XoaTamCauHoi ? "Đã xóa" : "Hoạt động"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/questions/edit/${question.MaCauHoi}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Question content */}
                  <div className="font-medium text-gray-800">
                    <div dangerouslySetInnerHTML={{ __html: renderLatex(question.NoiDung) }} />
                  </div>

                  {/* Child questions toggle */}
                  <button
                    onClick={() => toggleGroup(question.MaCauHoi)}
                    className="w-full border border-gray-300 text-left px-4 py-2 rounded-md flex justify-between items-center hover:bg-gray-50"
                  >
                    <span>Xem {question.SoCauHoiCon} câu hỏi con</span>
                    {expandedGroups.includes(question.MaCauHoi) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Child questions */}
                  {expandedGroups.includes(question.MaCauHoi) && question.CauHoiCon && (
                    <div className="space-y-3 mt-2">
                      {question.CauHoiCon.map((childQ) => (
                        <div key={childQ.MaCauHoi} className="border rounded-lg p-4 bg-gray-50">
                          <div className="mb-2 font-medium">
                            Câu {childQ.MaSoCauHoi}: <span dangerouslySetInnerHTML={{ __html: renderLatex(childQ.NoiDung) }} />
                          </div>

                          {/* Answer grid for short answers */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {childQ.CauTraLoi && childQ.CauTraLoi.map((answer, idx) => (
                              <div
                                key={answer.MaCauTraLoi}
                                className={cx(
                                  "flex items-start gap-2 p-2 rounded",
                                  answer.LaDapAn
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-gray-50 border border-gray-200"
                                )}
                              >
                                <span className={cx(
                                  "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium",
                                  answer.LaDapAn
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                )}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <div className={cx("flex-1", answer.LaDapAn ? "text-green-700" : "")}>
                                  <div dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }} />
                                </div>
                                {answer.LaDapAn && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                                    Đáp án
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Question metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 mt-2 border-t">
                    <div className="flex items-center gap-4">
                      <span>Cấp độ: {getDifficultyText(question.CapDo)}</span>
                      <span>Ngày tạo: {formatDate(question.NgayTao)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Số lần thi: {question.SoLanDuocThi || 0}</span>
                      <span>Số lần đúng: {question.SoLanDung || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
              >
                Trước
              </Button>
              <span className="mx-4 flex items-center">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* KaTeX Styles */}
      <style>{`
        .katex {
          font-size: 1.1em;
        }
        .katex-display {
          margin: 0.5em 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default GroupQuestionsPage;
