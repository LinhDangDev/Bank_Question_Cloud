import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer = ({ content, className = '' }: MathRendererProps) => {
  const MarkdownComponent = ReactMarkdown as any;
  return (
    <div className={`math-renderer ${className}`}>
      <MarkdownComponent
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Allow rendering of basic HTML tags if needed.
          // For security, this should be carefully managed.
          // Here we are allowing a few safe tags to pass through.
          p: ({ node, ...props }: any) => <p {...props} />,
          span: ({ node, ...props }: any) => <span {...props} />,
          div: ({ node, ...props }: any) => <div {...props} />,
          strong: ({ node, ...props }: any) => <strong {...props} />,
          em: ({ node, ...props }: any) => <em {...props} />,
          ul: ({ node, ...props }: any) => <ul {...props} />,
          ol: ({ node, ...props }: any) => <ol {...props} />,
          li: ({ node, ...props }: any) => <li {...props} />,
          br: ({ node, ...props }: any) => <br {...props} />,
        }}
      >
        {content}
      </MarkdownComponent>
    </div>
  );
};
