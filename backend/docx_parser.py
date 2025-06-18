#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import uuid
from typing import Dict, List, Optional, Tuple, Union
import logging

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('docx_parser')

try:
    import docx
    from docx.document import Document
    from docx.oxml.text.paragraph import CT_P
    from docx.text.paragraph import Paragraph
    from docx.text.run import Run
except ImportError:
    logger.error("python-docx not installed. Run: pip install python-docx")
    sys.exit(1)


def uuid_gen():
    return str(uuid.uuid4())


class DocxParser:
    def __init__(self, docx_path: str, process_images: bool = False, extract_styles: bool = False, preserve_latex: bool = False):
        self.docx_path = docx_path
        self.process_images = process_images
        self.extract_styles = extract_styles
        self.preserve_latex = preserve_latex
        self.document = self._load_document()

    def _load_document(self) -> Document:
        """Load the document using python-docx"""
        try:
            return docx.Document(self.docx_path)
        except Exception as e:
            logger.error(f"Error loading document: {e}")
            raise

    def _get_paragraph_text_with_formatting(self, paragraph: Paragraph) -> Dict:
        """Extract text and formatting from paragraph with enhanced format detection"""
        text = ""
        runs_data = []
        latex_expressions = []
        in_latex = False
        current_latex = ""

        for run in paragraph.runs:
            # Enhanced formatting detection - look deeper for underlined text
            is_bold = run.bold or (hasattr(run, 'font') and run.font.bold)
            is_italic = run.italic or (
                hasattr(run, 'font') and run.font.italic)

            # Check for underline in multiple ways
            is_underline = False
            if run.underline:
                is_underline = True
            elif hasattr(run, 'font') and hasattr(run.font, 'underline'):
                is_underline = bool(run.font.underline)

            # XML-level check for underline
            if not is_underline and hasattr(run, '_element') and hasattr(run._element, 'rPr'):
                rPr = run._element.rPr
                if rPr is not None and rPr.u is not None:
                    is_underline = True

            # Detect LaTeX expressions
            run_text = run.text

            # Check for LaTeX delimiters in this run
            if '$' in run_text and self.preserve_latex:
                # If we're not in a LaTeX expression and find a $, start one
                if not in_latex and run_text.count('$') % 2 == 1:
                    in_latex = True
                    dollar_pos = run_text.find('$')
                    current_latex = run_text[dollar_pos:]
                    # Keep the text before the LaTeX expression
                    run_text = run_text[:dollar_pos]
                # If we're in a LaTeX expression and find a closing $, end it
                elif in_latex and '$' in run_text:
                    dollar_pos = run_text.find('$')
                    current_latex += run_text[:dollar_pos+1]
                    in_latex = False
                    latex_expressions.append(current_latex)
                    current_latex = ""
                    # Keep the text after the LaTeX expression
                    run_text = run_text[dollar_pos+1:]
                # If we're in a LaTeX expression, add the whole run
                elif in_latex:
                    current_latex += run_text
                    run_text = ""

            # Also detect \begin{...} and \end{...} LaTeX environments
            elif self.preserve_latex and ('\\begin{' in run_text or '\\end{' in run_text or in_latex):
                if not in_latex and '\\begin{' in run_text:
                    in_latex = True
                    begin_pos = run_text.find('\\begin{')
                    current_latex = run_text[begin_pos:]
                    run_text = run_text[:begin_pos]
                elif in_latex and '\\end{' in run_text and '}' in run_text[run_text.find('\\end{'):]:
                    end_pos = run_text.find('\\end{')
                    end_brace_pos = run_text.find('}', end_pos)
                    if end_brace_pos != -1:
                        current_latex += run_text[:end_brace_pos+1]
                        in_latex = False
                        latex_expressions.append(current_latex)
                        current_latex = ""
                        run_text = run_text[end_brace_pos+1:]
                    else:
                        current_latex += run_text
                        run_text = ""
                elif in_latex:
                    current_latex += run_text
                    run_text = ""

            run_data = {
                "text": run_text,
                "bold": is_bold,
                "italic": is_italic,
                "underline": is_underline,
                "style": run.style.name if hasattr(run, 'style') and run.style else None
            }

            runs_data.append(run_data)
            text += run_text

        # If we're still in a LaTeX expression at the end, add it
        if in_latex and current_latex:
            latex_expressions.append(current_latex)

        # Add all LaTeX expressions back to the text
        for latex in latex_expressions:
            text += latex

        return {
            "text": text,
            "runs": runs_data,
            "latex_expressions": latex_expressions if latex_expressions else None
        }

    def _is_answer_correct(self, paragraph: Dict) -> bool:
        """Enhanced detection if the answer is marked as correct (underlined or formatted)"""
        if not paragraph.get("runs"):
            return False

        # Check if any run is underlined (correct answer)
        for run in paragraph["runs"]:
            if run.get("underline", False):
                logger.info(f"Found underlined answer: {run.get('text')}")
                return True

        return False

    def _is_answer_line(self, text: str) -> bool:
        """Improved check if line is an answer option (starts with A., B., C., or D.)"""
        return bool(re.match(r"^\s*[A-D][\.|\)]?\s", text.strip()))

    def _parse_single_question(self, block: List[Dict]) -> Dict:
        """Parse a single question from a block of paragraphs"""
        question = {
            "id": uuid_gen(),
            "content": "",
            "answers": [],
            "type": "single-choice",
            "has_latex": False
        }

        # Extract CLO information if present
        clo_match = None
        for p in block:
            text = p["text"]
            clo_match = re.search(r"\(CLO\d+\)", text)
            if clo_match:
                question["clo"] = clo_match.group(
                    0).replace("(", "").replace(")", "")
                break

        # Process question content and answers
        content_parts = []
        current_answers = []
        in_question_content = True
        has_latex = False

        for p in block:
            text = p["text"].strip()

            # Check if paragraph contains LaTeX
            if p.get("latex_expressions") and self.preserve_latex:
                has_latex = True

            # If it's an answer line, switch to answer processing mode
            if self._is_answer_line(text):
                in_question_content = False

                # Extract answer letter (A, B, C, D)
                answer_letter = text[0]

                # Remove the letter and formatting
                answer_text = re.sub(r"^\s*[A-D][\.|\)]?\s", "", text).strip()

                # Check if this answer is correct (underlined)
                is_correct = self._is_answer_correct(p)

                current_answers.append({
                    "id": uuid_gen(),
                    "content": answer_text,
                    "isCorrect": is_correct,
                    "order": len(current_answers)
                })
            elif in_question_content:
                # If it's the question content, add to content parts
                # Remove CLO marker if present
                if clo_match and clo_match.group(0) in text:
                    text = text.replace(clo_match.group(0), "").strip()

                if text:
                    content_parts.append(text)

        # Set question content and answers
        question["content"] = " ".join(content_parts).strip()
        question["answers"] = current_answers

        # Set question type based on number of correct answers
        correct_count = sum(
            1 for a in current_answers if a.get("isCorrect", False))
        if correct_count > 1:
            question["type"] = "multi-choice"

        # Set has_latex flag
        question["has_latex"] = has_latex

        return question

    def _parse_group_question(self, block: List[Dict]) -> Dict:
        """Parse a group question with its child questions"""
        group_question = {
            "id": uuid_gen(),
            "content": "",
            "type": "group",
            "childQuestions": [],
            "has_latex": False
        }

        # Extract CLO information if present
        for p in block:
            text = p["text"]
            clo_match = re.search(r"\(CLO\d+\)", text)
            if clo_match:
                group_question["clo"] = clo_match.group(
                    0).replace("(", "").replace(")", "")
                break

        # Process group content and child questions
        group_content_blocks = []
        child_question_blocks = []
        current_block = []
        in_group_content = False
        past_group_content = False
        has_latex = False

        for p in block:
            text = p["text"].strip()

            # Check if paragraph contains LaTeX
            if p.get("latex_expressions") and self.preserve_latex:
                has_latex = True

            # Start of group content
            if "[<sg>]" in text:
                in_group_content = True
                # Remove the marker and add remaining text
                text = text.replace("[<sg>]", "").strip()
                if text:
                    group_content_blocks.append(
                        {"text": text, "runs": p.get("runs"), "latex_expressions": p.get("latex_expressions")})
                continue

            # End of group content
            if "[<egc>]" in text:
                in_group_content = False
                past_group_content = True
                # Remove the marker and add remaining text
                text = text.replace("[<egc>]", "").strip()
                if text:
                    current_block.append({"text": text, "runs": p.get(
                        "runs"), "latex_expressions": p.get("latex_expressions")})
                continue

            # End of group
            if "[</sg>]" in text:
                # Process any remaining block
                if current_block:
                    child_question_blocks.append(current_block)
                break

            # If in group content, add to group content blocks
            if in_group_content:
                group_content_blocks.append(
                    {"text": text, "runs": p.get("runs"), "latex_expressions": p.get("latex_expressions")})
            else:
                # Look for child question markers - improved pattern matching
                child_match = re.search(r"\(\s*<\s*(\d+)\s*>\s*\)", text)
                if child_match:
                    # Save previous block if exists
                    if current_block:
                        child_question_blocks.append(current_block)

                    # Start new block
                    current_child_idx = int(child_match.group(1))
                    current_block = []

                    # Add text without marker
                    clean_text = text.replace(child_match.group(0), "").strip()
                    if clean_text:
                        current_block.append(
                            {"text": clean_text, "runs": p.get("runs"), "latex_expressions": p.get("latex_expressions")})
                else:
                    # Continue building current block
                    current_block.append(p)

        # Process any remaining block
        if current_block:
            child_question_blocks.append(current_block)

        # Process group content
        if group_content_blocks:
            group_content_text = " ".join(
                [b["text"] for b in group_content_blocks]).strip()
            group_question["groupContent"] = group_content_text

        # Process child questions
        for child_block in child_question_blocks:
            child_question = self._parse_single_question(child_block)
            child_question["inGroup"] = True
            child_question["groupId"] = group_question["id"]

            # If any child question has LaTeX, mark the group as having LaTeX
            if child_question.get("has_latex", False):
                has_latex = True

            group_question["childQuestions"].append(child_question)

        # Set has_latex flag for the group
        group_question["has_latex"] = has_latex

        return group_question

    def _post_process_latex(self, question):
        """Post-process LaTeX expressions in a question"""
        # If preserve_latex is not enabled, return question as is
        if not self.preserve_latex:
            return question

        # Check if question has LaTeX expressions
        has_latex = False

        # Process question content
        if question.get("content"):
            # Check for LaTeX delimiters
            if re.search(r'\$|\\\(|\\\[|\\begin\{', question["content"]):
                has_latex = True

        # Process answers
        if question.get("answers"):
            for answer in question["answers"]:
                if re.search(r'\$|\\\(|\\\[|\\begin\{', answer.get("content", "")):
                    has_latex = True

        # Process child questions
        if question.get("childQuestions"):
            for child in question["childQuestions"]:
                child_has_latex = self._post_process_latex(child)
                if child_has_latex:
                    has_latex = True

        # Update the has_latex flag
        question["has_latex"] = has_latex

        return has_latex

    def parse_questions(self) -> List[Dict]:
        """Parse all questions from the document"""
        questions = []

        # Extract all paragraphs with formatting
        all_paragraphs = []
        for paragraph in self.document.paragraphs:
            formatted_paragraph = self._get_paragraph_text_with_formatting(
                paragraph)
            if formatted_paragraph["text"].strip():  # Skip empty paragraphs
                all_paragraphs.append(formatted_paragraph)

        # Detect question blocks
        question_blocks = self._detect_questions_by_pattern(all_paragraphs)

        # Process each question block
        for block in question_blocks:
            # Skip empty blocks
            if not block:
                continue

            # Check if it's a group question
            is_group = any("[<sg>]" in p["text"] for p in block)

            if is_group:
                question = self._parse_group_question(block)
            else:
                question = self._parse_single_question(block)

            if question["content"] or (question.get("childQuestions") and question["childQuestions"]):
                # Post-process LaTeX expressions
                self._post_process_latex(question)
                questions.append(question)

        logger.info(f"Successfully parsed {len(questions)} questions")
        return questions

    def _extract_images(self, docx_path: str) -> Dict[str, str]:
        """Extract images from the DOCX file (not implemented yet)"""
        # This is a placeholder for future implementation
        return {}

    def _detect_questions_by_pattern(self, paragraphs: List[Dict]) -> List[List[Dict]]:
        """Detect question blocks by looking for question patterns and separators"""
        question_blocks = []
        current_block = []

        for p in paragraphs:
            text = p["text"].strip()

            # Check for question separators like [<br>], === or empty lines followed by question pattern
            is_separator = (
                "[<br>]" in text or
                text == "===" or
                (not text and current_block and len(current_block) > 0)
            )

            # If we have a separator and a non-empty current block, save it
            if is_separator and current_block:
                question_blocks.append(current_block)
                current_block = []
                continue

            # Skip completely empty paragraphs that aren't acting as separators
            if not text:
                continue

            # Check if this is likely the start of a new question
            # (Beginning with question number or CLO marker)
            is_question_start = (
                re.match(r"^\d+[\.\)]\s", text) or  # Numbered questions
                re.match(r"^\(CLO\d+\)", text) or   # CLO marker at start
                # First answer option
                re.match(r"^[A-Z]\.\s", text) and len(current_block) == 0
            )

            if is_question_start and current_block:
                question_blocks.append(current_block)
                current_block = []

            # Add paragraph to current block
            current_block.append(p)

        # Don't forget the last block
        if current_block:
            question_blocks.append(current_block)

        return question_blocks


def main():
    parser = argparse.ArgumentParser(
        description='Parse DOCX file into questions')
    parser.add_argument('input_file', help='Path to the input DOCX file')
    parser.add_argument('output_file', help='Path to the output JSON file')
    parser.add_argument('--process-images', action='store_true',
                        help='Process and extract images')
    parser.add_argument('--extract-styles', action='store_true',
                        help='Extract detailed style information')
    parser.add_argument('--preserve-latex', action='store_true',
                        help='Preserve LaTeX math expressions')

    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        logger.error(f"Input file not found: {args.input_file}")
        sys.exit(1)

    try:
        docx_parser = DocxParser(
            args.input_file,
            process_images=args.process_images,
            extract_styles=args.extract_styles,
            preserve_latex=args.preserve_latex
        )
        questions = docx_parser.parse_questions()

        # Write output to JSON file
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

        logger.info(
            f"Successfully parsed {len(questions)} questions to {args.output_file}")
    except Exception as e:
        logger.error(f"Error parsing document: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
