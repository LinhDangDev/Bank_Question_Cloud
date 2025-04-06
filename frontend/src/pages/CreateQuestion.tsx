import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CreateQuestion = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tạo câu hỏi mới</h1>

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
              <Label htmlFor="type">Loại câu hỏi</Label>
              <select
                id="type"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>Trắc nghiệm</option>
                <option>Tự luận</option>
                <option>Điền khuyết</option>
              </select>
            </div>

            <div>
              <Label htmlFor="question">Nội dung câu hỏi</Label>
              <textarea
                id="question"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập nội dung câu hỏi..."
              />
            </div>

            <div>
              <Label>Đáp án</Label>
              <div className="mt-2 space-y-2">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`option${option}`}
                      name="answer"
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`option${option}`} className="flex-1">
                      <Input
                        placeholder={`Đáp án ${option}`}
                      />
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="explanation">Giải thích</Label>
              <textarea
                id="explanation"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập giải thích cho đáp án..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button">
              Hủy
            </Button>
            <Button type="submit">
              Lưu câu hỏi
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateQuestion
