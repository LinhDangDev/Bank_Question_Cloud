import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Eye, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useThemeStyles, cx } from "../../utils/theme"
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

// Define the Question interface based on the API response
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
}

interface ApiResponse {
  items: Question[];
  meta: {
    total: number;
    page: string;
    limit: string;
    totalPages: number;
    availableLimits: number[];
  };
}

const typeColors: Record<string, string> = {
  '02CDC541-6931-461A-8751-0843AC45D6DC': 'bg-green-100 text-green-700',
  '06400160-101B-4314-ACD8-10E4D04FE281': 'bg-blue-100 text-blue-700',
  'B4871A30-80B8-4258-A82D-08372A2F2D0E': 'bg-purple-100 text-purple-700',
  '52A8D25D-30F7-4050-839E-6469AAEB460F': 'bg-orange-100 text-orange-700',
  '56F836D9-F018-4B18-ABE5-49DB7CEAD511': 'bg-yellow-100 text-yellow-700',
  '0078EDC5-34D7-433E-AC6C-320C4AE9CC78': 'bg-indigo-100 text-indigo-700',
  '6742EC82-8885-476A-95DA-14C4A8842640': 'bg-pink-100 text-pink-700',
  '0D6DE122-AC00-43C4-9F02-C5AAFC6C659C': 'bg-teal-100 text-teal-700',
  '7ED17AE5-B09F-4C3F-AF22-A4C66530C8F1': 'bg-cyan-100 text-cyan-700',
  '8E1DDF50-9182-4F3E-A648-6D2B35A657C2': 'bg-lime-100 text-lime-700',
  'E4312199-11B5-4056-AD2F-EFDA7861995D': 'bg-sky-100 text-sky-700',
  'FEF89752-BBBA-4381-935C-C46B30D8AD14': 'bg-amber-100 text-amber-700',
  '521261FE-F4EA-4485-9563-3A53FAF81904': 'bg-violet-100 text-violet-700',
  'F4BB3505-CD52-46DB-A276-C31F4A09A3D0': 'bg-fuchsia-100 text-fuchsia-700',
  '1D7B0021-7638-412C-BBB8-73E0636E813A': 'bg-emerald-100 text-emerald-700',
  '33BB05D0-397A-47EF-AEF4-767FEE4C0888': 'bg-rose-100 text-rose-700',
  '4DD24655-607E-4C98-96F4-64EE0A231C47': 'bg-slate-100 text-slate-700',
  '68B05918-2ACF-4C77-AA01-3812D229DA24': 'bg-gray-100 text-gray-700'
}

const statusColors: Record<string, string> = {
  'active': 'text-green-600',
  'deleted': 'text-red-500',
}

