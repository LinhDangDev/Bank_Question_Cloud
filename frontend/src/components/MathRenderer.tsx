import React, { useEffect, useRef } from 'react';

// Add global MathJax type definition for TypeScript
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

/**
 * Component for rendering math/LaTeX expressions in content
 */
export const MathRenderer = ({ content, displayMode = false, className = '' }: MathRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Process and render the math when the component mounts or content changes
    if (containerRef.current) {
      // For content with embedded LaTeX, we need to set the HTML first
      containerRef.current.innerHTML = content;

      // Then trigger MathJax processing
      if (window.MathJax) {
        try {
          window.MathJax.typesetPromise && window.MathJax.typesetPromise([containerRef.current])
            .catch((err: any) => console.error('MathJax error:', err));
        } catch (err) {
          console.error('Error rendering math:', err);
        }
      }
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${displayMode ? 'math-display' : ''} ${className}`}
    />
  );
};

/**
 * Component to initialize MathJax for the application
 */
export const MathJaxInitializer = () => {
  useEffect(() => {
    if (!window.MathJax) {
      // Create script element to load MathJax
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;

      // Configure MathJax
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true
        },
        svg: {
          fontCache: 'global'
        },
        options: {
          enableMenu: false  // Disable right-click menu
        }
      };

      // Add script to document
      document.head.appendChild(script);

      // Cleanup on unmount
      return () => {
        document.head.removeChild(script);
      };
    }
  }, []);

  return null;
};
