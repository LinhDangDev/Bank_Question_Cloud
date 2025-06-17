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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const UploadQuestions = () => {
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
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

  // Handle the actual file selection
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Chỉ hỗ trợ tệp tin .docx');
      return;
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setError(`Kích thước tệp tin quá lớn. Tối đa ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Add the chapter ID if selected
    if (chapterId) {
      formData.append('maPhan', chapterId);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send the file to backend for processing
      const response = await axios.post(`${API_BASE_URL}/questions-import/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Process the parsed questions
      if (response.data && response.data.fileId) {
        // Fetch the preview of parsed questions
        const previewResponse = await axios.get(`${API_BASE_URL}/questions-import/preview/${response.data.fileId}`);
        if (previewResponse.data && Array.isArray(previewResponse.data.items)) {
          // Process the questions before setting state
          const processedQuestions = previewResponse.data.items.map((q: any) => {
            // Add fileId to each question
            return {
              ...q,
              fileId: response.data.fileId,
              // Process answers to ensure consistent format
              answers: q.answers || []
            };
          });

          setSelectedQuestions(processedQuestions);

          if (processedQuestions.length === 0) {
            setError('Không tìm thấy câu hỏi nào trong tệp tin');
          }
        } else {
          setError('Định dạng phản hồi không đúng');
        }
      } else {
        setError('Định dạng phản hồi không đúng');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Lỗi xử lý tệp tin. Vui lòng kiểm tra định dạng và thử lại.');
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      // Send request to save questions
      const response = await axios.post(`${API_BASE_URL}/questions-import/save`, {
        fileId,
        questionIds: selectedQuestionIds,
        maPhan: chapterId
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
    // Replace special tags for better display
    let processedContent = content;

    // Replace nested group tags with styled versions
    processedContent = processedContent
      .replace(/\[\<sg\>\]/g, '<div class="bg-gray-50 p-2 rounded-md border-l-4 border-blue-500 mb-2">')
      .replace(/\[\<\/sg\>\]/g, '</div>')
      .replace(/\[\<egc\>\]/g, '<hr class="my-2 border-dashed border-gray-300"/>')
      .replace(/\[\<br\>\]/g, '');

    // Replace question number references
    processedContent = processedContent
      .replace(/\{<(\d+)>\}/g, '<span class="inline-block bg-blue-100 text-blue-800 px-1 rounded">$1</span>')
      .replace(/\(<(\d+)>\)/g, '<span class="inline-block bg-purple-100 text-purple-800 px-1 rounded">$1</span>');

    // Process audio tags
    processedContent = processedContent
      .replace(/<audio>(.*?)<\/audio>/g, '<div class="flex items-center gap-2 my-1"><span class="text-green-600">🎵</span><span class="text-xs bg-green-50 text-green-700 p-1 rounded">$1</span></div>');

    // Check if content contains LaTeX (enclosed in $ signs)
    if (processedContent.includes('$')) {
      try {
        const parts = processedContent.split(/(\$.*?\$)/g);
        let result = '';

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part.startsWith('$') && part.endsWith('$')) {
            try {
              const latex = part.slice(1, -1);
              const html = KaTeX.renderToString(latex, { throwOnError: false });
              result += `<span class="katex-formula">${html}</span>`;
            } catch (e) {
              result += part;
            }
          } else {
            result += part;
          }
        }

        return <div dangerouslySetInnerHTML={{ __html: result }} />;
      } catch (e) {
        return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
      }
    }

    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  // Function to render answers
  const renderAnswers = (answers: any[]) => (
    <div className="space-y-2 mt-3">
      {answers.map((answer, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 p-2 rounded-md ${
            answer.isCorrect
              ? "bg-green-50 border border-green-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium ${
            answer.isCorrect
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}>
            {String.fromCharCode(65 + index)}
          </span>
          <span className="flex-1">{renderContent(answer.content)}</span>
          {answer.isCorrect && (
            <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
              Đáp án
            </span>
          )}
        </div>
      ))}
    </div>
  );

  // Render single question as a card
  const renderQuestionCard = (question: any, index: number) => (
    <div
      key={question.id}
      className="mb-4 border rounded-lg overflow-hidden shadow-sm bg-white"
    >
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
            {question.clo && (
              <span className="border border-gray-300 text-xs rounded px-2 py-0.5">
                {question.clo}
              </span>
            )}
            <span className={`${getDifficultyColor(question.difficulty)} text-xs rounded px-2 py-0.5`}>
              {getDifficultyText(question.difficulty)}
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs rounded px-2 py-0.5">
              {question.type === 'group'
                ? 'Câu hỏi nhóm'
                : question.type === 'fill-blank'
                  ? 'Điền khuyết'
                  : question.type === 'multi-choice'
                    ? 'Nhiều lựa chọn'
                    : 'Đơn lựa chọn'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600"
              checked={selectedQuestionIds.includes(question.id)}
              onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {/* Question content */}
          <div className="text-gray-800 font-medium">
            {renderContent(question.content)}
          </div>

          {/* Group content if applicable */}
          {question.groupContent && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2">
              {renderContent(question.groupContent)}
            </div>
          )}

          {/* Answers */}
          {question.answers && question.answers.length > 0 && (
            renderAnswers(question.answers)
          )}
        </div>
      </div>
    </div>
  );

  // Render group question with child questions
  const renderGroupQuestionCard = (question: any, index: number) => (
    <div
      key={question.id}
      className="mb-4 border rounded-lg overflow-hidden shadow-sm bg-white"
    >
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
            {question.clo && (
              <span className="border border-gray-300 text-xs rounded px-2 py-0.5">
                {question.clo}
              </span>
            )}
            <span className={`${getDifficultyColor(question.difficulty)} text-xs rounded px-2 py-0.5`}>
              {getDifficultyText(question.difficulty)}
            </span>
            <span className="bg-purple-100 text-purple-800 text-xs rounded px-2 py-0.5">
              Câu hỏi nhóm
            </span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600"
              checked={selectedQuestionIds.includes(question.id)}
              onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {/* Question content */}
          <div className="text-gray-800 font-medium">
            {renderContent(question.content)}
          </div>

          {/* Group content if applicable */}
          {question.groupContent && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2 mb-4">
              {renderContent(question.groupContent)}
            </div>
          )}

          {/* Button to expand/collapse child questions */}
          {question.childQuestions && question.childQuestions.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup(question.id)}
                className="w-full border border-gray-300 text-left px-4 py-2 rounded-md flex justify-between items-center hover:bg-gray-50"
              >
                <span>Xem {question.childQuestions.length} câu hỏi con</span>
                {expandedGroups.includes(question.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Child questions (displayed when expanded) */}
              {expandedGroups.includes(question.id) && (
                <div className="mt-3 space-y-4">
                  {question.childQuestions.map((childQuestion: any, childIndex: number) => (
                    <div key={childQuestion.id} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-gray-700">
                          Câu {childIndex + 1}:
                        </span>
                      </div>
                      <div className="text-gray-800 mb-2">{renderContent(childQuestion.content)}</div>
                      {childQuestion.answers && childQuestion.answers.length > 0 && (
                        renderAnswers(childQuestion.answers)
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
    const isExpanded = expandedGroups.includes(question.id);

    return (
      <div className="space-y-2">
        {/* Group parent content */}
        <div className="font-medium mb-3">{renderContent(question.content)}</div>

        {/* Group context */}
        {question.groupContent && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3">
            {renderContent(question.groupContent)}
          </div>
        )}

        {/* Toggle button for child questions */}
        <button
          onClick={() => handleToggleGroup(question.id)}
          className="w-full border border-gray-300 text-left px-4 py-2 rounded-md flex justify-between items-center hover:bg-gray-50"
        >
          <span>Xem câu hỏi con</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Child questions */}
        {isExpanded && question.childQuestions && question.childQuestions.length > 0 && (
          <div className="space-y-3 pl-4 mt-3">
            {question.childQuestions.map((childQuestion: any, childIndex: number) => (
              <div key={childQuestion.id} className="border rounded-md p-3 bg-gray-50">
                <div className="font-medium mb-2">
                  Câu hỏi {childIndex + 1}: {renderContent(childQuestion.content)}
                </div>

                <div className="pl-3 space-y-2">
                  {childQuestion.answers?.map((answer: any, i: number) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 py-1 px-2 rounded-md ${
                        answer.isCorrect
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium ${
                        answer.isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="flex-1">
                        {renderContent(answer.content)}
                      </div>
                      {answer.isCorrect && (
                        <span className="ml-auto text-xs font-medium text-green-700">
                          ✓ Đáp án đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

      {/* Header */}
      <div className="flex items-center gap-2 text-base sm:text-lg font-medium">
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        <h1>Chọn câu hỏi</h1>
      </div>

      {/* Step 1 */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm sm:text-base">Bước 1: Chọn tệp tin câu hỏi</h2>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {/* File Word Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">File</span> Word
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden group-hover:block absolute mt-0 w-32 sm:w-40 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => handleFileUpload('word')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Tải lên
              </button>
              <button
                onClick={() => showGuide('word')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Xem hướng dẫn
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Tải file mẫu
              </button>
            </div>
          </div>

          {/* File Excel Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-green-100 hover:bg-green-200 rounded-md text-xs sm:text-sm">
              <svg className="h-3 w-3 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8M8 17h8M8 9h8" />
              </svg>
              <span className="hidden sm:inline">File</span> Excel
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden group-hover:block absolute mt-0 w-32 sm:w-40 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => handleFileUpload('excel')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Tải lên
              </button>
              <button
                onClick={() => showGuide('excel')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Xem hướng dẫn
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Tải file mẫu
              </button>
            </div>
          </div>

          {/* Backup File Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs sm:text-sm">
              <Database className="h-3 w-3 sm:h-5 sm:w-5" />
              Backup <span className="hidden sm:inline">File</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden group-hover:block absolute mt-0 w-32 sm:w-48 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => handleFileUpload('backup')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Chọn file câu hỏi
              </button>
              <button
                onClick={() => showGuide('backup')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Xem hướng dẫn
              </button>
            </div>
          </div>

          {/* Gói câu hỏi Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-blue-100 hover:bg-blue-200 rounded-md text-xs sm:text-sm">
              <File className="h-3 w-3 sm:h-5 sm:w-5" />
              Gói câu hỏi
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden group-hover:block absolute mt-0 w-32 sm:w-40 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => handleFileUpload('package')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Tải lên file
              </button>
              <button
                onClick={() => showGuide('package')}
                className="block w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              >
                Xem hướng dẫn
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

      {/* Step 2 */}
      <div className="space-y-3">
        <h2 className="font-medium text-sm sm:text-base">Bước 2: Lưu câu hỏi vào</h2>
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

      {/* Questions Section */}
      <div className="space-y-4">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600"
            checked={selectedQuestionIds.length === selectedQuestions.length && selectedQuestions.length > 0}
            onChange={handleSelectAll}
          />
          <span className="text-sm font-medium">Chọn tất cả câu hỏi</span>

          {selectedQuestionIds.length > 0 && (
            <span className="text-xs text-gray-500">
              ({selectedQuestionIds.length} / {selectedQuestions.length} câu hỏi được chọn)
            </span>
          )}
        </div>

        {/* Questions List */}
        {selectedQuestions.length > 0 ? (
          <div className="space-y-4">
            {selectedQuestions.map((question, index) => (
              <div key={question.id} className="border rounded-lg bg-white shadow-sm">
                <div className="p-4 border-b flex items-start justify-between">
                  <div className="flex items-center flex-wrap gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      question.type === 'group'
                        ? 'bg-blue-100 text-blue-700'
                        : question.type === 'fill-blank'
                          ? 'bg-purple-100 text-purple-700'
                          : question.type === 'multi-choice'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                    }`}>
                      {question.type === 'group'
                        ? 'Câu hỏi nhóm'
                        : question.type === 'fill-blank'
                          ? 'Điền khuyết'
                          : question.type === 'multi-choice'
                            ? 'Nhiều lựa chọn'
                            : 'Đơn lựa chọn'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedQuestionIds.includes(question.id)}
                    onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                  />
                </div>

                <div className="p-4">
                  {/* Question content */}
                  <div className="font-medium mb-3">{renderContent(question.content)}</div>

                  {/* Group content */}
                  {question.groupContent && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3">
                      {renderContent(question.groupContent)}
                    </div>
                  )}

                  {/* Answer options */}
                  <div className="pl-3 space-y-2">
                    {question.answers?.map((answer: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 py-1 px-2 rounded-md ${
                          answer.isCorrect
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium ${
                          answer.isCorrect
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <div className="flex-1">
                          {renderContent(answer.content)}
                        </div>
                        {answer.isCorrect && (
                          <span className="ml-auto text-xs font-medium text-green-700">
                            ✓ Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Statistics */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Thống kê</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tổng câu hỏi:</span>
                  <span className="ml-2 font-medium">{selectedQuestions.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Câu hỏi đơn:</span>
                  <span className="ml-2 font-medium">{selectedQuestions.filter(q => q.type !== 'group').length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Câu hỏi nhóm:</span>
                  <span className="ml-2 font-medium">{selectedQuestions.filter(q => q.type === 'group').length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Được chọn:</span>
                  <span className="ml-2 font-medium">{selectedQuestionIds.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p>Chưa có câu hỏi nào được tải lên</p>
              <p className="text-sm mt-1">Vui lòng chọn tệp tin câu hỏi ở bước 1</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={handleSaveQuestions}
          className={`bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          <UploadIcon className="h-3 w-3 sm:h-5 sm:w-5" />
          {isLoading ? 'Saving...' : 'Save'}
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
          margin: 0.5em 0;
          text-align: center;
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
