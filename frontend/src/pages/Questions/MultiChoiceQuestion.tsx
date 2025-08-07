import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import { createTinyMCEConfig, TINYMCE_API_KEY } from '../../utils/tinymce-config';
import { Info, CheckCircle, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';

const EditorAny = Editor as any;

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

  const handleAddAnswer = () => {
    setAnswers([...answers, '']);
  };

  const handleRemoveAnswer = (idx: number) => {
    if (answers.length <= 2) return;
    const newAnswers = [...answers];
    newAnswers.splice(idx, 1);
    setAnswers(newAnswers);

    // Update correctAnswers if needed
    if (correctAnswers.includes(idx)) {
      setCorrectAnswers(correctAnswers.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-full mx-auto min-h-screen py-8 bg-gradient-to-br from-blue-50 to-white text-[15px]">
      {/* Left: Main form */}
      <div className="lg:col-span-8 p-4">
        <div className="rounded-xl p-6 bg-white shadow-md border border-blue-100 mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-blue-100">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-blue-800">Câu hỏi trắc nghiệm nhiều đáp án</h2>
          </div>

          <div className="mb-6">
            <label className="font-semibold mb-2 flex items-center gap-2 text-gray-800 text-sm">
              <span className="text-blue-600">Câu hỏi</span>
              <Info className="w-4 h-4 text-blue-400" />
            </label>
            <div className="rounded-xl border border-blue-200 bg-white p-1.5 shadow-sm">
              <EditorAny
                apiKey={TINYMCE_API_KEY}
                value={content}
                onEditorChange={setContent}
                init={createTinyMCEConfig(120, false)}
              />
            </div>
          </div>

          <div className="mb-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-blue-800">Các đáp án</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAnswer}
                className="text-blue-700 flex items-center gap-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 font-semibold text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Thêm đáp án
              </Button>
            </div>

            {answers.map((answer, idx) => (
              <div
                key={idx}
                className={cx(
                  "group transition-all duration-200 rounded-xl border bg-white shadow-sm p-4 flex gap-3 items-start hover:shadow-md",
                  correctAnswers.includes(idx) ? "border-green-300 bg-green-50/30" : "border-gray-200 hover:border-blue-300"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {String.fromCharCode(65 + idx)}
                </div>

                <div className="flex-1">
                  <Input
                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                    value={answer}
                    onChange={e => handleAnswerChange(idx, e.target.value)}
                    className={cx(
                      "w-full rounded-lg p-2 text-sm",
                      correctAnswers.includes(idx)
                        ? "border-green-200 bg-green-50 focus:border-green-300 focus:ring focus:ring-green-200"
                        : "border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200"
                    )}
                  />
                </div>

                <div className="flex flex-col items-center gap-3 pt-1">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={correctAnswers.includes(idx)}
                      onChange={() => handleCorrectAnswerChange(idx)}
                      className="sr-only"
                      id={`answer-${idx}`}
                    />
                    <label
                      htmlFor={`answer-${idx}`}
                      className={cx(
                        "w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all",
                        correctAnswers.includes(idx)
                          ? "bg-green-500 text-white border-2 border-green-600"
                          : "bg-gray-100 text-gray-400 border-2 border-gray-300 hover:bg-gray-200"
                      )}
                    >
                      {correctAnswers.includes(idx) ? <CheckCircle className="w-5 h-5" /> : null}
                    </label>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAnswer(idx)}
                    disabled={answers.length <= 2}
                    className={cx(
                      "rounded-full w-8 h-8 p-0 flex items-center justify-center",
                      answers.length <= 2
                        ? "text-gray-300 border-gray-200"
                        : "text-red-400 hover:text-red-600 hover:bg-red-50 border-red-200"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Info panel */}
      <div className="lg:col-span-4 p-4">
        <div className="bg-white rounded-xl shadow-md h-fit text-left border border-blue-100 sticky top-6 overflow-hidden">
          {/* Action buttons */}
          <div className="p-4 grid grid-cols-2 gap-3 bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
            <Button
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 font-semibold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Lưu
            </Button>

            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 font-semibold text-sm shadow-md"
            >
              Lưu & Thêm
            </Button>

            <Button
              variant="outline"
              className="col-span-2 flex items-center justify-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-lg px-3 py-2 font-semibold text-sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
          </div>

          {/* Thông tin câu hỏi */}
          <div className="p-4">
            <div className="font-bold mb-3 text-left text-blue-800 text-sm flex items-center gap-2">
              <span className="bg-blue-100 p-1 rounded">
                <Info className="w-4 h-4 text-blue-600" />
              </span>
              Thông tin câu hỏi
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-left text-gray-700 font-medium">Khoa <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled selected>Chọn bộ đề</option>
                    <option value="khoa-cntt">Khoa Công nghệ thông tin</option>
                    <option value="khoa-kinh-te">Khoa Kinh tế</option>
                    <option value="khoa-ngoai-ngu">Khoa Ngoại ngữ</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-left text-gray-700 font-medium">Môn học <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled selected>Chọn môn học</option>
                    <option value="lap-trinh-web">Lập trình Web</option>
                    <option value="co-so-du-lieu">Cơ sở dữ liệu</option>
                    <option value="toan-roi-rac">Toán rời rạc</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-left text-gray-700 font-medium">Phần <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled selected>Chọn phần</option>
                    <option value="chuong-1">Chương 1</option>
                    <option value="chuong-2">Chương 2</option>
                    <option value="chuong-3">Chương 3</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-left text-gray-700 font-medium">Mức độ CLO <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled selected>Chọn mức độ</option>
                    <option value="1">Mức độ 1</option>
                    <option value="2">Mức độ 2</option>
                    <option value="3">Mức độ 3</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="font-bold mb-3 text-left text-blue-800 text-sm">Lưu ý</div>
            <p className="text-sm text-gray-600">
              Câu hỏi trắc nghiệm nhiều đáp án cho phép người dùng chọn nhiều đáp án đúng. Hãy đảm bảo có ít nhất một đáp án đúng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiChoiceQuestion;
