import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import { Eye, Plus, Trash2, Info, X, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Editor } from '@tinymce/tinymce-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';

// @ts-ignore
declare global {
  interface Window {
    MathJax?: any;
  }
}

const defaultAnswers = [
  { text: '', correct: false },
  { text: '', correct: false },
  { text: '', correct: false },
  { text: '', correct: false },
];

const layoutOptions = [
  { label: '1 cột', value: 1 },
  { label: '2 cột', value: 2 },
  { label: '3 cột', value: 3 },
  { label: '4 cột', value: 4 },
];

function splitAnswers(answers: { text: string; correct: boolean }[], columns: number) {
  const rows: { text: string; correct: boolean }[][] = [];
  for (let i = 0; i < answers.length; i += columns) {
    rows.push(answers.slice(i, i + columns));
  }
  return rows;
}

const EditorAny = Editor as any;

interface AnswerForm {
  text: string;
  correct: boolean;
}

interface SingleChoiceQuestionProps {
  question?: {
    MaCauHoi: string;
    NoiDung: string;
    answers: Array<{
      MaCauTraLoi: string;
      NoiDung: string;
      ThuTu: number;
      LaDapAn: boolean;
    }>;
    // Add other fields as needed
  };
}

const SingleChoiceQuestion = ({ question }: SingleChoiceQuestionProps) => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [content, setContent] = useState(question?.NoiDung || '');
  const [answers, setAnswers] = useState<AnswerForm[]>(
    question?.answers
      ? question.answers.map(a => ({ text: a.NoiDung, correct: a.LaDapAn }))
      : defaultAnswers
  );
  const [explanation, setExplanation] = useState('');
  const [layout, setLayout] = useState(1);
  const [fixedOrder, setFixedOrder] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [saveLocation, setSaveLocation] = useState('frame');
  const [frame, setFrame] = useState('');
  const [knowledgeUnit, setKnowledgeUnit] = useState('');
  const [level, setLevel] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers(ans => ans.map((a, i) => (i === idx ? { ...a, text: value } : a)));
  };
  const handleCorrectChange = (idx: number) => {
    setAnswers(ans => ans.map((a, i) => ({ ...a, correct: i === idx })));
  };
  const handleRemoveAnswer = (idx: number) => {
    if (answers.length <= 2) return;
    setAnswers(ans => ans.filter((_, i) => i !== idx));
  };
  const handleAddAnswer = () => {
    setAnswers(ans => [...ans, { text: '', correct: false }]);
  };

  const answerRows = splitAnswers(answers, 1);

  useEffect(() => {
    if (showPreview && window.MathJax) {
      window.MathJax.typesetPromise && window.MathJax.typesetPromise();
    }
  }, [showPreview, content, answers, explanation]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      if (question) {
        // Update existing question
        const mappedAnswers = answers.map((a, idx) => ({
          MaCauTraLoi: question.answers?.[idx]?.MaCauTraLoi || undefined,
          MaCauHoi: question.MaCauHoi,
          NoiDung: a.text,
          ThuTu: idx + 1,
          LaDapAn: a.correct,
          HoanVi: false
        }));

        // Create a copy of the question without the answers property
        const { answers: _, ...questionWithoutAnswers } = question;

        const payload = {
          question: {
            ...questionWithoutAnswers,
            NoiDung: content,
          },
          answers: mappedAnswers
        };

        const res = await fetch(`http://localhost:3000/cau-hoi/${question.MaCauHoi}/with-answers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Lưu thất bại!');
        setMessage('Lưu thành công!');
        setTimeout(() => {
          navigate('/questions');
        }, 1200);
      } else {
        // Create new question
        // First, check if we have all required fields
        if (!content) {
          setErrorMsg('Vui lòng nhập nội dung câu hỏi!');
          setSaving(false);
          return;
        }

        if (!frame) {
          setErrorMsg('Vui lòng chọn khoa!');
          setSaving(false);
          return;
        }

        if (!knowledgeUnit) {
          setErrorMsg('Vui lòng chọn môn học!');
          setSaving(false);
          return;
        }

        // Check if at least one answer is marked as correct
        if (!answers.some(a => a.correct)) {
          setErrorMsg('Vui lòng chọn ít nhất một đáp án đúng!');
          setSaving(false);
          return;
        }

        const mappedAnswers = answers.map((a, idx) => ({
          NoiDung: a.text,
          ThuTu: idx + 1,
          LaDapAn: a.correct,
          HoanVi: false
        }));

        const payload = {
          question: {
            MaPhan: frame, // Using frame as MaPhan for now
            MaSoCauHoi: Math.floor(Math.random() * 9000) + 1000, // Random number between 1000-9999
            NoiDung: content,
            HoanVi: !fixedOrder, // Invert fixedOrder for HoanVi
            CapDo: parseInt(level) || 1,
            SoCauHoiCon: 0,
            MaCLO: knowledgeUnit // Using knowledgeUnit as MaCLO for now
          },
          answers: mappedAnswers
        };

        const res = await fetch('http://localhost:3000/cau-hoi/with-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Tạo câu hỏi thất bại!');
        setMessage('Tạo câu hỏi thành công!');
        setTimeout(() => {
          navigate('/questions');
        }, 1200);
      }
    } catch (err) {
      setErrorMsg('Lưu thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAdd = async () => {
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      if (question) {
        // Update existing question
        const mappedAnswers = answers.map((a, idx) => ({
          MaCauTraLoi: question.answers?.[idx]?.MaCauTraLoi || undefined,
          MaCauHoi: question.MaCauHoi,
          NoiDung: a.text,
          ThuTu: idx + 1,
          LaDapAn: a.correct,
          HoanVi: false
        }));

        // Create a copy of the question without the answers property
        const { answers: _, ...questionWithoutAnswers } = question;

        const payload = {
          question: {
            ...questionWithoutAnswers,
            NoiDung: content,
          },
          answers: mappedAnswers
        };

        const res = await fetch(`http://localhost:3000/cau-hoi/${question.MaCauHoi}/with-answers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Lưu thất bại!');
        setMessage('Lưu thành công!');
      } else {
        // Create new question
        // First, check if we have all required fields
        if (!content) {
          setErrorMsg('Vui lòng nhập nội dung câu hỏi!');
          setSaving(false);
          return;
        }

        if (!frame) {
          setErrorMsg('Vui lòng chọn khoa!');
          setSaving(false);
          return;
        }

        if (!knowledgeUnit) {
          setErrorMsg('Vui lòng chọn môn học!');
          setSaving(false);
          return;
        }

        // Check if at least one answer is marked as correct
        if (!answers.some(a => a.correct)) {
          setErrorMsg('Vui lòng chọn ít nhất một đáp án đúng!');
          setSaving(false);
          return;
        }

        const mappedAnswers = answers.map((a, idx) => ({
          NoiDung: a.text,
          ThuTu: idx + 1,
          LaDapAn: a.correct,
          HoanVi: false
        }));

        const payload = {
          question: {
            MaPhan: frame, // Using frame as MaPhan for now
            MaSoCauHoi: Math.floor(Math.random() * 9000) + 1000, // Random number between 1000-9999
            NoiDung: content,
            HoanVi: !fixedOrder, // Invert fixedOrder for HoanVi
            CapDo: parseInt(level) || 1,
            SoCauHoiCon: 0,
            MaCLO: knowledgeUnit // Using knowledgeUnit as MaCLO for now
          },
          answers: mappedAnswers
        };

        const res = await fetch('http://localhost:3000/cau-hoi/with-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Tạo câu hỏi thất bại!');
        setMessage('Tạo câu hỏi thành công!');
      }

      // Always redirect to create page for "Save & Add"
      setTimeout(() => {
        navigate('/questions/create');
      }, 1200);
    } catch (err) {
      setErrorMsg('Lưu thất bại!');
    } finally {
      setSaving(false);
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
            <h2 className="text-lg font-bold text-blue-800">Câu hỏi trắc nghiệm 1 đáp án</h2>
          </div>

          <div className="mb-6">
            <label className="font-semibold mb-2 flex items-center gap-2 text-gray-800 text-sm">
              <span className="text-blue-600">Câu hỏi</span>
              <Info className="w-4 h-4 text-blue-400" />
            </label>
            <div className="rounded-xl border border-blue-200 bg-white p-1.5 shadow-sm">
              <EditorAny
                apiKey="6gjaodohdncfz36azjc7q49f26yrhh881rljxqshfack7cax"
                value={content}
                onEditorChange={setContent}
                init={{
                  height: 120,
                  menubar: false,
                  plugins: [
                    'advlist autolink lists link image charmap preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table code help wordcount',
                    'mathjax',
                    'table',
                    'media',
                    'codesample',
                  ],
                  toolbar:
                    'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | fontselect fontsizeselect formatselect | forecolor backcolor removeformat | subscript superscript | link image media table codesample blockquote | mathjax',
                  setup: (editor: any) => {
                    editor.on('focus', () => {
                      editor.theme.panel && editor.theme.panel.show();
                    });
                    editor.on('blur', () => {
                      editor.theme.panel && editor.theme.panel.hide();
                    });
                  },
                  mathjax: {
                    lib: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
                  },
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  toolbar_mode: 'sliding',
                }}
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

            {answers.map((a, idx) => (
              <div
                key={idx}
                className={cx(
                  "group transition-all duration-200 rounded-xl border bg-white shadow-sm p-4 flex gap-3 items-start hover:shadow-md",
                  a.correct ? "border-green-300 bg-green-50/30" : "border-gray-200 hover:border-blue-300"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {String.fromCharCode(65 + idx)}
                </div>

                <div className="flex-1">
                  <ReactQuill
                    theme="snow"
                    value={a.text}
                    onChange={value => handleAnswerChange(idx, value)}
                    style={{
                      minHeight: 80,
                      maxHeight: 120,
                      overflowY: 'auto',
                      backgroundColor: a.correct ? '#f0fdf4' : '#ffffff',
                      borderRadius: 8,
                      fontSize: 14,
                      border: a.correct ? '1px solid #86efac' : '1px solid #e5e7eb'
                    }}
                  />
                </div>

                <div className="flex flex-col items-center gap-3 pt-1">
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      name="correct"
                      checked={a.correct}
                      onChange={() => handleCorrectChange(idx)}
                      className="sr-only"
                      id={`answer-${idx}`}
                    />
                    <label
                      htmlFor={`answer-${idx}`}
                      className={cx(
                        "w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all",
                        a.correct
                          ? "bg-green-500 text-white border-2 border-green-600"
                          : "bg-gray-100 text-gray-400 border-2 border-gray-300 hover:bg-gray-200"
                      )}
                    >
                      {a.correct ? <CheckCircle className="w-5 h-5" /> : null}
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
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>

            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 font-semibold text-sm shadow-md"
              onClick={handleSaveAndAdd}
              disabled={saving}
            >
              Lưu & Thêm
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-lg px-3 py-2 font-semibold text-sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4" /> Xem trước
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-lg px-3 py-2 font-semibold text-sm"
              onClick={() => navigate('/questions')}
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
          </div>

          {/* Notification */}
          {message && (
            <div className="bg-green-50 p-3 border-b border-green-100 flex items-center gap-2 text-green-700 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" /> {message}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2 text-red-700 font-semibold text-sm">
              <X className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          {/* Bố cục đáp án */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <label className="block font-bold mb-2 text-gray-800 text-sm">Bố cục đáp án <span className="text-red-500">*</span></label>
            <div className="relative mb-3">
              <select
                className="w-full border rounded-lg p-2 pr-8 bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-gray-800 text-sm font-semibold appearance-none h-10"
                value={layout}
                onChange={e => setLayout(Number(e.target.value))}
              >
                {layoutOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1 bg-blue-50 p-2 rounded-lg">
              <input
                type="checkbox"
                id="fixedOrder"
                checked={fixedOrder}
                onChange={e => setFixedOrder(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <label htmlFor="fixedOrder" className="text-gray-700 text-sm cursor-pointer">Cố định thứ tự đáp án</label>
            </div>
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
                    value={frame}
                    onChange={e => setFrame(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled>Chọn bộ đề</option>
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
                    value={knowledgeUnit}
                    onChange={e => setKnowledgeUnit(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled>Chọn môn học</option>
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
                    value={knowledgeUnit}
                    onChange={e => setKnowledgeUnit(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled>Chọn phần</option>
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
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-blue-100 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                  >
                    <option value="" disabled>Chọn mức độ</option>
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
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 relative border border-blue-100 animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowPreview(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-blue-700">Xem trước câu hỏi</h3>
            </div>

            <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="font-medium mb-4 text-left" dangerouslySetInnerHTML={{ __html: content || '<span class=\"italic text-gray-400\">[Chưa nhập nội dung câu hỏi]</span>' }} />

              <div className="space-y-3">
                {splitAnswers(answers, layout).map((row, rowIdx) => (
                  <div key={rowIdx} className="flex flex-wrap gap-4 mb-2">
                    {row.map((a: { text: string; correct: boolean }, idx: number) => {
                      const answerIdx = rowIdx * layout + idx;
                      return (
                        <div key={answerIdx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex-1 min-w-[200px]">
                          <span className={cx(
                            'inline-flex items-center justify-center w-8 h-8 rounded-full border font-semibold',
                            a.correct ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700'
                          )}>
                            {String.fromCharCode(65 + answerIdx)}
                          </span>
                          <span className={cx('flex-1', a.text ? '' : 'italic text-gray-400')} dangerouslySetInnerHTML={{ __html: a.text || '[Chưa nhập đáp án]' }} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {explanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="font-semibold mb-2 text-blue-700 text-left flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Hướng dẫn giải
                </div>
                <div dangerouslySetInnerHTML={{ __html: explanation }} />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SingleChoiceQuestion;
