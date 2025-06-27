import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
// import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react'
import PageContainer from '@/components/ui/PageContainer'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { phanApi, questionApi } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'

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

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await questionApi.getByChapterWithAnswers(chapterId as string);
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
    } catch (error) {
      toast.error('Không thể tải danh sách câu hỏi')
      setQuestions([])
      console.error('Error fetching questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (chapterId) {
      fetchChapter()
      fetchQuestions()
    }

    // Cleanup function to avoid memory leaks and handle component unmounting
    return () => {
      // Nothing to cleanup yet
    }
  }, [chapterId])

  // Enhanced LaTeX rendering function with improved support for matrices, superscripts, and chemical formulas
  const renderLatex = (content: string) => {
    if (!content) return '';

    try {
      // Handle LaTeX with HTML style attributes (like colored math)
      const styledLatexRegex = /(\\[a-zA-Z]+\{[^}]*\})"?\s*style="([^"]+)">(\\[a-zA-Z]+\{[^}]*\})/g;
      let processedContent = content.replace(styledLatexRegex, (match, formula1, style, formula2) => {
        try {
          // Extract color from style if present
          const colorMatch = style.match(/color:\s*([^;]+)/);
          const color = colorMatch ? colorMatch[1] : '';

          // Render both formulas separately with the specified color
          const rendered1 = katex.renderToString(formula1, {
            throwOnError: false,
            output: 'html',
            displayMode: false,
            strict: false
          });

          const rendered2 = katex.renderToString(formula2, {
            throwOnError: false,
            output: 'html',
            displayMode: false,
            strict: false
          });

          // Return with appropriate styling
          return `<span class="katex-formula" style="color:${color}">${rendered1}</span><span class="katex-formula" style="color:${color}">${rendered2}</span>`;
        } catch (e) {
          console.error('Error rendering styled LaTeX:', match, e);
          return match;
        }
      });

      // Handle LaTeX with HTML style attributes but without closing tag
      const singleStyledLatexRegex = /(\\[a-zA-Z]+\{[^}]*\})"?\s*style="([^"]+)"/g;
      processedContent = processedContent.replace(singleStyledLatexRegex, (match, formula, style) => {
        try {
          // Extract color from style if present
          const colorMatch = style.match(/color:\s*([^;]+)/);
          const color = colorMatch ? colorMatch[1] : '';

          // Render formula with the specified color
          const rendered = katex.renderToString(formula, {
            throwOnError: false,
            output: 'html',
            displayMode: false,
            strict: false
          });

          // Return with appropriate styling
          return `<span class="katex-formula" style="color:${color}">${rendered}</span>`;
        } catch (e) {
          console.error('Error rendering single styled LaTeX:', match, e);
          return match;
        }
      });

      // Pre-process chemical formulas to make them more compatible with KaTeX
      // Replace chemical formulas like C_6H_12O_6 with proper LaTeX: C_{6}H_{12}O_{6}
      processedContent = processedContent.replace(/([A-Z][a-z]?)_(\d+)/g, '$1_{$2}');

      // Replace superscripts without braces like x^2 with proper LaTeX: x^{2}
      processedContent = processedContent.replace(/([A-Za-z0-9])(\^)(\d+|[a-zA-Z](?!\{))/g, '$1$2{$3}');

      // Fix specific patterns seen in the screenshots
      processedContent = processedContent.replace(/\\sqrt\{([a-z0-9])(\^)(\d+)\}/g, '\\sqrt{$1^{$3}}');

      // Comprehensive regex to match various LaTeX patterns
      const latexPatterns = [
        // Basic math commands
        /\\[a-zA-Z]+\{.*?\}/g,
        /\\[a-zA-Z]+_[a-zA-Z0-9]+/g,
        /\\[a-zA-Z]+_\{.*?\}/g,
        /\\[a-zA-Z]+\^\{.*?\}/g,
        /\\[a-zA-Z]+/g,

        // Matrix notation (with special handling)
        /\\begin\{pmatrix\}[\s\S]*?\\end\{pmatrix\}/g,
        /\\begin\{matrix\}[\s\S]*?\\end\{matrix\}/g,
        /\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\}/g,
        /\\begin\{vmatrix\}[\s\S]*?\\end\{vmatrix\}/g,
        /\\begin\{Vmatrix\}[\s\S]*?\\end\{Vmatrix\}/g,

        // Specific math expressions
        /\\exists.*?\\in.*?\\mathbb\{[A-Z]\}.*?[<>=]/g,
        /\\forall.*?\\ge 0/g,
        /\\sum.*?\\frac\{.*?\}\{.*?\}/g,
        /\\log_.*?\\iff/g,
        /\\lim_.*?= 1/g,
        /\\mathcal\{L\}.*?dt/g,
        /\\vec\{.*?\}/g,
        /\\binom\{.*?\}\{.*?\}/g,

        // Chemical formulas (enhanced)
        /[A-Z][a-z]?_\{[0-9]+\}[A-Z][a-z]?_\{[0-9]+\}[A-Z]?[a-z]?_?\{?[0-9]*\}?/g,
        /[A-Z][a-z]?\{.*?\}\d*/g,

        // Integrals
        /\\int_\{.*?\}\^\{.*?\}/g,
        /\\int_\{.*?\}/g,
        /\\int\^\{.*?\}/g,
        /\\int/g,

        // Fractions
        /\\frac\{.*?\}\{.*?\}/g,

        // Subscripts and superscripts (enhanced)
        /[A-Za-z0-9]_\{.*?\}\^\{.*?\}/g,
        /[A-Za-z0-9]_\{.*?\}/g,
        /[A-Za-z0-9]\^\{.*?\}/g,
        /[A-Za-z0-9]_[0-9a-zA-Z]/g,
        /[A-Za-z0-9]\^[0-9a-zA-Z]/g,

        // Greek letters
        /\\[a-zA-Z]+/g,

        // Special functions
        /\\sqrt\{.*?\}/g,
        /\\overline\{.*?\}/g,
        /\\underline\{.*?\}/g,

        // Sets and logic
        /\\in|\\subset|\\subseteq|\\cup|\\cap|\\emptyset|\\rightarrow|\\Rightarrow|\\Leftrightarrow|\\land|\\lor|\\neg/g,

        // Additional patterns for the specific cases in screenshots
        /\\sqrt\{[^}]+\}/g,
        /\\sqrt\{[a-z0-9]\^[0-9]+\}/g,
        /\\sqrt\{[a-z0-9]\^\{[0-9]+\}\}/g,
        /\\sqrt\{[a-z0-9]\^[0-9]+ \+ [a-z0-9]\^[0-9]+\}/g,
        /\\sqrt\{[a-z0-9]\^\{[0-9]+\} \+ [a-z0-9]\^\{[0-9]+\}\}/g,

        // Also match LaTeX expressions surrounded by $ signs
        /\$(.*?)\$/g
      ];

      // Find all matches from all patterns
      let allMatches: string[] = [];
      latexPatterns.forEach(pattern => {
        const matches = processedContent.match(pattern);
        if (matches) {
          allMatches = [...allMatches, ...matches];
        }
      });

      // Remove duplicates
      const uniqueMatches = [...new Set(allMatches)];

      // Sort by length (longest first) to avoid nested replacements
      uniqueMatches.sort((a, b) => b.length - a.length);

      // Replace each match with rendered LaTeX
      uniqueMatches.forEach(match => {
        try {
          // Skip if the match contains HTML style attributes (already processed above)
          if (match.includes('style=')) {
            return;
          }

          // Special handling for dollar-sign enclosed LaTeX
          let latexToRender = match;
          if (match.startsWith('$') && match.endsWith('$')) {
            latexToRender = match.substring(1, match.length - 1);
          }

          // Special handling for matrices to ensure proper rendering
          if (latexToRender.includes('\\begin{') && latexToRender.includes('\\end{')) {
            // Ensure proper line breaks in matrices
            latexToRender = latexToRender.replace(/\\\\(?!\n)/g, '\\\\\n');
            // Ensure proper spacing in matrices
            latexToRender = latexToRender.replace(/&(?!\s)/g, '& ');
          }

          const rendered = katex.renderToString(latexToRender, {
            throwOnError: false,
            output: 'html',
            displayMode: false,
            strict: false // Less strict mode to handle more expressions
          });

          // Create a safe regex pattern from the match
          const safePattern = new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          processedContent = processedContent.replace(safePattern, `<span class="katex-formula">${rendered}</span>`);
        } catch (e) {
          console.error('Error rendering specific LaTeX:', match, e);
        }
      });

      return processedContent;
    } catch (e) {
      console.error('Error processing LaTeX:', e);
      return content;
    }
  };

  const handleDeleteQuestion = async (maCauHoi: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      await questionApi.softDelete(maCauHoi);
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
    <PageContainer className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
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
        <Button onClick={() => navigate(`/questions/create?maPhan=${chapterId}`)}>
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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-8">
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
        <div className="space-y-0 border rounded-lg">
          {filteredQuestions.map((item, index) => (
            <div
              key={item.question.MaCauHoi}
              className={`flex flex-col md:flex-row justify-between gap-4 p-6 border-b hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                item.question.XoaTamCauHoi ? 'opacity-70' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 font-medium">#{index + 1}</span>
                  <span className="text-gray-500">#{item.question.MaSoCauHoi}</span>
                  {item.question.MaCLO && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.question.cloInfo?.TenCLO ? typeColors[item.question.cloInfo.TenCLO] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                    }`}>{item.question.cloInfo?.TenCLO || 'CLO'}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    item.question.XoaTamCauHoi
                      ? 'border-red-200 text-red-500'
                      : 'border-green-200 text-green-600'
                  }`}>
                    {item.question.XoaTamCauHoi ? 'Đã xóa' : 'Hoạt động'}
                  </span>
                </div>

                <div className="font-semibold text-base mb-2">
                  <div dangerouslySetInnerHTML={{ __html: renderLatex(item.question.NoiDung) }} />
                </div>

                {item.answers && item.answers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {item.answers.map((answer) => (
                      <div
                        key={answer.MaCauTraLoi}
                        className={`flex items-start gap-2 p-2 rounded ${
                          answer.LaDapAn
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${
                          answer.LaDapAn
                            ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}>
                          {String.fromCharCode(65 + answer.ThuTu - 1)}
                        </span>
                        <div className="flex-1">
                          <div dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {item.question.SoCauHoiCon > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-green-700 border-green-300 hover:bg-green-50"
                  >
                    Xem {item.question.SoCauHoiCon} câu hỏi con <span className="ml-1 font-bold text-lg">+</span>
                  </Button>
                )}
              </div>
              <div className="flex flex-col items-end min-w-[220px] gap-2">
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => navigate(`/questions/view/${item.question.MaCauHoi}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => navigate(`/questions/edit/${item.question.MaCauHoi}`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleDeleteQuestion(item.question.MaCauHoi)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-right">
                  <div className="mb-1">
                    <span className="font-medium">{item.question.XoaTamCauHoi ? 'Đã xóa' : 'Hoạt động'}</span>
                  </div>
                  <div className="text-gray-500">Cấp độ: <span className="font-semibold">{item.question.CapDo}</span></div>
                  <div className="text-gray-500">Ngày tạo: <span className="font-semibold">{formatDate(item.question.NgayTao)}</span></div>
                  <div className="text-gray-500">Ngày sửa: <span className="font-semibold">{formatDate(item.question.NgaySua)}</span></div>
                  <div className="text-gray-500">Mã câu hỏi: <span className="font-semibold">{item.question.MaSoCauHoi}</span></div>
                  <div className="text-gray-500">Số lần thi: <span className="font-semibold">{item.question.SoLanDuocThi}</span></div>
                  <div className="text-gray-500">Số lần đúng: <span className="font-semibold">{item.question.SoLanDung}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .katex-formula .katex {
          display: inline-block;
          font-size: 1.1em;
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
    </PageContainer>
  )
}

export default ChapterQuestions
