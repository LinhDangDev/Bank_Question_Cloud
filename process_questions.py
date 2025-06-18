#!/usr/bin/env python3

import argparse
import json
import os
import re
import sys
from pathlib import Path
try:
    import mammoth
    from dataclasses import dataclass, field, asdict
    from typing import List, Dict, Optional, Any
except ImportError:
    print("Missing dependencies. Please install required packages:")
    print("pip install mammoth")
    sys.exit(1)


@dataclass
class Answer:
    text: str
    is_correct: bool
    shuffle: bool = True
    order: int = 0


@dataclass
class Question:
    id: str
    content: str
    answers: List[Answer] = field(default_factory=list)
    question_type: str = "single-choice"
    clo: Optional[str] = None
    shuffle_answers: bool = True


def process_docx(docx_path: str) -> List[Question]:
    """Process a DOCX file containing questions with specific formatting."""
    print(f"Processing file: {docx_path}")

    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)

    html = result.value

    # Split by question separator
    question_blocks = html.split("[<br>]")
    print(f"Found {len(question_blocks)} question blocks")

    questions = []
    for i, block in enumerate(question_blocks):
        if not block.strip():
            continue

        try:
            # Extract question content up to first answer
            match = re.search(r'(.*?)([A-D]\.\s.*)', block, re.DOTALL)
            if not match:
                print(f"Skipping block {i+1}, no answers found")
                continue

            question_text, answers_text = match.groups()

            # Extract CLO if present
            clo_match = re.search(r'\((CLO\d+)\)', question_text)
            clo = clo_match.group(1) if clo_match else None

            # Process non-shuffle info
            no_shuffle_match = re.search(
                r'Lựa chọn nào không cho hoán vị cho[^:]*:([^.]*)', block)
            no_shuffle_answers = []
            if no_shuffle_match:
                no_shuffle_text = no_shuffle_match.group(1).strip()
                no_shuffle_answers = [
                    a.strip() for a in re.findall(r'[A-D]', no_shuffle_text)]
                print(f"Found non-shuffling answers: {no_shuffle_answers}")

            # Extract correct answer
            correct_match = re.search(
                r'Phần đáp án[^:]*:[^A-D]*([A-D])', block)
            correct_answer = correct_match.group(1) if correct_match else None

            # Extract individual answers
            answer_pattern = re.compile(
                r'([A-D])\.([^A-D]*?)(?=[A-D]\.|$)', re.DOTALL)
            answer_matches = answer_pattern.findall(answers_text)

            answers = []
            for letter, text in answer_matches:
                is_correct = letter == correct_answer or '<u>' in text

                # Kiểm tra nếu đáp án có in nghiêng, đánh dấu không hoán vị
                has_italic = '<em>' in text or '<i>' in text
                shuffle = letter not in no_shuffle_answers and not has_italic

                # Clean answer text
                clean_text = text.strip()
                # Remove underline tags
                clean_text = re.sub(r'</?u>', '', clean_text)

                answers.append(Answer(
                    text=clean_text,
                    is_correct=is_correct,
                    shuffle=shuffle,
                    order=ord(letter) - ord('A')
                ))

            # Create question object
            question = Question(
                id=f"q{i+1}",
                content=question_text.strip(),
                answers=answers,
                clo=clo,
                # Only shuffle if not all answers are non-shuffle
                shuffle_answers=any(a.shuffle for a in answers)
            )

            questions.append(question)

        except Exception as e:
            print(f"Error processing block {i+1}: {e}")

    return questions


def format_output(questions: List[Question], output_format: str) -> str:
    """Format the processed questions for output."""
    if output_format == 'json':
        # Convert dataclasses to dictionaries
        questions_dict = [asdict(q) for q in questions]
        return json.dumps(questions_dict, ensure_ascii=False, indent=2)
    else:
        # Text format
        result = []
        for i, q in enumerate(questions):
            result.append(f"Question {i+1}: {q.content}")

            if q.clo:
                result.append(f"CLO: {q.clo}")

            result.append(f"Shuffle answers: {q.shuffle_answers}")

            for j, a in enumerate(q.answers):
                result.append(f"  {chr(65+j)}. {a.text}")
                result.append(
                    f"     Correct: {a.is_correct}, Shuffle: {a.shuffle}")

            result.append("")

        return "\n".join(result)


def main():
    parser = argparse.ArgumentParser(
        description="Process DOCX files with questions")
    parser.add_argument('input', help="Input DOCX file path")
    parser.add_argument('-o', '--output', help="Output file path")
    parser.add_argument('-f', '--format', choices=['json', 'text'], default='json',
                        help="Output format (default: json)")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found")
        return 1

    try:
        questions = process_docx(args.input)

        if not questions:
            print("No questions found in the document")
            return 1

        print(f"Successfully processed {len(questions)} questions")

        # Format output
        output_content = format_output(questions, args.format)

        # Write to file or stdout
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output_content)
            print(f"Results written to {args.output}")
        else:
            print(output_content)

        return 0

    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
