import React, { useState, useEffect } from 'react';
import { pendingQuestionApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { AdminOnly, QuestionApprovalOnly } from '../../components/PermissionGuard';
import { toast } from 'react-hot-toast';

interface QuestionApproval {
    MaCauHoiChoDuyet: string;
    NoiDung: string;
    TrangThai: number; // 0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối
    NgayTao: string;
    GhiChu?: string;
    Teacher?: {
        UserId: string;
        Name: string;
        Email: string;
    };
    Phan?: {
        MaPhan: string;
        TenPhan: string;
    };
}

interface Statistics {
    total: number;
    choDuyet: number;
    daDuyet: number;
    tuChoi: number;
}

const QuestionsApproval: React.FC = () => {
    const [questions, setQuestions] = useState<QuestionApproval[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(0); // Mặc định hiển thị câu hỏi chờ duyệt
    const [activeTab, setActiveTab] = useState<number>(0); // 0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedQuestionForReject, setSelectedQuestionForReject] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [approvalData, setApprovalData] = useState({
        trangThai: 1,
        ghiChu: '',
        maPhan: ''
    });

    const { isAdmin, canApproveQuestions } = usePermissions();

    useEffect(() => {
        fetchQuestions();
        fetchStatistics();
    }, [currentPage, statusFilter]);

    // Cập nhật statusFilter khi thay đổi activeTab
    useEffect(() => {
        setStatusFilter(activeTab);
        setCurrentPage(1); // Reset về trang 1 khi chuyển tab
        setSelectedQuestions([]); // Xóa các câu hỏi đã chọn khi chuyển tab
    }, [activeTab]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            // Gọi API với tham số trangThai để lọc theo trạng thái
            const response = await pendingQuestionApi.getAll(currentPage, 10, statusFilter);

            if (response.data && response.data.items) {
                setQuestions(response.data.items);
                setTotalPages(response.data.totalPages || 1);
            } else {
                setQuestions([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Lỗi khi tải danh sách câu hỏi');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await pendingQuestionApi.getStatistics();
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleApprove = async (questionId: string) => {
        try {
            await pendingQuestionApi.approve(questionId);
            toast.success('Đã duyệt câu hỏi');
            fetchQuestions();
            fetchStatistics();
        } catch (error) {
            console.error('Error approving question:', error);
            toast.error('Lỗi khi duyệt câu hỏi');
        }
    };

    const handleReject = async () => {
        if (!selectedQuestionForReject || !rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            await pendingQuestionApi.reject(selectedQuestionForReject, rejectReason);
            toast.success('Đã từ chối câu hỏi');
            setShowRejectModal(false);
            setSelectedQuestionForReject(null);
            setRejectReason('');
            fetchQuestions();
            fetchStatistics();
        } catch (error) {
            console.error('Error rejecting question:', error);
            toast.error('Lỗi khi từ chối câu hỏi');
        }
    };

    const handleBulkApproval = async () => {
        if (selectedQuestions.length === 0) {
            toast.error('Vui lòng chọn ít nhất một câu hỏi');
            return;
        }

        try {
            await pendingQuestionApi.bulkProcess(
                selectedQuestions,
                approvalData.trangThai,
                approvalData.ghiChu,
                approvalData.maPhan || undefined
            );

            toast.success('Đã xử lý các câu hỏi được chọn');
            setSelectedQuestions([]);
            setShowApprovalModal(false);
            fetchQuestions();
            fetchStatistics();
        } catch (error) {
            console.error('Error bulk approving questions:', error);
            toast.error('Lỗi khi xử lý hàng loạt');
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return 'Chờ duyệt';
            case 1: return 'Đã duyệt';
            case 2: return 'Từ chối';
            default: return 'Không xác định';
        }
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case 0: return 'text-yellow-600 bg-yellow-100';
            case 1: return 'text-green-600 bg-green-100';
            case 2: return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTabIndicatorClass = (tabIndex: number) => {
        return activeTab === tabIndex
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    };

    const getTabCountClass = (tabIndex: number) => {
        if (!statistics) return 'bg-gray-200 text-gray-600';

        switch (tabIndex) {
            case 0: return 'bg-yellow-100 text-yellow-800';
            case 1: return 'bg-green-100 text-green-800';
            case 2: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-200 text-gray-600';
        }
    };

    const getTabCount = (tabIndex: number) => {
        if (!statistics) return 0;

        switch (tabIndex) {
            case 0: return statistics.choDuyet;
            case 1: return statistics.daDuyet;
            case 2: return statistics.tuChoi;
            default: return 0;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Quản lý câu hỏi chờ duyệt
                </h1>
                <p className="text-gray-600">
                    {isAdmin() ? 'Duyệt câu hỏi từ giáo viên' : 'Xem trạng thái câu hỏi đã gửi'}
                </p>
            </div>

            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                        <div className="text-sm text-gray-600">Tổng số</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow cursor-pointer" onClick={() => setActiveTab(0)}>
                        <div className="text-2xl font-bold text-yellow-600">{statistics.choDuyet}</div>
                        <div className="text-sm text-gray-600">Chờ duyệt</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow cursor-pointer" onClick={() => setActiveTab(1)}>
                        <div className="text-2xl font-bold text-green-600">{statistics.daDuyet}</div>
                        <div className="text-sm text-gray-600">Đã duyệt</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow cursor-pointer" onClick={() => setActiveTab(2)}>
                        <div className="text-2xl font-bold text-red-600">{statistics.tuChoi}</div>
                        <div className="text-sm text-gray-600">Từ chối</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab(0)}
                            className={`pb-4 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabIndicatorClass(0)}`}
                        >
                            <span>Chờ duyệt</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTabCountClass(0)}`}>
                                {getTabCount(0)}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab(1)}
                            className={`pb-4 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabIndicatorClass(1)}`}
                        >
                            <span>Đã duyệt</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTabCountClass(1)}`}>
                                {getTabCount(1)}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab(2)}
                            className={`pb-4 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabIndicatorClass(2)}`}
                        >
                            <span>Từ chối</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTabCountClass(2)}`}>
                                {getTabCount(2)}
                            </span>
                        </button>
                    </nav>
                </div>

                <div className="mt-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {activeTab === 0 ? 'Câu hỏi chờ duyệt' :
                             activeTab === 1 ? 'Câu hỏi đã duyệt' :
                             'Câu hỏi bị từ chối'}
                            {statistics &&
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    (Hiển thị {getTabCount(activeTab)} câu hỏi)
                                </span>
                            }
                        </h2>
                    </div>
                    <QuestionApprovalOnly>
                        {selectedQuestions.length > 0 && activeTab === 0 && (
                            <button
                                onClick={() => setShowApprovalModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Xử lý hàng loạt ({selectedQuestions.length})
                            </button>
                        )}
                    </QuestionApprovalOnly>
                </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {activeTab === 0 ? 'Không có câu hỏi chờ duyệt' :
                         activeTab === 1 ? 'Không có câu hỏi đã duyệt' :
                         'Không có câu hỏi bị từ chối'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {activeTab === 0 && (
                                        <QuestionApprovalOnly>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestions.length === questions.filter(q => q.TrangThai === 0).length && questions.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedQuestions(questions.filter(q => q.TrangThai === 0).map(q => q.MaCauHoiChoDuyet));
                                                        } else {
                                                            setSelectedQuestions([]);
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                            </th>
                                        </QuestionApprovalOnly>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nội dung
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {activeTab !== 0 ? 'Ngày xử lý' : 'Ngày tạo'}
                                    </th>
                                    {activeTab === 2 && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lý do từ chối
                                        </th>
                                    )}
                                    {activeTab === 0 && (
                                        <QuestionApprovalOnly>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hành động
                                            </th>
                                        </QuestionApprovalOnly>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {questions.map((question) => (
                                    <tr key={question.MaCauHoiChoDuyet} className="hover:bg-gray-50">
                                        {activeTab === 0 && (
                                            <QuestionApprovalOnly>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {question.TrangThai === 0 && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedQuestions.includes(question.MaCauHoiChoDuyet)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedQuestions([...selectedQuestions, question.MaCauHoiChoDuyet]);
                                                                } else {
                                                                    setSelectedQuestions(selectedQuestions.filter(id => id !== question.MaCauHoiChoDuyet));
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                    )}
                                                </td>
                                            </QuestionApprovalOnly>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="max-h-16 overflow-hidden text-ellipsis">
                                                {question.NoiDung}
                                            </div>
                                            {question.Phan && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Phần: {question.Phan.TenPhan}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {question.Teacher?.Name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(question.NgayTao).toLocaleDateString('vi-VN')}
                                        </td>
                                        {activeTab === 2 && (
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate">
                                                    {question.GhiChu || 'Không có ghi chú'}
                                                </div>
                                            </td>
                                        )}
                                        {activeTab === 0 && (
                                            <QuestionApprovalOnly>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(question.MaCauHoiChoDuyet)}
                                                            className="flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedQuestionForReject(question.MaCauHoiChoDuyet);
                                                                setShowRejectModal(true);
                                                            }}
                                                            className="flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                </td>
                                            </QuestionApprovalOnly>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 flex justify-between items-center border-t">
                    <div>
                        <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{questions.length}</span> câu hỏi
                        </p>
                    </div>
                    <div className="flex justify-center space-x-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-sm rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                            &laquo;
                        </button>
                        <span className="px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-md">
                            {currentPage}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev))}
                            disabled={currentPage >= totalPages}
                            className={`px-4 py-2 text-sm rounded-md ${currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                            &raquo;
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Approval Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium mb-4">Xử lý hàng loạt</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hành động
                                </label>
                                <select
                                    value={approvalData.trangThai}
                                    onChange={(e) => setApprovalData({...approvalData, trangThai: Number(e.target.value)})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value={1}>Duyệt</option>
                                    <option value={2}>Từ chối</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú {approvalData.trangThai === 2 && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={approvalData.ghiChu}
                                    onChange={(e) => setApprovalData({...approvalData, ghiChu: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    rows={3}
                                    placeholder={approvalData.trangThai === 2 ? "Lý do từ chối (bắt buộc)" : "Ghi chú (tùy chọn)"}
                                    required={approvalData.trangThai === 2}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleBulkApproval}
                                disabled={approvalData.trangThai === 2 && !approvalData.ghiChu.trim()}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${approvalData.trangThai === 2 && !approvalData.ghiChu.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium mb-4">Từ chối câu hỏi</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lý do từ chối <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    rows={3}
                                    placeholder="Nhập lý do từ chối"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedQuestionForReject(null);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${!rejectReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionsApproval;
