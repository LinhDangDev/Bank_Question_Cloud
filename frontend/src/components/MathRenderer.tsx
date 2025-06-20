import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Component for rendering Markdown, HTML, and math/LaTeX expressions using react-markdown.
 */
export const MathRenderer = ({ content, className = '' }: MathRendererProps) => {
  return (
    <ReactMarkdown
      className={`math-renderer ${className}`}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // Allow rendering of basic HTML tags if needed.
        // For security, this should be carefully managed.
        // Here we are allowing a few safe tags to pass through.
        p: ({ node, ...props }) => <p {...props} />,
        span: ({ node, ...props }) => <span {...props} />,
        div: ({ node, ...props }) => <div {...props} />,
        strong: ({ node, ...props }) => <strong {...props} />,
        em: ({ node, ...props }) => <em {...props} />,
        ul: ({ node, ...props }) => <ul {...props} />,
        ol: ({ node, ...props }) => <ol {...props} />,
        li: ({ node, ...props }) => <li {...props} />,
        br: ({ node, ...props }) => <br {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
