import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BlankQuestions = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tạo câu hỏi điền khuyết</h1>

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
              <Label htmlFor="question">Nội dung câu hỏi</Label>
              <div className="mt-1 space-y-2">
                <textarea
                  id="question"
                  rows={4}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập nội dung câu hỏi..."
                />
                <p className="text-sm text-gray-500">
                  Sử dụng [...] để đánh dấu vị trí cần điền. Ví dụ: Hà Nội là [...] của Việt Nam.
                </p>
              </div>
            </div>

            <div>
              <Label>Đáp án</Label>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index}>
                      <Label htmlFor={`blank${index}`} className="text-sm text-gray-500">
                        Khuyết {index}
                      </Label>
                      <Input
                        id={`blank${index}`}
                        placeholder={`Đáp án cho khuyết ${index}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
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

export default BlankQuestions