const Questions = () => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(2); // Starting with page 2 as per your API URL
  const [limit, setLimit] = useState<number>(100);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [availableLimits, setAvailableLimits] = useState<number[]>([5, 10, 20, 50, 100]);
  const [showLimitDropdown, setShowLimitDropdown] = useState<boolean>(false);
  const limitDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/cau-hoi?page=${page}&limit=${limit}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        setQuestions(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
        setAvailableLimits(data.meta.availableLimits);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again later.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [page, limit]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (limitDropdownRef.current && !limitDropdownRef.current.contains(event.target as Node)) {
        setShowLimitDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date from ISO string to local date format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced LaTeX rendering function with improved support for matrices, superscripts, and chemical formulas
  const renderLatex = (content: string) => {
    try {
      // Handle LaTeX with HTML style attributes (like colored math)
      // Example: \sqrt{a^2" style="color:#cc0000">\sqrt{a^2 + b^2}
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
      // Example: \sqrt{d^2" style="color:#cc0000"
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
        /\\sqrt\{[a-z0-9]\^\{[0-9]+\} \+ [a-z0-9]\^\{[0-9]+\}\}/g
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

          // Special handling for matrices to ensure proper rendering
          let latexToRender = match;

          // Fix common matrix issues
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

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
    setShowLimitDropdown(false);
  };

  // Calculate the range of items being displayed
  const startItem = Math.min(totalItems, (page - 1) * limit + 1);
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className={cx("text-2xl font-bold", styles.isDark ? 'text-gray-200' : '')}>Danh sách câu hỏi</h1>
        <Button
          className={styles.primaryButton}
          onClick={() => navigate('/questions/create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm câu hỏi..."
            className={cx("pl-10", styles.input)}
          />
        </div>
        <Button
          variant="outline"
          className={cx("flex items-center gap-2", styles.outlineButton)}
        >
          <Filter className="w-4 h-4" />
          Lọc
        </Button>
      </div>

      {/* Scrollable question list */}
      <div className="flex-1 overflow-y-auto border rounded-lg" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="space-y-0">
            {questions.map((q, index) => (
              <div
                key={q.MaCauHoi}
                className={cx(
                  "flex flex-col md:flex-row justify-between gap-4 p-6 border-b hover:bg-gray-50 dark:hover:bg-gray-700/30",
                  styles.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 font-medium">#{index + 1 + (page - 1) * limit}</span>
                    <span className="text-gray-500">#{q.MaSoCauHoi}</span>
                    {q.MaCLO && (
                      <span className={cx(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        typeColors[q.MaCLO] || 'bg-gray-100 text-gray-700'
                      )}>CLO-{q.MaCLO.substring(0, 6)}</span>
                    )}
                    <span className={cx(
                      "px-2 py-0.5 rounded text-xs font-medium border",
                      q.XoaTamCauHoi ? 'border-red-200 text-red-500' : 'border-green-200 text-green-600'
                    )}>
                      {q.XoaTamCauHoi ? 'Đã xoá' : 'Hoạt động'}
                    </span>
                  </div>

                  <div className="font-semibold text-base mb-2">
                    <div dangerouslySetInnerHTML={{ __html: renderLatex(q.NoiDung) }} />
                  </div>

                  {q.SoCauHoiCon > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Xem {q.SoCauHoiCon} câu hỏi con <span className="ml-1 font-bold text-lg">+</span>
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-end min-w-[220px] gap-2">
                  <div className="flex gap-2 mb-2">
                    <Button variant="outline" size="sm" className={styles.outlineButton}><Eye className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className={styles.outlineButton} onClick={() => navigate(`/questions/edit/${q.MaCauHoi}`)}><Edit className="w-4 h-4" /></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cx(
                        styles.isDark
                          ? 'text-red-400 hover:text-red-300 border-red-800 hover:bg-red-900 hover:bg-opacity-30'
                          : 'text-red-500 hover:text-red-600 border-red-300 hover:bg-red-50'
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-right">
                    <div className="mb-1">
                      <span className="font-medium">{q.XoaTamCauHoi ? 'Đã xoá' : 'Hoạt động'}</span>
                    </div>
                    <div className="text-gray-500">Cấp độ: <span className="font-semibold">{q.CapDo}</span></div>
                    <div className="text-gray-500">Ngày tạo: <span className="font-semibold">{formatDate(q.NgayTao)}</span></div>
                    <div className="text-gray-500">Mã câu hỏi: <span className="font-semibold">{q.MaSoCauHoi}</span></div>
                    <div className="text-gray-500">Số lần thi: <span className="font-semibold">{q.SoLanDuocThi}</span></div>
                    <div className="text-gray-500">Số lần đúng: <span className="font-semibold">{q.SoLanDung}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed pagination controls */}
      <div className="py-3 mt-4 flex flex-wrap justify-between items-center gap-4">
        {/* Left side - Page navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm mr-2">Trang {page} / {totalPages}</span>
          <div className="flex border rounded overflow-hidden">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-r h-8 px-3"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              Đầu
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-r h-8 px-3"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <div className="flex items-center px-2 bg-white dark:bg-gray-700">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => setPage(Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages))}
                className="w-12 text-center bg-transparent border-none focus:outline-none h-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-l h-8 px-3"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-l h-8 px-3"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              Cuối
            </Button>
          </div>
        </div>

        {/* Right side - Display options and info */}
        <div className="flex items-center gap-4">
          {/* Limit dropdown */}
          <div className="relative" ref={limitDropdownRef}>
            <div className="flex items-center">
              <span className="text-sm mr-2">Hiển thị:</span>
              <button
                className="flex items-center gap-1 border rounded px-3 py-1 bg-white dark:bg-gray-700"
                onClick={() => setShowLimitDropdown(!showLimitDropdown)}
              >
                {limit} <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {showLimitDropdown && (
              <div className="absolute bottom-full mb-1 right-0 bg-white dark:bg-gray-800 border rounded shadow-lg z-10">
                {availableLimits.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLimitChange(l)}
                    className={cx(
                      "block w-full text-left px-4 py-2",
                      limit === l
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Display range */}
          <div className="text-sm">
            Hiển thị {startItem}-{endItem} trong số {totalItems} bản ghi
          </div>
        </div>
      </div>

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
    </div>
  )
}

export default Questions
