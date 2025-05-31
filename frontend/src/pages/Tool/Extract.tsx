"use client"

import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card1"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  FileText,
  HelpCircle,
  Upload
} from "lucide-react"

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [department, setDepartment] = useState("")
  const [saveLocation, setSaveLocation] = useState("C:/Users/User/Documents")
  const [exportSeparateFile, setExportSeparateFile] = useState(true)
  const [isDraft, setIsDraft] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", {
      department,
      selectedFile,
      exportSeparateFile,
      saveLocation,
      isDraft
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-medium">Rút trích đề thi</CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: Form inputs */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="department" className="block font-medium text-gray-700">
                  Chọn Khoa
                </label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Khoa Đại Cương" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="khoa-dai-cuong">Khoa Đại Cương</SelectItem>
                    <SelectItem value="khoa-cntt">Khoa Công Nghệ Thông Tin</SelectItem>
                    <SelectItem value="khoa-kinh-te">Khoa Kinh Tế</SelectItem>
                    <SelectItem value="khoa-dien-tu">Khoa Điện Tử</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="file" className="block font-medium text-gray-700">
                  Nhập mã trên đề thi (tập tin Excel)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    className="col-span-2"
                    onChange={handleFileChange}
                  />
                  <Button variant="outline">Chọn tập tin</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  <span>Nhập trực tiếp</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <HelpCircle size={16} />
                  <span>Trợ giúp</span>
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                <span>Xem tài liệu hướng dẫn trích</span>
              </Button>

              <div className="space-y-3 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export"
                    checked={exportSeparateFile}
                    onCheckedChange={(checked) =>
                      setExportSeparateFile(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="export"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Xuất ra tập tin riêng gửi (*) sau đồng tin hiện Team 7 Exam Suite
                  </label>
                </div>

                <div className="space-y-2 pl-6">
                  <label htmlFor="saveLocation" className="block font-medium text-gray-700 text-sm">
                    Nơi lưu gửi
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={saveLocation}
                      onChange={(e) => setSaveLocation(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline">Thay đổi</Button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDraft"
                    checked={isDraft}
                    onCheckedChange={(checked) =>
                      setIsDraft(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="isDraft"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Rút trích Đề thi
                  </label>
                </div>
              </div>
            </div>

            {/* Right column: Exam statistics and notifications */}
            <div className="bg-gray-50 rounded-lg p-5 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin đề thi</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số câu hỏi đã được:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số câu hỏi không:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số câu bị lỗi:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Thông báo các câu hỏi có khả năng gặp lỗi. Đề nghị kiểm tra lại
                </h3>
                <div className="bg-gray-100 rounded-lg p-5 h-48 flex items-center justify-center">
                  <div className="text-gray-500 italic flex flex-col items-center gap-2">
                    <AlertCircle className="h-6 w-6" />
                    <span>Chưa có thông báo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 px-6 py-4 border-t">
          <Button
            className="ml-auto bg-blue-600 hover:bg-blue-700"
            onClick={handleFormSubmit}
          >
            Bắt đầu rút trích
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Index
