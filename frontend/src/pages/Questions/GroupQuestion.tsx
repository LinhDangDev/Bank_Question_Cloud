import { useState } from 'react';
import { useThemeStyles, cx } from '../../utils/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/config';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import MathModal from '@/components/Modal/MathModal';
import SingleChoiceQuestion from './SingleChoiceQuestion';

interface SubQuestion {
  id: number;
  content: string;
  answer: string;
  answers: {
    text: string;
    correct: boolean;
  }[];
}

const GroupQuestion = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStyles();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('1');
  const [chapterId, setChapterId] = useState('');
  const [cloId, setCloId] = useState('');
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([
    { id: 1, content: '', answer: '', answers: [{ text: '', correct: true }, { text: '', correct: false }] }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<{ questionId: number | null; field: string }>({
    questionId: null,
    field: ''
  });

  const addSubQuestion = () => {
    const newId = subQuestions.length > 0 ? Math.max(...subQuestions.map(q => q.id)) + 1 : 1;
    setSubQuestions([...subQuestions, {
      id: newId,
      content: '',
      answer: '',
      answers: [{ text: '', correct: true }, { text: '', correct: false }]
    }]);
  };

  const removeSubQuestion = (id: number) => {
    setSubQuestions(subQuestions.filter(q => q.id !== id));
  };

  const updateSubQuestion = (id: number, field: keyof SubQuestion, value: string | any) => {
    setSubQuestions(
      subQuestions.map(q => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề câu hỏi nhóm');
      return;
    }

    if (!chapterId) {
      setError('Vui lòng chọn chương/phần');
      return;
    }

    if (subQuestions.length === 0) {
      setError('Cần ít nhất một câu hỏi con');
      return;
    }

    // Kiểm tra các câu hỏi con
    for (const question of subQuestions) {
      if (!question.content.trim()) {
        setError(`Câu hỏi con #${question.id} chưa có nội dung`);
        return;
      }

      // Kiểm tra câu trả lời
      if (question.answers.length < 2) {
        setError(`Câu hỏi con #${question.id} cần ít nhất 2 câu trả lời`);
        return;
      }

      if (!question.answers.some(a => a.correct)) {
        setError(`Câu hỏi con #${question.id} chưa có đáp án đúng`);
        return;
      }

      if (question.answers.some(a => !a.text.trim())) {
        setError(`Câu hỏi con #${question.id} có câu trả lời trống`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // Generate random question numbers
      const parentQuestionNumber = Math.floor(Math.random() * 10000);
      const childQuestionNumbers = subQuestions.map(() => Math.floor(Math.random() * 10000));

      // Chuẩn bị dữ liệu cho API
      const requestData = {
        parentQuestion: {
          MaPhan: chapterId,
          MaSoCauHoi: parentQuestionNumber,
          NoiDung: title,
          HoanVi: true,
          CapDo: parseInt(difficulty),
          SoCauHoiCon: subQuestions.length,
          XoaTamCauHoi: false,
          SoLanDuocThi: 0,
          SoLanDung: 0,
          MaCLO: cloId || null
        },
        childQuestions: subQuestions.map((sq, index) => ({
          question: {
            MaPhan: chapterId,
            MaSoCauHoi: childQuestionNumbers[index],
            NoiDung: sq.content,
            HoanVi: true,
            CapDo: parseInt(difficulty),
            SoCauHoiCon: 0,
            XoaTamCauHoi: false,
            SoLanDuocThi: 0,
            SoLanDung: 0,
            MaCLO: cloId || null
          },
          answers: sq.answers.map((ans, i) => ({
            NoiDung: ans.text,
            ThuTu: i + 1,
            LaDapAn: ans.correct,
            HoanVi: true
          }))
        }))
      };

      console.log('Sending request data:', JSON.stringify(requestData));

      // Gọi API
      const response = await fetch(`${API_BASE_URL}/cau-hoi/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi tạo câu hỏi nhóm');
      }

      // Chuyển hướng đến trang danh sách câu hỏi nhóm
      navigate('/questions/group');
    } catch (err) {
      console.error('Error creating group question:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo câu hỏi nhóm');
    } finally {
      setLoading(false);
    }
  };

  const openMathModal = (questionId: number | null, field: string) => {
    setCurrentEditingField({ questionId, field });
    setShowMathModal(true);
  };

  const handleMathInsert = (latex: string) => {
    if (currentEditingField.field === 'title') {
      setTitle(prev => prev + latex);
    } else if (currentEditingField.field === 'content' && currentEditingField.questionId !== null) {
      updateSubQuestion(
        currentEditingField.questionId,
        'content',
        subQuestions.find(q => q.id === currentEditingField.questionId)?.content + latex
      );
    }
    setShowMathModal(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tạo câu hỏi nhóm</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Tiêu đề câu hỏi nhóm
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => openMathModal(null, 'title')}
          >
            Σ Công thức
          </Button>
        </label>
        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề câu hỏi nhóm..."
          className={cx(
            'border rounded p-2 w-full',
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block mb-2 font-medium">Độ khó</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={cx(
              'border rounded p-2 w-full',
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'
            )}
          >
            <option value="1">Dễ</option>
            <option value="2">Trung bình</option>
            <option value="3">Khó</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Chương/Phần</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className={cx(
              'border rounded p-2 w-full',
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'
            )}
          >
            <option value="">Chọn chương/phần</option>
            {/* Thêm options từ API */}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">CLO</label>
          <select
            value={cloId}
            onChange={(e) => setCloId(e.target.value)}
            className={cx(
              'border rounded p-2 w-full',
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'
            )}
          >
            <option value="">Chọn CLO</option>
            {/* Thêm options từ API */}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Câu hỏi con ({subQuestions.length})</h2>
          <Button onClick={addSubQuestion} variant="outline">
            Thêm câu hỏi con
          </Button>
        </div>

        {subQuestions.map((question, index) => (
          <div
            key={question.id}
            className={cx(
              'border rounded-lg p-4 mb-4',
              isDark ? 'bg-gray-800' : 'bg-gray-50'
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Câu hỏi {index + 1}</h3>
              <Button
                onClick={() => removeSubQuestion(question.id)}
                variant="destructive"
                size="sm"
              >
                Xóa
              </Button>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                Nội dung câu hỏi
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => openMathModal(question.id, 'content')}
                >
                  Σ Công thức
                </Button>
              </label>
              <Textarea
                value={question.content}
                onChange={(e) =>
                  updateSubQuestion(question.id, 'content', e.target.value)
                }
                placeholder="Nhập nội dung câu hỏi..."
                className={cx(
                  'border rounded p-2 w-full',
                  isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'
                )}
              />
            </div>

            <div className="mb-2">
              <label className="block mb-2 font-medium">Câu trả lời</label>
              {question.answers.map((answer, ansIndex) => (
                <div key={ansIndex} className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={answer.correct}
                    onChange={() => {
                      const newAnswers = question.answers.map((a, i) => ({
                        ...a,
                        correct: i === ansIndex
                      }));
                      updateSubQuestion(question.id, 'answers', newAnswers);
                    }}
                    className="mr-2"
                  />
                  <Input
                    value={answer.text}
                    onChange={(e) => {
                      const newAnswers = [...question.answers];
                      newAnswers[ansIndex].text = e.target.value;
                      updateSubQuestion(question.id, 'answers', newAnswers);
                    }}
                    placeholder={`Đáp án ${ansIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      const newAnswers = question.answers.filter((_, i) => i !== ansIndex);
                      updateSubQuestion(question.id, 'answers', newAnswers);
                    }}
                    variant="text"
                    size="sm"
                    className="ml-2"
                    disabled={question.answers.length <= 2}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newAnswers = [...question.answers, { text: '', correct: false }];
                  updateSubQuestion(question.id, 'answers', newAnswers);
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Thêm đáp án
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate('/questions')}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Đang lưu...' : 'Lưu câu hỏi nhóm'}
        </Button>
      </div>

      {showMathModal && (
        <MathModal
          isOpen={showMathModal}
          onClose={() => setShowMathModal(false)}
          onInsert={handleMathInsert}
        />
      )}
    </div>
  );
};

export default GroupQuestion;
