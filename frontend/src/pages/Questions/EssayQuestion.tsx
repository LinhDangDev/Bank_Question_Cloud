import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';

const EssayQuestion = () => {
  const styles = useThemeStyles();
  const [content, setContent] = useState('');
  const [sampleAnswer, setSampleAnswer] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className={cx('text-2xl font-bold mb-6', styles.isDark ? 'text-gray-200' : '')}>
        Tạo câu hỏi tự luận
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
        <label className="block font-medium mb-1">Đáp án mẫu</label>
        <textarea
          className={cx(
            'w-full p-2 border rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'min-h-[200px] resize-y'
          )}
          placeholder="Nhập đáp án mẫu..."
          value={sampleAnswer}
          onChange={e => setSampleAnswer(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mt-6">
        <Button className={styles.primaryButton}>Lưu</Button>
        <Button variant="outline" onClick={() => window.history.back()}>Quay lại</Button>
      </div>
    </div>
  );
};

export default EssayQuestion;
