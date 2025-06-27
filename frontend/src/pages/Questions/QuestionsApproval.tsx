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
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
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

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await pendingQuestionApi.getAll(currentPage, 10, statusFilter);
            setQuestions(response.data.items || []);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Lỗi khi tải danh sách câu hỏi');
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

    const handleApprove = async (questionId: string, status: number, note?: string) => {
        try {
            if (status === 1) {
                await pendingQuestionApi.approve(questionId);
                toast.success('Đã duyệt câu hỏi');
            } else {
                await pendingQuestionApi.reject(questionId, note || 'Từ chối không đạt yêu cầu');
                toast.success('Đã từ chối câu hỏi');
            }
            fetchQuestions();
            fetchStatistics();
        } catch (error) {
            console.error('Error approving question:', error);
            toast.error('Lỗi khi xử lý câu hỏi');
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
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-yellow-600">{statistics.choDuyet}</div>
                        <div className="text-sm text-gray-600">Chờ duyệt</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600">{statistics.daDuyet}</div>
                        <div className="text-sm text-gray-600">Đã duyệt</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-red-600">{statistics.tuChoi}</div>
                        <div className="text-sm text-gray-600">Từ chối</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                        </label>
                        <select
                            value={statusFilter ?? ''}
                            onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Tất cả</option>
                            <option value="0">Chờ duyệt</option>
                            <option value="1">Đã duyệt</option>
                            <option value="2">Từ chối</option>
                        </select>
                    </div>

                    <QuestionApprovalOnly>
                        {selectedQuestions.length > 0 && (
                            <button
                                onClick={() => setShowApprovalModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
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
                        Không có câu hỏi nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <QuestionApprovalOnly>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestions.length === questions.filter(q => q.TrangThai === 0).length}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nội dung
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <QuestionApprovalOnly>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </QuestionApprovalOnly>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {questions.map((question) => (
                                    <tr key={question.MaCauHoiChoDuyet}>
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
                                        <td className="px-6 py-4">
                                            <div className="max-h-16 overflow-hidden text-ellipsis">
                                                {question.NoiDung}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {question.Teacher?.Name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(question.TrangThai)}`}>
                                                {getStatusText(question.TrangThai)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(question.NgayTao).toLocaleDateString('vi-VN')}
                                        </td>
                                        <QuestionApprovalOnly>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {question.TrangThai === 0 && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(question.MaCauHoiChoDuyet, 1)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Lý do từ chối:');
                                                                if (reason !== null) {
                                                                    handleApprove(question.MaCauHoiChoDuyet, 2, reason);
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </QuestionApprovalOnly>
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
                                    Ghi chú
                                </label>
                                <textarea
                                    value={approvalData.ghiChu}
                                    onChange={(e) => setApprovalData({...approvalData, ghiChu: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    rows={3}
                                    placeholder="Ghi chú (tùy chọn)"
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
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionsApproval;
