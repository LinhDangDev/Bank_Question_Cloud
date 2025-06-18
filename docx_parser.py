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
    def __init__(self, docx_path: str, process_images: bool = False, extract_styles: bool = False):
        self.docx_path = docx_path
        self.process_images = process_images
        self.extract_styles = extract_styles
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

        for run in paragraph.runs:
            # Enhanced formatting detection
            is_bold = run.bold or (hasattr(run, 'font') and run.font.bold)
            is_italic = run.italic or (
                hasattr(run, 'font') and run.font.italic)
            is_underline = run.underline or (
                hasattr(run, 'font') and
                (run.font.underline or
                 (hasattr(run.font, 'underline_values') and run.font.underline_values))
            )

            run_data = {
                "text": run.text,
                "bold": is_bold,
                "italic": is_italic,
                "underline": is_underline,
                "style": run.style.name if hasattr(run, 'style') and run.style else None
            }

            runs_data.append(run_data)
            text += run.text

        return {
            "text": text,
            # Always keep runs for correct answer detection
            "runs": runs_data if self.extract_styles else runs_data
        }

    def _is_answer_correct(self, paragraph: Dict) -> bool:
        """Enhanced detection if the answer is marked as correct (underlined or formatted)"""
        if not paragraph.get("runs"):
            return False

        # Check if any run is underlined (correct answer)
        for run in paragraph["runs"]:
            if run.get("underline", False):
                return True

            # Some templates use bold instead of underline for correct answers
            # Particularly check if the content part is bold, not just the letter
            if run.get("bold", False) and len(run.get("text", "").strip()) > 2:
                # Make sure it's not just a bolded answer letter (A., B., etc)
                text = run.get("text", "").strip()
                if not text.startswith("A.") and not text.startswith("B.") and not text.startswith("C.") and not text.startswith("D."):
                    return True

        return False

    def _is_answer_line(self, text: str) -> bool:
        """Improved check if line is an answer option (starts with A., B., C., or D.)"""
        return bool(re.match(r"^\s*[A-D]\.\s", text.strip()))

    def _extract_question_content(self, paragraphs: List[Dict]) -> Tuple[str, List[Dict], Optional[str]]:
        """Extract question content, answers and CLO from paragraphs with improved detection"""
        question_text = ""
        answers = []
        clo = None

        # Extract CLO if present
        clo_match = re.search(
            r"\(CLO\d+\)", paragraphs[0]["text"]) if paragraphs else None
        if clo_match:
            clo = clo_match.group(0).strip("()")
            paragraphs[0]["text"] = paragraphs[0]["text"].replace(
                clo_match.group(0), "").strip()

        in_question = True
        question_parts = []

        for p in paragraphs:
            if self._is_answer_line(p["text"]):
                in_question = False

                # Extract answer letter and content
                match = re.match(r"^\s*([A-D])\.\s*(.*)", p["text"].strip())
                if match:
                    letter = match.group(1)
                    content = match.group(2)

                    # Check if answer is correct (underlined)
                    is_correct = self._is_answer_correct(p)

                    answers.append({
                        "letter": letter,
                        "content": content,
                        "isCorrect": is_correct
                    })
            elif in_question:
                # Still in question content
                question_parts.append(p["text"].strip())

        # Join question parts with proper spacing
        question_text = " ".join(question_parts)

        return question_text, answers, clo

    def _parse_group_question(self, block: List[Dict]) -> Dict:
        """Parse a group question with its child questions"""
        group_question = {
            "type": "group",
            "content": "",
            "groupContent": "",
            "clo": None,
            "childQuestions": []
        }

        # Extract group content between [<sg>] and [<egc>]
        group_content_blocks = []
        child_question_blocks = []
        current_block = []

        in_group_content = False
        past_group_content = False
        current_child_idx = -1

        # Extract CLO from first paragraph if present
        if block and block[0]["text"]:
            clo_match = re.search(r"\(CLO\d+\)", block[0]["text"])
            if clo_match:
                group_question["clo"] = clo_match.group(0).strip("()")
                # Remove CLO from content
                block[0]["text"] = block[0]["text"].replace(
                    clo_match.group(0), "").strip()

        for p in block:
            text = p["text"].strip()

            # Start of group content
            if "[<sg>]" in text:
                in_group_content = True
                # Remove the marker and add remaining text
                text = text.replace("[<sg>]", "").strip()
                if text:
                    group_content_blocks.append(
                        {"text": text, "runs": p.get("runs")})
                continue

            # End of group content
            if "[<egc>]" in text:
                in_group_content = False
                past_group_content = True
                # Remove the marker and add remaining text
                text = text.replace("[<egc>]", "").strip()
                if text:
                    current_block.append({"text": text, "runs": p.get("runs")})
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
                    {"text": text, "runs": p.get("runs")})
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
                            {"text": clean_text, "runs": p.get("runs")})
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
            if not child_block:
                continue

            question_text, answers, clo = self._extract_question_content(
                child_block)

            child_question = {
                "type": "single-choice" if len([a for a in answers if a["isCorrect"]]) <= 1 else "multi-choice",
                "content": question_text,
                # Inherit CLO from group if not specified
                "clo": clo or group_question["clo"],
                "answers": answers
            }

            group_question["childQuestions"].append(child_question)

        return group_question

    def _parse_single_question(self, block: List[Dict]) -> Dict:
        """Parse a single question"""
        question_text, answers, clo = self._extract_question_content(block)

        return {
            "type": "single-choice" if len([a for a in answers if a["isCorrect"]]) <= 1 else "multi-choice",
            "content": question_text,
            "clo": clo,
            "answers": answers
        }

    def parse_questions(self) -> List[Dict]:
        """Parse all questions from the document"""
        questions = []
        current_block = []

        # First pass: Extract all paragraphs with formatting
        all_paragraphs = []
        for paragraph in self.document.paragraphs:
            formatted_paragraph = self._get_paragraph_text_with_formatting(
                paragraph)
            if formatted_paragraph["text"].strip():  # Skip empty paragraphs
                all_paragraphs.append(formatted_paragraph)

        # Look for question block markers
        question_blocks = []
        current_block = []

        # Improved block detection
        for paragraph in all_paragraphs:
            text = paragraph["text"].strip()

            if "[<br>]" in text:
                # End of current block
                parts = text.split("[<br>]")

                # Add first part to current block
                if parts[0].strip():
                    current_block.append({**paragraph, "text": parts[0]})

                if current_block:
                    # Add the completed block
                    question_blocks.append(current_block)

                # Start a new block with any content after [<br>]
                current_block = []
                for part in parts[1:]:
                    if part.strip():
                        current_block.append({**paragraph, "text": part})
            else:
                current_block.append(paragraph)

        # Add the last block if not empty
        if current_block:
            question_blocks.append(current_block)

        # If no explicit blocks found, try to detect them by question patterns
        if len(question_blocks) <= 1:
            logger.info(
                "No explicit block markers, detecting questions by pattern...")
            question_blocks = self._detect_questions_by_pattern(all_paragraphs)

        # Process each question block
        for block in question_blocks:
            if not block:
                continue

            # Check if it's a group question
            is_group = any("[<sg>]" in p["text"] for p in block)

            if is_group:
                question = self._parse_group_question(block)
            else:
                question = self._parse_single_question(block)

            questions.append(question)

        # Add unique IDs to questions and answers
        for question in questions:
            question["id"] = uuid_gen()

            if question.get("answers"):
                for i, answer in enumerate(question["answers"]):
                    answer["id"] = uuid_gen()
                    answer["order"] = i

            if question.get("childQuestions"):
                for child in question["childQuestions"]:
                    child["id"] = uuid_gen()
                    for i, answer in enumerate(child.get("answers", [])):
                        answer["id"] = uuid_gen()
                        answer["order"] = i

    return questions

    def _detect_questions_by_pattern(self, paragraphs: List[Dict]) -> List[List[Dict]]:
        """Detect questions without explicit markers by looking for patterns"""
        blocks = []
        current_block = []
        in_question = False

        # Look for patterns like:
        # 1. Question text...
        # A. Answer 1
        # B. Answer 2
        # ...
        # Matches "1. ", "2. " etc.
        question_start_pattern = re.compile(r'^\s*\d+\.\s')

        for i, p in enumerate(paragraphs):
            text = p["text"].strip()

            # Detect start of new question
            if question_start_pattern.match(text):
                # If we were already in a question, save the current block
                if in_question and current_block:
                    blocks.append(current_block)
                    current_block = []

                # Start new question
                in_question = True
                current_block.append(p)
            elif self._is_answer_line(text):
                # This is an answer line, add to current question
                if in_question:
                    current_block.append(p)
            elif in_question:
                # Continue with current question
                current_block.append(p)
            else:
                # Not in a question yet, could be header or other text
                pass

        # Add the last block
        if current_block:
            blocks.append(current_block)

        return blocks


