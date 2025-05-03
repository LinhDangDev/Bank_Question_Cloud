import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, Book, HelpCircle, FileText } from 'lucide-react'

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null)
    } else {
      setExpandedSection(sectionId)
    }
  }

  const toggleFaq = (faqId: number) => {
    if (expandedFaq === faqId) {
      setExpandedFaq(null)
    } else {
      setExpandedFaq(faqId)
    }
  }

  const faqs = [
    {
      id: 1,
      question: 'Làm thế nào để tạo một câu hỏi mới?',
      answer: 'Để tạo câu hỏi mới, bạn cần đăng nhập vào hệ thống, sau đó truy cập vào mục "Câu hỏi" trên thanh điều hướng bên trái. Nhấn vào nút "Tạo câu hỏi" và điền thông tin câu hỏi theo mẫu. Sau khi hoàn thiện, nhấn nút "Lưu" để lưu câu hỏi vào hệ thống.'
    },
    {
      id: 2,
      question: 'Làm thế nào để tạo một đề thi mới?',
      answer: 'Để tạo đề thi mới, bạn cần đăng nhập vào hệ thống, sau đó truy cập vào mục "Đề" trên thanh điều hướng bên trái. Nhấn vào nút "Tạo đề thi mới" và điền thông tin đề thi. Bạn có thể chọn câu hỏi từ ngân hàng câu hỏi hiện có hoặc tạo câu hỏi mới. Sau khi hoàn thiện, nhấn nút "Lưu" để lưu đề thi vào hệ thống.'
    },
    {
      id: 3,
      question: 'Làm thế nào để xuất đề thi ra file PDF?',
      answer: 'Để xuất đề thi ra file PDF, bạn cần truy cập vào mục "Công cụ" trên thanh điều hướng bên trái, chọn "Xuất file PDF". Chọn đề thi bạn muốn xuất từ danh sách, cấu hình các tùy chọn xuất (như bao gồm đáp án, định dạng, v.v.) và nhấn nút "Xuất PDF". File PDF sẽ được tạo và tải xuống tự động.'
    },
    {
      id: 4,
      question: 'Làm thế nào để thêm người dùng mới vào hệ thống?',
      answer: 'Để thêm người dùng mới, bạn cần có quyền quản trị viên. Truy cập vào mục "Quản lý người dùng" trên thanh điều hướng bên trái, nhấn vào nút "Thêm người dùng". Điền thông tin người dùng bao gồm tên, email, vai trò và các thông tin khác. Sau khi hoàn thiện, nhấn nút "Lưu người dùng" để thêm người dùng vào hệ thống.'
    },
    {
      id: 5,
      question: 'Làm thế nào để rút trích câu hỏi từ file tài liệu?',
      answer: 'Để rút trích câu hỏi từ file tài liệu, bạn cần truy cập vào mục "Công cụ" trên thanh điều hướng bên trái, chọn "Rút trích đề thi". Tải lên file tài liệu có chứa câu hỏi (hỗ trợ PDF, DOC, DOCX) và nhấn nút "Rút trích câu hỏi". Hệ thống sẽ phân tích tài liệu và trích xuất các câu hỏi. Bạn có thể xem lại và xác minh các câu hỏi được trích xuất trước khi lưu vào hệ thống.'
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Hướng dẫn sử dụng</h1>

      {/* Search bar */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Tìm kiếm hướng dẫn..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <div className="absolute left-3 top-3.5 text-gray-400">
          <Search size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Nội dung</h2>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => toggleSection('getting-started')}
                className={`w-full text-left py-2 flex items-center text-sm ${
                  expandedSection === 'getting-started' ? 'font-medium text-blue-600' : 'text-gray-600'
                }`}
              >
                <Book size={16} className="mr-2" />
                Bắt đầu sử dụng
              </button>
            </li>
            <li>
              <button
                onClick={() => toggleSection('questions')}
                className={`w-full text-left py-2 flex items-center text-sm ${
                  expandedSection === 'questions' ? 'font-medium text-blue-600' : 'text-gray-600'
                }`}
              >
                <FileText size={16} className="mr-2" />
                Quản lý câu hỏi
              </button>
            </li>
            <li>
              <button
                onClick={() => toggleSection('exams')}
                className={`w-full text-left py-2 flex items-center text-sm ${
                  expandedSection === 'exams' ? 'font-medium text-blue-600' : 'text-gray-600'
                }`}
              >
                <FileText size={16} className="mr-2" />
                Quản lý đề thi
              </button>
            </li>
            <li>
              <button
                onClick={() => toggleSection('tools')}
                className={`w-full text-left py-2 flex items-center text-sm ${
                  expandedSection === 'tools' ? 'font-medium text-blue-600' : 'text-gray-600'
                }`}
              >
                <FileText size={16} className="mr-2" />
                Sử dụng công cụ
              </button>
            </li>
            <li>
              <button
                onClick={() => toggleSection('faqs')}
                className={`w-full text-left py-2 flex items-center text-sm ${
                  expandedSection === 'faqs' ? 'font-medium text-blue-600' : 'text-gray-600'
                }`}
              >
                <HelpCircle size={16} className="mr-2" />
                Câu hỏi thường gặp
              </button>
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {/* Getting Started */}
          {expandedSection === 'getting-started' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Bắt đầu sử dụng</h2>
              <div className="space-y-6 text-gray-700">
                <p>
                  Xin chào và chào mừng bạn đến với hệ thống quản lý câu hỏi và đề thi. Hệ thống này được thiết kế để giúp giảng viên và quản trị viên quản lý câu hỏi, tạo đề thi và phân tích dữ liệu một cách hiệu quả.
                </p>

                <div>
                  <h3 className="text-lg font-medium mb-2">Đăng nhập vào hệ thống</h3>
                  <p className="mb-2">
                    Để bắt đầu sử dụng, bạn cần đăng nhập vào hệ thống với tài khoản được cấp bởi quản trị viên. Các bước thực hiện:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Truy cập vào trang đăng nhập</li>
                    <li>Nhập email và mật khẩu của bạn</li>
                    <li>Nhấn nút "Đăng nhập"</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Giao diện chính</h3>
                  <p className="mb-2">
                    Sau khi đăng nhập, bạn sẽ thấy giao diện chính bao gồm:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Thanh điều hướng bên trái - chứa các tính năng chính</li>
                    <li>Thanh trên cùng - hiển thị thông tin người dùng và thông báo</li>
                    <li>Vùng nội dung chính - hiển thị thông tin tùy theo chức năng đang chọn</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Thay đổi thông tin cá nhân</h3>
                  <p>
                    Bạn có thể cập nhật thông tin cá nhân và mật khẩu bằng cách nhấn vào tên người dùng ở góc trên bên phải và chọn "Cài đặt tài khoản".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Questions Management */}
          {expandedSection === 'questions' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Quản lý câu hỏi</h2>
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-lg font-medium mb-2">Xem danh sách câu hỏi</h3>
                  <p>
                    Truy cập vào mục "Câu hỏi" → "Danh sách câu hỏi" trên thanh điều hướng bên trái để xem tất cả câu hỏi trong hệ thống. Bạn có thể tìm kiếm, lọc và sắp xếp câu hỏi theo nhiều tiêu chí khác nhau.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Tạo câu hỏi mới</h3>
                  <p className="mb-2">
                    Để tạo câu hỏi mới, nhấn vào "Câu hỏi" → "Tạo câu hỏi" trên thanh điều hướng. Trong form tạo câu hỏi, bạn cần điền các thông tin sau:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Nội dung câu hỏi</li>
                    <li>Các lựa chọn trả lời</li>
                    <li>Đáp án đúng</li>
                    <li>Môn học liên quan</li>
                    <li>Mức độ khó</li>
                    <li>Các thẻ gắn kèm (tùy chọn)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Chỉnh sửa và xóa câu hỏi</h3>
                  <p>
                    Từ danh sách câu hỏi, bạn có thể nhấn vào biểu tượng bút chì để chỉnh sửa hoặc biểu tượng thùng rác để xóa câu hỏi. Lưu ý rằng việc xóa câu hỏi là không thể hoàn tác và sẽ ảnh hưởng đến các đề thi đã sử dụng câu hỏi đó.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Nhập câu hỏi từ file</h3>
                  <p>
                    Bạn có thể tải lên nhiều câu hỏi cùng lúc thông qua tính năng "Tải lên câu hỏi". Hệ thống hỗ trợ các định dạng file Excel và CSV theo mẫu quy định.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Exams Management */}
          {expandedSection === 'exams' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Quản lý đề thi</h2>
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-lg font-medium mb-2">Xem danh sách đề thi</h3>
                  <p>
                    Truy cập vào mục "Đề" → "Danh sách đề" trên thanh điều hướng bên trái để xem tất cả đề thi trong hệ thống. Bạn có thể tìm kiếm, lọc và sắp xếp đề thi theo nhiều tiêu chí khác nhau.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Tạo đề thi mới</h3>
                  <p className="mb-2">
                    Để tạo đề thi mới, nhấn vào nút "Tạo đề thi mới" trong trang danh sách đề thi. Bạn cần thực hiện các bước sau:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Nhập thông tin cơ bản của đề thi: tên, môn học, thời gian, mô tả, v.v.</li>
                    <li>Chọn câu hỏi từ ngân hàng câu hỏi hoặc tạo câu hỏi mới</li>
                    <li>Sắp xếp thứ tự câu hỏi</li>
                    <li>Cấu hình các tùy chọn khác như trộn câu hỏi, trộn đáp án</li>
                    <li>Nhấn nút "Lưu đề thi" để hoàn tất</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Xuất đề thi</h3>
                  <p>
                    Bạn có thể xuất đề thi ra file PDF hoặc Word để in ấn. Từ trang chi tiết đề thi, nhấn vào nút "Xuất đề thi" và chọn định dạng file mong muốn.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Tạo nhiều phiên bản đề thi</h3>
                  <p>
                    Hệ thống cho phép tạo nhiều phiên bản khác nhau của cùng một đề thi (ví dụ: đề A, B, C, D) bằng cách trộn thứ tự câu hỏi và đáp án. Từ trang chi tiết đề thi, nhấn vào nút "Tạo phiên bản" và chọn số lượng phiên bản cần tạo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tools */}
          {expandedSection === 'tools' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Sử dụng công cụ</h2>
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-lg font-medium mb-2">Xuất file PDF</h3>
                  <p>
                    Công cụ xuất file PDF cho phép bạn tạo các bản in chất lượng cao của đề thi với nhiều tùy chọn định dạng. Truy cập vào mục "Công cụ" → "Xuất file PDF" trên thanh điều hướng bên trái để sử dụng tính năng này.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Rút trích đề thi</h3>
                  <p className="mb-2">
                    Công cụ rút trích đề thi giúp bạn trích xuất câu hỏi từ các tài liệu có sẵn (PDF, DOC, DOCX). Các bước thực hiện:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Truy cập vào mục "Công cụ" → "Rút trích đề thi"</li>
                    <li>Tải lên tài liệu có chứa câu hỏi</li>
                    <li>Nhấn nút "Rút trích câu hỏi"</li>
                    <li>Xem lại và xác minh các câu hỏi được trích xuất</li>
                    <li>Lưu các câu hỏi vào hệ thống</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Phân tích thống kê</h3>
                  <p>
                    Công cụ phân tích thống kê cung cấp các báo cáo và biểu đồ về việc sử dụng câu hỏi và đề thi trong hệ thống. Truy cập vào mục "Công cụ" → "Phân tích thống kê" để xem các số liệu và biểu đồ phân tích.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FAQs */}
          {expandedSection === 'faqs' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Câu hỏi thường gặp</h2>

              {filteredFaqs.length > 0 ? (
                <div className="space-y-4">
                  {filteredFaqs.map(faq => (
                    <div
                      key={faq.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="font-medium">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp size={18} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-500" />
                        )}
                      </button>

                      {expandedFaq === faq.id && (
                        <div className="px-4 py-3 text-gray-700">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HelpCircle size={48} className="mx-auto text-gray-300 mb-2" />
                  <p>Không tìm thấy câu hỏi nào phù hợp với từ khóa "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Help
