import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';

const MultiChoiceQuestion = () => {
  const styles = useThemeStyles();
  const [content, setContent] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers(ans => ans.map((a, i) => (i === idx ? value : a)));
  };

  const handleCorrectAnswerChange = (idx: number) => {
    setCorrectAnswers(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      }
      return [...prev, idx];
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className={cx('text-2xl font-bold mb-6', styles.isDark ? 'text-gray-200' : '')}>
        Tạo câu hỏi trắc nghiệm nhiều đáp án
      </h2>
      <div className="mb-4">
        <label className="block font-medium mb-1">Nội dung câu hỏi</label>
        <Input
          placeholder="Nhập nội dung câu hỏi..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-2">Đáp án</label>
        <div className="space-y-2">
          {[0, 1, 2, 3].map(idx => (
            <div key={idx} className="flex items-center gap-2">
              <span className={cx(
                'w-7 h-7 flex items-center justify-center rounded-full border font-bold',
                'bg-gray-100 text-gray-700 border-gray-300'
              )}>{String.fromCharCode(65 + idx)}</span>
              <Input
                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                className="flex-1"
                value={answers[idx]}
                onChange={e => handleAnswerChange(idx, e.target.value)}
              />
              <input
                type="checkbox"
                checked={correctAnswers.includes(idx)}
                onChange={() => handleCorrectAnswerChange(idx)}
                className="ml-2"
              />
              <span className="text-xs">Đáp án đúng</span>
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

export default MultiChoiceQuestion;
