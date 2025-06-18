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
import { MathRenderer, MathJaxInitializer } from '../../components/MathRenderer';
import QuestionItem from '../../components/QuestionItem';

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
        const response = await axios.get(`${API_BASE_URL}/khoa`);
        if (response.data) {
          setFaculties(response.data);
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

      // Now fetch the parsed questions
      const questionsResponse = await fetch(`${API_BASE_URL}/questions-import/preview/${data.fileId}`, {
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

      // Call save API
      const response = await fetch(`${API_BASE_URL}/questions-import/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          fileId,
          questionIds: selectedQuestionIds,
          maPhan: chapterId,
          questionMetadata
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();

      // Success message and reset
      alert(`Đã lưu ${result.savedCount} câu hỏi thành công`);
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

    // Replace special tags for better display
    let processedContent = content;

    // Handle special tags for group questions with better styling
    processedContent = processedContent
      .replace(/\[\<sg\>\]/g, '<div class="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500 my-3">')
      .replace(/\[\<\/sg\>\]/g, '</div>')
      .replace(/\[\<egc\>\]/g, '<hr class="my-3 border-dashed border-gray-300"/>')
      .replace(/\[\<br\>\]/g, '');

    // Replace question number references with nicer styling
    processedContent = processedContent
      .replace(/\{<(\d+)>\}/g, '<span class="inline-block bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium text-xs">$1</span>')
      .replace(/\(<(\d+)>\)/g, '<span class="inline-block bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium text-xs">$1</span>');

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
          <div className="space-y-3">
            <h3 className="font-medium">Hướng dẫn nhập gói câu hỏi</h3>
            <p className="text-sm">Chức năng đang được phát triển...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-screen-2xl">
      <MathJaxInitializer />
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Header with statistics */}
      <div className="border bg-white rounded-lg p-4 mb-4">
        <h1 className="text-xl font-medium mb-2">Thông kê câu hỏi</h1>

        <div className="flex justify-between">
          <div className="text-right text-sm font-medium">
            {selectedQuestionIds.length}/{selectedQuestions.length} câu hỏi được chọn
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-2">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="text-sm text-blue-700 font-medium">Đơn lựa chọn</div>
            <div className="text-2xl font-bold text-blue-700">{getQuestionStats().singleChoice}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <div className="text-sm text-yellow-700 font-medium">Nhiều lựa chọn</div>
            <div className="text-2xl font-bold text-yellow-700">{getQuestionStats().multiChoice}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <div className="text-sm text-purple-700 font-medium">Nhóm</div>
            <div className="text-2xl font-bold text-purple-700">{getQuestionStats().groups}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="text-sm text-green-700 font-medium">Tổng</div>
            <div className="text-2xl font-bold text-green-700">{getQuestionStats().total}</div>
          </div>
        </div>

        {Object.keys(getQuestionStats().clos).length > 0 && (
          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Phân bố CLOs:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(getQuestionStats().clos).map(([clo, count]) => (
                <div key={clo} className={`${getCloColor(clo)} text-sm px-2 py-0.5 rounded-full`}>
                  <span className="mr-1">{clo}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 1: File Upload */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 mr-2">1</span>
          Chọn tệp tin câu hỏi
        </h2>

        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center cursor-pointer">
            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium">Kéo thả file DOCX vào đây hoặc nhấn để chọn file</p>
            <p className="text-xs text-gray-500 mt-1">Chỉ hỗ trợ file DOCX với định dạng chuẩn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Templates */}
          <div className="border rounded-lg bg-white p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Mẫu câu hỏi</h3>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? 'Ẩn bớt' : 'Xem thêm'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableTemplates.slice(0, showTemplates ? undefined : 2).map((template) => (
                <div
                  key={template.id}
                  className="border rounded-md p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  onClick={() => showGuide('word')}
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm truncate">{template.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide instead of recent files */}
          <div className="border rounded-lg bg-white p-4">
            <h3 className="text-md font-medium mb-2">Hướng dẫn soạn đề</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Câu hỏi đơn: Nội dung câu hỏi sau đó là các phương án A, B, C, D. Gạch chân đáp án đúng.</p>
              <p>• Câu hỏi nhóm: Sử dụng các ký hiệu [&lt;sg&gt;] để bắt đầu nhóm và [&lt;/sg&gt;] để kết thúc.</p>
              <p>• Ký hiệu [&lt;br&gt;] để ngăn cách giữa các câu hỏi.</p>
              <button
                className="text-blue-600 hover:text-blue-800 mt-2 text-sm font-medium"
                onClick={() => showGuide('word')}
              >
                Xem hướng dẫn chi tiết
              </button>
            </div>
          </div>
        </div>

        {/* Loading and Error states */}
        {isLoading && (
          <div className="text-center p-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-xs sm:text-sm">Đang xử lý...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded-md text-xs sm:text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Step 2: Save Questions */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 mr-2">2</span>
          Lưu câu hỏi vào
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Select Khoa */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium">Chọn khoa: <span className="text-red-500">*</span></label>
            <select
              className="border p-1 sm:p-2 rounded-md w-full text-xs sm:text-sm"
              value={facultyId}
              onChange={handleFacultyChange}
            >
              <option value="">Chọn khoa</option>
              {faculties.map(faculty => (
                <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                  {faculty.TenKhoa}
                </option>
              ))}
            </select>
          </div>
          {/* Select Môn Học */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium">Chọn Môn Học: <span className="text-red-500">*</span></label>
            <select
              className="border p-1 sm:p-2 rounded-md w-full text-xs sm:text-sm"
              value={subjectId}
              onChange={handleSubjectChange}
              disabled={!facultyId}
            >
              <option value="">Chọn môn học</option>
              {subjects.map(subject => (
                <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                  {subject.TenMonHoc}
                </option>
              ))}
            </select>
          </div>
          {/* Select Chương/Phần */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium">Chọn Chương/Phần: <span className="text-red-500">*</span></label>
            <select
              className="border p-1 sm:p-2 rounded-md w-full text-xs sm:text-sm"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              disabled={!subjectId}
            >
              <option value="">Chọn chương/phần</option>
              {chapters.map(chapter => (
                <option key={chapter.MaPhan} value={chapter.MaPhan}>
                  {chapter.TenPhan}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions List Section with filters integrated */}
      <div className="space-y-4 flex flex-col h-full mt-4">
        {selectedQuestions.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600"
                  checked={selectedQuestionIds.length === selectedQuestions.length && selectedQuestions.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="ml-2 text-sm font-medium">
                  Chọn tất cả câu hỏi
                  {selectedQuestionIds.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({selectedQuestionIds.length} / {selectedQuestions.length})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex gap-2 items-center">
                <select
                  className="border p-1 rounded-md text-xs"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option value="all">Tất cả loại</option>
                  <option value="single-choice">Đơn lựa chọn</option>
                  <option value="multi-choice">Nhiều lựa chọn</option>
                  <option value="fill-blank">Điền khuyết</option>
                  <option value="group">Nhóm</option>
                </select>

                {getUniqueClos().length > 0 && (
                  <select
                    className="border p-1 rounded-md text-xs"
                    value={filterClo}
                    onChange={e => setFilterClo(e.target.value)}
                  >
                    <option value="all">Tất cả CLO</option>
                    <option value="none">Không có CLO</option>
                    {getUniqueClos().map(clo => (
                      <option key={clo} value={clo}>{clo}</option>
                    ))}
                  </select>
                )}

                {(filterType !== 'all' || filterClo !== 'all') && (
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterClo('all');
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-md flex items-center"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {renderQuestions()}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={handleSaveQuestions}
          className={`bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || selectedQuestionIds.length === 0 || !chapterId}
        >
          <UploadIcon className="h-3 w-3 sm:h-5 sm:w-5" />
          {isLoading ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Hướng Dẫn Soạn Thảo Nội Dung"
        size="xl"
        footer={
          <button
            onClick={() => setShowGuideModal(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 sm:px-6 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium"
          >
            Đóng
          </button>
        }
      >
        {renderGuideContent()}
      </Modal>

      {/* KaTeX Styles */}
      <style>{`
        .katex-formula .katex {
          display: inline-block;
          font-size: 1.1em;
        }

        /* Additional styles for better LaTeX rendering */
        .katex-display {
          display: block;
          margin: 1em 0;
          text-align: center;
          overflow-x: auto;
          overflow-y: hidden;
        }

        /* Fix for fractions */
        .katex .mfrac .frac-line {
          border-bottom-width: 1px;
        }

        /* Fix for matrices */
        .katex .mord.mtable {
          vertical-align: middle;
        }

        /* Fix for chemical formulas */
        .katex .msupsub {
          text-align: left;
        }

        /* Fix for superscripts */
        .katex .msup {
          vertical-align: baseline;
        }

        /* Fix for subscripts */
        .katex .msub {
          vertical-align: baseline;
        }
      `}</style>

      {/* View Question Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Chi tiết câu hỏi"
        size="lg"
      >
        {viewingQuestion && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {viewingQuestion.clo && (
                <span className={`${getCloColor(viewingQuestion.clo)} text-xs rounded px-2 py-0.5`}>
                  {viewingQuestion.clo}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                viewingQuestion.type === 'fill-blank'
                  ? 'bg-blue-100 text-blue-700'
                  : viewingQuestion.type === 'multi-choice'
                    ? 'bg-yellow-100 text-yellow-700'
                    : viewingQuestion.type === 'group'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
              }`}>
                {viewingQuestion.type === 'fill-blank'
                  ? 'Điền khuyết'
                  : viewingQuestion.type === 'multi-choice'
                    ? 'Nhiều lựa chọn'
                    : viewingQuestion.type === 'group'
                      ? 'Câu hỏi nhóm'
                      : 'Đơn lựa chọn'}
              </span>
            </div>

            <div className="mb-4">
              {renderContent(viewingQuestion.content)}
            </div>

            {viewingQuestion.groupContent && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
                {renderContent(viewingQuestion.groupContent)}
              </div>
            )}

            {viewingQuestion.type !== 'group' && viewingQuestion.answers && (
              <div className="space-y-3">
                <h4 className="font-medium">Phương án trả lời:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewingQuestion.answers.map((answer, idx) => (
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
              </div>
            )}

            {viewingQuestion.type === 'group' && viewingQuestion.childQuestions && (
              <div className="space-y-3">
                <h4 className="font-medium">Câu hỏi con:</h4>
                {viewingQuestion.childQuestions.map((childQ, childIdx) => (
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
                    </div>

                    <div className="mb-3">
                      {renderContent(childQ.content)}
                    </div>

                    {childQ.answers && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {childQ.answers.map((answer, idx) => (
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
            )}
          </div>
        )}
      </Modal>

      {/* Edit Question Modal - Simple version */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Chỉnh sửa câu hỏi"
        size="lg"
      >
        {editingQuestion && (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nội dung câu hỏi:</label>
              <textarea
                className="w-full border rounded-md p-2 h-24"
                value={editingQuestion.content}
                onChange={(e) => setEditingQuestion({...editingQuestion, content: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">CLO:</label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={editingQuestion.clo || ''}
                onChange={(e) => setEditingQuestion({...editingQuestion, clo: e.target.value})}
              />
            </div>

            {editingQuestion.type !== 'group' && editingQuestion.answers && (
              <div>
                <label className="block text-sm font-medium mb-2">Phương án trả lời:</label>
                {editingQuestion.answers.map((answer, idx) => (
                  <div key={idx} className="mb-2 flex items-start">
                    <div className="flex items-center mr-2 mt-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600"
                        checked={answer.isCorrect}
                        onChange={(e) => {
                          const newAnswers = [...editingQuestion.answers];
                          newAnswers[idx] = {...answer, isCorrect: e.target.checked};
                          setEditingQuestion({...editingQuestion, answers: newAnswers});
                        }}
                      />
                      <span className="ml-2">{String.fromCharCode(65 + idx)}</span>
                    </div>
                    <textarea
                      className="flex-1 border rounded-md p-2 h-16"
                      value={answer.content}
                      onChange={(e) => {
                        const newAnswers = [...editingQuestion.answers];
                        newAnswers[idx] = {...answer, content: e.target.value};
                        setEditingQuestion({...editingQuestion, answers: newAnswers});
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  // Update the question in the selectedQuestions array
                  setSelectedQuestions(prev => prev.map(q =>
                    q.id === editingQuestion.id ? editingQuestion : q
                  ));
                  setShowEditModal(false);
                }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Question Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xóa câu hỏi"
        size="sm"
      >
        <div className="p-4 text-center">
          <p className="mb-4">Bạn có chắc chắn muốn xóa câu hỏi này?</p>
          <div className="flex justify-center gap-2">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              onClick={() => setShowDeleteModal(false)}
            >
              Hủy
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={confirmDeleteQuestion}
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UploadQuestions;
