import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import { Plus, Trash2 } from 'lucide-react';

interface SubQuestion {
  id: number;
  content: string;
  answer: string;
}

const GroupQuestion = () => {
  const styles = useThemeStyles();
  const [content, setContent] = useState('');
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([
    { id: 1, content: '', answer: '' }
  ]);

  const addSubQuestion = () => {
    setSubQuestions(prev => [
      ...prev,
      { id: prev.length + 1, content: '', answer: '' }
    ]);
  };

  const removeSubQuestion = (id: number) => {
    setSubQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateSubQuestion = (id: number, field: keyof SubQuestion, value: string) => {
    setSubQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className={cx('text-2xl font-bold mb-6', styles.isDark ? 'text-gray-200' : '')}>
        Tạo câu hỏi nhóm
      </h2>
      <div className="mb-4">
        <label className="block font-medium mb-1">Nội dung câu hỏi chính</label>
        <Input
          placeholder="Nhập nội dung câu hỏi chính..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block font-medium">Câu hỏi con</label>
          <Button
            variant="outline"
            size="sm"
            onClick={addSubQuestion}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi
          </Button>
        </div>
        <div className="space-y-4">
          {subQuestions.map((q, index) => (
            <div key={q.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Câu hỏi {index + 1}</h3>
                {subQuestions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubQuestion(q.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Nội dung</label>
                  <Input
                    placeholder="Nhập nội dung câu hỏi..."
                    value={q.content}
                    onChange={e => updateSubQuestion(q.id, 'content', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Đáp án</label>
                  <Input
                    placeholder="Nhập đáp án..."
                    value={q.answer}
                    onChange={e => updateSubQuestion(q.id, 'answer', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button className={styles.primaryButton}>Lưu</Button>
        <Button variant="outline" onClick={() => window.history.back()}>Quay lại</Button>
      </div>
    </div>
  );
};

export default GroupQuestion;
