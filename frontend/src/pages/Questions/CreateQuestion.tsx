import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageContainer from "../../components/ui/PageContainer"
import { useThemeStyles, cx } from "../../utils/theme"
import { File, Upload, ChevronRight, Edit, Check, X, Trash } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

interface QuestionTypeCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  isSelected: boolean
}

const QuestionTypeCard = ({ icon, title, description, onClick, isSelected }: QuestionTypeCardProps) => {
  const styles = useThemeStyles();
  return (
    <div
      className={cx(
        "border rounded-lg p-4 flex flex-col items-center text-center gap-2 cursor-pointer transition-all hover:shadow-md",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : `${styles.isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'}`,
        styles.isDark && !isSelected && "bg-gray-800 hover:bg-gray-700"
      )}
      onClick={onClick}
    >
      <div className={cx(
        "p-3 rounded-full",
        isSelected ? "bg-blue-100" : `${styles.isDark ? 'bg-gray-700' : 'bg-gray-100'}`
      )}>
        {icon}
      </div>
      <h3 className={cx("font-medium text-lg", styles.isDark ? 'text-gray-200' : '')}>
        {title}
      </h3>
      <p className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-600')}>
        {description}
      </p>
    </div>
  )
}

interface Question {
  id: number
  content: string
  type: string
  selected: boolean
}

interface QuestionUploaderProps {
  onNextStep: (questions: Question[]) => void
  onCancel: () => void
}