def parse_args():
    parser = argparse.ArgumentParser(
        description='Parse DOCX file and extract questions')
    parser.add_argument('input_file', help='Path to input DOCX file')
    parser.add_argument('output_file', help='Path to output JSON file')
    parser.add_argument('--process-images', action='store_true',
                        help='Process images in document')
    parser.add_argument('--extract-styles', action='store_true',
                        help='Extract detailed styling information')
    return parser.parse_args()


def main():
    args = parse_args()

    try:
        # Check if input file exists
        if not os.path.exists(args.input_file):
            logger.error(f"Input file not found: {args.input_file}")
            sys.exit(1)

        # Parse document
        parser = DocxParser(
            args.input_file, args.process_images, args.extract_styles)
        questions = parser.parse_questions()

        # Standardize output to match TypeScript interface
        output_questions = []
        for question in questions:
            result = {
                "id": question["id"],
                "content": question["content"],
                "clo": question["clo"],
                "type": question["type"],
                "answers": []
            }

            # Format answers
            if question.get("answers"):
                for answer in question["answers"]:
                    result["answers"].append({
                        "id": answer["id"],
                        "content": answer["content"],
                        "isCorrect": answer["isCorrect"],
                        "order": answer["order"]
                    })

            # Format child questions if present
            if question["type"] == "group":
                result["groupContent"] = question.get("groupContent", "")
                result["childQuestions"] = []

                for child in question.get("childQuestions", []):
                    child_result = {
                        "id": child["id"],
                        "content": child["content"],
                        "clo": child["clo"],
                        "type": child["type"],
                        "answers": []
                    }

                    # Format child answers
                    for answer in child.get("answers", []):
                        child_result["answers"].append({
                            "id": answer["id"],
                            "content": answer["content"],
                            "isCorrect": answer["isCorrect"],
                            "order": answer["order"]
                        })

                    result["childQuestions"].append(child_result)

            output_questions.append(result)

        # Write results to output file
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(output_questions, f, ensure_ascii=False, indent=2)

        logger.info(f"Successfully parsed {len(output_questions)} questions")

    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
