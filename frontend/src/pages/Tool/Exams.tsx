import { useState, useEffect } from 'react'
import { Search, Filter, Plus, FileText, Download, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { examApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const Exams = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [loading, setLoading] = useState(false)
  const [approvedExams, setApprovedExams] = useState([])
  const [pendingExams, setPendingExams] = useState([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const subjects = ['Tất cả', 'Lập trình Web', 'Mạng máy tính', 'Hệ điều hành', 'Cơ sở dữ liệu']
  const semesters = ['Tất cả', 'HK1 2022-2023', 'HK2 2022-2023', 'HK1 2023-2024', 'HK2 2023-2024']

  const fetchExams = async () => {
    try {
      setLoading(true)
      console.log('Fetching exams...');

      // Fetch all exams and filter them on the frontend
      const response = await examApi.getAll();

      console.log('All exams response:', response);

      const allExams = response.data?.items || response.data || [];

      console.log('All exams data:', allExams);

      // Filter exams by approval status
      const approved = allExams.filter((exam: any) => exam.DaDuyet === true);
      const pending = allExams.filter((exam: any) => exam.DaDuyet === false);

      console.log('Filtered - Approved:', approved.length, 'Pending:', pending.length);

      setApprovedExams(approved)
      setPendingExams(pending)

    } catch (error: any) {
      console.error('Error fetching exams:', error)
      toast.error('Không thể tải danh sách đề thi')
      // Set empty arrays to avoid undefined errors
      setApprovedExams([])
      setPendingExams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const filterExams = (exams: any) => {
    return exams.filter((exam: any) => {
      const matchesQuery = exam.TenDeThi?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = selectedSubject === '' || selectedSubject === 'Tất cả' || exam.MonHoc?.TenMonHoc === selectedSubject
      // Implement semester filtering when available in the API
      //const matchesSemester = selectedSemester === '' || selectedSemester === 'Tất cả' || exam.semester === selectedSemester
      return matchesQuery && matchesSubject // && matchesSemester
    })
  }

  const handleViewExam = (examId: any) => {
    navigate(`/exams/${examId}`)
  }

  const handleEditExam = (examId: any) => {
    navigate(`/exams/edit/${examId}`)
  }

  const handleDeleteExam = async (examId: any) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này không?')) {
      try {
        await examApi.deleteExam(examId)
        toast.success('Xóa đề thi thành công')
        fetchExams()
      } catch (error) {
        console.error('Error deleting exam:', error)
        toast.error('Không thể xóa đề thi')
      }
    }
  }

  const handleApproveExam = async (examId: any) => {
    try {
      await examApi.approveExam(examId)
      toast.success('Duyệt đề thi thành công')
      fetchExams()
    } catch (error) {
      console.error('Error approving exam:', error)
      toast.error('Không thể duyệt đề thi')
    }
  }

  const handleCreateExam = () => {
    navigate('/extract')
  }

  const renderExamTable = (exams: any, isApproved = false) => {
    const filteredExams = filterExams(exams)

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Tên đề thi</th>
              <th className="py-3 px-6 text-left">Môn học</th>
              <th className="py-3 px-6 text-center">Số câu hỏi</th>
              <th className="py-3 px-6 text-center">Trạng thái</th>
              <th className="py-3 px-6 text-center">Ngày tạo</th>
              <th className="py-3 px-6 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-4 px-6 text-center">
                  Đang tải...
                </td>
              </tr>
            ) : filteredExams.length > 0 ? (
              filteredExams.map((exam: any)  => (
                <tr key={exam.MaDeThi} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">
                    <div className="flex items-center">
                      <FileText size={16} className="mr-2 text-blue-500" />
                      <span>{exam.TenDeThi}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-left">{exam.MonHoc?.TenMonHoc || '-'}</td>
                  <td className="py-3 px-6 text-center">{exam.SoCauHoi || 0}</td>
                  <td className="py-3 px-6 text-center">
                    {exam.DaDuyet ? (
                      <span className="flex items-center justify-center text-green-500">
                        <CheckCircle size={16} className="mr-1" /> Đã duyệt
                      </span>
                    ) : (
                      <span className="flex items-center justify-center text-yellow-500">
                        <XCircle size={16} className="mr-1" /> Chưa duyệt
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {new Date(exam.NgayTao).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleViewExam(exam.MaDeThi)}
                        className="transform hover:text-blue-500 hover:scale-110 transition-all p-1"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          examApi.downloadExam(exam.MaDeThi, 'pdf')
                            .then(response => {
                              const url = window.URL.createObjectURL(new Blob([response.data]));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `exam-${exam.MaDeThi}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                            })
                            .catch(error => {
                              console.error('Error downloading exam:', error);
                              toast.error('Không thể tải xuống đề thi');
                            });
                        }}
                        className="transform hover:text-green-500 hover:scale-110 transition-all p-1 ml-2"
                        title="Tải xuống"
                      >
                        <Download size={18} />
                      </button>
                      {!isApproved && isAdmin && (
                        <>
                          <button
                            onClick={() => handleEditExam(exam.MaDeThi)}
                            className="transform hover:text-yellow-500 hover:scale-110 transition-all p-1 ml-2"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleApproveExam(exam.MaDeThi)}
                            className="transform hover:text-green-500 hover:scale-110 transition-all p-1 ml-2"
                            title="Duyệt"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.MaDeThi)}
                            className="transform hover:text-red-500 hover:scale-110 transition-all p-1 ml-2"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
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
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách đề thi</h1>
        {isAdmin && (
          <button
            onClick={handleCreateExam}
            className="mt-4 sm:mt-0 flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} className="mr-2" />
            Tạo đề thi mới
          </button>
        )}
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

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Chưa duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {renderExamTable(pendingExams, false)}
          </TabsContent>

          <TabsContent value="approved">
            {renderExamTable(approvedExams, true)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Exams
