import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    MathJax?: any;
  }
}

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer = ({ content, displayMode = false, className = '' }: MathRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax) {
      // Process the content for rendering if needed
      let processedContent = content;

      // Replace simple dollar signs with LaTeX delimiters if not already done
      if (!content.includes('\\(') && !content.includes('\\[')) {
        // Handle double dollar signs first (display mode)
        processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, '\\[$1\\]');

        // Then handle single dollar signs (inline mode)
        // Use non-greedy matching to handle multiple expressions on the same line
        processedContent = processedContent.replace(/\$([^\$]+?)\$/g, '\\($1\\)');
      }

      // Update the container's HTML
      containerRef.current.innerHTML = processedContent;

      // Render math using MathJax
      try {
        if (window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
            console.error('MathJax typeset error:', err);
          });
        } else if (window.MathJax.typeset) {
          window.MathJax.typeset([containerRef.current]);
        }
      } catch (error) {
        console.error('Error rendering math:', error);
      }
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-content ${displayMode ? 'block my-4' : 'inline'} ${className}`}
    />
  );
};

// Initialization component to ensure MathJax is loaded
export const MathJaxInitializer = () => {
  useEffect(() => {
    if (!window.MathJax) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.id = 'MathJax-script';

      // Configure MathJax before loading the script
      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)'], ['$', '$']],
          displayMath: [['\\[', '\\]'], ['$$', '$$']],
          processEscapes: true,
          processEnvironments: true
        },
        options: {
          ignoreHtmlClass: 'no-mathjax',
          processHtmlClass: 'mathjax'
        }
      };

      document.head.appendChild(script);

      return () => {
        // Clean up if component unmounts
        if (document.getElementById('MathJax-script')) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  return null;
};
