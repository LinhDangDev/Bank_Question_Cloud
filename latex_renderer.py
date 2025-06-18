#!/usr/bin/env python3
import sys
import re
import json
import argparse
from pathlib import Path


def convert_equations_to_mathjax(html_content):
    """
    Convert different equation formats to MathJax compatible syntax
    """
    # Convert Word's equation format
    html_content = re.sub(r'<equation>(.*?)</equation>',
                          r'\\(\\1\\)', html_content)

    # Convert standard LaTeX format with $...$ to \(...\)
    html_content = re.sub(r'\$(.*?)\$', r'\\(\1\\)', html_content)

    # Convert display math mode $$...$$ to \[...\]
    html_content = re.sub(r'\$\$(.*?)\$\$', r'\\[\1\\]', html_content)

    # Leave existing \(...\) and \[...\] alone as they're already correctly formatted

    return html_content


def process_json_file(json_path):
    """
    Process a JSON file containing questions and answers with equations
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Process each question and its answers
    for question in data:
        if 'content' in question:
            question['content'] = convert_equations_to_mathjax(
                question['content'])

        if 'answers' in question:
            for answer in question['answers']:
                if 'content' in answer:
                    answer['content'] = convert_equations_to_mathjax(
                        answer['content'])

        # Process child questions if present
        if 'childQuestions' in question and question['childQuestions']:
            for child in question['childQuestions']:
                if 'content' in child:
                    child['content'] = convert_equations_to_mathjax(
                        child['content'])

                if 'answers' in child:
                    for answer in child['answers']:
                        if 'content' in answer:
                            answer['content'] = convert_equations_to_mathjax(
                                answer['content'])

    return data


def inject_mathjax_script():
    """
    Return the MathJax configuration script to inject into HTML
    """
    return """
    <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true
      },
      options: {
        ignoreHtmlClass: 'no-mathjax',
        processHtmlClass: 'mathjax'
      },
      startup: {
        ready: () => {
          MathJax.startup.defaultReady();
          document.querySelectorAll('.math-content').forEach(el => {
            MathJax.typeset([el]);
          });
        }
      }
    };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    """


def create_mathjax_component_code():
    """
    Generate React component code for rendering LaTeX content
    """
    return """import { useEffect, useRef } from 'react';

export const MathRenderer = ({ content, displayMode = false }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax) {
      // Process the content for rendering
      const processedContent = content
        .replace(/\\\(/g, '$$')  // Convert \\( to $$
        .replace(/\\\)/g, '$$')  // Convert \\) to $$
        .replace(/\\\[/g, '$$$$') // Convert \\[ to $$$$
        .replace(/\\\]/g, '$$$$'); // Convert \\] to $$$$

      // Update the container's HTML
      containerRef.current.innerHTML = processedContent;

      // Render math
      window.MathJax.typesetPromise([containerRef.current]).catch(err => {
        console.error('MathJax typeset error:', err);
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-content ${displayMode ? 'block my-4' : 'inline'}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
"""


def main():
    parser = argparse.ArgumentParser(
        description="Improve LaTeX equation rendering in frontend files")
    parser.add_argument("--input", "-i", help="Input file path (JSON)")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--create-component", action="store_true",
                        help="Generate React MathRenderer component")
    args = parser.parse_args()

    try:
        if args.create_component:
            component_code = create_mathjax_component_code()

            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(component_code)
                print(f"MathRenderer component written to {args.output}")
            else:
                print(component_code)
            return 0

        if not args.input:
            print("Error: Input file required. Use --input to specify a file.")
            return 1

        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: Input file '{input_path}' does not exist")
            return 1

        # Process the input file based on file type
        if input_path.suffix.lower() == '.json':
            processed_data = process_json_file(input_path)

            # Output the processed data
            output_data = json.dumps(
                processed_data, ensure_ascii=False, indent=2)

            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(output_data)
                print(f"Processed JSON written to {args.output}")
            else:
                print(output_data)
        else:
            print(f"Error: Unsupported file type: {input_path.suffix}")
            return 1

        return 0

    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
