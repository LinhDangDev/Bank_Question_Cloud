import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  deThiApi,
  examApi,
  cauHoiApi
} from '@/services/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Search,
  Filter,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import QuestionItem from '@/components/QuestionItem';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Interfaces
interface ExamQuestion {
  MaDeThi: string;
  MaPhan: string;
  MaCauHoi: string;
  ThuTu: number;
  Phan: {
    MaPhan: string;
    TenPhan: string;
  };
  CauHoi: {
    MaCauHoi: string;
    NoiDung: string;
    CLO?: {
      MaCLO: string;
      TenCLO: string;
    };
    CauTraLoi?: Array<{
      MaCauTraLoi: string;
      NoiDung: string;
      LaDapAn: boolean;
      ThuTu: number;
    }>;
    SoCauHoiCon?: number;
    LaCauHoiNhom?: boolean;
    CauHoiCon?: Array<{
      MaCauHoi: string;
      MaSoCauHoi: number;
      NoiDung: string;
      CauTraLoi: Array<{
        MaCauTraLoi: string;
        NoiDung: string;
        LaDapAn: boolean;
        ThuTu: number;
      }>;
    }>;
  };
}

interface Exam {
  MaDeThi: string;
  TenDeThi: string;
  NgayTao: string;
  DaDuyet: boolean;
  LoaiBoChuongPhan: boolean;
  MonHoc?: {
    TenMonHoc: string;
  };
}

interface SearchableQuestion {
  id: string;
  MaCauHoi: string;
  NoiDung: string;
  LaCauHoiNhom: boolean;
  CauTraLoi?: Array<{
    MaCauTraLoi: string;
    NoiDung: string;
    LaDapAn: boolean;
    ThuTu: number;
  }>;
  MonHoc?: {
    TenMonHoc: string;
  };
  Phan?: {
    TenPhan: string;
  };
  CLO?: {
    TenCLO: string;
  };
  isSelected?: boolean;
  alreadyInExam?: boolean;
}

