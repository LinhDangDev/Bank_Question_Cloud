import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileUp, Download } from 'lucide-react'

const PDF = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Xuất đề thi PDF</h1>

      <div className="max-w-3xl bg-white rounded-lg shadow p-6">
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Môn học</Label>
              <Input
                id="subject"
                placeholder="Chọn môn học"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="examType">Loại đề thi</Label>
              <select
                id="examType"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>Giữa kỳ</option>
                <option>Cuối kỳ</option>
                <option>Kiểm tra</option>
              </select>
            </div>

            <div>
              <Label htmlFor="time">Thời gian làm bài (phút)</Label>
              <Input
                id="time"
                type="number"
                placeholder="90"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Mẫu đề thi</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6">
                <div className="text-center">
                  <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button variant="outline">
                      Chọn mẫu đề
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Hỗ trợ file DOCX, PDF
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>Cấu trúc đề</Label>
              <div className="mt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="Số câu"
                    className="w-24"
                  />
                  <span>câu</span>
                  <select className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option>Trắc nghiệm</option>
                    <option>Tự luận</option>
                    <option>Điền khuyết</option>
                  </select>
                  <Button variant="outline" size="icon">+</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button">
              Xem trước
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              <Download className="w-4 h-4 mr-2" />
              Xuất PDF
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PDF
