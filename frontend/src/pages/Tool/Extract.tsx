import { useState } from 'react'
import { Upload, FileText, Download, RefreshCw, Trash2, AlertTriangle, Check } from 'lucide-react'

const Extract = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) {
      return
    }

    // Check file type
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
      setError('Định dạng file không được hỗ trợ. Vui lòng sử dụng PDF, DOC hoặc DOCX.')
      e.target.value = ''
      return
    }

    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Kích thước file quá lớn. Vui lòng tải lên file dưới 10MB.')
      e.target.value = ''
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = () => {
    if (!file) return

    setIsProcessing(true)
    setProgressPercent(0)
    setExtractedQuestions([])

    // Mock extraction process with progress updates
    const interval = setInterval(() => {
      setProgressPercent(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10) + 1
        if (newProgress >= 100) {
          clearInterval(interval)

          // Mock extracted questions
          setTimeout(() => {
            const mockQuestions = [
              {
                id: 1,
                text: 'Mô hình OSI có bao nhiêu tầng?',
                options: ['5 tầng', '6 tầng', '7 tầng', '8 tầng'],
                answer: 2, // index of correct answer
                verified: true
              },
              {
                id: 2,
                text: 'Ngôn ngữ lập trình nào được sử dụng phổ biến nhất trong phát triển web?',
                options: ['Java', 'JavaScript', 'Python', 'C#'],
                answer: 1,
                verified: true
              },
              {
                id: 3,
                text: 'Khái niệm "Đóng gói" trong lập trình hướng đối tượng có nghĩa là gì?',
                options: [
                  'Khả năng một đối tượng có thể thực hiện nhiều hành vi khác nhau',
                  'Khả năng ẩn thông tin và chi tiết triển khai bên trong đối tượng',
                  'Khả năng một lớp có thể kế thừa từ lớp khác',
                  'Khả năng tạo ra nhiều đối tượng từ một lớp'
                ],
                answer: 1,
                verified: false
              },
              {
                id: 4,
                text: 'Hệ quản trị cơ sở dữ liệu nào sau đây là hệ quản trị cơ sở dữ liệu quan hệ?',
                options: ['MongoDB', 'Cassandra', 'MySQL', 'Redis'],
                answer: 2,
                verified: false
              },
              {
                id: 5,
                text: 'Thuật toán sắp xếp nào có độ phức tạp trung bình là O(n log n)?',
                options: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'],
                answer: 1,
                verified: false
              }
            ]

            setExtractedQuestions(mockQuestions)
            setIsProcessing(false)
          }, 500)

          return 100
        }
        return newProgress
      })
    }, 200)
  }

  const handleReset = () => {
    setFile(null)
    setExtractedQuestions([])
    setError(null)
    setProgressPercent(0)
  }

  const toggleVerified = (id: number) => {
    setExtractedQuestions(prev =>
      prev.map(q => q.id === id ? {...q, verified: !q.verified} : q)
    )
  }

  const handleSaveQuestions = () => {
    const verifiedQuestions = extractedQuestions.filter(q => q.verified)
    console.log('Saving questions:', verifiedQuestions)

    // Simulate API call
    alert(`Đã lưu ${verifiedQuestions.length} câu hỏi vào hệ thống`)
  }

  const handleSaveAsDraft = () => {
    console.log('Saving as draft:', extractedQuestions)

    // Simulate API call
    alert('Đã lưu bản nháp thành công')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Rút trích câu hỏi từ đề thi</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tải lên tài liệu</h2>

          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Nhấp để tải lên hoặc kéo và thả
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, DOC, DOCX tối đa 10MB
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {isProcessing ? (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Đang xử lý... {progressPercent}%
                  </p>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpload}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                    disabled={!!error}
                  >
                    <RefreshCw size={18} className="mr-2" />
                    Rút trích câu hỏi
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Hướng dẫn:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Hệ thống hỗ trợ các định dạng: PDF, DOC, DOCX</li>
              <li>Kích thước file tối đa: 10MB</li>
              <li>Định dạng câu hỏi được hỗ trợ: câu hỏi trắc nghiệm</li>
              <li>Tài liệu nên có cấu trúc rõ ràng để tăng độ chính xác</li>
            </ul>
          </div>
        </div>

        {/* Results section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Kết quả rút trích</h2>
            <div className="text-sm text-gray-500">
              {extractedQuestions.length > 0 ? (
                <span>{extractedQuestions.filter(q => q.verified).length}/{extractedQuestions.length} câu hỏi đã xác minh</span>
              ) : (
                <span>Chưa có câu hỏi nào</span>
              )}
            </div>
          </div>

          {extractedQuestions.length > 0 ? (
            <div className="space-y-6">
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                {extractedQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`border rounded-lg p-4 ${
                      question.verified ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">Câu hỏi {index + 1}</h3>
                      <button
                        onClick={() => toggleVerified(question.id)}
                        className={`${
                          question.verified
                            ? 'text-green-600 hover:text-green-800'
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                      >
                        <Check size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-gray-700">{question.text}</p>

                    <div className="mt-3 space-y-2">
                      {question.options.map((option: string, i: number) => (
                        <div
                          key={i}
                          className={`flex items-start p-2 rounded-md ${
                            i === question.answer
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 mr-2 rounded-full flex items-center justify-center border ${
                            i === question.answer
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-400'
                          }`}>
                            <span className="text-xs">{String.fromCharCode(65 + i)}</span>
                          </div>
                          <p className="text-sm">{option}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={handleSaveAsDraft}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <Download size={18} className="mr-2" />
                  Lưu bản nháp
                </button>
                <button
                  onClick={handleSaveQuestions}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  disabled={extractedQuestions.filter(q => q.verified).length === 0}
                >
                  <Check size={18} className="mr-2" />
                  Lưu vào hệ thống
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2">
                {isProcessing
                  ? 'Đang xử lý tài liệu...'
                  : 'Tải lên tài liệu để rút trích câu hỏi'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Extract
