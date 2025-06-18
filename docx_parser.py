#!/usr/bin/env python3
import sys
import re
import json
import mammoth
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
import argparse


@dataclass
class Answer:
    text: str
    is_correct: bool
    shuffle: bool = True
    order: int = 0


@dataclass
class Question:
    content: str
    answers: List[Answer] = field(default_factory=list)
    question_type: str = "single-choice"
    is_group: bool = False
    child_questions: List[Any] = field(default_factory=list)
    clo: Optional[str] = None
    shuffle_answers: bool = True


def extract_equations_from_docx(docx_path):
    """Extract and preserve equations from Word documents."""
    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_html(
            docx_file,
            transform_document=mammoth.transforms.paragraph(
                lambda p: mammoth.transforms.run(
                    lambda r: mammoth.transforms.get_descendants_of_type(
                        r, "equation")
                )(p)
            )
        )

    html = result.value
    # Convert Word's OMML equations to LaTeX format
    html = re.sub(r'<equation>(.*?)</equation>', r'$\1$', html)
    return html


def parse_question_content(content):
    """Parse the question content and extract LaTeX equations."""
    # Replace Word's equation format with LaTeX
    content = re.sub(r'<eq>(.*?)</eq>', r'$\1$', content)
    return content


def parse_answers(content):
    """Parse answer choices according to the defined format."""
    answers = []

    # Split by A., B., C., D. pattern
    answer_pattern = re.compile(r'([A-D]\.)(.*?)(?=(?:[A-D]\.)|$)', re.DOTALL)

    matches = answer_pattern.findall(content)

    # Determine if any answer is marked as not to be shuffled
    shuffle_info = re.search(r'Lựa chọn nào không cho hoán vị', content)
    no_shuffle_answers = []

    if shuffle_info:
        # Extract non-shuffling answers like "D, A, B"
        shuffle_match = re.search(
            r'Lựa chọn nào không cho hoán vị[^:]*:([^.]*)', content)
        if shuffle_match:
            no_shuffle_text = shuffle_match.group(1).strip()
            no_shuffle_answers = [a.strip()
                                  for a in no_shuffle_text.split(',')]

    # Find correct answers
    correct_answers = []
    correct_pattern = re.search(
        r'Phần đáp án\s*Câu lựa chọn đúng[^:]*:[^ABCD]*(([ABCD],?\s*)+)', content, re.DOTALL)
    if correct_pattern:
        correct_text = correct_pattern.group(1).strip()
        correct_answers = [a.strip()
                           for a in re.findall(r'[ABCD]', correct_text)]

    for i, (label, text) in enumerate(matches):
        answer_letter = label[0]  # A, B, C, or D
        answer_text = text.strip()

        # Check if this answer is correct
        is_correct = answer_letter in correct_answers

        # Check if this answer should be shuffled
        shuffle = answer_letter not in no_shuffle_answers

        answers.append(Answer(
            text=parse_question_content(answer_text),
            is_correct=is_correct,
            shuffle=shuffle,
            order=i
        ))

    return answers


def parse_docx(docx_path):
    """Parse a DOCX file containing questions with LaTeX equations."""
    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)

    html = result.value

    # Extract individual questions
    questions = []

    # Simple pattern to identify question blocks
    question_blocks = html.split("<h1>")

    for block in question_blocks[1:]:  # Skip the first empty block
        try:
            # Extract question content
            content = block.split("</h1>")[1].strip()

            # Extract question text before the answers
            question_text = content.split("A.")[0].strip()

            # Extract answer portion
            answer_section = "A." + content.split("A.")[1]

            # Create question object
            question = Question(
                content=parse_question_content(question_text),
                answers=parse_answers(answer_section),
                shuffle_answers=True
            )

            # Parse CLO if present
            clo_match = re.search(r'CLO\d+', content)
            if clo_match:
                question.clo = clo_match.group(0)

            questions.append(question)

        except Exception as e:
            print(f"Error parsing question: {e}")

    return questions


def questions_to_json(questions):
    """Convert question objects to JSON format."""
    output = []
    for i, q in enumerate(questions):
        question_json = {
            "id": f"q{i+1}",
            "content": q.content,
            "type": q.question_type,
            "clo": q.clo,
            "shuffleAnswers": q.shuffle_answers,
            "answers": []
        }

        for j, a in enumerate(q.answers):
            answer_json = {
                "id": f"a{i+1}_{j+1}",
                "content": a.text,
                "isCorrect": a.is_correct,
                "shuffle": a.shuffle,
                "order": a.order
            }
            question_json["answers"].append(answer_json)

        output.append(question_json)

    return json.dumps(output, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="Parse DOCX files with LaTeX equations and custom answer format")
    parser.add_argument("docx_file", help="Path to the DOCX file to parse")
    parser.add_argument("-o", "--output", help="Output JSON file path")
    args = parser.parse_args()

    try:
        docx_path = Path(args.docx_file)
        if not docx_path.exists():
            print(f"Error: File '{docx_path}' does not exist")
            return 1

        questions = parse_docx(docx_path)
        json_output = questions_to_json(questions)

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(json_output)
            print(
                f"Successfully wrote {len(questions)} questions to {args.output}")
        else:
            print(json_output)

        return 0

    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
