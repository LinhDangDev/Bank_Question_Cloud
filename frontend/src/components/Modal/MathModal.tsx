import { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import 'mathlive';
import katex from 'katex';
import type { MathfieldElement } from '../../types/mathlive';

interface MathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOk: (latex: string) => void;
  initialLatex?: string;
}

export default function MathModal({ isOpen, onClose, onOk, initialLatex = '' }: MathModalProps) {
  const [latex, setLatex] = useState(initialLatex);
  const mathFieldRef = useRef<MathfieldElement>(null);

  useEffect(() => {
    const el = mathFieldRef.current;
    if (el) {
      el.value = latex;
      const handler = (e: any) => setLatex(e.target.value);
      el.addEventListener('input', handler);
      return () => el.removeEventListener('input', handler);
    }
  }, [latex]);

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.value = initialLatex;
    }
    setLatex(initialLatex);
    // eslint-disable-next-line
  }, [isOpen]);

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
          ref={mathFieldRef}
          virtualkeyboardmode="onfocus"
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

// Register custom element if not already defined
if (typeof window !== 'undefined' && !window.customElements.get('math-field')) {
  // @ts-ignore
  window.customElements.define('math-field', (window as any).MathfieldElement || class extends HTMLElement {});
}
