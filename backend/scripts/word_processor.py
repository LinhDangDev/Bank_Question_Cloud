#!/usr/bin/env python3
"""
Word Document Processor with Mammoth
Author: Linh Dang Dev

This script processes Word documents to extract text content and images using mammoth library.
It handles question parsing with proper formatting detection for correct answers.
"""

import os
import sys
import json
import zipfile
import tempfile
import base64
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import mammoth
import argparse
from dataclasses import dataclass, asdict
import re

@dataclass
class ExtractedImage:
    """Represents an extracted image from Word document"""
    filename: str
    content_type: str
    data: str  # base64 encoded
    size: int
    original_path: str

@dataclass
class ParsedAnswer:
    """Represents a parsed answer option"""
    letter: str
    content: str
    is_correct: bool
    order: int

@dataclass
class ParsedQuestion:
    """Represents a parsed question"""
    type: str  # 'single', 'group', 'fill-in-blank'
    content: str
    answers: List[ParsedAnswer]
    clo: Optional[str]
    order: int
    media_references: List[str]
    placeholder_number: Optional[int] = None

@dataclass
class ProcessingResult:
    """Result of Word document processing"""
    success: bool
    text_content: str
    html_content: str
    questions: List[ParsedQuestion]
    images: List[ExtractedImage]
    errors: List[str]
    warnings: List[str]
    statistics: Dict[str, int]

