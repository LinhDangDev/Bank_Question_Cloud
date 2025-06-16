import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/button';
import { useThemeStyles, cx } from '@/utils/theme';
import { File, Upload, ChevronRight, Edit, Check, X, Trash, Filter, ArrowLeft, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { toast } from 'react-toastify';
import { Pagination } from '@/components/ui/pagination';

interface Question {
  id: string;
  content: string;
  type: string;
  selected?: boolean;
  answers?: {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }[];
}

const QuestionUploadPage = () => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const maPhan = searchParams.get('maPhan');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [fileId, setFileId] = useState<string>('');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load questions for a specific page
  const loadQuestions = async (page: number = 1) => {
    if (!fileId) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/questions-import/preview/${fileId}`, {
        params: {
          page,
          limit: pageSize
        }
      });

      if (response.data && response.data.items) {
        // Update questions with selected state
        const updatedQuestions = response.data.items.map((q: Question) => ({
          ...q,
          selected: selectAll || selectedQuestions.has(q.id)
        }));

        setQuestions(updatedQuestions);
        setTotalPages(response.data.meta.totalPages);
        setTotalItems(response.data.meta.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Không thể tải danh sách câu hỏi');
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (maPhan) {
      formData.append('maPhan', maPhan);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/questions-import/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.fileId) {
        setFileId(response.data.fileId);
        setUploadSuccess(true);
        setIsUploading(false);

        // Load first page of questions
        setTimeout(() => {
          loadQuestions(1);
        }, 500);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      toast.error('Không thể tải lên tệp. Vui lòng kiểm tra định dạng và thử lại.');
    }
  };

  // Toggle selection of all questions
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      // If selecting all, add all current questions to selected set
      const newSelected = new Set(selectedQuestions);
      questions.forEach(q => newSelected.add(q.id));
      setSelectedQuestions(newSelected);
    } else {
      // If deselecting all, remove all current questions from selected set
      const newSelected = new Set(selectedQuestions);
      questions.forEach(q => newSelected.delete(q.id));
      setSelectedQuestions(newSelected);
    }

    // Update the UI state of current questions
    setQuestions(questions.map(q => ({
      ...q,
      selected: newSelectAll
    })));
  };

  // Toggle selection of a single question
  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);

    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }

    setSelectedQuestions(newSelected);

    // Update the UI state
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, selected: !q.selected }
        : q
    ));
  };

  // Save selected questions to the database
  const saveQuestions = async () => {
    if (selectedQuestions.size === 0) {
      toast.error('Không có câu hỏi được chọn');
      return;
    }

    setIsSaving(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/questions-import/save`, {
        fileId,
        questionIds: Array.from(selectedQuestions),
        maPhan
      });

      if (response.data && response.data.success) {
        toast.success(`Đã lưu ${response.data.savedCount} câu hỏi vào hệ thống.`);

        // Navigate back to question list or section details
        if (maPhan) {
          navigate(`/chapter-questions/${maPhan}`);
        } else {
          navigate('/questions');
        }
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Không thể lưu câu hỏi vào hệ thống. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadQuestions(page);
  };

  // Component for displaying a single question
  const QuestionItem = ({ question }: { question: Question }) => {
    return (
      <div
        className={cx(
          "p-4 border-b last:border-b-0",
          styles.isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={question.selected}
              onChange={() => toggleQuestionSelection(question.id)}
              className={cx(
                "h-4 w-4 rounded",
                styles.isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              )}
            />
          </div>
          <div className="flex-1">
            <p className={cx("font-medium mb-2", styles.isDark ? 'text-gray-200' : 'text-gray-700')}>
              {question.content}
            </p>

            {question.type === 'single-choice' && question.answers && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {question.answers.map((answer, i) => (
                  <div
                    key={answer.id}
                    className={cx(
                      "flex items-center gap-2 p-2 rounded-md",
                      answer.isCorrect ? (styles.isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-50') : '',
                      styles.isDark ? 'border border-gray-700' : 'border border-gray-200'
                    )}
                  >
                    {answer.isCorrect && (
                      <Check className={cx("h-4 w-4", styles.isDark ? 'text-green-400' : 'text-green-500')} />
                    )}
                    <span className={cx(
                      answer.isCorrect
                        ? (styles.isDark ? 'text-green-400' : 'text-green-700')
                        : (styles.isDark ? 'text-gray-300' : 'text-gray-700')
                    )}>
                      {String.fromCharCode(65 + answer.order)}. {answer.content}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {question.type === 'fill-blank' && (
              <div className={cx(
                "p-2 rounded-md mt-3",
                styles.isDark ? 'bg-blue-900 bg-opacity-20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              )}>
                <span className={cx(
                  "text-sm",
                  styles.isDark ? 'text-blue-300' : 'text-blue-700'
                )}>
                  Câu hỏi điền khuyết
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer className="p-6">
      <div className={cx(
        "max-w-8xl mx-auto",
        styles.isDark ? 'bg-white-900' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={cx("text-2xl font-bold", styles.isDark ? 'text-gray-200' : '')}>
              Tải lên file câu hỏi
            </h1>
            <p className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-600')}>
              Tạo nhiều câu hỏi từ file Word
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(maPhan ? `/chapter-questions/${maPhan}` : '/questions')}
            className={styles.outlineButton}
          >
            Quay lại danh sách câu hỏi
          </Button>
        </div>

        <div className={cx(
          "p-6 rounded-lg mb-6",
          styles.isDark ? 'bg-gray-850 shadow-xl' : 'bg-white shadow-sm border border-gray-200'
        )}>
          {!file && (
            <div className={cx(
              "border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-4",
              styles.isDark ? 'border-gray-700' : 'border-gray-300'
            )}>
              <div className={cx(
                "p-4 rounded-full",
                styles.isDark ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <Upload className={cx("h-8 w-8", styles.isDark ? 'text-gray-400' : 'text-gray-500')} />
              </div>
              <div className="text-center">
                <p className={cx("font-medium mb-1", styles.isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Kéo thả file hoặc click để chọn
                </p>
                <p className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Hỗ trợ tệp định dạng .docx theo mẫu
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".docx"
                  onChange={handleFileChange}
                />
                <span className={cx(
                  "inline-block px-4 py-2 rounded-md font-medium text-sm",
                  styles.isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                )}>
                  Chọn tệp
                </span>
              </label>
            </div>
          )}

          {file && isUploading && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 rounded-full animate-spin"></div>
              <p className={cx("font-medium", styles.isDark ? 'text-gray-300' : 'text-gray-700')}>
                Đang xử lý file...
              </p>
            </div>
          )}

          {file && !isUploading && uploadSuccess && (
            <div className="space-y-4">
              <div className={cx(
                "flex items-center p-4 rounded-lg",
                styles.isDark ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <div className={cx(
                  "p-2 rounded mr-3",
                  styles.isDark ? 'bg-gray-700' : 'bg-white'
                )}>
                  <File className={cx("h-6 w-6", styles.isDark ? 'text-blue-400' : 'text-blue-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cx("font-medium truncate", styles.isDark ? 'text-gray-200' : 'text-gray-700')}>
                    {file.name}
                  </p>
                  <p className={cx("text-xs", styles.isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {(file.size / 1024).toFixed(1)} KB • Đã xử lý thành công
                  </p>
                </div>
                <button
                  className={cx(
                    "p-1 rounded-full",
                    styles.isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                  )}
                  onClick={() => {
                    setFile(null);
                    setQuestions([]);
                    setUploadSuccess(false);
                    setFileId('');
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className={cx(
            "rounded-lg overflow-hidden mb-6",
            styles.isDark ? 'bg-gray-850 shadow-xl' : 'bg-white shadow-sm border border-gray-200'
          )}>
            <div className={cx(
              "p-4 flex items-center justify-between border-b",
              styles.isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            )}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className={cx(
                    "h-4 w-4 rounded",
                    styles.isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  )}
                />
                <span className={cx("font-medium", styles.isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Chọn tất cả
                </span>
              </div>
              <div className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-500')}>
                Hiển thị {questions.length} / {totalItems} câu hỏi
              </div>
            </div>

            <div>
              {questions.map((question) => (
                <QuestionItem key={question.id} question={question} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={cx(
                "p-4 border-t flex items-center justify-center",
                styles.isDark ? 'border-gray-700' : 'border-gray-200'
              )}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-4 pb-8">
            <Button
              variant="outline"
              onClick={() => navigate(maPhan ? `/chapter-questions/${maPhan}` : '/questions')}
              className={styles.outlineButton}
            >
              Hủy
            </Button>
            <div className="flex items-center gap-3">
              <span className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-500')}>
                Đã chọn: {selectedQuestions.size}/{totalItems} câu hỏi
              </span>
              <Button
                variant="primary"
                className="flex items-center gap-1"
                onClick={saveQuestions}
                disabled={selectedQuestions.size === 0 || isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Lưu vào hệ thống
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default QuestionUploadPage;
