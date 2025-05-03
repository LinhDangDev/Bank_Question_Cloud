import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from 'lucide-react'
import { useThemeStyles, cx } from "../../utils/theme"
import { useNavigate } from 'react-router-dom'

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

      <div className={cx(
        "rounded-lg shadow",
        styles.isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cx(
                "border-b",
                styles.isDark ? 'border-gray-700' : 'border-gray-200'
              )}>
                <th className={cx(
                  "px-6 py-3 text-left text-sm font-medium",
                  styles.isDark ? 'text-gray-400' : 'text-gray-500'
                )}>ID</th>
                <th className={cx(
                  "px-6 py-3 text-left text-sm font-medium",
                  styles.isDark ? 'text-gray-400' : 'text-gray-500'
                )}>Câu hỏi</th>
                <th className={cx(
                  "px-6 py-3 text-left text-sm font-medium",
                  styles.isDark ? 'text-gray-400' : 'text-gray-500'
                )}>Loại</th>
                <th className={cx(
                  "px-6 py-3 text-left text-sm font-medium",
                  styles.isDark ? 'text-gray-400' : 'text-gray-500'
                )}>Môn học</th>
                <th className={cx(
                  "px-6 py-3 text-left text-sm font-medium",
                  styles.isDark ? 'text-gray-400' : 'text-gray-500'
                )}>Ngày tạo</th>
                <th className={cx(
                  "px-6 py-3 text-left text-sm font-medium",
                  styles.isDark ? 'text-gray-400' : 'text-gray-500'
                )}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((item) => (
                <tr key={item} className={cx(
                  "border-b",
                  styles.isDark ? 'border-gray-700' : 'border-gray-200'
                )}>
                  <td className={cx(
                    "px-6 py-4 text-sm",
                    styles.isDark ? 'text-gray-300' : ''
                  )}>Q{item}</td>
                  <td className={cx(
                    "px-6 py-4 text-sm",
                    styles.isDark ? 'text-gray-300' : ''
                  )}>Câu hỏi mẫu {item}</td>
                  <td className={cx(
                    "px-6 py-4 text-sm",
                    styles.isDark ? 'text-gray-300' : ''
                  )}>
                    <span className={cx(
                      "inline-block px-2 py-0.5 text-xs rounded",
                      styles.isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    )}>
                      Trắc nghiệm
                    </span>
                  </td>
                  <td className={cx(
                    "px-6 py-4 text-sm",
                    styles.isDark ? 'text-gray-300' : ''
                  )}>Toán</td>
                  <td className={cx(
                    "px-6 py-4 text-sm",
                    styles.isDark ? 'text-gray-300' : ''
                  )}>01/01/2024</td>
                  <td className={cx(
                    "px-6 py-4 text-sm",
                    styles.isDark ? 'text-gray-300' : ''
                  )}>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={styles.outlineButton}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cx(
                          styles.isDark
                            ? 'text-red-400 hover:text-red-300 border-red-800 hover:bg-red-900 hover:bg-opacity-30'
                            : 'text-red-500 hover:text-red-600 border-red-300 hover:bg-red-50'
                        )}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Questions
