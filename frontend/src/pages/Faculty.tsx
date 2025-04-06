import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from 'lucide-react'

const Faculty = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách khoa</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khoa
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm khoa..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 1, name: 'Khoa Công nghệ thông tin', subjects: 12, teachers: 45 },
          { id: 2, name: 'Khoa Kinh tế', subjects: 15, teachers: 38 },
          { id: 3, name: 'Khoa Ngoại ngữ', subjects: 8, teachers: 32 },
          { id: 4, name: 'Khoa Điện - Điện tử', subjects: 10, teachers: 28 },
          { id: 5, name: 'Khoa Quản trị kinh doanh', subjects: 14, teachers: 42 },
          { id: 6, name: 'Khoa Du lịch', subjects: 9, teachers: 25 },
        ].map((faculty) => (
          <div key={faculty.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{faculty.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Số môn học: {faculty.subjects}</p>
              <p>Số giảng viên: {faculty.teachers}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">Chi tiết</Button>
              <Button variant="outline" size="sm">Sửa</Button>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">Xóa</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Faculty
