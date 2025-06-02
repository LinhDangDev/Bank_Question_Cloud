import { useState } from 'react';
import { Modal } from './Modal';
import { MathfieldElement } from 'react-mathlive';
import katex from 'katex';

interface MathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOk: (latex: string) => void;
  initialLatex?: string;
}

export default function MathModal({ isOpen, onClose, onOk, initialLatex = '' }: MathModalProps) {
  const [latex, setLatex] = useState(initialLatex);
  const [input, setInput] = useState(initialLatex);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập / sửa ký tự toán học"
      size="md"
      footer={
        <>
          <button className="px-4 py-2 mr-2 rounded bg-gray-100" onClick={onClose}>Hủy</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => { onOk(latex); onClose(); }}>OK</button>
        </>
      }
    >
      <div className="mb-4">
        <math-field
          value={latex}
          onInput={(e: any) => setLatex(e.target.value)}
          virtualKeyboardMode="onfocus"
          style={{ width: '100%', minHeight: 40, fontSize: 22 }}
        />
      </div>
      <div className="mb-4">
        <textarea
          className="w-full border rounded p-2 min-h-[60px]"
          value={latex}
          onChange={e => setLatex(e.target.value)}
          placeholder="Nhập LaTeX..."
        />
      </div>
      <div className="border-t pt-2 mt-2">
        <div className="font-semibold mb-1">Preview</div>
        <div
          className="p-2 min-h-[40px] bg-gray-50 rounded"
          dangerouslySetInnerHTML={{ __html: katex.renderToString(latex, { throwOnError: false }) }}
        />
      </div>
    </Modal>
  );
}

// Đăng ký custom element nếu chưa có
if (typeof window !== 'undefined' && !window.customElements.get('math-field')) {
  window.customElements.define('math-field', MathfieldElement);
}
