import { useState } from 'react'
import { Search, Filter, Plus, FileText, Download, Edit, Trash2 } from 'lucide-react'

const Exams = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')

  // Mock data - would be replaced with API data
  const exams = [
    { id: 1, title: 'Đề thi cuối kỳ Lập trình Web HK1 2022-2023', subject: 'Lập trình Web', semester: 'HK1 2022-2023', questionCount: 40, createdBy: 'Nguyễn Văn A', createdAt: '10/12/2022' },
    { id: 2, title: 'Đề thi giữa kỳ Mạng máy tính HK2 2022-2023', subject: 'Mạng máy tính', semester: 'HK2 2022-2023', questionCount: 30, createdBy: 'Trần Thị B', createdAt: '15/03/2023' },
    { id: 3, title: 'Đề thi cuối kỳ Hệ điều hành HK1 2023-2024', subject: 'Hệ điều hành', semester: 'HK1 2023-2024', questionCount: 35, createdBy: 'Lê Văn C', createdAt: '20/12/2023' },
    { id: 4, title: 'Đề thi giữa kỳ Cơ sở dữ liệu HK1 2023-2024', subject: 'Cơ sở dữ liệu', semester: 'HK1 2023-2024', questionCount: 25, createdBy: 'Phạm Thị D', createdAt: '25/10/2023' },
  ]

  const subjects = ['Tất cả', 'Lập trình Web', 'Mạng máy tính', 'Hệ điều hành', 'Cơ sở dữ liệu']
  const semesters = ['Tất cả', 'HK1 2022-2023', 'HK2 2022-2023', 'HK1 2023-2024', 'HK2 2023-2024']

  const filteredExams = exams.filter(exam => {
    const matchesQuery = exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === '' || selectedSubject === 'Tất cả' || exam.subject === selectedSubject
    const matchesSemester = selectedSemester === '' || selectedSemester === 'Tất cả' || exam.semester === selectedSemester

    return matchesQuery && matchesSubject && matchesSemester
  })

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách đề thi</h1>
        <button className="mt-4 sm:mt-0 flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} className="mr-2" />
          Tạo đề thi mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm đề thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </div>
          </div>

          {/* Subject filter */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
            >
              <option value="">Chọn môn học</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Filter size={18} />
            </div>
          </div>

          {/* Semester filter */}
          <div className="relative">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
            >
              <option value="">Chọn học kỳ</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Filter size={18} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Tên đề thi</th>
                <th className="py-3 px-6 text-left">Môn học</th>
                <th className="py-3 px-6 text-left">Học kỳ</th>
                <th className="py-3 px-6 text-center">Số câu hỏi</th>
                <th className="py-3 px-6 text-center">Ngày tạo</th>
                <th className="py-3 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {filteredExams.length > 0 ? (
                filteredExams.map(exam => (
                  <tr key={exam.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <FileText size={16} className="mr-2 text-blue-500" />
                        <span>{exam.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">{exam.subject}</td>
                    <td className="py-3 px-6 text-left">{exam.semester}</td>
                    <td className="py-3 px-6 text-center">{exam.questionCount}</td>
                    <td className="py-3 px-6 text-center">{exam.createdAt}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button className="transform hover:text-blue-500 hover:scale-110 transition-all p-1">
                          <Download size={18} />
                        </button>
                        <button className="transform hover:text-yellow-500 hover:scale-110 transition-all p-1 ml-2">
                          <Edit size={18} />
                        </button>
                        <button className="transform hover:text-red-500 hover:scale-110 transition-all p-1 ml-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 px-6 text-center">
                    Không tìm thấy đề thi nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Exams
