import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import { Eye, Plus, Trash2, Info, X } from 'lucide-react';
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
    if (!question) return;
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);
    try {
      const mappedAnswers = answers.map((a, idx) => ({
        MaCauTraLoi: question.answers?.[idx]?.MaCauTraLoi || undefined,
        MaCauHoi: question.MaCauHoi,
        NoiDung: a.text,
        ThuTu: idx + 1,
        LaDapAn: a.correct,
        HoanVi: false
      }));
      const payload = {
        question: {
          ...question,
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
    } catch (err) {
      setErrorMsg('Lưu thất bại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full py-8 text-left">
      {/* Left: Main form */}
      <div className="flex-1 rounded-xl p-8 bg-white shadow-lg md:mr-[340px]">
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-xl font-bold text-blue-700 text-left">Câu hỏi trắc nghiệm 1 đáp án</h2>
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="mb-8" style={{ minWidth: 920 }}>
          <label className="font-medium mb-2 flex items-center gap-1 text-left text-gray-700">
            Câu hỏi <Info className="w-4 h-4 text-blue-400" />
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
            <EditorAny
              apiKey="6gjaodohdncfz36azjc7q49f26yrhh881rljxqshfack7cax"
              value={content}
              onEditorChange={setContent}
              init={{
                height: 180,
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
        <div className="mb-8 space-y-4">
          {answers.map((a, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex gap-6 items-start">
              <label className="w-24 min-w-[80px] font-medium pt-2 text-gray-700">Đáp án {String.fromCharCode(65 + idx)} <span className="text-red-500">*</span></label>
              <div className="flex-1">
                <ReactQuill
                  theme="snow"
                  value={a.text}
                  onChange={value => handleAnswerChange(idx, value)}
                  style={{ minHeight: 80, minWidth: 400, maxWidth: '100%', marginBottom: 0, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                <input
                  type="radio"
                  name="correct"
                  checked={a.correct}
                  onChange={() => handleCorrectChange(idx)}
                  className="accent-blue-600 w-5 h-5"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAnswer(idx)}
                  disabled={answers.length <= 2}
                  className="text-gray-400 hover:text-red-500 border-none bg-transparent"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={handleAddAnswer} className="text-blue-600 flex items-center gap-1 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-2">
            <Plus className="w-4 h-4" /> Thêm đáp án
          </Button>
        </div>
      </div>
      {/* Right: Info panel */}
      <div
        className="w-[340px] bg-white rounded-2xl shadow-xl h-fit text-left border border-gray-100"
        style={{ position: 'sticky', top: 32, alignSelf: 'flex-start', zIndex: 20 }}
      >
        {/* Bố cục đáp án */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white rounded-t-2xl">
          <div className="mb-4">
            <label className="block font-semibold mb-2 text-gray-700 text-base">Bố cục đáp án <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                className="w-full border rounded-lg p-2 pr-8 bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-gray-700"
                value={layout}
                onChange={e => setLayout(Number(e.target.value))}
              >
                {layoutOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={fixedOrder} onChange={e => setFixedOrder(e.target.checked)} />
            <span className="text-gray-600">Cố định thứ tự đáp án</span>
          </div>
        </div>
        {/* Action buttons */}
        <div className="p-6 flex gap-2 mb-2 justify-end border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
          <Button variant="outline" className="flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2" onClick={() => setShowPreview(true)}><Eye className="w-4 h-4" /> Xem trước</Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-semibold" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 font-semibold">Lưu & Thêm</Button>
          <Button variant="outline" className="ml-2 rounded-lg px-4 py-2" onClick={() => navigate('/questions')}>Quay lại</Button>
        </div>
        {/* Notification */}
        {message && <div className="text-green-600 font-semibold mb-2 text-center">{message}</div>}
        {errorMsg && <div className="text-red-600 font-semibold mb-2 text-center">{errorMsg}</div>}
        {/* Thông tin câu hỏi */}
        <div className="p-6">
          <div className="font-semibold mb-2 text-left text-gray-700">Thông tin câu hỏi</div>
          <div className="mb-2">
            <label className="block text-sm mb-1 text-left text-gray-600">Khoa <span className="text-red-500">*</span></label>
            <Input value={frame} onChange={e => setFrame(e.target.value)} placeholder="Chọn bộ đề" />
          </div>
          <div className="mb-2">
            <label className="block text-sm mb-1 text-left text-gray-600">Môn học <span className="text-red-500">*</span></label>
            <Input value={knowledgeUnit} onChange={e => setKnowledgeUnit(e.target.value)} placeholder="Chọn" />
          </div>
          <div className="mb-2">
            <label className="block text-sm mb-1 text-left text-gray-600">Phần <span className="text-red-500">*</span></label>
            <Input value={knowledgeUnit} onChange={e => setKnowledgeUnit(e.target.value)} placeholder="Chọn" />
          </div>
          <div className="mb-2">
            <label className="block text-sm mb-1 text-left text-gray-600">Mức độ CLO <span className="text-red-500">*</span></label>
            <Input value={level} onChange={e => setLevel(e.target.value)} placeholder="Chọn" />
          </div>
        </div>
      </div>
      {showPreview && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200"
              onClick={() => setShowPreview(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-blue-700 text-left">Xem trước câu hỏi</h3>
            <div className="mb-4">
              <div className="font-medium mb-2 text-left" dangerouslySetInnerHTML={{ __html: content || '<span class=\"italic text-gray-400\">[Chưa nhập nội dung câu hỏi]</span>' }} />
              <div className="space-y-2">
                {splitAnswers(answers, layout).map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-8 mb-2">
                    {row.map((a: { text: string; correct: boolean }, idx: number) => {
                      const answerIdx = rowIdx * layout + idx;
                      return (
                        <div key={answerIdx} className="flex items-center gap-2">
                          <span className={cx(
                            'inline-flex items-center justify-center w-7 h-7 rounded-full border font-semibold',
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
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="font-semibold mb-1 text-blue-700 text-left">Hướng dẫn giải</div>
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
