import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { useThemeStyles, cx } from "../../utils/theme"
import { useNavigate } from 'react-router-dom'

const sampleQuestions = [
  {
    id: 760633,
    content: "Câu hỏi này là gì\n1. dfsf",
    answers: [
      { label: 'A', text: 'fdsfs', correct: true },
      { label: 'B', text: 'sfsd' },
      { label: 'C', text: 'sdf' },
      { label: 'D', text: 'sdf' },
    ],
    type: 'CL01',
    status: 'Đã xoá',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 21:53:36',
    code: 760632,
  },
  {
    id: 760631,
    content: "Đánh giá tác động của mạng xã hội đối với giới trẻ hiện nay.",
    type: 'CLO2',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:33',
    code: 760631,
  },
  {
    id: 760630,
    content: "Vận dụng kiến thức về điện từ, giải thích cách hoạt động của một chiếc máy biến áp.",
    type: 'CLO3',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:33',
    code: 760630,
  },
  {
    id: 760629,
    content: "Giải thích nguyên nhân gây ra hiện tượng hiệu ứng nhà kính.",
    type: 'CLO4',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:33',
    code: 760629,
  },
  {
    id: 760613,
    content: "Nguyên nhân chính nào dẫn đến sự sụp đổ của Đế quốc La Mã?",
    answers: [
      { label: 'A', text: 'Sự trỗi dậy của Đế quốc Ottoman' },
      { label: 'B', text: 'Sự suy thoái kinh tế và bất ổn chính trị', correct: true },
      { label: 'C', text: 'Các cuộc xâm lược của người Viking' },
      { label: 'D', text: 'Sự lan rộng của Kitô giáo' },
    ],
    type: 'CLO5',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:32',
    code: 760613,
  },
]

const typeColors: Record<string, string> = {
  'CLO1': 'bg-green-100 text-green-700',
  'CLO2': 'bg-blue-100 text-blue-700',
  'CLO3': 'bg-purple-100 text-purple-700',
  'CLO4': 'bg-orange-100 text-orange-700',
  'CLO5': 'bg-orange-100 text-orange-700'
}


const statusColors: Record<string, string> = {
  'Hoạt động': 'text-green-600',
  'Đã xoá': 'text-red-500',
}

const Questions = () => {
  const styles = useThemeStyles();
  const navigate = useNavigate();

  return (
    <div className="p-6">
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

      <div className="space-y-6">
        {sampleQuestions.map((q, idx) => (
          <div
            key={q.id}
            className={cx(
              "rounded-lg shadow flex flex-col md:flex-row justify-between gap-4 p-6 border",
              styles.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-base">{q.content}</span>
                {q.type && (
                  <span className={cx(
                    "ml-2 px-2 py-0.5 rounded text-xs font-medium",
                    typeColors[q.type] || 'bg-gray-100 text-gray-700'
                  )}>{q.type}</span>
                )}
                {q.status && (
                  <span className={cx(
                    "ml-2 px-2 py-0.5 rounded text-xs font-medium border",
                    q.status === 'Hoạt động' ? 'border-green-200' : 'border-red-200',
                    statusColors[q.status]
                  )}>{q.status}</span>
                )}
              </div>
              {q.answers && (
                <ul className="mb-2 ml-4">
                  {q.answers.map((a) => (
                    <li key={a.label} className="flex items-center gap-2 mb-1">
                      <span className={cx(
                        "w-6 h-6 flex items-center justify-center rounded-full border font-bold",
                        a.correct
                          ? 'bg-green-500 text-white border-green-500'
                          : styles.isDark
                            ? 'bg-gray-700 text-gray-200 border-gray-600'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                      )}>{a.label}</span>
                      <span className={a.correct ? 'font-semibold text-green-700' : ''}>{a.text}</span>
                    </li>
                  ))}
                </ul>
              )}
              {q.answers && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 text-green-700 border-green-300 hover:bg-green-50"
                >
                  Thêm câu hỏi con <span className="ml-1 font-bold text-lg">+</span>
                </Button>
              )}
            </div>
            <div className="flex flex-col items-end min-w-[220px] gap-2">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" className={styles.outlineButton}><Eye className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" className={styles.outlineButton} onClick={() => navigate(`/questions/edit/${q.id}`)}><Edit className="w-4 h-4" /></Button>
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
                  <span className="font-medium">{q.status === 'Đã xoá' ? 'Đã xoá' : 'Hoạt động'}</span>
                </div>
                <div className="text-gray-500">Tạo bởi <span className="font-semibold">{q.createdBy}</span></div>
                <div className="text-gray-500">{q.createdAt}</div>
                <div className="text-gray-500">Mã câu hỏi: <span className="font-semibold">{q.code}</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Questions