const QuestionUploader = ({ onNextStep, onCancel }: QuestionUploaderProps) => {
  const styles = useThemeStyles();
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(true);
        setQuestions([
          { id: 1, content: "When did the woman put her keys in her purse?", type: "choice", selected: true },
          { id: 2, content: "Which of the following best describes the organization of the passage?", type: "choice", selected: true },
          { id: 3, content: "We live in a global village, but this _____ mean that we all behave the same way.", type: "fillInBlank", selected: true },
        ]);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className={cx("text-xl font-bold mb-2", styles.isDark ? 'text-gray-200' : '')}>
          Tải lên file câu hỏi
        </h2>
        <p className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-600')}>
          Hỗ trợ định dạng Word, Excel và file backup
        </p>
      </div>
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
              Hỗ trợ tệp định dạng .docx, .xlsx, .json
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".docx,.xlsx,.json"
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
      {file && !isUploading && (
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
                {(file.size / 1024).toFixed(1)} KB • {uploadSuccess ? 'Đã xử lý thành công' : 'Đang xử lý...'}
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
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {questions.length > 0 && (
            <div className="space-y-3">
              <h3 className={cx("font-medium", styles.isDark ? 'text-gray-200' : 'text-gray-700')}>
                Các câu hỏi được tìm thấy ({questions.length})
              </h3>
              <div className={cx(
                "max-h-72 overflow-y-auto border rounded-lg",
                styles.isDark ? 'border-gray-700' : 'border-gray-200'
              )}>
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className={cx(
                      "p-3 flex items-start gap-3 border-b last:border-b-0",
                      styles.isDark ? 'border-gray-700' : 'border-gray-200'
                    )}
                  >
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={question.selected}
                        onChange={() => {
                          setQuestions(questions.map(q =>
                            q.id === question.id ? { ...q, selected: !q.selected } : q
                          ));
                        }}
                        className={cx(
                          "h-4 w-4 rounded",
                          styles.isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cx(
                        "font-medium mb-1 line-clamp-2",
                        styles.isDark ? 'text-gray-200' : 'text-gray-700'
                      )}>
                        {question.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={cx(
                          "inline-block px-2 py-0.5 text-xs rounded",
                          question.type === 'choice'
                            ? (styles.isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
                            : (styles.isDark ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700')
                        )}>
                          {question.type === 'choice' ? 'Trắc nghiệm' : 'Điền khuyết'}
                        </span>
                        <button className={cx(
                          "text-xs flex items-center gap-1",
                          styles.isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        )}>
                          <Edit className="h-3 w-3" />
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className={styles.outlineButton}
            >
              Hủy
            </Button>
            <Button
              disabled={!uploadSuccess || questions.length === 0}
              onClick={() => onNextStep(questions.filter(q => q.selected))}
              className={cx(
                styles.primaryButton,
                "flex items-center gap-1"
              )}
            >
              Tiến hành
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

type QuestionType =
  | 'single-choice'
  | 'multi-choice'
  | 'fill-blank'
  | 'essay'
  | 'image'
  | 'audio'
  | 'group'
  | 'upload'

const CreateQuestion = () => {
  const styles = useThemeStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [step, setStep] = useState<number>(1);
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const [maPhan, setMaPhan] = useState<string | null>(null);

  // Extract maPhan from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const maPhanParam = searchParams.get('maPhan');
    if (maPhanParam) {
      setMaPhan(maPhanParam);
    }
  }, [location.search]);

  const questionTypes = [
    {
      id: 'single-choice',
      title: 'Trắc nghiệm một đáp án',
      description: 'Câu hỏi có nhiều lựa chọn với 1 đáp án đúng',
      icon: <div className="text-blue-500">A</div>
    },
    {
      id: 'multi-choice',
      title: 'Trắc nghiệm nhiều đáp án',
      description: 'Câu hỏi có nhiều lựa chọn với nhiều đáp án đúng',
      icon: <div className="text-green-500">A+</div>
    },
    {
      id: 'fill-blank',
      title: 'Điền khuyết',
      description: 'Câu hỏi yêu cầu điền từ vào chỗ trống',
      icon: <div className="text-amber-500">_</div>
    },
    {
      id: 'essay',
      title: 'Tự luận',
      description: 'Câu hỏi yêu cầu viết câu trả lời dài',
      icon: <div className="text-purple-500">¶</div>
    },
    {
      id: 'image',
      title: 'Câu hỏi ảnh',
      description: 'Câu hỏi kèm hình ảnh minh họa',
      icon: <div className="text-indigo-500">🖼️</div>
    },
    {
      id: 'audio',
      title: 'Câu hỏi âm thanh',
      description: 'Câu hỏi kèm tệp âm thanh',
      icon: <div className="text-pink-500">🔊</div>
    },
    {
      id: 'group',
      title: 'Câu hỏi nhóm',
      description: 'Nhóm các loại câu hỏi khác nhau',
      icon: <div className="text-teal-500">#</div>
    },
    {
      id: 'upload',
      title: 'Tải lên từ tệp',
      description: 'Tạo nhiều câu hỏi từ file Word, Excel...',
      icon: <Upload className="h-5 w-5 text-orange-500" />
    }
  ];

  const handleNextStep = (questions: Question[]) => {
    setUploadedQuestions(questions);
    setStep(3);
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <h2 className={cx("text-xl font-bold", styles.isDark ? 'text-gray-200' : '')}>Chọn loại câu hỏi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {questionTypes.map((type) => (
              <QuestionTypeCard
                key={type.id}
                icon={type.icon}
                title={type.title}
                description={type.description}
                isSelected={selectedType === type.id}
                onClick={() => {
                  setSelectedType(type.id as QuestionType);
                  if (type.id === 'upload') {
                    navigate('/questions/upload');
                  } else {
                    // Pass maPhan as query parameter if available
                    const queryParam = maPhan ? `?maPhan=${maPhan}` : '';
                    navigate(`/questions/edit/new?type=${type.id}${maPhan ? `&maPhan=${maPhan}` : ''}`);
                  }
                }}
              />
            ))}
          </div>

          {/* Show back button if we came from a chapter */}
          {maPhan && (
            <div className="flex justify-start mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(`/chapter-questions/${maPhan}`)}
                className={styles.outlineButton}
              >
                Quay lại danh sách câu hỏi
              </Button>
            </div>
          )}
        </div>
      );
    } else if (step === 2) {
      return (
        <QuestionUploader
          onNextStep={handleNextStep}
          onCancel={() => {
            setSelectedType(null);
            setStep(1);
          }}
        />
      );
    } else if (step === 3) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={cx("text-xl font-bold", styles.isDark ? 'text-gray-200' : '')}>
              Xem lại câu hỏi ({uploadedQuestions.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              className={cx(
                styles.outlineButton,
                "flex items-center gap-1"
              )}
              onClick={() => setStep(2)}
            >
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          </div>
          <div className={cx(
            "border rounded-lg overflow-hidden",
            styles.isDark ? 'border-gray-700' : 'border-gray-200'
          )}>
            {uploadedQuestions.map((question, index) => (
              <div
                key={question.id}
                className={cx(
                  "p-4 border-b last:border-b-0",
                  styles.isDark ? 'border-gray-700' : 'border-gray-200',
                  styles.isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cx(
                      "inline-flex items-center justify-center h-6 w-6 rounded-full text-sm font-medium",
                      styles.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    )}>
                      {index + 1}
                    </span>
                    <span className={cx(
                      "inline-block px-2 py-0.5 text-xs rounded",
                      question.type === 'choice'
                        ? (styles.isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
                        : (styles.isDark ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700')
                    )}>
                      {question.type === 'choice' ? 'Trắc nghiệm' : 'Điền khuyết'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className={cx(
                      "p-1 rounded hover:bg-opacity-10",
                      styles.isDark ? 'hover:bg-gray-400 text-gray-400' : 'hover:bg-gray-500 text-gray-500'
                    )}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className={cx(
                      "p-1 rounded hover:bg-opacity-10",
                      styles.isDark ? 'hover:bg-red-400 text-red-400' : 'hover:bg-red-500 text-red-500'
                    )}>
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className={cx("font-medium mb-2", styles.isDark ? 'text-gray-200' : 'text-gray-700')}>
                  {question.content}
                </p>
                {question.type === 'choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'].map((answer, i) => (
                      <div
                        key={i}
                        className={cx(
                          "flex items-center gap-2 p-2 rounded-md",
                          i === 0 ? (styles.isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-50') : '',
                          styles.isDark ? 'border border-gray-700' : 'border border-gray-200'
                        )}
                      >
                        {i === 0 && (
                          <Check className={cx("h-4 w-4", styles.isDark ? 'text-green-400' : 'text-green-500')} />
                        )}
                        <span className={cx(
                          i === 0 ? (styles.isDark ? 'text-green-400' : 'text-green-700') :
                                   (styles.isDark ? 'text-gray-300' : 'text-gray-700')
                        )}>
                          {answer}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {question.type === 'fillInBlank' && (
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <div className={cx(
                      "p-2 rounded-md",
                      styles.isDark ? 'bg-green-900 bg-opacity-30 border border-green-800' : 'bg-green-50 border border-green-200'
                    )}>
                      <span className={cx(
                        "font-medium",
                        styles.isDark ? 'text-green-400' : 'text-green-700'
                      )}>
                        Đáp án đúng: doesn't
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedType(null);
                setUploadedQuestions([]);
                setStep(1);
              }}
              className={styles.outlineButton}
            >
              Hủy
            </Button>
            <div className="flex items-center gap-3">
              <span className={cx("text-sm", styles.isDark ? 'text-gray-400' : 'text-gray-500')}>
                Tổng số: {uploadedQuestions.length} câu hỏi
              </span>
              <Button
                className={cx(
                  styles.primaryButton,
                  "flex items-center gap-1"
                )}
              >
                <Check className="h-4 w-4" />
                Lưu vào hệ thống
              </Button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <PageContainer className="p-6">
      <div className={cx(
        "max-w-8xl mx-auto",
        styles.isDark ? 'bg-white-900' : 'bg-white'
      )}>
        <div className={cx(
          "border-b mb-7 pb-5",
          styles.isDark ? 'border-gray-800' : 'border-gray-200'
        )}>
          <h1 className={cx(
            "text-2xl font-bold",
            styles.isDark ? 'text-gray-100' : 'text-gray-900'
          )}>
            Tạo câu hỏi mới
          </h1>
        </div>

        <div className={cx(
          "p-6 rounded-lg",
          styles.isDark ? 'bg-gray-850 shadow-xl' : 'bg-white shadow-sm'
        )}>
          {renderStep()}
        </div>
      </div>
    </PageContainer>
  )
}

export default CreateQuestion
