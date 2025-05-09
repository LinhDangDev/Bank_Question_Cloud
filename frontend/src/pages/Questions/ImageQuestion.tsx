import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';

const ImageQuestion = () => {
  const styles = useThemeStyles();
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className={cx('text-2xl font-bold mb-6', styles.isDark ? 'text-gray-200' : '')}>
        Tạo câu hỏi ảnh
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
        <label className="block font-medium mb-1">Ảnh câu hỏi</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {preview ? (
              <div className="mb-4">
                <img src={preview} alt="Preview" className="mx-auto h-32 w-auto" />
              </div>
            ) : (
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload ảnh</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <p className="pl-1">hoặc kéo thả</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Đáp án</label>
        <Input
          placeholder="Nhập đáp án..."
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

export default ImageQuestion;
