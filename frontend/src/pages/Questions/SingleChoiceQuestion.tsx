import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import { Eye, Plus, Trash2, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Editor } from '@tinymce/tinymce-react';

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

const SingleChoiceQuestion = () => {
  const styles = useThemeStyles();
  const [content, setContent] = useState('');
  const [answers, setAnswers] = useState(defaultAnswers);
  const [explanation, setExplanation] = useState('');
  const [layout, setLayout] = useState(1);
  const [fixedOrder, setFixedOrder] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [saveLocation, setSaveLocation] = useState('frame');
  const [frame, setFrame] = useState('');
  const [knowledgeUnit, setKnowledgeUnit] = useState('');
  const [level, setLevel] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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

  return (
    <div className="flex flex-col md:flex-row w-full py-8 text-left">
      {/* Left: Main form */}
      <div className="flex-1 rounded-lg p-6 shadow md:mr-[300px]">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold text-blue-700 text-left">Câu hỏi trắc nghiệm 1 đáp án</h2>
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="mb-4" style={{ minWidth: 920 }}>
          <label className="font-medium mb-1 flex items-center gap-1 text-left">
            Câu hỏi <Info className="w-4 h-4 text-blue-400" />
          </label>
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
        <div className="mb-4">
          {answers.map((a, idx) => (
            <div key={idx} className="flex gap-8 mb-6">
              <div className="flex items-center gap-4 w-full">
                <label className="w-20 min-w-[80px] font-medium">Đáp án {String.fromCharCode(65 + idx)} <span className="text-red-500">*</span></label>
                <Input
                  className="flex-1 min-w-[280px] max-w-full"
                  placeholder={`Nhập đáp án`}
                  value={a.text}
                  onChange={e => handleAnswerChange(idx, e.target.value)}
                />
                <input
                  type="radio"
                  name="correct"
                  checked={a.correct}
                  onChange={() => handleCorrectChange(idx)}
                  className="ml-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAnswer(idx)}
                  disabled={answers.length <= 2}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={handleAddAnswer} className="text-blue-600 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Thêm đáp án
          </Button>
        </div>

      </div>
      {/* Right: Info panel */}
      <div className="fixed right-8 w-[300px] bg-white rounded-lg p-6 shadow h-fit text-left z-50" style={{ top: '88px' }}>
        <div className="flex gap-2 mb-4 justify-end">
          <Button variant="outline" className="flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-100" onClick={() => setShowPreview(true)}><Eye className="w-4 h-4" /> Xem trước</Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">Lưu</Button>
          <Button className="bg-blue-700 hover:bg-blue-800 text-white">Lưu & Thêm</Button>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1 text-left">Bố cục đáp án <span className="text-red-500">*</span></label>
          <select
            className="w-full border rounded-md p-2"
            value={layout}
            onChange={e => setLayout(Number(e.target.value))}
          >
            {layoutOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={fixedOrder} onChange={e => setFixedOrder(e.target.checked)} />
          <span>Cố định thứ tự đáp án</span>
        </div>

        <div className="font-semibold mb-2 text-left">Thông tin câu hỏi</div>
        {/* <div className="mb-2">
          <label className="block text-sm mb-1 text-left">Lưu tại</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input type="radio" checked={saveLocation === 'frame'} onChange={() => setSaveLocation('frame')} />
              Lưu tại bộ đề
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={saveLocation === 'bank'} onChange={() => setSaveLocation('bank')} />
              Lưu tại kho cá nhân
            </label>
          </div>
        </div> */}
        <div className="mb-2">
          <label className="block text-sm mb-1 text-left">Bộ đề <span className="text-red-500">*</span></label>
          <Input value={frame} onChange={e => setFrame(e.target.value)} placeholder="Chọn bộ đề" />
        </div>
        <div className="mb-2">
          <label className="block text-sm mb-1 text-left">Đơn vị kiến thức <span className="text-red-500">*</span></label>
          <Input value={knowledgeUnit} onChange={e => setKnowledgeUnit(e.target.value)} placeholder="Chọn" />
        </div>
        <div className="mb-2">
          <label className="block text-sm mb-1 text-left">Mức độ CLO <span className="text-red-500">*</span></label>
          <Input value={level} onChange={e => setLevel(e.target.value)} placeholder="Chọn" />
        </div>
      </div>
      {showPreview && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative"
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
