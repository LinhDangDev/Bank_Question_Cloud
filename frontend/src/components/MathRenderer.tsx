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
  // Add additional CSS for better LaTeX rendering
  const customStyles = `
    .katex {
      font-size: 1.15em;
    }
    .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.5em 0;
    }
  `;

  const MarkdownComponent = ReactMarkdown as any;

  // Preprocess content to ensure LaTeX renders correctly
  let processedContent = content;

  // Make sure all LaTeX commands are properly escaped in markdown context
  if (processedContent && !processedContent.includes('```math')) {
    // Convert explicit LaTeX notation that might not be captured by remark-math
    processedContent = processedContent
      // Ensure proper spacing for display math mode
      .replace(/\$\$(.*?)\$\$/g, '\n\n$$\n$1\n$$\n\n')
      // Convert LaTeX commands outside of math delimiters
      .replace(/(^|[^$])\\((?:forall|exists|in|subset|cup|cap|rightarrow|Rightarrow))/g, '$1$\\$2$');
  }

  return (
    <div className={`math-renderer ${className}`}>
      <style>{customStyles}</style>
      <MarkdownComponent
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, {
            throwOnError: false,
            strict: false,
            output: 'htmlAndMathml',
            trust: true,
            macros: {
              // Common LaTeX macros used in mathematical notation
              "\\E": "\\mathbb{E}",
              "\\R": "\\mathbb{R}",
              "\\N": "\\mathbb{N}",
              "\\Z": "\\mathbb{Z}"
            }
          }]
        ]}
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
          code: ({ node, inline, className, children, ...props }: any) => {
            // Special handling for code blocks that might contain LaTeX
            const match = /language-(\w+)/.exec(className || '');
            const isLatex = match && (match[1] === 'latex' || match[1] === 'math' || match[1] === 'tex');

            if (isLatex) {
              return <span className="katex-block">{children}</span>;
            }

            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <pre className={className}>
                <code {...props}>{children}</code>
              </pre>
            );
          }
        }}
      >
        {processedContent}
      </MarkdownComponent>
    </div>
  );
};

export default MathRenderer;
