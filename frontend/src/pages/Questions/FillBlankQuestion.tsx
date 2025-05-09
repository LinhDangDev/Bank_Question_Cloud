import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';

const FillBlankQuestion = () => {
  const styles = useThemeStyles();
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className={cx('text-2xl font-bold mb-6', styles.isDark ? 'text-gray-200' : '')}>
        Tạo câu hỏi điền khuyết
      </h2>
      <div className="mb-4">
        <label className="block font-medium mb-1">Nội dung câu hỏi</label>
        <div className="text-sm text-gray-500 mb-2">
          Sử dụng dấu [...] để đánh dấu phần cần điền khuyết. Ví dụ: "Thủ đô của Việt Nam là [...]"
        </div>
        <Input
          placeholder="Nhập nội dung câu hỏi..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Đáp án đúng</label>
        <Input
          placeholder="Nhập đáp án đúng..."
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mt-6">
        <Button className={styles.primaryButton}>Lưu</Button>
        <Button variant="outline" onClick={() => window.history.back()}>Quay lại</Button>
      </div>
    </div>
  );
};

export default FillBlankQuestion;