const EditExamQuestions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State
  const [exam, setExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableQuestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch exam and questions data
  useEffect(() => {
    const fetchExamData = async () => {
      if (!id) {
        setError("ID đề thi không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [examResponse, questionsResponse] = await Promise.all([
          examApi.getExamById(id),
          deThiApi.getHierarchicalQuestions(id)
        ]);

        setExam(examResponse.data);

        // Process the questions response
        if (questionsResponse.data && questionsResponse.data.questions) {
          let questions = questionsResponse.data.questions;
          if (Array.isArray(questions)) {
            setExamQuestions(questions);
          } else if (questions && questions.items && Array.isArray(questions.items)) {
            setExamQuestions(questions.items);
          } else {
            console.error("Unexpected questions format:", questionsResponse.data);
            setExamQuestions([]);
            setError("Định dạng dữ liệu không hợp lệ");
          }
        } else {
          setExamQuestions([]);
          setError("Không có dữ liệu chi tiết đề thi");
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
        setError("Không thể tải thông tin đề thi. Vui lòng thử lại sau.");
        toast.error("Không thể tải thông tin đề thi");
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id]);

  // Handle search for questions
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await cauHoiApi.searchQuestions({
        searchTerm: searchQuery,
        pageSize: 20,
        pageNumber: 1
      });

      if (response.data && Array.isArray(response.data.items)) {
        // Mark questions already in the exam
        const existingQuestionIds = examQuestions.map(q => q.MaCauHoi);
        const formattedResults = response.data.items.map((question: any) => ({
          ...question,
          id: question.MaCauHoi,
          isSelected: selectedQuestions.includes(question.MaCauHoi),
          alreadyInExam: existingQuestionIds.includes(question.MaCauHoi)
        }));
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching questions:", error);
      toast.error("Không thể tìm kiếm câu hỏi");
    } finally {
      setSearching(false);
    }
  };

  // Handle selecting a question from search results
  const handleSelectSearchResult = (questionId: string) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Handle adding selected questions to the exam
  const handleAddSelectedQuestions = async () => {
    if (selectedQuestions.length === 0 || !id) return;

    try {
      setSaving(true);
      const questionsToAdd = selectedQuestions.map(questionId => ({
        MaDeThi: id,
        MaCauHoi: questionId,
        // Use default phan if exam doesn't have chapters
        MaPhan: exam?.LoaiBoChuongPhan
          ? examQuestions[0]?.MaPhan || "default"
          : examQuestions[0]?.MaPhan || "default",
        ThuTu: examQuestions.length + 1
      }));

      await deThiApi.addQuestionsToExam(id, questionsToAdd);

      toast.success(`Đã thêm ${selectedQuestions.length} câu hỏi vào đề thi`);
      setShowAddDialog(false);
      setSelectedQuestions([]);

      // Refresh exam questions
      const refreshedQuestions = await deThiApi.getHierarchicalQuestions(id);
      if (refreshedQuestions.data && refreshedQuestions.data.questions) {
        const questions = refreshedQuestions.data.questions;
        if (Array.isArray(questions)) {
          setExamQuestions(questions);
        } else if (questions && questions.items && Array.isArray(questions.items)) {
          setExamQuestions(questions.items);
        }
      }

      setHasChanges(true);
    } catch (error) {
      console.error("Error adding questions to exam:", error);
      toast.error("Không thể thêm câu hỏi vào đề thi");
    } finally {
      setSaving(false);
    }
  };

  // Handle removing a question from the exam
  const handleRemoveQuestion = async (questionId: string) => {
    if (!id) return;

    try {
      await deThiApi.removeQuestionFromExam(id, questionId);
      setExamQuestions(prev => prev.filter(q => q.MaCauHoi !== questionId));
      toast.success("Đã xóa câu hỏi khỏi đề thi");
      setHasChanges(true);
    } catch (error) {
      console.error("Error removing question:", error);
      toast.error("Không thể xóa câu hỏi khỏi đề thi");
    }
  };

  // Handle reordering questions
  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = examQuestions.findIndex(q => q.MaCauHoi === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= examQuestions.length) return;

    const reorderedQuestions = [...examQuestions];
    const temp = reorderedQuestions[currentIndex];
    reorderedQuestions[currentIndex] = reorderedQuestions[newIndex];
    reorderedQuestions[newIndex] = temp;

    // Update order numbers
    reorderedQuestions.forEach((q, index) => {
      q.ThuTu = index + 1;
    });

    setExamQuestions(reorderedQuestions);
    setHasChanges(true);
  };

  // Save all changes (primarily the order of questions)
  const handleSaveChanges = async () => {
    if (!id || !hasChanges) return;

    try {
      setSaving(true);
      const orderedQuestions = examQuestions.map((q, index) => ({
        MaDeThi: id,
        MaCauHoi: q.MaCauHoi,
        MaPhan: q.MaPhan,
        ThuTu: index + 1
      }));

      await deThiApi.updateExamQuestionOrder(id, orderedQuestions);
      toast.success("Đã lưu thay đổi thành công");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation back
  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm("Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời đi?")) {
        navigate(`/exams/view/${id}`);
      }
    } else {
      navigate(`/exams/view/${id}`);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
          <Button onClick={() => navigate('/exams')} className="mt-4">
            <ArrowLeft className="mr-2" size={16} />
            Quay lại danh sách đề thi
          </Button>
        </div>
      </div>
    );
  }

  // Transform question for QuestionItem component
  const transformQuestion = (question: ExamQuestion) => {
    const isGroupQuestion = question.CauHoi.LaCauHoiNhom ||
                          (question.CauHoi.SoCauHoiCon && question.CauHoi.SoCauHoiCon > 0) ||
                          (question.CauHoi.CauHoiCon && question.CauHoi.CauHoiCon.length > 0);

    return {
      id: question.MaCauHoi,
      content: question.CauHoi.NoiDung,
      clo: question.CauHoi.CLO?.TenCLO || null,
      type: isGroupQuestion ? 'group' : 'single-choice',
      answers: question.CauHoi.CauTraLoi?.map((answer, idx) => ({
        id: answer.MaCauTraLoi,
        content: answer.NoiDung || '',
        isCorrect: answer.LaDapAn,
        order: answer.ThuTu || idx
      })) || [],
      questionNumber: question.ThuTu,
      childQuestions: question.CauHoi.CauHoiCon?.map((childQ) => ({
        id: childQ.MaCauHoi,
        content: childQ.NoiDung || '',
        clo: null,
        type: 'single-choice' as const,
        answers: childQ.CauTraLoi?.map((answer, idx) => ({
          id: answer.MaCauTraLoi,
          content: answer.NoiDung || '',
          isCorrect: answer.LaDapAn,
          order: answer.ThuTu || idx
        })) || []
      })) || []
    };
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2" size={16} />
            Quay lại
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges || saving}
            className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2" size={16} />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Chỉnh sửa câu hỏi trong đề thi</h1>
            <p className="text-gray-600">{exam?.TenDeThi}</p>
          </div>

          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2" size={16} />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Danh sách câu hỏi ({examQuestions.length})</h2>
              {hasChanges && (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                  Có thay đổi chưa lưu
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {examQuestions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Đề thi này chưa có câu hỏi nào.</p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="mr-2" size={16} />
                  Thêm câu hỏi
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {examQuestions.map((question, index) => (
                  <div key={question.MaCauHoi} className="relative group">
                    <QuestionItem
                      question={{
                        ...transformQuestion(question),
                        questionNumber: index + 1
                      }}
                      showAnswers={true}
                    />

                    {/* Action buttons */}
                    <div className="absolute right-4 top-4 hidden group-hover:flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveQuestion(question.MaCauHoi, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUp size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveQuestion(question.MaCauHoi, 'down')}
                        disabled={index === examQuestions.length - 1}
                      >
                        <MoveDown size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveQuestion(question.MaCauHoi)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Questions Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Thêm câu hỏi vào đề thi</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2" size={16} />
                )}
                Tìm kiếm
              </Button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    {searching ? 'Đang tìm kiếm...' : searchQuery ? 'Không tìm thấy kết quả' : 'Nhập từ khóa để tìm câu hỏi'}
                  </p>
                </div>
              ) : (
                searchResults.map((question) => (
                  <Card
                    key={question.MaCauHoi}
                    className={`cursor-pointer border ${
                      question.alreadyInExam
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : question.isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'
                    }`}
                    onClick={() => {
                      if (!question.alreadyInExam) {
                        handleSelectSearchResult(question.MaCauHoi);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {question.LaCauHoiNhom && (
                              <Badge variant="outline" className="bg-purple-50">Câu hỏi nhóm</Badge>
                            )}
                            {question.CLO?.TenCLO && (
                              <Badge variant="outline">{question.CLO.TenCLO}</Badge>
                            )}
                            {question.alreadyInExam && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-500">
                                Đã có trong đề thi
                              </Badge>
                            )}
                          </div>
                          <div
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: question.NoiDung }}
                          />
                          {(question.MonHoc?.TenMonHoc || question.Phan?.TenPhan) && (
                            <div className="mt-2 text-xs text-gray-500">
                              {question.MonHoc?.TenMonHoc && (
                                <span className="mr-2">Môn: {question.MonHoc.TenMonHoc}</span>
                              )}
                              {question.Phan?.TenPhan && (
                                <span>Chương: {question.Phan.TenPhan}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center h-full">
                          {question.isSelected && !question.alreadyInExam && (
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">
                Đã chọn {selectedQuestions.length} câu hỏi
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleAddSelectedQuestions}
                disabled={selectedQuestions.length === 0 || saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2" size={16} />
                    Thêm vào đề thi
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditExamQuestions;