class WordProcessor:
    """Main class for processing Word documents"""
    
    def __init__(self):
        self.question_patterns = {
            'single_marker': '(DON)',
            'group_marker': '(NHOM)',
            'fill_blank_marker': '(DIENKHUYET)',
            'clo_pattern': re.compile(r'\(CLO(\d+)\)'),
            'answer_pattern': re.compile(r'^([A-Z])\.\s*(.*)$'),
            'group_child_pattern': re.compile(r'\(NHOM\s*[–-]\s*(\d+)\)'),
            'fill_blank_child_pattern': re.compile(r'\(DIENKHUYET\s*[–-]\s*(\d+)\)'),
            'group_start': '[<sg>]',
            'group_content_end': '[<egc>]',
            'group_end': '[</sg>]',
            'question_separator': '[<br>]',
            'placeholder_pattern': re.compile(r'\{<(\d+)>\}'),
        }
        
    def process_docx_file(self, file_path: str, extract_images: bool = True) -> ProcessingResult:
        """
        Process a DOCX file and extract content and images
        
        Args:
            file_path: Path to the DOCX file
            extract_images: Whether to extract images from the document
            
        Returns:
            ProcessingResult containing all extracted data
        """
        result = ProcessingResult(
            success=False,
            text_content="",
            html_content="",
            questions=[],
            images=[],
            errors=[],
            warnings=[],
            statistics={}
        )
        
        try:
            if not os.path.exists(file_path):
                result.errors.append(f"File not found: {file_path}")
                return result
                
            # Extract text and HTML content
            text_content, html_content, conversion_messages = self._extract_content(file_path)
            result.text_content = text_content
            result.html_content = html_content
            
            # Process conversion messages
            for message in conversion_messages:
                if message.type == 'warning':
                    result.warnings.append(message.message)
                elif message.type == 'error':
                    result.errors.append(message.message)
            
            # Extract images if requested
            if extract_images:
                images = self._extract_images(file_path)
                result.images = images
                
            # Parse questions from text content
            questions = self._parse_questions(text_content)
            result.questions = questions
            
            # Generate statistics
            result.statistics = self._generate_statistics(questions, images)
            
            result.success = True
            
        except Exception as e:
            result.errors.append(f"Processing error: {str(e)}")
            
        return result
    
    def _extract_content(self, file_path: str) -> Tuple[str, str, List[Any]]:
        """Extract text and HTML content from DOCX file"""
        
        # Configure mammoth options for better formatting detection
        style_map = """
        u => u
        b => strong
        i => em
        """
        
        # Extract raw text
        with open(file_path, 'rb') as docx_file:
            text_result = mammoth.extract_raw_text(docx_file)
            text_content = text_result.value
            
        # Extract HTML with formatting
        with open(file_path, 'rb') as docx_file:
            html_result = mammoth.convert_to_html(
                docx_file,
                style_map=style_map,
                include_embedded_style_map=True,
                include_default_style_map=True
            )
            html_content = html_result.value
            
        return text_content, html_content, html_result.messages
    
    def _extract_images(self, file_path: str) -> List[ExtractedImage]:
        """Extract images from DOCX file"""
        images = []
        
        try:
            # DOCX files are ZIP archives
            with zipfile.ZipFile(file_path, 'r') as docx_zip:
                # Look for images in media folder
                media_files = [f for f in docx_zip.namelist() if f.startswith('word/media/')]
                
                for media_file in media_files:
                    try:
                        # Read image data
                        image_data = docx_zip.read(media_file)
                        
                        # Determine content type based on file extension
                        file_ext = Path(media_file).suffix.lower()
                        content_type_map = {
                            '.png': 'image/png',
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.gif': 'image/gif',
                            '.bmp': 'image/bmp',
                            '.webp': 'image/webp'
                        }
                        content_type = content_type_map.get(file_ext, 'image/jpeg')
                        
                        # Create ExtractedImage object
                        image = ExtractedImage(
                            filename=Path(media_file).name,
                            content_type=content_type,
                            data=base64.b64encode(image_data).decode('utf-8'),
                            size=len(image_data),
                            original_path=media_file
                        )
                        
                        images.append(image)
                        
                    except Exception as e:
                        print(f"Error extracting image {media_file}: {e}")
                        
        except Exception as e:
            print(f"Error opening DOCX file for image extraction: {e}")
            
        return images
    
    def _parse_questions(self, text_content: str) -> List[ParsedQuestion]:
        """Parse questions from text content"""
        questions = []
        
        try:
            # Clean and split text into blocks
            blocks = self._split_into_question_blocks(text_content)
            
            for i, block in enumerate(blocks):
                if not block.strip():
                    continue
                    
                try:
                    if self.question_patterns['single_marker'] in block:
                        question = self._parse_single_question(block, i + 1)
                        if question:
                            questions.append(question)
                    elif self.question_patterns['group_marker'] in block:
                        group_questions = self._parse_group_question(block, i + 1)
                        questions.extend(group_questions)
                    elif self.question_patterns['fill_blank_marker'] in block:
                        fill_blank_questions = self._parse_fill_blank_question(block, i + 1)
                        questions.extend(fill_blank_questions)
                        
                except Exception as e:
                    print(f"Error parsing question block {i + 1}: {e}")
                    
        except Exception as e:
            print(f"Error parsing questions: {e}")
            
        return questions
    
    def _split_into_question_blocks(self, text: str) -> List[str]:
        """Split text into question blocks"""
        # Clean text
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        
        blocks = []
        lines = text.split('\n')
        current_block = ''
        in_group = False
        
        for line in lines:
            line = line.strip()
            
            # Check for question type markers
            if any(marker in line for marker in [
                self.question_patterns['single_marker'],
                self.question_patterns['group_marker'], 
                self.question_patterns['fill_blank_marker']
            ]):
                if current_block.strip():
                    blocks.append(current_block.strip())
                    current_block = ''
                current_block += line + '\n'
            elif line == self.question_patterns['group_start']:
                in_group = True
                current_block += line + '\n'
            elif line == self.question_patterns['group_end']:
                current_block += line + '\n'
                in_group = False
            elif line == '(KETTHUCNHOM)' or line == '(KETTHUCDIENKHUYET)':
                current_block += line + '\n'
                blocks.append(current_block.strip())
                current_block = ''
            elif line == self.question_patterns['question_separator'] and not in_group:
                if current_block.strip():
                    blocks.append(current_block.strip())
                    current_block = ''
            else:
                current_block += line + '\n'
        
        if current_block.strip():
            blocks.append(current_block.strip())
            
        return [block for block in blocks if block]
    
    def _parse_single_question(self, block: str, order: int) -> Optional[ParsedQuestion]:
        """Parse a single question block"""
        try:
            lines = [line.strip() for line in block.split('\n') if line.strip()]
            
            content_lines = []
            answer_lines = []
            clo = None
            in_answers = False
            
            for line in lines:
                # Skip question type marker
                if self.question_patterns['single_marker'] in line:
                    continue
                    
                # Check if this is an answer line
                if self.question_patterns['answer_pattern'].match(line):
                    in_answers = True
                    answer_lines.append(line)
                elif in_answers:
                    answer_lines.append(line)
                else:
                    # Extract CLO
                    clo_match = self.question_patterns['clo_pattern'].search(line)
                    if clo_match:
                        clo = clo_match.group(1)
                        clean_line = self.question_patterns['clo_pattern'].sub('', line).strip()
                        if clean_line:
                            content_lines.append(clean_line)
                    else:
                        content_lines.append(line)
            
            content = ' '.join(content_lines).strip()
            answers = self._parse_answers(answer_lines)
            media_refs = self._extract_media_references(content)
            
            return ParsedQuestion(
                type='single',
                content=content,
                answers=answers,
                clo=clo,
                order=order,
                media_references=media_refs
            )
            
        except Exception as e:
            print(f"Error parsing single question: {e}")
            return None
    
    def _parse_group_question(self, block: str, order: int) -> List[ParsedQuestion]:
        """Parse a group question block"""
        # This is a simplified implementation
        # In a full implementation, you would parse the group structure
        return []
    
    def _parse_fill_blank_question(self, block: str, order: int) -> List[ParsedQuestion]:
        """Parse a fill-in-blank question block"""
        # This is a simplified implementation
        # In a full implementation, you would parse the fill-in-blank structure
        return []
    
    def _parse_answers(self, answer_lines: List[str]) -> List[ParsedAnswer]:
        """Parse answer options from lines"""
        answers = []
        current_answer = ''
        current_letter = ''
        order = 0
        
        for line in answer_lines:
            answer_match = self.question_patterns['answer_pattern'].match(line)
            
            if answer_match:
                # Save previous answer
                if current_answer and current_letter:
                    answers.append(ParsedAnswer(
                        letter=current_letter,
                        content=current_answer.strip(),
                        is_correct=self._is_correct_answer(current_answer),
                        order=order
                    ))
                    order += 1
                
                current_letter = answer_match.group(1)
                current_answer = answer_match.group(2)
            else:
                current_answer += ' ' + line
        
        # Save last answer
        if current_answer and current_letter:
            answers.append(ParsedAnswer(
                letter=current_letter,
                content=current_answer.strip(),
                is_correct=self._is_correct_answer(current_answer),
                order=order
            ))
        
        return answers
    
    def _is_correct_answer(self, content: str) -> bool:
        """Check if answer content indicates it's the correct answer"""
        # Check for underline, bold, or other formatting indicators
        indicators = ['<u>', '</u>', '<b>', '</b>', '<strong>', '</strong>', '_', '__']
        return any(indicator in content for indicator in indicators)
    
    def _extract_media_references(self, content: str) -> List[str]:
        """Extract media file references from content"""
        media_refs = []
        
        # Look for [AUDIO: filename] and [IMAGE: filename] patterns
        audio_pattern = re.compile(r'\[AUDIO:\s*([^\]]+)\]', re.IGNORECASE)
        image_pattern = re.compile(r'\[IMAGE:\s*([^\]]+)\]', re.IGNORECASE)
        
        for match in audio_pattern.finditer(content):
            media_refs.append(match.group(1).strip())
            
        for match in image_pattern.finditer(content):
            media_refs.append(match.group(1).strip())
            
        return media_refs
    
    def _generate_statistics(self, questions: List[ParsedQuestion], images: List[ExtractedImage]) -> Dict[str, int]:
        """Generate processing statistics"""
        stats = {
            'total_questions': len(questions),
            'single_questions': len([q for q in questions if q.type == 'single']),
            'group_questions': len([q for q in questions if q.type == 'group']),
            'fill_blank_questions': len([q for q in questions if q.type == 'fill-in-blank']),
            'total_images': len(images),
            'questions_with_media': len([q for q in questions if q.media_references]),
            'total_media_references': sum(len(q.media_references) for q in questions)
        }
        return stats

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Process Word documents with mammoth')
    parser.add_argument('input_file', help='Path to input DOCX file')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--extract-images', action='store_true', help='Extract images from document')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    processor = WordProcessor()
    result = processor.process_docx_file(args.input_file, args.extract_images)
    
    if args.verbose:
        print(f"Processing result: {result.success}")
        print(f"Questions found: {len(result.questions)}")
        print(f"Images extracted: {len(result.images)}")
        print(f"Errors: {len(result.errors)}")
        print(f"Warnings: {len(result.warnings)}")
    
    # Convert result to JSON
    output_data = {
        'success': result.success,
        'text_content': result.text_content,
        'html_content': result.html_content,
        'questions': [asdict(q) for q in result.questions],
        'images': [asdict(img) for img in result.images],
        'errors': result.errors,
        'warnings': result.warnings,
        'statistics': result.statistics
    }
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f"Results saved to {args.output}")
    else:
        print(json.dumps(output_data, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
