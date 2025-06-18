import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as os from 'os';

const execPromise = promisify(exec);

export interface ParsedQuestion {
    id: string;
    content: string;
    answers?: ParsedAnswer[];
    type?: string;
    childQuestions?: ParsedQuestion[];
    files?: any[];
    inGroup?: boolean;
    groupId?: string;
}

export interface ParsedAnswer {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
}

interface ParseOptions {
    processImages?: boolean;
    extractStyles?: boolean;
}

@Injectable()
export class DocxParserService {
    private readonly logger = new Logger(DocxParserService.name);
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'questions');

    constructor() {
        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    /**
     * Parse DOCX file to extract questions
     */
    async parseDocxToQuestions(filePath: string): Promise<ParsedQuestion[]> {
        try {
            this.logger.log(`Parsing DOCX file: ${filePath}`);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                this.logger.error(`File not found: ${filePath}`);
                throw new Error(`File not found: ${filePath}`);
            }

            // Use mammoth options to preserve underlines for correct answers
            // and italic for non-randomized options
            const options = {
                styleMap: [
                    "u => u",
                    "i => i",
                    "b => b",
                    "sup => sup",
                    "sub => sub"
                ]
            };

            try {
                // Extract text content from DOCX (not HTML to better handle the custom tags)
                const { value: textContent } = await mammoth.extractRawText({ path: filePath });

                if (!textContent || textContent.trim().length === 0) {
                    this.logger.error(`Empty or invalid DOCX content in file: ${filePath}`);
                    throw new Error(`Empty or invalid DOCX content`);
                }

                this.logger.log(`Successfully extracted ${textContent.length} characters of text from DOCX`);

                // Process text to extract questions
                const questions = this.extractQuestionsFromText(textContent);

                this.logger.log(`Successfully parsed ${questions.length} questions from DOCX file`);
                return questions;
            } catch (mammothError) {
                this.logger.error(`Error extracting text from DOCX: ${mammothError.message}`, mammothError.stack);
                throw new Error(`Failed to extract text from DOCX: ${mammothError.message}`);
            }
        } catch (error) {
            this.logger.error(`Error parsing DOCX file: ${error.message}`, error.stack);
            throw new Error(`Failed to parse DOCX file: ${error.message}`);
        }
    }

    /**
     * Process uploaded file: save to uploads directory and parse
     */
    async processUploadedFile(file: MulterFile): Promise<{ questions: ParsedQuestion[], filePath: string }> {
        try {
            this.logger.log(`Processing uploaded file: ${file?.originalname || 'unknown'}`);

            // Check if file exists
            if (!file) {
                this.logger.error('File object is missing');
                throw new Error("Invalid file or missing buffer");
            }

            // Check if buffer exists
            if (!file.buffer || file.buffer.length === 0) {
                this.logger.error(`File buffer is missing or empty for file: ${file.originalname}`);
                throw new Error("Invalid file or missing buffer");
            }

            // Check file type
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext !== '.docx') {
                this.logger.error(`Invalid file type: ${ext}. Only .docx files are supported`);
                throw new Error(`Invalid file type: ${ext}. Only .docx files are supported`);
            }

            this.logger.log(`File validation passed for ${file.originalname} (${file.size} bytes)`);

            // Generate unique filename
            const fileId = uuidv4();
            const filename = `${fileId}${ext}`;
            const uploadPath = path.join(this.uploadsDir, filename);

            // Ensure directory exists
            if (!fs.existsSync(this.uploadsDir)) {
                this.logger.log(`Creating uploads directory: ${this.uploadsDir}`);
                fs.mkdirSync(this.uploadsDir, { recursive: true });
            }

            // Save file to disk
            fs.writeFileSync(uploadPath, file.buffer);
            this.logger.log(`File saved to: ${uploadPath}`);

            // Use mammoth to process DOCX to HTML
            const { value: html, messages } = await mammoth.convertToHtml({
                path: uploadPath
            }, {
                // Extract image content and transform to base64
                convertImage: mammoth.images.imgElement((image) => {
                    return image.read()
                        .then((imageBuffer) => {
                            const base64 = imageBuffer.toString('base64');
                            const mimeType = image.contentType;
                            return {
                                src: `data:${mimeType};base64,${base64}`
                            };
                        });
                })
            });

            // Log any warnings or errors
            messages.forEach(message => {
                if (message.type === 'warning') {
                    this.logger.warn(`Mammoth warning: ${message.message}`);
                }
            });

            this.logger.log(`Processed DOCX with size ${html.length}`);

            // Handle complex Word documents with multi-level structure
            const questions = await this.parseDocxHtml(html);

            return {
                questions,
                filePath: uploadPath
            };
        } catch (error) {
            this.logger.error(`Error processing uploaded file: ${error.message}`, error.stack);
            throw new Error(`Failed to process uploaded file: ${error.message}`);
        }
    }

    /**
     * Extract questions from raw text content
     */
    private extractQuestionsFromText(text: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        try {
            // Extract and process single questions
            const singleQuestions = this.parseSingleQuestions(text);
            questions.push(...singleQuestions);

            // Extract and process group questions
            const groupQuestions = this.parseGroupQuestions(text);
            questions.push(...groupQuestions);

            return questions;
        } catch (error) {
            this.logger.error(`Error extracting questions from text: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Parse single questions (not in a group)
     */
    private parseSingleQuestions(text: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        // Match all question blocks that are not inside [<sg>]...[</sg>]
        // We need to be careful to not capture group questions

        // First, let's remove all group questions from the text
        let processedText = text;
        const groupBlocks = text.match(/\[\<sg\>\].*?\[\<\/sg\>\]/gs);

        if (groupBlocks) {
            for (const block of groupBlocks) {
                processedText = processedText.replace(block, '');
            }
        }

        // Now extract single questions
        const questionBlocks = processedText.split(/\[\<br\>\]/g);

        for (const block of questionBlocks) {
            if (!block.trim()) continue;

            const question = this.parseQuestionBlock(block);
            if (question) {
                questions.push(question);
            }
        }

        return questions;
    }

    /**
     * Parse group questions [<sg>]...[</sg>]
     */
    private parseGroupQuestions(text: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        try {
            // Find all group blocks
            const groupRegex = /\[\<sg\>\](.*?)\[\<\/sg\>\]/gs;
            const groupMatches = text.matchAll(groupRegex);

            for (const groupMatch of Array.from(groupMatches)) {
                const groupContent = groupMatch[1];
                const groupId = uuidv4(); // Generate a unique ID for this group

                // Extract the common content (before [<egc>])
                const commonContentMatch = groupContent.match(/(.*?)\[\<egc\>\]/s);
                if (!commonContentMatch) continue;

                const commonContent = commonContentMatch[1].trim();

                // Extract audio file path if present
                let audioPath: string | null = null;
                const audioMatch = commonContent.match(/<audio>(.*?)<\/audio>/);
                if (audioMatch) {
                    audioPath = audioMatch[1].trim();
                }

                // Extract sub-questions
                const subQuestionsContent = groupContent.substring(groupContent.indexOf('[<egc>]') + 8);
                const subQuestionBlocks = subQuestionsContent.split(/\[\<br\>\]/g);

                for (const block of subQuestionBlocks) {
                    if (!block.trim()) continue;

                    // Extract the question number
                    const numberMatch = block.match(/\(\<(\d+)\>\)/);
                    if (!numberMatch) continue;

                    const questionNumber = numberMatch[1];

                    // Parse the question block
                    const question = this.parseQuestionBlock(block);

                    if (question) {
                        // Add common content and group information
                        question.content = `${commonContent}\n\n${question.content}`;
                        question.inGroup = true;
                        question.groupId = groupId;

                        // Add audio file if present
                        if (audioPath) {
                            question.files = question.files || [];
                            question.files.push({
                                type: 'audio',
                                path: audioPath
                            });
                        }

                        questions.push(question);
                    }
                }
            }

            return questions;
        } catch (error) {
            this.logger.error(`Error parsing group questions: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Parse a single question block
     */
    private parseQuestionBlock(block: string): ParsedQuestion | null {
        try {
            // Clean up the block
            let cleanBlock = block.trim();

            // Extract CLO information
            let cloInfo = '';
            const cloMatch = cleanBlock.match(/\(CLO\d+\)/);
            if (cloMatch) {
                cloInfo = cloMatch[0];
                cleanBlock = cleanBlock.replace(cloMatch[0], '').trim();
            }

            // Extract question content (everything before the first option)
            const parts = cleanBlock.split(/\n[A-D]\./);
            if (parts.length < 2) return null;

            let content = parts[0].trim();

            // Add CLO info back if needed
            if (cloInfo) {
                content = `${cloInfo} ${content}`;
            }

            // Determine question type
            let type = 'single-choice';
            if (content.includes('___') || content.includes('...')) {
                type = 'fill-blank';
            } else if (content.match(/\{\<\d+\>\}/)) {
                type = 'group-question';
            }

            // Process LaTeX in content
            content = this.processLatex(content);

            // Extract answers
            const answers: ParsedAnswer[] = [];
            const optionLines = cleanBlock.match(/[A-D]\.\s*.*(?:\n(?!\n|[A-D]\.).*)*/g);

            if (optionLines) {
                for (let i = 0; i < optionLines.length; i++) {
                    const line = optionLines[i].trim();
                    const letter = line[0];
                    let answerContent = line.substring(2).trim();

                    // Check if this is the correct answer (underlined)
                    const isCorrect = line.includes('__') || answerContent.includes('*');

                    // Check if this option should not be randomized (italic)
                    const noRandomize = line.match(/[A-D]\._/) || answerContent.match(/^_/);

                    // Clean up the content
                    answerContent = answerContent
                        .replace(/\*/g, '')  // Remove asterisks
                        .replace(/__/g, '')  // Remove underlines
                        .replace(/^_/, '')   // Remove italic marker
                        .trim();

                    // Process LaTeX
                    answerContent = this.processLatex(answerContent);

                    answers.push({
                        id: randomUUID(), // Add unique ID for each answer
                        content: answerContent,
                        isCorrect,
                        order: letter.charCodeAt(0) - 'A'.charCodeAt(0)
                    });
                }
            }

            return {
                id: uuidv4(),
                content,
                type,
                answers
            };
        } catch (error) {
            this.logger.error(`Error parsing question block: ${error.message}`, error.stack);
            return null;
        }
    }

    /**
     * Process LaTeX formulas in text
     * Replaces $...$ with proper LaTeX format
     */
    private processLatex(text: string): string {
        // Look for inline LaTeX formulas ($...$)
        return text.replace(/\$(.+?)\$/g, (match, formula) => {
            return `$${formula}$`;  // Keep the dollar signs for the frontend to process
        });
    }

    private async parseDocxHtml(html: string): Promise<ParsedQuestion[]> {
        try {
            const questions: ParsedQuestion[] = [];

            // Split content by [<br>] which marks the end of a question
            const questionBlocks = html.split(/\[\s*&lt;br&gt;\s*\]/gi);

            // Process each block to extract questions
            for (let block of questionBlocks) {
                if (!block.trim()) continue;

                // Check if it's a group question
                const isGroup = block.includes('[&lt;sg&gt;]');

                // Create basic question object
                let question: ParsedQuestion = {
                    id: randomUUID(),
                    content: '',
                    answers: [],
                    type: 'single-choice'
                };

                if (isGroup) {
                    // Handle group question
                    question.type = 'group';

                    // Extract group content (between [<sg>] and [<egc>])
                    const sgRegex = /\[\s*&lt;sg&gt;\s*\]([\s\S]*?)\[\s*&lt;egc&gt;\s*\]/i;
                    const sgMatch = block.match(sgRegex);

                    if (sgMatch) {
                        // Extract group content
                        const groupContent = sgMatch[1].trim();
                        question.content = groupContent;

                        // Remove group content part from block for further processing
                        block = block.replace(sgMatch[0], '');
                    }

                    // Parse child questions (look for pattern with (<number>) at start)
                    question.childQuestions = [];

                    // Look for child question pattern like (<1>) or (<2>)
                    const childPattern = /\(\s*&lt;(\d+)&gt;\s*\)([\s\S]*?)(?=\(\s*&lt;\d+&gt;\s*\)|$)/g;
                    let childMatch;

                    while ((childMatch = childPattern.exec(block)) !== null) {
                        const childQuestionNumber = childMatch[1];
                        const childContent = childMatch[2].trim();

                        // Create child question
                        const childQuestion = this.parseQuestionContent(childContent);
                        childQuestion.id = randomUUID();

                        question.childQuestions.push(childQuestion);
                    }

                } else {
                    // Regular question - parse content and answers
                    Object.assign(question, this.parseQuestionContent(block));
                }

                questions.push(question);
            }

            return questions;

        } catch (error) {
            this.logger.error(`Error parsing HTML content: ${error.message}`, error.stack);
            throw error;
        }
    }

    private parseQuestionContent(content: string): ParsedQuestion {
        const question: ParsedQuestion = {
            id: randomUUID(),
            content: '',
            answers: [],
            type: 'single-choice'
        };

        // Extract CLO information using regex
        const cloRegex = /\(\s*CLO\d+\s*\)/i;
        const cloMatch = content.match(cloRegex);

        if (cloMatch) {
            // Extract CLO but keep it in content for now
            // We'll handle CLO tags in the frontend
        }

        // Split content by line breaks to separate question text and answers
        const lines = content.split(/<\s*br\s*\/?\s*>/);

        // First line should be the question text
        if (lines.length > 0) {
            question.content = lines[0].trim();

            // Look for answers (lines starting with A., B., C., D.)
            const answerLines = lines.filter(line =>
                /^[A-D]\.\s/.test(line.trim())
            );

            // Process each answer
            const parsedAnswers: ParsedAnswer[] = answerLines.map((line, index) => {
                // Check if this is marked as correct (has underline or bold)
                const isUnderlined = line.includes('<u>') || line.includes('</u>');
                const isBold = line.includes('<strong>') || line.includes('</strong>');
                const isCorrect = isUnderlined || isBold;

                // Create answer object with required id property
                return {
                    id: randomUUID(), // Add unique ID for each answer
                    // Clean up formatting but maintain the answer text
                    content: line.replace(/<\/?[^>]+(>|$)/g, '').trim(),
                    isCorrect,
                    order: index
                } as ParsedAnswer;
            });

            // Assign the properly formed answers array to the question
            question.answers = parsedAnswers;

            // Determine question type based on number of correct answers
            const correctCount = question.answers.filter(a => a.isCorrect).length;
            if (correctCount > 1) {
                question.type = 'multi-choice';
            } else if (correctCount === 0 && question.answers.length > 0) {
                // If no correct answers found, mark the first one as correct
                question.answers[0].isCorrect = true;
            }
        }

        return question;
    }

    // Parse a DOCX file and extract questions, answers, and correct answers
    async parseDocx(filePath: string, options: ParseOptions = {}): Promise<any> {
        try {
            // First try using Python (if available) for better parsing
            try {
                return await this.parseDOCXWithPython(filePath, options);
            } catch (pythonError) {
                this.logger.warn(`Python parsing failed, falling back to default parser: ${pythonError.message}`);
                // Implement a fallback parser here if needed
                throw new Error('No fallback parser implemented');
            }
        } catch (error) {
            this.logger.error(`Failed to parse DOCX: ${error.message}`, error.stack);
            throw new Error(`Failed to parse DOCX: ${error.message}`);
        }
    }

    // Use Python for better DOCX parsing with python-docx
    private async parseDOCXWithPython(filePath: string, options: ParseOptions = {}): Promise<any> {
        const tempDir = path.join(os.tmpdir(), 'docx_parser');

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputFile = path.join(tempDir, `${uuidv4()}.json`);
        const scriptPath = path.join(__dirname, '..', '..', 'docx_parser.py');

        if (!fs.existsSync(scriptPath)) {
            // If the script doesn't exist, create it
            await this.createParserScript(scriptPath);
        }

        // Run Python script
        const command = `python3 "${scriptPath}" "${filePath}" "${outputFile}" ${options.processImages ? '--process-images' : ''} ${options.extractStyles ? '--extract-styles' : ''}`;

        try {
            this.logger.log(`Running command: ${command}`);

            const { stdout, stderr } = await execPromise(command);

            if (stderr && !stderr.includes('DEBUG:')) {
                this.logger.warn(`Python parser warning: ${stderr}`);
            }

            if (!fs.existsSync(outputFile)) {
                throw new Error('Python parsing failed: No output file generated');
            }

            // Read and parse the output file
            const jsonData = fs.readFileSync(outputFile, 'utf8');
            const result = JSON.parse(jsonData);

            // Clean up temp file
            fs.unlinkSync(outputFile);

            return result;
        } catch (error) {
            this.logger.error(`Python parsing failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Create Python parser script if it doesn't exist
    private async createParserScript(scriptPath: string): Promise<void> {
        const scriptContent = `#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
from typing import Dict, List, Optional, Tuple, Union
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
        """Extract text and formatting from paragraph"""
        text = ""
        runs_data = []

        for run in paragraph.runs:
            run_data = {
                "text": run.text,
                "bold": run.bold,
                "italic": run.italic,
                "underline": run.underline,
                "style": run.style.name if run.style else None
            }

            runs_data.append(run_data)
            text += run.text

        return {
            "text": text,
            "runs": runs_data if self.extract_styles else None
        }

    def _is_answer_correct(self, paragraph: Dict) -> bool:
        """Determine if the answer is marked as correct (underlined)"""
        if not paragraph.get("runs"):
            return False

        # Check if any run is underlined (correct answer)
        for run in paragraph["runs"]:
            if run.get("underline", False):
                return True

        return False

    def _is_answer_line(self, text: str) -> bool:
        """Check if line is an answer option (starts with A., B., C., or D.)"""
        return bool(re.match(r"^[A-D]\.", text.strip()))

    def _extract_question_content(self, paragraphs: List[Dict]) -> Tuple[str, List[Dict], Optional[str]]:
        """Extract question content, answers and CLO from paragraphs"""
        question_text = ""
        answers = []
        clo = None

        # Extract CLO if present
        clo_match = re.search(r"\(CLO\d+\)", paragraphs[0]["text"])
        if clo_match:
            clo = clo_match.group(0).strip("()")
            paragraphs[0]["text"] = paragraphs[0]["text"].replace(clo_match.group(0), "").strip()

        in_question = True

        for p in paragraphs:
            if self._is_answer_line(p["text"]):
                in_question = False

                # Extract answer letter and content
                match = re.match(r"^([A-D])\.\s*(.*)", p["text"].strip())
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
                if question_text:
                    question_text += " "
                question_text += p["text"]

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

        for p in block:
            text = p["text"].strip()

            # Start of group content
            if "[<sg>]" in text:
                in_group_content = True
                # Remove the marker and add remaining text
                text = text.replace("[<sg>]", "").strip()
                if text:
                    group_content_blocks.append({"text": text, "runs": p.get("runs")})
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
                group_content_blocks.append({"text": text, "runs": p.get("runs")})
            else:
                # Look for child question markers
                child_match = re.search(r"\\(<(\d+)>\\)", text)
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
                        current_block.append({"text": clean_text, "runs": p.get("runs")})
                else:
                    # Continue building current block
                    current_block.append({"text": text, "runs": p.get("runs")})

        # Process any remaining block
        if current_block:
            child_question_blocks.append(current_block)

        # Process group content
        if group_content_blocks:
            group_content_text = " ".join([b["text"] for b in group_content_blocks])
            group_question["groupContent"] = group_content_text.strip()

        # Extract CLO from first paragraph if present
        if block and block[0]["text"]:
            clo_match = re.search(r"\\(CLO\d+\\)", block[0]["text"])
            if clo_match:
                group_question["clo"] = clo_match.group(0).strip("()")

        # Process child questions
        for child_block in child_question_blocks:
            if not child_block:
                continue

            question_text, answers, clo = self._extract_question_content(child_block)

            child_question = {
                "type": "single-choice" if len([a for a in answers if a["isCorrect"]]) <= 1 else "multi-choice",
                "content": question_text,
                "clo": clo,
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
            formatted_paragraph = self._get_paragraph_text_with_formatting(paragraph)
            if formatted_paragraph["text"].strip():  # Skip empty paragraphs
                all_paragraphs.append(formatted_paragraph)

        # Second pass: Process blocks separated by [<br>]
        for paragraph in all_paragraphs:
            text = paragraph["text"]

            if "[<br>]" in text:
                # End of question block
                parts = text.split("[<br>]")

                # Add first part to current block
                if parts[0].strip():
                    current_block.append({
                        "text": parts[0],
                        "runs": paragraph.get("runs")
                    })

                # Process the current block
                if current_block:
                    # Check if it's a group question
                    is_group = any("[<sg>]" in p["text"] for p in current_block)

                    if is_group:
                        question = self._parse_group_question(current_block)
                    else:
                        question = self._parse_single_question(current_block)

                    questions.append(question)

                # Start a new block with remaining parts
                current_block = []
                for part in parts[1:]:
                    if part.strip():
                        current_block.append({
                            "text": part,
                            "runs": paragraph.get("runs")
                        })
            else:
                # Continue building the current block
                current_block.append(paragraph)

        # Process any remaining block
        if current_block:
            # Check if it's a group question
            is_group = any("[<sg>]" in p["text"] for p in current_block)

            if is_group:
                question = self._parse_group_question(current_block)
            else:
                question = self._parse_single_question(current_block)

            questions.append(question)

        # Add unique IDs to questions and answers
        for question in questions:
            question["id"] = uuidv4()

            if question.get("answers"):
                for i, answer in enumerate(question["answers"]):
                    answer["id"] = uuidv4()
                    answer["order"] = i

            if question.get("childQuestions"):
                for child in question["childQuestions"]:
                    child["id"] = uuidv4()
                    for i, answer in enumerate(child.get("answers", [])):
                        answer["id"] = uuidv4()
                        answer["order"] = i

        return questions

def parse_args():
    parser = argparse.ArgumentParser(description='Parse DOCX file and extract questions')
    parser.add_argument('input_file', help='Path to input DOCX file')
    parser.add_argument('output_file', help='Path to output JSON file')
    parser.add_argument('--process-images', action='store_true', help='Process images in document')
    parser.add_argument('--extract-styles', action='store_true', help='Extract detailed styling information')
    return parser.parse_args()

def main():
    args = parse_args()

    try:
        # Check if input file exists
        if not os.path.exists(args.input_file):
            logger.error(f"Input file not found: {args.input_file}")
            sys.exit(1)

        # Parse document
        parser = DocxParser(args.input_file, args.process_images, args.extract_styles)
        questions = parser.parse_questions()

        # Write results to output file
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

        logger.info(f"Successfully parsed {len(questions)} questions")

    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

        fs.writeFileSync(scriptPath, scriptContent);
        fs.chmodSync(scriptPath, '755'); // Make executable

        this.logger.log(`Created parser script at ${scriptPath}`);
    }
}
