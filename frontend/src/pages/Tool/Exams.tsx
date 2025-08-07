import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, FileText, Download, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { examApi, cauHoiApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const Exams = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [loading, setLoading] = useState(false)
  const [approvedExams, setApprovedExams] = useState<any[]>([])
  const [pendingExams, setPendingExams] = useState<any[]>([])
  const [examQuestionsMap, setExamQuestionsMap] = useState<Record<string, any[]>>({})
  const [expandedExams, setExpandedExams] = useState<string[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({})

  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const fetchExams = async () => {
    try {
      setLoading(true)
      console.log('Fetching exams... Time:', new Date().toISOString());

      // Fetch all exams in one call for better performance
      const response = await examApi.getAllExams();
      console.log('All exams response:', response);

      let allExams: any[] = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          allExams = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          allExams = response.data.items;
        }
      }

      // Properly separate approved and pending exams based on DaDuyet property
      const approved = allExams.filter(exam => exam.DaDuyet === true);
      const pending = allExams.filter(exam => exam.DaDuyet !== true);

      console.log('Approved exams:', approved.length, 'Pending exams:', pending.length);

      // Only show toast notification once and only when we actually have exams
      if (allExams.length > 0) {
        toast.success(`Đã tải ${allExams.length} đề thi`, {
          toastId: 'exams-loaded', // Prevent duplicate toasts
        });
      } else if (!loading) { // Only show this message if we're not in initial loading state
        toast.info('Không tìm thấy đề thi nào', {
          toastId: 'no-exams-found',
        });
      }

      setApprovedExams(approved)
      setPendingExams(pending)
      setSelectedExams([]) // Reset selected exams
      setExpandedExams([]) // Reset expanded exams
      setExamQuestionsMap({}) // Reset questions

    } catch (error: any) {
      console.error('Error fetching exams:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Không thể tải danh sách đề thi: ${error.message || 'Lỗi không xác định'}`, {
        toastId: 'exams-error',
      });
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

  const fetchExamQuestions = async (examId: string) => {
    // Skip if already loaded
    if (examQuestionsMap[examId] && examQuestionsMap[examId].length > 0) {
      return;
    }

    try {
      setLoadingQuestions(prev => ({ ...prev, [examId]: true }));

      // Fetch exam details (question list)
      const examDetailsResponse = await examApi.getExamDetails(examId);
      const examDetails = examDetailsResponse.data;

      if (!examDetails || !examDetails.length) {
        setExamQuestionsMap(prev => ({ ...prev, [examId]: [] }));
        return;
      }

      // Fetch full details for each question including answers
      const questionsWithDetails = await Promise.all(
        examDetails.map(async (detail: any) => {
          try {
            const questionResponse = await cauHoiApi.getWithAnswers(detail.MaCauHoi);
            return questionResponse.data;
          } catch (error) {
            console.error(`Error fetching question ${detail.MaCauHoi}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and set the questions
      const validQuestions = questionsWithDetails.filter(q => q !== null);
      setExamQuestionsMap(prev => ({ ...prev, [examId]: validQuestions }));

    } catch (error) {
      console.error('Error fetching exam questions:', error);
      toast.error('Không thể tải câu hỏi cho đề thi này');
    } finally {
      setLoadingQuestions(prev => ({ ...prev, [examId]: false }));
    }
  };

  const toggleExamExpand = (examId: string) => {
    if (expandedExams.includes(examId)) {
      setExpandedExams(expandedExams.filter(id => id !== examId));
    } else {
      setExpandedExams([...expandedExams, examId]);
      fetchExamQuestions(examId);
    }
  };

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

  const toggleExamSelection = (examId: string) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId))
    } else {
      setSelectedExams([...selectedExams, examId])
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedExams.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một đề thi để xóa')
      return
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedExams.length} đề thi đã chọn không?`)) {
      try {
        let successCount = 0
        let errorCount = 0

        // Xóa từng đề thi đã chọn
        for (const examId of selectedExams) {
          try {
            await examApi.deleteExam(examId)
            successCount++
          } catch (error) {
            console.error(`Error deleting exam ${examId}:`, error)
            errorCount++
          }
        }

        // Thông báo kết quả
        if (successCount > 0) {
          toast.success(`Xóa thành công ${successCount} đề thi`)
        }
        if (errorCount > 0) {
          toast.error(`Không thể xóa ${errorCount} đề thi`)
        }

        // Làm mới danh sách và xóa selection
        fetchExams()
        setSelectedExams([])
      } catch (error) {
        console.error('Error in bulk delete:', error)
        toast.error('Có lỗi xảy ra khi xóa đề thi')
      }
    }
  }

  const renderQuestionContent = (question: any) => {
    if (!question) return null;

    // Get CLO information
    const cloInfo = question.CLO ? (
      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-2 mb-2">
        CLO: {question.CLO}
      </div>
    ) : null;

    // Get correct answers
    const correctAnswers = question.CauTraLoi
      ? question.CauTraLoi
          .filter((answer: any) => answer.Dung)
          .map((answer: any) => (
            <div key={answer.MaCauTraLoi} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block mr-2 mb-2">
              Đáp án đúng: {answer.NoiDung}
            </div>
          ))
      : null;

    return (
      <div className="bg-gray-50 p-3 my-1 rounded-md border border-gray-200">
        <div className="flex items-start gap-2 mb-2">
          <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
            {question.LoaiCauHoi || "SINGLE_CHOICE"}
          </div>
          {cloInfo}
        </div>

        <div className="mb-2 text-sm" dangerouslySetInnerHTML={{ __html: question.NoiDung || "" }} />

        {question.CauTraLoi && question.CauTraLoi.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Các lựa chọn:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.CauTraLoi.map((answer: any) => (
                <div
                  key={answer.MaCauTraLoi}
                  className={`text-xs p-2 rounded border ${answer.Dung ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  {answer.NoiDung}
                </div>
              ))}
            </div>
          </div>
        )}

        {correctAnswers && correctAnswers.length > 0 && (
          <div className="mt-2 flex flex-wrap">
            {correctAnswers}
          </div>
        )}
      </div>
    );
  };

  const renderExamTable = (exams: any, isApproved = false) => {
    const filteredExams = filterExams(exams)

    return (
      <div className="overflow-x-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Tìm thấy {filteredExams.length} đề thi</span>
          </div>
          {selectedExams.length > 0 && isAdmin && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              <Trash2 size={16} className="mr-2" />
              Xóa {selectedExams.length} đề thi đã chọn
            </button>
          )}
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              {isAdmin && (
                <th className="py-3 px-3 text-center w-10">
                  <span className="sr-only">Chọn</span>
                </th>
              )}
              <th className="py-3 px-6 text-left">Tên đề thi</th>
              <th className="py-3 px-6 text-left">Môn học</th>
              <th className="py-3 px-6 text-center">Số câu hỏi</th>
              <th className="py-3 px-6 text-center">Trạng thái</th>
              <th className="py-3 px-6 text-center">Cấu trúc</th>
              <th className="py-3 px-6 text-center">Ngày tạo</th>
              <th className="py-3 px-6 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-4 px-6 text-center">
                  Đang tải...
                </td>
              </tr>
            ) : filteredExams.length > 0 ? (
              filteredExams.map((exam: any) => (
                <React.Fragment key={exam.MaDeThi}>
                  <tr className={`border-b border-gray-200 hover:bg-gray-50 ${expandedExams.includes(exam.MaDeThi) ? 'bg-gray-50' : ''}`}>
                    {isAdmin && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedExams.includes(exam.MaDeThi)}
                          onChange={() => toggleExamSelection(exam.MaDeThi)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleExamExpand(exam.MaDeThi)}
                          className="mr-2 text-gray-500 hover:text-gray-700"
                        >
                          {expandedExams.includes(exam.MaDeThi) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                        <FileText size={16} className="mr-2 text-blue-500" />
                        <span>{exam.TenDeThi}</span>
                        {!exam.ChiTietDeThi && (
                          <AlertCircle size={14} className="ml-2 text-amber-500" />
                        )}
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
                      {exam.LoaiBoChuongPhan ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Không phân cấp
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Phân cấp
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
                  {expandedExams.includes(exam.MaDeThi) && (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="bg-gray-50 p-0">
                        <div className="p-4">
                          <div className="mb-2 flex items-center">
                            <List size={16} className="mr-2 text-gray-600" />
                            <h3 className="font-medium">Danh sách câu hỏi</h3>
                          </div>

                          {loadingQuestions[exam.MaDeThi] ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                              <p className="mt-2 text-sm text-gray-500">Đang tải câu hỏi...</p>
                            </div>
                          ) : examQuestionsMap[exam.MaDeThi]?.length > 0 ? (
                            <div className="space-y-4">
                              {examQuestionsMap[exam.MaDeThi].map((question: any, index: number) => (
                                <div key={question.MaCauHoi} className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                                    <div className="font-medium">Câu {index + 1}</div>
                                  </div>
                                  <div className="p-4">
                                    {renderQuestionContent(question)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              Không tìm thấy câu hỏi nào cho đề thi này
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-4 px-6 text-center">
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
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={fetchExams}
            className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={handleCreateExam}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} className="mr-2" />
              Tạo đề thi mới
            </button>
          )}
        </div>
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
          {/* <div className="relative">
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
          </div> */}

          {/* Semester filter */}
          {/* <div className="relative">
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
          </div> */}
        </div>

        <Tabs defaultValue="pending" className="w-full" onValueChange={() => setSelectedExams([])}>
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
