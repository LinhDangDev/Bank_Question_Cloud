import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  content: string;
  chemistryMode?: boolean;
}

/**
 * MathRenderer component - Renders LaTeX and chemistry formulas
 * Requires MathJax to be loaded in the page
 */
const MathRenderer: React.FC<MathRendererProps> = ({ content, chemistryMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    try {
      // Xử lý công thức LaTeX và công thức hóa học
      let processedContent = content;

      // Nếu là chế độ hóa học, thêm xử lý cho công thức hóa học
      if (chemistryMode) {
        // Xử lý các công thức hóa học phổ biến
        processedContent = processedContent
          // Xử lý công thức ce
          .replace(/\\ce\{([^}]+)\}/g, (_, formula) => {
            return `$\\ce{${formula}}$`;
          })
          // Xử lý H_2O và tương tự
          .replace(/(H|C|O|N|P|S|Cl|Na|K|Ca|Fe|Mg)_(\d+)/g, (_, element, subscript) => {
            return `$${element}_${subscript}$`;
          })
          // Xử lý số và nguyên tố như 2H, 3O
          .replace(/(\d+)(H|C|O|N|P|S|Cl|Na|K|Ca|Fe|Mg)/g, (_, number, element) => {
            return `$${number}${element}$`;
          });
      }

      // Đảm bảo các ký hiệu LaTeX được bao quanh bởi $ hoặc $$
      processedContent = processedContent
        // Không thay thế $$ vì đã là định dạng block math
        // Xử lý \begin{equation} và \end{equation}
        .replace(/\\begin\{equation\}([^]*?)\\end\{equation\}/g, (_, content) => {
          return `$$${content}$$`;
        })
        // Xử lý \begin{align} và \end{align}
        .replace(/\\begin\{align\}([^]*?)\\end\{align\}/g, (_, content) => {
          return `$$${content}$$`;
        })
        // Đảm bảo các phép tính phổ biến đều được render
        .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_, num, denom) => {
          if (!processedContent.includes(`$\\frac{${num}}{${denom}}$`)) {
            return `$\\frac{${num}}{${denom}}$`;
          }
          return `\\frac{${num}}{${denom}}`;
        })
        .replace(/\\sqrt\{([^}]*)\}/g, (_, content) => {
          if (!processedContent.includes(`$\\sqrt{${content}}$`)) {
            return `$\\sqrt{${content}}$`;
          }
          return `\\sqrt{${content}}`;
        });

      // Thiết lập HTML với nội dung đã xử lý
      containerRef.current.innerHTML = processedContent;

      // Khởi tạo MathJax nếu có sẵn
      if (window.MathJax?.typeset) {
        window.MathJax.typeset([containerRef.current]);
      } else {
        console.warn('MathJax is not loaded. LaTeX formulas will not be rendered properly.');
      }
    } catch (error) {
      console.error('Error rendering math content:', error);
      // Fallback để hiển thị nguyên bản nếu có lỗi
      if (containerRef.current) {
        containerRef.current.innerHTML = content;
      }
    }
  }, [content, chemistryMode]);

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${chemistryMode ? 'chemistry-renderer' : ''}`}
    />
  );
};

/**
 * Kiểm tra xem nội dung có chứa công thức toán học không
 */
export const containsMath = (content: string): boolean => {
  if (!content) return false;

  const mathPatterns = [
    /\$\$[^$]+\$\$/g,           // Block math $$...$$
    /\$[^$]+\$/g,              // Inline math $...$
    /\\begin\{equation\}/g,     // LaTeX equation environment
    /\\begin\{align\}/g,        // LaTeX align environment
    /\\frac\{[^}]*\}\{[^}]*\}/g, // Fractions
    /\\sqrt\{[^}]*\}/g,         // Square roots
    /\\sum/g,                   // Summation
    /\\int/g,                   // Integration
    /\\lim/g,                   // Limits
    /\\alpha|\\beta|\\gamma|\\delta|\\theta|\\pi|\\sigma/g, // Greek letters
    /\^[^{\s]|\^{[^}]+}/g,      // Superscripts
    /_[^{\s]|_{[^}]+}/g,        // Subscripts
  ];

  return mathPatterns.some(pattern => pattern.test(content));
};

/**
 * Trích xuất các biểu thức LaTeX từ nội dung
 */
export const extractLatexExpressions = (content: string): string[] => {
  if (!content) return [];

  const expressions: string[] = [];
  const patterns = [
    /\$\$([^$]+)\$\$/g,         // Block math
    /\$([^$]+)\$/g,             // Inline math
    /\\begin\{equation\}([^]*?)\\end\{equation\}/g,
    /\\begin\{align\}([^]*?)\\end\{align\}/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      expressions.push(match[1]);
    }
  });

  return expressions;
};

/**
 * Kiểm tra tính hợp lệ của biểu thức LaTeX
 */
export const validateLatex = (latex: string): boolean => {
  if (!latex) return false;

  try {
    // Kiểm tra cặp ngoặc nhọn
    const braceCount = (latex.match(/\{/g) || []).length - (latex.match(/\}/g) || []).length;
    if (braceCount !== 0) return false;

    // Kiểm tra các lệnh LaTeX cơ bản
    const invalidPatterns = [
      /\\[a-zA-Z]+\{[^}]*$/,     // Lệnh không đóng ngoặc
      /\{[^}]*$/,                // Ngoặc nhọn không đóng
      /\$[^$]*$/,                // Dollar sign không đóng
    ];

    return !invalidPatterns.some(pattern => pattern.test(latex));
  } catch (error) {
    return false;
  }
};

/**
 * Làm sạch LaTeX để lưu trữ
 */
export const cleanLatexForStorage = (content: string): string => {
  if (!content) return '';

  return content
    // Loại bỏ khoảng trắng thừa
    .replace(/\s+/g, ' ')
    .trim()
    // Chuẩn hóa dollar signs
    .replace(/\$\s+/g, '$')
    .replace(/\s+\$/g, '$')
    // Chuẩn hóa ngoặc nhọn
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}');
};

export { MathRenderer };
export default MathRenderer;
