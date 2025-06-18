#!/usr/bin/env python3
import os
import sys
import json
import argparse
from docx_parser import DocxParser


def main():
    parser = argparse.ArgumentParser(
        description='Test DOCX parser for question bank')
    parser.add_argument('input_file', help='Path to input DOCX file')
    parser.add_argument('--extract-styles', action='store_true',
                        help='Extract detailed styling information')
    parser.add_argument('--output', help='Path to output JSON file (optional)')
    args = parser.parse_args()

    # Check if input file exists
    if not os.path.exists(args.input_file):
        print(f"Error: Input file not found: {args.input_file}")
        sys.exit(1)

    print(f"Testing parser on file: {args.input_file}")

    try:
        # Initialize parser
        parser = DocxParser(args.input_file, process_images=False,
                            extract_styles=args.extract_styles)

        # Parse questions
        questions = parser.parse_questions()

        # Print summary of results
        print(f"Successfully parsed {len(questions)} questions")

        # Count question types
        single_choice = len(
            [q for q in questions if q["type"] == "single-choice"])
        multi_choice = len(
            [q for q in questions if q["type"] == "multi-choice"])
        group_questions = len([q for q in questions if q["type"] == "group"])

        # Count child questions in groups
        child_questions = sum(len(q.get("childQuestions", []))
                              for q in questions if q["type"] == "group")

        # Count answers
        total_answers = sum(len(q.get("answers", [])) for q in questions)

        # Count correct answers
        correct_answers = sum(sum(1 for a in q.get("answers", []) if a.get(
            "isCorrect", False)) for q in questions)

        # Count child answers
        child_answers = 0
        child_correct_answers = 0
        for q in questions:
            if q["type"] == "group":
                for child in q.get("childQuestions", []):
                    child_answers += len(child.get("answers", []))
                    child_correct_answers += sum(1 for a in child.get(
                        "answers", []) if a.get("isCorrect", False))

        # Print summary
        print("\nQuestion Types:")
        print(f"  Single Choice: {single_choice}")
        print(f"  Multi Choice: {multi_choice}")
        print(f"  Group Questions: {group_questions}")
        print(f"  Child Questions: {child_questions}")
        print("\nAnswers:")
        print(f"  Total Answers: {total_answers}")
        print(f"  Correct Answers: {correct_answers}")
        print(f"  Child Answers: {child_answers}")
        print(f"  Child Correct Answers: {child_correct_answers}")

        # Save output if requested
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            print(f"\nOutput saved to: {args.output}")
        else:
            # Print detailed representation of the first question
            if questions:
                print("\nSample Question:")
                q = questions[0]
                print(f"  Type: {q['type']}")
                print(f"  Content: {q['content'][:100]}...")
                if q['type'] == 'group':
                    print(
                        f"  Group Content: {q.get('groupContent', '')[:100]}...")
                    print(
                        f"  Child Questions: {len(q.get('childQuestions', []))}")
                else:
                    print(f"  Answers: {len(q.get('answers', []))}")
                    for i, a in enumerate(q.get("answers", [])[:3]):
                        print(
                            f"    {chr(65+i)}. {a['content'][:50]}... (Correct: {a['isCorrect']})")
                    if len(q.get("answers", [])) > 3:
                        print(
                            f"    ... and {len(q.get('answers', [])) - 3} more answers")

    except Exception as e:
        print(f"Error parsing document: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
