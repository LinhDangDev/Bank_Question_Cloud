import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Upload as UploadIcon,
  FileText,
  Database,
  File,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import { Modal } from '../../components/Modal/Modal';
import axios from 'axios';
import KaTeX from 'katex';
import 'katex/dist/katex.min.css';
import { API_BASE_URL } from '@/config';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore - Import mammoth without type definitions
import mammoth from 'mammoth';
import { MathRenderer } from '../../components/MathRenderer';
import QuestionItem from '../../components/QuestionItem';
import { questionsImportApi } from '../../services/api';
import { formatChildQuestionContent, formatParentQuestionContent, cleanContent } from '../../utils/latex';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LazyMediaPlayer from '../../components/LazyMediaPlayer';

// Interface for parsed question
interface ParsedQuestion {
  id: string;
  content: string;
  clo?: string | null;
  type: 'single-choice' | 'multi-choice' | 'fill-blank' | 'group';
  answers: {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }[];
  childQuestions?: ParsedQuestion[];
  groupContent?: string;
  fileId?: string; // Make fileId optional
}

// Helper functions for displaying question difficulty
const getDifficultyColor = (level: number) => {
  if (!level || level <= 2) return "bg-green-100 text-green-800";
  if (level <= 4) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

const getDifficultyText = (level: number) => {
  if (!level || level <= 2) return "Dễ";
  if (level <= 4) return "Trung bình";
  return "Khó";
}

// Function to parse question content using regex patterns
const parseQuestion = (text: string) => {
  // Find CLO info
  const cloRegex = /\((CLO\d+)\)/;
  const cloMatch = text.match(cloRegex);
  const clo = cloMatch ? cloMatch[1] : null;

  // Remove CLO tag for cleaner display
  let cleanContent = text;
  if (clo) {
    cleanContent = text.replace(cloRegex, '').trim();
  }

  return { content: cleanContent, clo };
};

// Parse answer to check if it's marked as correct
const parseAnswer = (text: string, isUnderlined: boolean) => {
  // Check if the answer text contains underline markup - Word can use different styles
  const hasUnderline = text.includes('<u>') ||
                       text.includes('text-decoration:underline') ||
                       text.includes('text-decoration: underline') ||
                       text.includes('<span style="text-decoration: underline">') ||
                       text.match(/<span\s+class="[^"]*underline[^"]*"/i);

  // If explicitly told it's underlined or if we detect underline markup
  const isCorrectAnswer = isUnderlined || hasUnderline;

  // Clean up the content while preserving LaTeX
  const cleanContent = text
    .replace(/^[A-D]\.\s*/, '') // Remove A., B., etc.
    .replace(/<\/?u>/g, '')    // Remove explicit underline tags
    .trim();

  return {
    content: cleanContent,
    isCorrect: isCorrectAnswer
  };
};

// Helper function to get CLO color based on CLO number
const getCloColor = (clo: string) => {
  if (!clo) return "bg-gray-100 text-gray-800";

  // Extract the number from CLO text (e.g., "CLO1" -> 1)
  const cloNumber = clo.match(/\d+/)?.[0];
  if (!cloNumber) return "bg-gray-100 text-gray-800";

  // Return the appropriate color based on CLO number
  switch (cloNumber) {
    case '1': return "bg-green-100 text-green-700";
    case '2': return "bg-blue-100 text-blue-700";
    case '3': return "bg-purple-100 text-purple-700";
    case '4': return "bg-orange-100 text-orange-700";
    case '5': return "bg-yellow-100 text-yellow-700";
    default: return "bg-indigo-100 text-indigo-800";
  }
};

// Component để hiển thị code với syntax highlighting
const CodeBlock = ({ children }: { children: string }) => {
  // Xử lý syntax highlighting cho các ký hiệu đặc biệt
  const formattedCode = children
    .replace(/\[\<(sg|\/sg|egc|br)\>\]/g, '<span class="text-amber-600 font-medium">[$1]</span>')
    .replace(/\<(audio|\/audio)\>/g, '<span class="text-green-600 font-medium">&lt;$1&gt;</span>')
    .replace(/\((\<\d+\>)\)/g, '<span class="text-purple-600 font-medium">($1)</span>')
    .replace(/\{(\<\d+\>)\}/g, '<span class="text-blue-600 font-medium">{$1}</span>')
    .replace(/\((CLO.*?)\)/g, '<span class="text-indigo-600 font-medium">($1)</span>')
    .replace(/^([A-D]\.)/gm, '<span class="text-red-600 font-medium">$1</span>');

  return (
    <pre
      className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-2 sm:p-4 rounded-lg shadow-inner border border-gray-200 overflow-x-auto sm:text-sm"
      dangerouslySetInnerHTML={{ __html: formattedCode }}
    />
  );
};

// Function to parse DOCX file with Mammoth.js
const parseDocxWithMammoth = async (file: File): Promise<ParsedQuestion[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(loadEvent) {
      try {
        if (!loadEvent.target || !loadEvent.target.result) {
          reject(new Error('Error reading file'));
          return;
        }

        const arrayBuffer = loadEvent.target.result as ArrayBuffer;

        // Enhanced mammoth options with better style preservation
        const options = {
          arrayBuffer,
          // Enhanced style map for better formatting detection
          styleMap: [
            "u => u", // Preserve underline
            "strong => strong",
            "b => strong",
            "i => em",
            "strike => s",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            // Handle all types of underlined text - Word has multiple ways to apply underline
            "w:rPr/w:u => u",  // Word's native underline
            'w:rPr[w:u] => u', // Another Word underline format
            "span[style-text-decoration='underline'] => u"  // Style-based underline
          ],
          // Preserve the HTML structure and formatting
          preserveStyles: true,
          includeEmbeddedStyleMap: true,
          ignoreEmptyParagraphs: false
        };

        console.log('Starting DOCX conversion with enhanced options');
        const result = await mammoth.convertToHtml(options);
        const htmlContent = result.value;

        console.log('HTML content loaded, length:', htmlContent.length);
        console.log('Sample HTML:', htmlContent.substring(0, 500)); // Log sample for debugging

        // Create a DOM parser to work with the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Questions array
        const questions: ParsedQuestion[] = [];

        // Process the HTML to extract questions
        // Split content by [<br>] which indicates end of a question
        const questionBlocks = htmlContent.split(/\[\s*&lt;\s*br\s*&gt;\s*\]/i);

        console.log(`Found ${questionBlocks.length} question blocks`);

        // Enhanced answer detection function with stronger underline detection
        const detectCorrectAnswer = (text: string): boolean => {
          // Check various ways answers might be marked as correct
          return (
            // Standard HTML underline markers
            text.includes('<u>') ||
            text.includes('</u>') ||

            // CSS-based underline styles
            text.includes('text-decoration:underline') ||
            text.includes('text-decoration: underline') ||

            // Class-based underline
            text.match(/<span\s+class="[^"]*underline[^"]*"/i) !== null ||

            // Inline style-based underline (enhanced patterns)
            text.match(/<span\s+style="[^"]*text-decoration\s*:\s*underline[^"]*"/i) !== null ||
            text.match(/style="[^"]*text-decoration[^:]*:[^"]*underline[^"]*"/i) !== null ||

            // Word-specific underline attributes
            text.match(/<span\s+data-underline="true"[^>]*>/i) !== null ||

            // Special Word XML format for underline
            text.match(/<w:u\s+[^>]*>/i) !== null ||

            // Word XML namespace format
            text.match(/<w:rPr[^>]*>.*?<w:u[^>]*>/i) !== null ||

            // Sometimes bolding is used instead of underlining in some templates
            // But check that it's not just the "A." part that's bold
            (text.includes('<strong>') &&
             !text.includes('<strong>Câu') &&
             !/^<strong>[A-D]\.<\/strong>/.test(text)) ||

            // Bold styling with additional pattern check
            (text.match(/<span\s+style="[^"]*font-weight\s*:\s*bold[^"]*"/i) !== null &&
             !/^<span[^>]*>[A-D]\.<\/span>/.test(text))
          );
        };

        // Process each question block with enhanced detection
        questionBlocks.forEach((block, index) => {
          if (!block.trim()) return; // Skip empty blocks

          // Check if it's a group question
          const isGroup = block.includes('[&lt;sg&gt;]');

          // Create question object
          let question: ParsedQuestion = {
            id: uuidv4(),
            content: '',
            type: 'single-choice',
            answers: []
          };

          // Extract CLO information
          const cloMatch = block.match(/\(CLO\d+\)/);
          if (cloMatch) {
            question.clo = cloMatch[0].replace(/[()]/g, '');
            // Remove CLO tag from content
            block = block.replace(cloMatch[0], '').trim();
          }

          if (isGroup) {
            question.type = 'group';

            // Extract group content (between [<sg>] and [<egc>])
            const sgMatch = block.match(/\[\s*&lt;\s*sg\s*&gt;\s*\]([\s\S]*?)\[\s*&lt;\s*egc\s*&gt;\s*\]/i);
            if (sgMatch) {
              question.groupContent = sgMatch[1].trim();

              // Remove group content from block for further processing
              block = block.replace(sgMatch[0], '');
            }

            // Extract child questions
            question.childQuestions = [];

            // Find child questions using pattern (<number>)
            const childBlocks = block.split(/\(\s*&lt;\s*\d+\s*&gt;\s*\)/i).filter(b => b.trim());
            const childNumberMatches = block.match(/\(\s*&lt;\s*\d+\s*&gt;\s*\)/gi) || [];

            childBlocks.forEach((childBlock, childIdx) => {
              if (!childBlock.trim() || childIdx === 0) return; // Skip empty blocks or first split (before first marker)

              // Create child question
              const childQuestion: ParsedQuestion = {
                id: uuidv4(),
                content: childBlock.trim(),
                type: 'single-choice',
                answers: []
              };

              // Extract CLO information for child question
              const childCloMatch = childBlock.match(/\(CLO\d+\)/);
              if (childCloMatch) {
                childQuestion.clo = childCloMatch[0].replace(/[()]/g, '');
                childQuestion.content = childQuestion.content.replace(childCloMatch[0], '').trim();
              }

              // Extract the question content and answers separately
              const contentAndAnswers = childQuestion.content.split(/<br\s*\/?>/i);

              // First part is the question content
              if (contentAndAnswers.length > 0) {
                childQuestion.content = contentAndAnswers[0].trim();

                // Extract answers - look for lines starting with A., B., C., D.
                const answerLines = contentAndAnswers.filter(line =>
                  /^[A-D]\./.test(line.trim())
                );

              // Process each answer with enhanced detection
              answerLines.forEach((line, idx) => {
                  // Use enhanced detection of correct answers
                  const isCorrect = detectCorrectAnswer(line);

                  // Extract the letter (A, B, C, D)
                  const letter = line.trim().charAt(0);

                  // Clean up the content - remove the A., B., etc. and formatting tags
                const cleanContent = line
                  .replace(/^[A-D]\.\s*/, '') // Remove A., B. etc.
                  .replace(/<\/?u>/g, '') // Remove underline tags
                  .replace(/<\/?strong>/g, '') // Remove strong tags
                  .trim();

                childQuestion.answers.push({
                  id: uuidv4(),
                  content: cleanContent,
                    isCorrect: isCorrect,
                  order: idx
                });
              });
              }

              // If no answer is marked as correct, default to first answer
              if (childQuestion.answers.length > 0 && !childQuestion.answers.some(a => a.isCorrect)) {
                childQuestion.answers[0].isCorrect = true;
              }

              // Determine question type based on answers
              if (childQuestion.answers.filter(a => a.isCorrect).length > 1) {
                childQuestion.type = 'multi-choice';
              }

              if (question.childQuestions) {
                question.childQuestions.push(childQuestion);
              }
            });
          } else {
            // Regular question
            // Extract question content and answers
            const contentAndAnswers = block.split(/<br\s*\/?>/i);

            // First line is the question content (everything before first A.)
            const questionLines = [];
            let startedAnswers = false;

            for (let i = 0; i < contentAndAnswers.length; i++) {
              const line = contentAndAnswers[i].trim();
              if (!startedAnswers && /^[A-D]\./.test(line)) {
                startedAnswers = true;
              }

              if (!startedAnswers) {
                questionLines.push(contentAndAnswers[i]);
              }
            }

            // Join all question content lines
            question.content = questionLines.join(' ').trim();

            // Extract CLO information from content if it exists
            const contentCloMatch = question.content.match(/\(CLO\d+\)/);
            if (contentCloMatch) {
              question.clo = contentCloMatch[0].replace(/[()]/g, '');
              question.content = question.content.replace(contentCloMatch[0], '').trim();
            }

            // Extract answers with improved detection
            const answerLines = contentAndAnswers.filter(line =>
              /^[A-D]\./.test(line.trim())
            );

            console.log(`Question ${index + 1} has ${answerLines.length} answer lines`);

            // Process each answer with enhanced detection
            answerLines.forEach((line, idx) => {
              // Use improved detection function
              const isCorrect = detectCorrectAnswer(line);

              console.log(`Answer ${idx + 1} is correct: ${isCorrect}, content: ${line.substring(0, 30)}...`);

              // Clean up the content while keeping the formatting for LaTeX
              const cleanContent = line
                .replace(/^[A-D]\.\s*/, '') // Remove A., B. etc.
                .replace(/<\/?u>/g, '') // Remove underline tags
                .replace(/<\/?strong>/g, '') // Remove strong tags
                .trim();

              question.answers.push({
                id: uuidv4(),
                content: cleanContent,
                isCorrect: isCorrect,
                order: idx
              });
            });

            // If no answer is marked as correct, default to first answer
            if (question.answers.length > 0 && !question.answers.some(a => a.isCorrect)) {
              question.answers[0].isCorrect = true;
            }

            // Determine question type based on answers
            if (question.answers.filter(a => a.isCorrect).length > 1) {
              question.type = 'multi-choice';
            }
          }

          // Add debug information to help identify issues
          console.log(`Question ${index + 1} parsed:`, {
            content: question.content.substring(0, 50) + '...',
            type: question.type,
            answerCount: question.answers.length,
            correctAnswers: question.answers.filter(a => a.isCorrect).length,
            childQuestions: question.childQuestions?.length || 0
          });

          questions.push(question);
        });

        console.log(`Successfully parsed ${questions.length} questions`);
        resolve(questions);

      } catch (error) {
        console.error('Error parsing DOCX:', error);
        reject(error);
      }
    };

    reader.onerror = function() {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

const UploadQuestions = () => {
  const { user } = useAuth();
  const { isTeacher, canImportQuestions } = usePermissions();
  const [selectedQuestions, setSelectedQuestions] = useState<ParsedQuestion[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideType, setGuideType] = useState<'word' | 'excel' | 'backup' | 'package'>('word');
  // Faculty, subject, and chapter state
  const [faculties, setFaculties] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [facultyId, setFacultyId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Add state for selected question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  // Add state for expanded group questions
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  // Add filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClo, setFilterClo] = useState<string>('all');
  const [dragOver, setDragOver] = useState(false);
  const [recentFiles, setRecentFiles] = useState<{name: string, date: string, id: string}[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<{name: string, id: string}[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  // Add these new state variables inside the UploadQuestions component
  const [viewingQuestion, setViewingQuestion] = useState<ParsedQuestion | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ParsedQuestion | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  // New states for ZIP package upload
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipUploadResult, setZipUploadResult] = useState<any>(null);

  // Toggle group expansion
  const toggleGroup = (questionId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  // Fetch faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/khoa`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        if (response.data) {
          setFaculties(response.data);

          // Nếu là teacher và chỉ có 1 khoa, tự động chọn khoa đó
          if (response.data.length === 1) {
            setFacultyId(response.data[0].MaKhoa);
          }
        }
      } catch (err) {
        console.error('Error fetching faculties:', err);
      }
    };
    fetchFaculties();
  }, []);

  // Fetch subjects when faculty changes
  useEffect(() => {
    if (!facultyId) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/mon-hoc/khoa/${facultyId}`);
        if (response.data) {
          setSubjects(response.data);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, [facultyId]);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      return;
    }

    const fetchChapters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/phan/mon-hoc/${subjectId}`);
        if (response.data) {
          setChapters(response.data);
        }
      } catch (err) {
        console.error('Error fetching chapters:', err);
      }
    };
    fetchChapters();
  }, [subjectId]);

  // Handle faculty change
  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFacultyId(e.target.value);
    setSubjectId('');
    setChapterId('');
  };

  // Handle subject change
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubjectId(e.target.value);
    setChapterId('');
  };

  // Handle file upload for different types
  const handleFileUpload = (fileType: string) => {
    if (fileType === 'word') {
      fileInputRef.current?.click();
    } else {
      console.log(`Uploading ${fileType} file`);
      // Implementation for other file types
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    // Get the dropped files
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type and process it
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Chỉ hỗ trợ tệp tin .docx');
      return;
    }

    // Process the dropped file
    await processFile(file);
  };

  // Unified processing function for both drag-drop and file input
  const processFile = async (file: File) => {
    // Validate file size (max 50MB to handle larger files with images)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError(`Kích thước tệp tin quá lớn. Tối đa ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Display info to user
      console.log('Đang xử lý tệp tin DOCX, vui lòng đợi...');

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Add chapter ID if selected
      if (chapterId) {
        formData.append('maPhan', chapterId);
      }

      // Add processing options
      formData.append('processImages', 'true');
      formData.append('preserveLatex', 'true'); // Enable LaTeX preservation

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/questions-import/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi xử lý: ${response.status}: ${errorText}`);
      }

      // Get the fileId from response
      const data = await response.json();
      console.log('Upload successful, file ID:', data.fileId);

      // Now fetch the parsed questions with higher limit
      const questionsResponse = await fetch(`${API_BASE_URL}/questions-import/preview/${data.fileId}?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!questionsResponse.ok) {
        const errorText = await questionsResponse.text();
        throw new Error(`Lỗi xem trước: ${questionsResponse.status}: ${errorText}`);
      }

      const questionsData = await questionsResponse.json();
      console.log(`Received ${questionsData.items.length} questions from server`);

      // Format as needed for the UI
      const processedQuestions = questionsData.items.map((q: any) => ({
        ...q,
        fileId: data.fileId
      }));

      setSelectedQuestions(processedQuestions);

      // Select all questions by default
      setSelectedQuestionIds(processedQuestions.map((q: any) => q.id));

      if (processedQuestions.length === 0) {
        setError('Không tìm thấy câu hỏi nào trong tệp tin');
      }

    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Lỗi xử lý tệp tin. Vui lòng kiểm tra định dạng và thử lại.');
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update handleFileSelected to use the unified processFile function
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const showGuide = (type: 'word' | 'excel' | 'backup' | 'package') => {
    setGuideType(type);
    setShowGuideModal(true);
  };

  // Handle ZIP file upload for exam packages
  const handleZipFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipError('Vui lòng chọn file ZIP');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setZipError('File ZIP quá lớn. Vui lòng chọn file nhỏ hơn 100MB');
      return;
    }

    await processZipFile(file);
  };

  // Process ZIP file containing exam package
  const processZipFile = async (file: File) => {
    setIsZipLoading(true);
    setZipError(null);
    setZipUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add chapter ID if selected
      if (chapterId) {
        formData.append('maPhan', chapterId);
      }

      // Add processing options
      formData.append('processImages', 'true');
      formData.append('processAudio', 'true');
      formData.append('saveToDatabase', 'false'); // Preview mode first
      formData.append('limit', '100');

      const response = await fetch(`${API_BASE_URL}/exam-package/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi xử lý gói đề: ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setZipUploadResult(result);

      // Convert result to ParsedQuestion format for preview
      if (result.questions && result.questions.length > 0) {
        const convertedQuestions = result.questions.map((q: any) => ({
          id: q.id || uuidv4(),
          content: q.content || q.processedContent || '',
          clo: q.clo,
          type: q.type || 'single-choice',
          answers: q.answers || [],
          childQuestions: q.childQuestions || [],
          groupContent: q.groupContent,
          hoanVi: q.hoanVi
        }));

        setSelectedQuestions(convertedQuestions);
        toast.success(`Đã xử lý thành công ${result.questions.length} câu hỏi từ gói đề thi!`);
      }

    } catch (err: any) {
      console.error('Error processing ZIP file:', err);
      setZipError(err.message || 'Lỗi xử lý gói đề thi. Vui lòng kiểm tra định dạng và thử lại.');
      toast.error(err.message || 'Lỗi xử lý gói đề thi');
    } finally {
      setIsZipLoading(false);
      // Reset the file input
      const zipInput = document.getElementById('zipFileInput') as HTMLInputElement;
      if (zipInput) {
        zipInput.value = '';
      }
    }
  };

  // Handle select/deselect all questions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuestionIds(selectedQuestions.map(q => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  // Handle select/deselect individual question
  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds(prev => [...prev, questionId]);
    } else {
      setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
    }
  };

  // Set all questions as selected by default when they are loaded
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      setSelectedQuestionIds(selectedQuestions.map(q => q.id));
    }
  }, [selectedQuestions]);

  // Update handleSaveQuestions to use selectedQuestionIds
  const handleSaveQuestions = async () => {
    if (selectedQuestionIds.length === 0) {
      setError('Vui lòng chọn ít nhất một câu hỏi');
      return;
    }

    if (!chapterId) {
      setError('Vui lòng chọn chương/phần cho các câu hỏi');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the file ID of the first selected question (they all share the same fileId)
      const fileId = selectedQuestions.find(q => selectedQuestionIds.includes(q.id))?.fileId;

      if (!fileId) {
        throw new Error('Không tìm thấy ID tệp tin');
      }

      // Prepare CLO metadata if available
      const questionMetadata = selectedQuestions
        .filter(q => selectedQuestionIds.includes(q.id))
        .map(q => ({
          id: q.id,
          clo: q.clo || null
        }));

      // Call save API using the new service
      const result = await questionsImportApi.saveQuestions({
        fileId,
        questionIds: selectedQuestionIds,
        maPhan: chapterId,
        questionMetadata
      });

      // Success message based on user role
      if (isTeacher()) {
        toast.success(`Đã gửi ${result.data.savedCount} câu hỏi chờ duyệt. Admin sẽ xem xét và duyệt câu hỏi của bạn.`);
      } else {
        toast.success(`Đã lưu ${result.data.savedCount} câu hỏi thành công vào ngân hàng câu hỏi.`);
      }

      setSelectedQuestions([]);
      setSelectedQuestionIds([]);

    } catch (err: any) {
      console.error('Error saving questions:', err);
      setError(err.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the renderContent function to use MathRenderer for LaTeX
  const renderContent = (content: string) => {
    if (!content) return <div></div>;

    // Clean content first
    let processedContent = cleanContent(content);

    // Handle special tags for group questions with better styling
    processedContent = processedContent
      .replace(/\[\<sg\>\]/g, '<div class="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500 my-3">')
      .replace(/\[\<\/sg\>\]/g, '</div>')
      .replace(/\[\<egc\>\]/g, '<hr class="my-3 border-dashed border-gray-300"/>')
      .replace(/\[\<br\>\]/g, '');

    // Use the new formatting functions for better styling
    processedContent = formatParentQuestionContent(processedContent);

    // Handle child question patterns
    processedContent = processedContent
      .replace(/\(<(\d+)>\)/g, '<span class="inline-block bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium text-xs">Câu $1</span>');

    // Process audio tags
    processedContent = processedContent
      .replace(/<audio>(.*?)<\/audio>/g, '<div class="flex items-center gap-2 my-2"><span class="text-green-600">🔊</span><span class="text-xs bg-green-50 text-green-700 p-1 rounded">$1</span></div>');

    // Handle underlined answers (Word format for correct answers)
    processedContent = processedContent
      .replace(/<u>([A-D]\.)<\/u>/g, '<span class="text-green-700 font-bold border-b-2 border-green-500">$1</span>')
      .replace(/<u>([A-D]\.<\/u> .*?)(?=<br|$)/g, '<span class="text-green-700 font-bold border-b-2 border-green-500">$1</span>');

    // Make sure spans with underline style are identified
    processedContent = processedContent
      .replace(/<span style="text-decoration: ?underline">(.*?)<\/span>/g,
               '<span class="text-green-700 font-bold border-b-2 border-green-500">$1</span>');

    // Ensure images are properly displayed with max width and centered
    // First, convert relative image URLs to absolute URLs pointing to the backend
    processedContent = processedContent.replace(/src="([^"]+)"/g, (match, url) => {
      // If the URL is not absolute (doesn't start with http or data:), prepend API base URL
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        return `src="${API_BASE_URL}/${url}"`;
      }
      return match;
    });

    // Then ensure proper styling for all images
    processedContent = processedContent
      .replace(/<img/g, '<img style="max-width: 100%; height: auto; display: block; margin: 10px auto; object-fit: contain;"');

    // Check if content contains LaTeX (enclosed in $ signs)
    const hasLatex = /\$|\\\(|\\\[|\\begin\{equation\}/.test(processedContent);

    if (hasLatex) {
      // Use our custom MathRenderer for LaTeX content
      return <MathRenderer content={processedContent} />;
    }

    // For images and other HTML content
    return <div className="question-content" dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  // Function to render answers
  const renderAnswers = (answers: any[]) => {
    // ALWAYS use the grid layout now for better UI consistency
    return (
      <div className="mt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {answers.map((answer, index) => (
            <div
              key={index}
              className={`flex items-center p-3 rounded-md ${
                answer.isCorrect
                  ? "bg-green-50 border-2 border-green-500" // Enhanced border color for better visibility
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {/* Answer letter in a circle */}
              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2.5 ${
                answer.isCorrect
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>

              {/* Answer content with LaTeX support */}
              <div className="flex-1 min-w-0">
                {renderContent(answer.content)}
              </div>

              {/* "Đáp án" badge for correct answer */}
              {answer.isCorrect && (
                <div className="flex-shrink-0 bg-green-200 text-green-800 text-xs px-2.5 py-1 rounded-full ml-2 font-medium">
                  Đáp án đúng
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Modify how questions are rendered
  const renderQuestions = () => {
    if (!selectedQuestions.length) return null;

    const filteredQuestions = filterQuestions(selectedQuestions);

    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          Không tìm thấy câu hỏi nào phù hợp với bộ lọc
    </div>
  );
    }

    return filteredQuestions.map((question, index) => (
      <QuestionItem
        key={question.id}
        question={question}
        index={index}
        selected={selectedQuestionIds.includes(question.id)}
        onSelect={(id, selected) => handleSelectQuestion(id, selected)}
      />
    ));
  };

  // Implement collapse functionality for group questions
  const handleToggleGroup = (questionId: string) => {
    setExpandedGroups(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Modify the existing rendering of questions to better handle grouped questions
  const renderGroupQuestionContent = (question: any, index: number) => {
    // Only render if the group is expanded
    if (!expandedGroups.includes(question.id)) return null;

    return (
      <div className="mt-3 space-y-3 border-t pt-3">
        {question.childQuestions?.map((childQ: any, childIdx: number) => (
          <div key={childIdx} className="border rounded-md bg-gray-50 p-3">
            <div className="font-medium mb-2 flex items-center gap-2">
              <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                Câu {childIdx + 1}
              </div>
              {childQ.clo && (
                <span className={`${getCloColor(childQ.clo)} text-xs rounded px-2 py-0.5`}>
                  {childQ.clo}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                childQ.type === 'fill-blank'
                  ? 'bg-blue-100 text-blue-700'
                  : childQ.type === 'multi-choice'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                {childQ.type === 'fill-blank'
                  ? 'Điền khuyết'
                  : childQ.type === 'multi-choice'
                    ? 'Nhiều lựa chọn'
                    : 'Đơn lựa chọn'}
              </span>
            </div>

            <div className="mb-3 text-gray-800">
              {renderContent(childQ.content)}
            </div>

            {/* Multimedia content for child question */}
            <div className="mb-3">
              <LazyMediaPlayer maCauHoi={childQ.id} showFileName={false} />
            </div>

            {/* Display answers in 2x2 grid for group child questions */}
            {childQ.answers && childQ.answers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {childQ.answers.map((answer: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center p-2 rounded-md ${
                      answer.isCorrect
                        ? 'bg-green-50 border-2 border-green-300'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                      answer.isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renderContent(answer.content)}
                    </div>
                    {answer.isCorrect && (
                      <div className="flex-shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded ml-2 font-medium">
                        Đáp án
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Implement statistics calculation functions
  const getQuestionStats = () => {
    if (!selectedQuestions.length) return {
      total: 0,
      selected: 0,
      singleChoice: 0,
      multiChoice: 0,
      fillBlank: 0,
      groups: 0,
      clos: {} as Record<string, number>,
      childQuestions: 0
    };

    // Count types
    const singleChoice = selectedQuestions.filter(q => q.type === 'single-choice').length;
    const multiChoice = selectedQuestions.filter(q => q.type === 'multi-choice').length;
    const fillBlank = selectedQuestions.filter(q => q.type === 'fill-blank').length;
    const groups = selectedQuestions.filter(q => q.type === 'group').length;

    // Count CLOs
    const clos: Record<string, number> = {};
    selectedQuestions.forEach(q => {
      if (q.clo) {
        clos[q.clo] = (clos[q.clo] || 0) + 1;
      }

      // Count CLOs in child questions as well
      if (q.childQuestions) {
        q.childQuestions.forEach(child => {
          if (child.clo) {
            clos[child.clo] = (clos[child.clo] || 0) + 1;
          }
        });
      }
    });

    return {
      total: selectedQuestions.length,
      selected: selectedQuestionIds.length,
      singleChoice,
      multiChoice,
      fillBlank,
      groups,
      clos,
      childQuestions: selectedQuestions.reduce((acc, q) =>
        acc + (q.childQuestions?.length || 0), 0)
    };
  };

  // Add filter functions
  const filterQuestions = (questions: ParsedQuestion[]) => {
    return questions.filter(question => {
      // Filter by type
      if (filterType !== 'all' && question.type !== filterType) {
        return false;
      }

      // Filter by CLO
      if (filterClo !== 'all') {
        if (filterClo === 'none' && question.clo) {
          return false;
        } else if (filterClo !== 'none' && question.clo !== filterClo) {
          return false;
        }
      }

      return true;
    });
  };

  // Get unique CLOs from questions
  const getUniqueClos = () => {
    const clos = new Set<string>();
    selectedQuestions.forEach(q => {
      if (q.clo) clos.add(q.clo);
      if (q.childQuestions) {
        q.childQuestions.forEach(child => {
          if (child.clo) clos.add(child.clo);
        });
      }
    });
    return Array.from(clos).sort();
  };

  // Fetch recent files and templates on component mount
  useEffect(() => {
    const fetchRecentFiles = async () => {
      try {
        // This would be replaced with an actual API call
        // Simulating for now
        setRecentFiles([
          { name: 'Câu hỏi Tin học đại cương.docx', date: '14/07/2024', id: '1' },
          { name: 'Tiếng Anh chuyên ngành.docx', date: '10/07/2024', id: '2' },
          { name: 'Kỹ thuật lập trình.docx', date: '05/07/2024', id: '3' }
        ]);

        setAvailableTemplates([
          { name: 'Mẫu câu hỏi đơn', id: '1' },
          { name: 'Mẫu câu hỏi nhóm', id: '2' },
          { name: 'Mẫu câu hỏi điền khuyết', id: '3' },
          { name: 'Mẫu câu hỏi nghe', id: '4' }
        ]);
      } catch (err) {
        console.error('Error fetching recent files:', err);
      }
    };

    fetchRecentFiles();
  }, []);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // This would be replaced with an actual API call
        // Simulating for now
        setAvailableTemplates([
          { name: 'Mẫu câu hỏi đơn', id: '1' },
          { name: 'Mẫu câu hỏi nhóm', id: '2' },
          { name: 'Mẫu câu hỏi điền khuyết', id: '3' },
          { name: 'Mẫu câu hỏi nghe', id: '4' }
        ]);
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    };

    fetchTemplates();
  }, []);

  // Component to render LaTeX content with proper styling
  const MathComponent = ({ content, displayMode = false }: { content: string; displayMode?: boolean }) => {
    const [renderedHtml, setRenderedHtml] = useState("");

    useEffect(() => {
      try {
        const html = KaTeX.renderToString(content, {
          displayMode,
          throwOnError: false,
          strict: false,
          trust: true,
          output: 'html'
        });
        setRenderedHtml(html);
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        setRenderedHtml(`<span class="text-red-500">${content}</span>`);
      }
    }, [content, displayMode]);

    return displayMode ? (
      <div
        className="katex-display my-4 text-center overflow-x-auto p-2"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    ) : (
      <span
        className="katex-inline"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  };

  // Add these handlers before the return statement
  const handleViewQuestion = (question: ParsedQuestion) => {
    setViewingQuestion(question);
    setShowViewModal(true);
  };

  const handleEditQuestion = (question: ParsedQuestion) => {
    setEditingQuestion({...question});
    setShowEditModal(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      // Remove the question from selectedQuestions
      setSelectedQuestions(prev => prev.filter(q => q.id !== questionToDelete));
      // Also remove from selectedQuestionIds if present
      setSelectedQuestionIds(prev => prev.filter(id => id !== questionToDelete));
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  // Implement guide content rendering
  const renderGuideContent = () => {
    switch (guideType) {
      case 'word':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Hướng dẫn soạn câu hỏi</h3>
            <div className="bg-gray-50 border rounded-md p-3 text-sm space-y-2">
              <h4 className="font-medium">Câu hỏi đơn</h4>
              <p>- Viết nội dung câu hỏi</p>
              <p>- Liệt kê các phương án trả lời, mỗi phương án một dòng bắt đầu bằng A., B., C., D.</p>
              <p>- <strong>Gạch chân</strong> đáp án đúng trong Word</p>
            </div>

            <div className="bg-gray-50 border rounded-md p-3 text-sm space-y-2">
              <h4 className="font-medium">Câu hỏi nhóm</h4>
              <p>- Bắt đầu nhóm với cú pháp: [&lt;sg&gt;]</p>
              <p>- Nhập nội dung chung của nhóm câu hỏi</p>
              <p>- Kết thúc nội dung chung: [&lt;egc&gt;]</p>
              <p>- Nhập các câu hỏi con sử dụng cú pháp (&lt;1&gt;), (&lt;2&gt;), ...</p>
              <p>- Kết thúc nhóm câu hỏi với cú pháp: [&lt;/sg&gt;]</p>
            </div>

            <div className="bg-gray-50 border rounded-md p-3 text-sm space-y-2">
              <h4 className="font-medium">CLO và siêu dữ liệu</h4>
              <p>- Thêm CLO vào đầu câu hỏi với cú pháp: (CLO1), (CLO2), ...</p>
              <p>- Sử dụng [&lt;br&gt;] để ngăn cách giữa các câu hỏi</p>
            </div>

            <div className="mt-3">
              <a
                href="/template/huong-dan-soan-ngan-hang-cau-hoi-trac-nghiem.pdf"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" />
                Tải hướng dẫn chi tiết
              </a>
            </div>
          </div>
        );

      case 'excel':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Hướng dẫn nhập từ Excel</h3>
            <p className="text-sm">Chức năng đang được phát triển...</p>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Hướng dẫn khôi phục từ bản sao lưu</h3>
            <p className="text-sm">Chức năng đang được phát triển...</p>
          </div>
        );

      case 'package':
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Hướng dẫn tạo gói đề thi</h3>

            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm space-y-3">
              <h4 className="font-medium text-green-800">Cấu trúc gói đề thi (ZIP)</h4>
              <div className="space-y-2">
                <p><strong>📄 File Word (.docx)</strong> - Bắt buộc</p>
                <p className="ml-4 text-gray-600">• Chứa nội dung câu hỏi theo định dạng chuẩn</p>
                <p className="ml-4 text-gray-600">• Sử dụng markup [AUDIO: filename] và [IMAGE: filename]</p>

                <p><strong>🎵 Thư mục /audio</strong> - Tùy chọn</p>
                <p className="ml-4 text-gray-600">• Chứa các file âm thanh (.mp3, .wav, .m4a)</p>

                <p><strong>🖼️ Thư mục /images</strong> - Tùy chọn</p>
                <p className="ml-4 text-gray-600">• Chứa các file hình ảnh (.jpg, .png, .gif, .bmp)</p>
                <p className="ml-4 text-gray-600">• Tự động chuyển đổi sang WebP để tối ưu</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm space-y-3">
              <h4 className="font-medium text-blue-800">Tính năng tự động</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Phân tích và trích xuất câu hỏi từ Word</li>
                <li>Upload media lên Digital Ocean Spaces</li>
                <li>Chuyển đổi hình ảnh sang WebP (chất lượng 85%)</li>
                <li>Thay thế đường dẫn local thành full URLs</li>
                <li>Nhận diện gạch chân để thiết lập HoanVi</li>
                <li>Xử lý LaTeX và công thức toán học</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm space-y-2">
              <h4 className="font-medium text-amber-800">Lưu ý quan trọng</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Kích thước tối đa: 100MB</li>
                <li>Tên file media phải khớp với markup trong Word</li>
                <li>Sử dụng đường dẫn tương đối trong markup</li>
                <li>Kiểm tra preview trước khi lưu vào database</li>
              </ul>
            </div>

            <div className="bg-gray-50 border rounded-md p-3 text-sm">
              <h4 className="font-medium mb-2">Ví dụ cấu trúc ZIP:</h4>
              <pre className="text-xs font-mono text-gray-600">
{`exam-package.zip
├── questions.docx
├── audio/
│   ├── listening1.mp3
│   └── pronunciation.wav
└── images/
    ├── diagram1.jpg
    └── chart2.png`}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Header with title and back button */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
            aria-label="Quay lại"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Tải lên câu hỏi</h1>
        </div>
      </div>

      {/* Main content area with scrolling */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
              <span className="mr-2 mt-0.5">⚠️</span>
              <div>
                <p className="font-medium">Lỗi upload Word</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* ZIP Error display */}
          {zipError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
              <span className="mr-2 mt-0.5">⚠️</span>
              <div>
                <p className="font-medium">Lỗi upload gói đề thi</p>
                <p>{zipError}</p>
              </div>
            </div>
          )}

          {/* ZIP Success display */}
          {zipUploadResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start">
              <span className="mr-2 mt-0.5">✅</span>
              <div>
                <p className="font-medium">Xử lý gói đề thi thành công</p>
                <p>Đã xử lý {zipUploadResult.statistics?.totalQuestions || 0} câu hỏi</p>
                {zipUploadResult.statistics?.mediaReplacementsMade > 0 && (
                  <p>Đã thay thế {zipUploadResult.statistics.mediaReplacementsMade} tham chiếu media</p>
                )}
              </div>
            </div>
          )}

          {/* Faculty, Subject, Chapter selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Chọn khoa, môn học và chương/phần</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Faculty dropdown */}
              <div>
                <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1">
                  Khoa <span className="text-red-500">*</span>
                </label>
                <select
                  id="faculty"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={facultyId}
                  onChange={handleFacultyChange}
                >
                  <option value="">-- Chọn khoa --</option>
                  {faculties.map(faculty => (
                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                      {faculty.TenKhoa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject dropdown */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={subjectId}
                  onChange={handleSubjectChange}
                  disabled={!facultyId}
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map(subject => (
                    <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                      {subject.TenMonHoc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter dropdown */}
              <div>
                <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 mb-1">
                  Chương/Phần <span className="text-red-500">*</span>
                </label>
                <select
                  id="chapter"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  disabled={!subjectId}
                >
                  <option value="">-- Chọn chương/phần --</option>
                  {chapters.map(chapter => (
                    <option key={chapter.MaPhan} value={chapter.MaPhan}>
                      {chapter.TenPhan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Upload Options - Two Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Section 1: Upload Word Document */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-medium">Upload File Word</h2>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  isLoading
                    ? 'border-blue-500 bg-blue-50 cursor-not-allowed'
                    : dragOver
                      ? 'border-blue-500 bg-blue-50 cursor-pointer'
                      : 'border-gray-300 hover:border-blue-400 cursor-pointer'
                }`}
                onDragOver={!isLoading ? handleDragOver : undefined}
                onDragLeave={!isLoading ? handleDragLeave : undefined}
                onDrop={!isLoading ? handleDrop : undefined}
                onClick={() => !isLoading && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  className="hidden"
                  accept=".docx,.doc"
                  disabled={isLoading}
                />
                <div className="mx-auto flex flex-col items-center">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                      <h3 className="text-base font-medium text-blue-700">Đang xử lý file Word...</h3>
                      <p className="text-sm text-blue-600 mt-1">Vui lòng đợi, đang phân tích nội dung</p>
                    </>
                  ) : (
                    <>
                      <FileText className="h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-base font-medium text-gray-700">Tải lên file Word</h3>
                      <p className="text-sm text-gray-500 mt-1">Kéo thả hoặc nhấp để chọn file</p>
                      <p className="text-xs text-gray-400 mt-1">Hỗ trợ: .docx, .doc</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className={`w-full inline-flex items-center justify-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isLoading
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                  }`}
                  onClick={() => !isLoading && showGuide('word')}
                  disabled={isLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Xem hướng dẫn định dạng Word
                </button>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                  <p className="font-medium mb-1">Tính năng:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Phân tích câu hỏi từ file Word</li>
                    <li>Tự động nhận diện CLO</li>
                    <li>Hỗ trợ LaTeX và công thức toán</li>
                    <li>Xử lý định dạng gạch chân (HoanVi)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2: Upload Exam Package (ZIP) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-lg font-medium">Upload Gói Đề Thi</h2>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  isZipLoading
                    ? 'border-green-500 bg-green-50 cursor-not-allowed'
                    : 'border-green-300 hover:border-green-400 cursor-pointer'
                }`}
                onClick={() => !isZipLoading && document.getElementById('zipFileInput')?.click()}
              >
                <input
                  id="zipFileInput"
                  type="file"
                  className="hidden"
                  accept=".zip"
                  onChange={handleZipFileSelected}
                  disabled={isZipLoading}
                />
                <div className="mx-auto flex flex-col items-center">
                  {isZipLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3"></div>
                      <h3 className="text-base font-medium text-green-700">Đang xử lý gói đề thi...</h3>
                      <p className="text-sm text-green-600 mt-1">Vui lòng đợi, quá trình có thể mất vài phút</p>
                    </>
                  ) : (
                    <>
                      <Database className="h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-base font-medium text-gray-700">Tải lên gói đề thi</h3>
                      <p className="text-sm text-gray-500 mt-1">Kéo thả hoặc nhấp để chọn file ZIP</p>
                      <p className="text-xs text-gray-400 mt-1">Hỗ trợ: .zip (tối đa 100MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className={`w-full inline-flex items-center justify-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isZipLoading
                      ? 'border-green-200 text-green-400 bg-green-25 cursor-not-allowed'
                      : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500'
                  }`}
                  onClick={() => !isZipLoading && showGuide('package')}
                  disabled={isZipLoading}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Xem hướng dẫn gói đề thi
                </button>

                <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-md">
                  <p className="font-medium mb-1">Cấu trúc gói đề:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>File Word (.docx) - Bắt buộc</li>
                    <li>Thư mục /audio - Tùy chọn</li>
                    <li>Thư mục /images - Tùy chọn</li>
                    <li>Tự động chuyển đổi WebP</li>
                    <li>Upload lên Digital Ocean Spaces</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Questions preview area */}
          {selectedQuestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Xem trước câu hỏi</h2>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedQuestionIds.length === selectedQuestions.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                    Chọn tất cả ({selectedQuestions.length} câu hỏi)
                  </label>
                </div>
              </div>

              {/* Filter options */}
              <div className="mb-4 flex flex-wrap gap-2">
                <select
                  value={filterClo}
                  onChange={(e) => setFilterClo(e.target.value)}
                  className="border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả CLO</option>
                  {getUniqueClos().map(clo => (
                    <option key={clo} value={clo}>{clo}</option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả loại</option>
                  <option value="single-choice">Trắc nghiệm đơn</option>
                  <option value="multi-choice">Trắc nghiệm nhiều đáp án</option>
                  <option value="fill-blank">Điền khuyết</option>
                  <option value="group">Câu hỏi nhóm</option>
                </select>
              </div>

              {/* Questions list with max height and scrolling */}
              <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
                {filterQuestions(selectedQuestions).map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-4 ${
                      index !== filterQuestions(selectedQuestions).length - 1 ? 'border-b border-gray-200' : ''
                    } ${selectedQuestionIds.includes(question.id) ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(question.id)}
                        onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                        className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        {/* Question header with tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Câu {index + 1}</span>

                          {question.type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              question.type === 'single-choice' ? 'bg-blue-100 text-blue-800' :
                              question.type === 'multi-choice' ? 'bg-purple-100 text-purple-800' :
                              question.type === 'fill-blank' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {question.type === 'single-choice' ? 'Trắc nghiệm đơn' :
                               question.type === 'multi-choice' ? 'Trắc nghiệm nhiều đáp án' :
                               question.type === 'fill-blank' ? 'Điền khuyết' :
                               'Câu hỏi nhóm'}
                            </span>
                          )}

                          {question.clo && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getCloColor(question.clo)}`}>
                              {question.clo}
                            </span>
                          )}
                        </div>

                        {/* Question content */}
                        {renderContent(question.content)}

                        {/* Multimedia content */}
                        <div className="mb-3">
                          <LazyMediaPlayer maCauHoi={question.id} showFileName={false} />
                        </div>

                        {/* Answers for non-group questions */}
                        {question.type !== 'group' && question.answers && question.answers.length > 0 && (
                          renderAnswers(question.answers)
                        )}

                        {/* Child questions for group questions */}
                        {question.type === 'group' && question.childQuestions && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleToggleGroup(question.id)}
                              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {expandedGroups.includes(question.id) ? (
                                <ChevronDown className="h-4 w-4 mr-1" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-1" />
                              )}
                              {question.childQuestions.length} câu hỏi con
                            </button>

                            {expandedGroups.includes(question.id) && (
                              <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                {question.childQuestions.map((childQuestion, childIndex) => (
                                  renderGroupQuestionContent(childQuestion, childIndex)
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleSaveQuestions}
                  disabled={isLoading || selectedQuestionIds.length === 0 || !chapterId}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      {isTeacher() ? 'Gửi câu hỏi chờ duyệt' : 'Lưu câu hỏi'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide modal */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Hướng dẫn định dạng"
      >
        {renderGuideContent()}
      </Modal>

      {/* View question modal */}
      <Modal
        isOpen={!!viewingQuestion}
        onClose={() => setViewingQuestion(null)}
        title="Xem chi tiết câu hỏi"
      >
        {viewingQuestion && (
          <div className="p-4">
            <div className="mb-4">
              {renderContent(viewingQuestion.content)}
            </div>

            {/* Multimedia content in modal */}
            <div className="mb-4">
              <LazyMediaPlayer maCauHoi={viewingQuestion.id} showFileName={false} />
            </div>
            {viewingQuestion.answers && viewingQuestion.answers.length > 0 && (
              <div className="mt-4">
                {renderAnswers(viewingQuestion.answers)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UploadQuestions;
