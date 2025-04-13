import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from 'lucide-react'

const Questions = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách câu hỏi</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm câu hỏi..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Lọc
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Câu hỏi</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Loại</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Môn học</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((item) => (
                <tr key={item} className="border-b">
                  <td className="px-6 py-4 text-sm">Q{item}</td>
                  <td className="px-6 py-4 text-sm">Câu hỏi mẫu {item}</td>
                  <td className="px-6 py-4 text-sm">Trắc nghiệm</td>
                  <td className="px-6 py-4 text-sm">Toán</td>
                  <td className="px-6 py-4 text-sm">01/01/2024</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Sửa</Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">Xóa</Button>
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
