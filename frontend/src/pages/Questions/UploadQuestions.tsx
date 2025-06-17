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

        // Use mammoth to convert DOCX to HTML with style preservation
        const options = {
          arrayBuffer,
          // Use convertToHtml options to preserve styles
          styleMap: [
            "u => u",
            "strong => strong",
            "b => strong",
            "i => em",
            "strike => s",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh"
          ]
        };

        const result = await mammoth.convertToHtml(options);
        const htmlContent = result.value;

        console.log('HTML content loaded, length:', htmlContent.length);

        // Create a DOM parser to work with the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Questions array
        const questions: ParsedQuestion[] = [];

        // Process the HTML to extract questions
        // Split content by [<br>] which indicates end of a question
        const questionBlocks = htmlContent.split('[&lt;br&gt;]');

        console.log(`Found ${questionBlocks.length} question blocks`);

        // Process each question block
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
            const sgMatch = block.match(/\[&lt;sg&gt;\]([\s\S]*?)\[&lt;egc&gt;\]/);
            if (sgMatch) {
              question.groupContent = sgMatch[1].trim();

              // Remove group content from block for further processing
              block = block.replace(sgMatch[0], '');
            }

            // Extract child questions
            question.childQuestions = [];

            // Find child questions using pattern (<number>)
            const childBlocks = block.split(/\(&lt;\d+&gt;\)/g).filter(b => b.trim());

            childBlocks.forEach((childBlock, childIdx) => {
              if (!childBlock.trim()) return;

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
              }

              // Extract answers from child question
              const answerLines = childBlock.split(/<br\s*\/?>/g)
                .filter(line => /^[A-D]\./.test(line.trim()));

              // Process each answer
              answerLines.forEach((line, idx) => {
                // Enhanced detection of correct answers marked by underline
                const isUnderlined = Boolean(
                  line.includes('<u>') ||
                  line.includes('</u>') ||
                  line.includes('<strong>') ||
                  line.includes('text-decoration:underline') ||
                  line.includes('text-decoration: underline') ||
                  line.match(/<span\s+class="[^"]*underline[^"]*"/i)
                );

                // Clean up the content while keeping the formatting for LaTeX
                const cleanContent = line
                  .replace(/^[A-D]\.\s*/, '') // Remove A., B. etc.
                  .replace(/<\/?u>/g, '') // Remove underline tags
                  .replace(/<\/?strong>/g, '') // Remove strong tags
                  .trim();

                childQuestion.answers.push({
                  id: uuidv4(),
                  content: cleanContent,
                  isCorrect: isUnderlined,
                  order: idx
                });
              });

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
            // Extract question content (everything before first A.)
            const contentAndAnswers = block.split(/<br\s*\/?>/g);

            // First line is the question content
            question.content = contentAndAnswers[0].trim();

            // Extract CLO information from content if it exists
            const contentCloMatch = question.content.match(/\(CLO\d+\)/);
            if (contentCloMatch) {
              question.clo = contentCloMatch[0].replace(/[()]/g, '');
            }

            // Extract answers
            const answerLines = contentAndAnswers.filter(line =>
              /^[A-D]\./.test(line.trim())
            );

            // Process each answer
            answerLines.forEach((line, idx) => {
              // Enhanced detection of correct answers marked by underline
              const isUnderlined = Boolean(
                line.includes('<u>') ||
                line.includes('</u>') ||
                line.includes('<strong>') ||
                line.includes('text-decoration:underline') ||
                line.includes('text-decoration: underline') ||
                line.match(/<span\s+class="[^"]*underline[^"]*"/i)
              );

              // Clean up the content while keeping the formatting for LaTeX
              const cleanContent = line
                .replace(/^[A-D]\.\s*/, '') // Remove A., B. etc.
                .replace(/<\/?u>/g, '') // Remove underline tags
                .replace(/<\/?strong>/g, '') // Remove strong tags
                .trim();

              question.answers.push({
                id: uuidv4(),
                content: cleanContent,
                isCorrect: isUnderlined,
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
      // Parse DOCX file using Mammoth.js locally
      console.log('Starting to parse DOCX file with Mammoth.js...');
      const parsedQuestions = await parseDocxWithMammoth(file);

      console.log(`Parsed ${parsedQuestions.length} questions with Mammoth.js`);

      // Add fileId to all questions for compatibility
      const fileId = uuidv4();
      const processedQuestions = parsedQuestions.map(question => ({
        ...question,
        fileId
      }));

      setSelectedQuestions(processedQuestions);

      // Select all questions by default
      setSelectedQuestionIds(processedQuestions.map(q => q.id));

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
    if (!facultyId || !subjectId || !chapterId) {
      alert('Vui lòng chọn đầy đủ Khoa, Môn học và Chương/Phần');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      alert('Chưa có câu hỏi nào được chọn');
      return;
    }

    setIsLoading(true);
    setError(null);

    // We need to get the fileId from the response we got earlier
    const fileId = selectedQuestions[0]?.fileId;

    if (!fileId) {
      setError('Missing file information. Please upload again.');
      setIsLoading(false);
      return;
    }

    try {
      // Filter the selected questions to include their CLO information
      const selectedQuestionsWithClO = selectedQuestions
        .filter(q => selectedQuestionIds.includes(q.id))
        .map(q => ({
          id: q.id,
          clo: q.clo || null,  // Include the CLO information
          childQuestions: q.childQuestions ? q.childQuestions.map((child: ParsedQuestion) => ({
            id: child.id,
            clo: child.clo || null  // Include CLO for child questions too
          })) : []
        }));

      // Send request to save questions with CLO information
      const response = await axios.post(`${API_BASE_URL}/questions-import/save`, {
        fileId,
        questionIds: selectedQuestionIds,
        maPhan: chapterId,
        questionMetadata: selectedQuestionsWithClO  // Send the CLO metadata
      });

      if (response.data && response.data.success) {
        alert(`Đã lưu thành công ${response.data.savedCount} câu hỏi!`);
      // Optionally clear questions or redirect
      // setSelectedQuestions([]);
      } else {
      setError('Lỗi khi lưu câu hỏi. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error saving questions:', err);
      setError(err.response?.data?.message || 'Lỗi khi lưu câu hỏi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render LaTeX in question content
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
    processedContent = processedContent
      .replace(/<img/g, '<img style="max-width: 100%; height: auto; display: block; margin: 10px auto; object-fit: contain;"');

    // Check if content contains LaTeX (enclosed in $ signs)
    const hasLatex = /\$|\\\(|\\\[|\\begin\{equation\}/.test(processedContent);

    if (hasLatex) {
      try {
        // Extract and process all LaTeX expressions with different delimiters
        let latexExpressions: string[] = [];
        let latexCount = 0;

        // Helper function to replace LaTeX with placeholders
        const saveLaTeX = (match: string, group: string, offset: number, fullString: string) => {
          const placeholder = `LATEX_PLACEHOLDER_${latexCount++}`;
          latexExpressions.push(match);
          return placeholder;
        };

        // Replace all LaTeX expressions with placeholders
        // Handle both inline and display math with various delimiters
        processedContent = processedContent
          .replace(/\$\$(.*?)\$\$/gs, saveLaTeX)
          .replace(/\$([^$\n]+?)\$/g, saveLaTeX) // Changed to non-greedy to avoid issues
          .replace(/\\\[(.*?)\\\]/gs, saveLaTeX)
          .replace(/\\\((.*?)\\\)/gs, saveLaTeX)
          .replace(/\\begin\{equation\}(.*?)\\end\{equation\}/gs, saveLaTeX);

        // Render HTML content
        let result = processedContent;

        // Replace placeholders with rendered LaTeX
        for (let i = 0; i < latexCount; i++) {
          const placeholder = `LATEX_PLACEHOLDER_${i}`;
          const expr = latexExpressions[i];

          try {
            // Determine if it's display mode or inline mode
            const isDisplayMode = expr.startsWith('$$') ||
                                 expr.startsWith('\\[') ||
                                 expr.includes('\\begin{equation}');

            const latex = expr
              .replace(/^\$\$(.*)\$\$$/gs, '$1')
              .replace(/^\$(.*)\$$/gs, '$1')
              .replace(/^\\\[(.*)\\\]$/gs, '$1')
              .replace(/^\\\((.*)\\\)$/gs, '$1')
              .replace(/\\begin\{equation\}(.*?)\\end\{equation\}/gs, '$1');

            // Render LaTeX using KaTeX
            const html = KaTeX.renderToString(latex, {
              displayMode: isDisplayMode,
              throwOnError: false,
              trust: true,
              strict: false,
              output: 'html' // Ensure HTML output
            });

            // Replace placeholder with rendered LaTeX
            if (isDisplayMode) {
              result = result.replace(placeholder, `<div class="katex-display my-4 text-center overflow-x-auto">${html}</div>`);
            } else {
              result = result.replace(placeholder, `<span class="katex-inline">${html}</span>`);
            }
          } catch (e) {
            console.error('LaTeX rendering error:', e);
            // If rendering fails, show raw LaTeX with error indicator
            result = result.replace(placeholder, `<span class="text-red-500">${expr}</span>`);
          }
        }

        return <div dangerouslySetInnerHTML={{ __html: result }} />;
      } catch (e) {
        console.error('Content processing error:', e);
        return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
      }
    }

    // Handle images (if URLs are present)
    if (processedContent.includes('<img') || processedContent.includes('[img]')) {
      return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
    }

    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
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
              className={`flex items-center p-2 rounded-md ${
                answer.isCorrect
                  ? "bg-green-50 border-2 border-green-300"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {/* Answer letter in a circle */}
              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mr-2 ${
                answer.isCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>

              {/* Answer content with LaTeX support */}
              <div className="flex-1 min-w-0">
                {renderContent(answer.content)}
              </div>

              {/* "Đáp án" badge for correct answer */}
              {answer.isCorrect && (
                <div className="flex-shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded ml-2 font-medium">
                  Đáp án
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render single question as a card
  const renderSingleQuestionCard = (question: any, index: number) => (
    <div key={question.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={selectedQuestionIds.includes(question.id)}
            onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
          />
          <div className="text-sm font-medium text-gray-700">#{index + 1}</div>
          {question.clo && (
            <span className={`${getCloColor(question.clo)} text-xs rounded px-2 py-0.5`}>
              {question.clo}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            question.type === 'fill-blank'
              ? 'bg-blue-100 text-blue-700'
              : question.type === 'multi-choice'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
          }`}>
            {question.type === 'fill-blank'
              ? 'Điền khuyết'
              : question.type === 'multi-choice'
                ? 'Nhiều lựa chọn'
                : 'Đơn lựa chọn'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <Eye className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 text-gray-800">
          {renderContent(question.content)}
        </div>

        {/* Display answers in 2x2 grid for better visual layout */}
        {question.answers && question.answers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.answers.map((answer: any, idx: number) => (
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

        <div className="mt-2 pt-2 border-t text-xs text-gray-500 flex justify-between">
          <div>Ngày tạo: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );

  // Render group question with child questions
  const renderGroupQuestionCard = (question: any, index: number) => (
    <div key={question.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={selectedQuestionIds.includes(question.id)}
            onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
          />
          <div className="text-sm font-medium text-gray-700">#{index + 1}</div>
          {question.clo && (
            <span className={`${getCloColor(question.clo)} text-xs rounded px-2 py-0.5`}>
              {question.clo}
            </span>
          )}
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
            Câu hỏi nhóm
          </span>
          {question.childQuestions && (
            <span className="text-xs text-gray-500">
              ({question.childQuestions.length} câu hỏi con)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <Eye className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 text-gray-800">
          {renderContent(question.content)}
        </div>

        {question.groupContent && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
            {renderContent(question.groupContent)}
          </div>
        )}

        {/* Button to toggle showing child questions */}
        <button
          onClick={() => toggleGroup(question.id)}
          className="w-full border border-gray-200 flex items-center justify-between p-2 rounded-md bg-white hover:bg-gray-50"
        >
          <span className="text-sm">
            {expandedGroups.includes(question.id) ? 'Ẩn câu hỏi con' : 'Xem câu hỏi con'}
          </span>
          {expandedGroups.includes(question.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Display child questions when expanded */}
        {expandedGroups.includes(question.id) && question.childQuestions && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {question.childQuestions.map((childQ: any, childIdx: number) => (
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
        )}

        <div className="mt-2 pt-2 border-t text-xs text-gray-500 flex justify-between">
          <div>Trung bình</div>
          <div>Ngày tạo: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );

  // Renders appropriate guide content based on type
  const renderGuideContent = () => {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="font-semibold text-lg sm:text-xl mb-4 border-b pb-2">
          <h2>Hướng Dẫn Soạn Thảo Nội Dung Đề Thi Trắc Nghiệm</h2>
        </div>

        {/* Section 1: Hình thức */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base sm:text-lg text-blue-600">1. Hình thức</h3>
          <div className="space-y-2">
            <p><strong>Phần mềm sử dụng:</strong> Microsoft Word</p>
            <p><strong>Font chữ:</strong> Unicode - Times New Roman, cỡ chữ 13</p>
            <p><strong>Trình bày:</strong></p>
            <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base">
              <li>Mỗi phương án lựa chọn phải xuống dòng bằng phím Enter.</li>
              <li>Không sử dụng bảng, Bullets and Numbering để đánh tự động.</li>
              <li>Ký tự A, B, C, D phải là chữ in hoa, theo sau là dấu chấm (.), khoảng trắng, rồi đến nội dung lựa chọn.</li>
              <li>Gạch chân đáp án đúng (kèm dấu chấm).</li>
              <li>In nghiêng ký tự A, B, C, D ở các phương án không cho hoán vị.</li>
              <li>Tên tập tin: Học phần - chương - chuẩn đầu ra</li>
              <li>Định dạng hình ảnh: Chuyển thành Bitmap Image</li>
              <li>Công thức: Sử dụng Equation</li>
            </ul>
          </div>
        </div>

        {/* Section 2: Các Dạng Câu Hỏi Trắc Nghiệm Khách Quan */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base sm:text-lg text-blue-600">2. Các Dạng Câu Hỏi Trắc Nghiệm Khách Quan</h3>
          <h4 className="font-semibold text-sm sm:text-base">Các ký hiệu quy ước kỹ thuật:</h4>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 mt-2 text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 text-left">Ký hiệu</th>
                  <th className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 text-left">Ý nghĩa</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 font-mono text-amber-600">[&lt;sg&gt;]</td>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2">Ký hiệu bắt đầu nhóm</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 font-mono text-amber-600">[&lt;/sg&gt;]</td>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2">Ký hiệu kết thúc nhóm</td>
                </tr>
                    <tr>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 font-mono text-amber-600">[&lt;egc&gt;]</td>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2">Ký hiệu kết thúc nội dung của nhóm</td>
                </tr>
                    <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 font-mono text-amber-600">[&lt;br&gt;]</td>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2">Ký hiệu kết thúc một câu hỏi</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2 font-mono text-purple-600">(&lt;n&gt;)</td>
                  <td className="border border-gray-300 px-2 py-1 sm:px-4 sm:py-2">Ký hiệu số thứ tự tương ứng của câu hỏi trong nhóm</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subsection 2.1: Câu Hỏi Đơn */}
          <div className="space-y-3 mt-3">
            <h4 className="font-medium text-sm sm:text-base text-blue-500">2.1. Câu Hỏi Đơn</h4>
            <p className="text-sm sm:text-base">Mỗi câu hỏi có 04 phương án lựa chọn và kết thúc bằng ký hiệu [&lt;br&gt;].</p>
            <p className="text-sm sm:text-base"><strong>Cú pháp chuẩn:</strong></p>
            <CodeBlock>{`(CLO…) Câu hỏi:
A. <lựa chọn 1>
B. <lựa chọn 2>
C. <lựa chọn 3>
D. <lựa chọn 4>
[<br>]`}</CodeBlock>
            <p className="text-sm sm:text-base"><strong>Ví dụ:</strong></p>
            <CodeBlock>{`(CLO1) When did the woman put her keys in her purse?
A. When she came home.
B. When she was driving the car.
C. When she left school.
D. When she opened the front door.
[<br>]`}</CodeBlock>
          </div>

          {/* Subsection 2.2: Câu Hỏi Nhóm */}
          <div className="space-y-3 mt-3">
            <h4 className="font-medium text-sm sm:text-base text-blue-500">2.2. Câu Hỏi Nhóm</h4>
            <p className="text-sm sm:text-base">Nhóm câu hỏi sử dụng các ký hiệu quy ước sau:</p>
            <ul className="list-disc pl-4 sm:pl-6 text-sm sm:text-base">
              <li><strong className="text-amber-600 font-mono">[&lt;sg&gt;]</strong>: Bắt đầu nhóm</li>
              <li><strong className="text-amber-600 font-mono">[&lt;egc&gt;]</strong>: Kết thúc nội dung nhóm</li>
              <li><strong className="text-amber-600 font-mono">[&lt;/sg&gt;]</strong>: Kết thúc nhóm</li>
              <li><strong className="text-blue-600 font-mono">&#123;&lt;1&gt;&#125; – &#123;&lt;n&gt;&#125;</strong>: Thể hiện số thứ tự câu hỏi trong nhóm</li>
            </ul>
            <p className="text-sm sm:text-base"><strong>Cú pháp chuẩn:</strong></p>
            <CodeBlock>{`[<sg>]
Nội dung nhóm, dùng cho các câu từ {<1>} – {<n>}
[<egc>]
(<1>) (CLO1) Câu hỏi con 1
A. Lựa chọn 1
B. Lựa chọn 2
C. Lựa chọn 3
D. Lựa chọn 4
[<br>]
(<2>) (CLO2) Câu hỏi con 2
A. Lựa chọn 1
B. Lựa chọn 2
C. Lựa chọn 3
D. Lựa chọn 4
[<br>]
[</sg>]`}</CodeBlock>
            <p className="text-sm sm:text-base"><strong>Ví dụ:</strong></p>
            <CodeBlock>{`[<sg>]
Questions {<1>} – {<3>} refer to the following passage.
Probably the most important factor governing the severity of forest fires is weather. Hot, dry weather lowers the moisture content of fuels. Once a fire has started, wind is extremely critical because it influences the oxygen supply and the rate of spread...
[<egc>]
(<1>) (CLO1) In this passage, the author's main purpose is to …
A. argue
B. inform
C. persuade
D. entertain
[<br>]
(<2>) (CLO1) Which of the following best describes the organization of the passage?
A. A comparison and contrast of the factors governing forest fires is followed by a list of causes.
B. A description of the conditions affecting forest fires is followed by a description of the causes.
C. An analysis of factors related to forest fires is followed by an argument against the causes of fires.
D. Several generalizations about forest fires are followed by a series of conclusions.
[<br>]
[</sg>]`}</CodeBlock>
          </div>

          {/* Subsection 2.3: Câu Hỏi Điền Khuyết */}
          <div className="space-y-3 mt-3">
            <h4 className="font-medium text-sm sm:text-base text-blue-500">2.3. Câu Hỏi Điền Khuyết</h4>
            <p className="text-sm sm:text-base">Dạng câu hỏi nhóm điền khuyết sử dụng cú pháp tương tự câu hỏi nhóm:</p>
            <CodeBlock>{`[<sg>]
Nội dung câu hỏi điền khuyết…
[<egc>]
(<1>) (CLO…)
A. Lựa chọn 1
B. Lựa chọn 2
C. Lựa chọn 3
D. Lựa chọn 4
[<br>]
[</sg>]`}</CodeBlock>
            <p className="text-sm sm:text-base"><strong>Ví dụ:</strong></p>
            <CodeBlock>{`[<sg>]
Questions {<1>} – {<3>} refer to the following passage.
Travelling to all corners of the world gets easier and easier. We live in a global village, but this {<1>} _____ mean that we all behave the same way...
[<egc>]
(<1>) (CLO…)
A. doesn't
B. didn't
C. don't
D. isn't
[<br>]
(<2>) (CLO…)
A. may not
B. shouldn't
C. don't
D. can't
[<br>]
[</sg>]`}</CodeBlock>
          </div>

          {/* Subsection 2.4: Câu Hỏi Dạng Nghe */}
          <div className="space-y-3 mt-3">
            <h4 className="font-medium text-sm sm:text-base text-blue-500">2.4. Câu Hỏi Dạng Nghe</h4>
            <p className="text-sm sm:text-base">Sử dụng thêm ký hiệu <code className="text-green-600 font-mono">&lt;audio&gt;</code> và <code className="text-green-600 font-mono">&lt;/audio&gt;</code> để chỉ đường dẫn file âm thanh.</p>
            <p className="text-sm sm:text-base"><strong>Cú pháp chuẩn:</strong></p>
            <CodeBlock>{`[<sg>]
Nội dung của phần LISTENING:
<audio>đường dẫn file audio</audio>
[<egc>]
(<1>) (CLO…)
A. Lựa chọn 1
B. Lựa chọn 2
C. Lựa chọn 3
D. Lựa chọn 4
[<br>]
[</sg>]`}</CodeBlock>
            <p className="text-sm sm:text-base"><strong>Ví dụ:</strong></p>
            <CodeBlock>{`[<sg>]
Questions <1> – <3>
Nội dung của phần LISTENING:
<audio>audio/1.mp3</audio>
[<egc>]
(<1>) (CLO...) What does the man keep in his wallet?
A. ID card.
B. Money.
C. Credit cards.
D. All are correct.
[<br>]
[</sg>]`}</CodeBlock>
          </div>
        </div>

        {/* Section 3: Lưu Ý Quan Trọng */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base sm:text-lg text-blue-600">3. Lưu Ý Quan Trọng</h3>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base">
            <li>Tập tin âm thanh phải nằm cùng thư mục hoặc thư mục con chứa tập tin Word.</li>
            <li>Đảm bảo đúng các ký hiệu bắt đầu, kết thúc nhóm.</li>
            <li>Định dạng đáp án đúng, không cho hoán vị theo hướng dẫn chi tiết trên.</li>
            <li>Mỗi câu hỏi phải có đúng 4 phương án lựa chọn.</li>
            <li>Các ký hiệu phải được gõ chính xác, bao gồm cả dấu ngoặc vuông.</li>
            <li>Không được chèn bảng, hình ảnh, hoặc đối tượng khác vào giữa các phương án lựa chọn.</li>
            <li>Tên file nên đặt theo quy ước để dễ dàng quản lý.</li>
          </ul>
        </div>
      </div>
    );
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
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
              {filterQuestions(selectedQuestions).map((question, index) => (
                question.type === 'group'
                  ? renderGroupQuestionCard(question, index)
                  : renderSingleQuestionCard(question, index)
              ))}
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
    </div>
  );
};

export default UploadQuestions;
