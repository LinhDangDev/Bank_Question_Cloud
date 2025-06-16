import { useState, useRef } from 'react';
import { ChevronLeft, Upload as UploadIcon, FileText, Database, File, X } from 'lucide-react';
import { Modal } from '../../components/Modal/Modal';
import axios from 'axios';
import KaTeX from 'katex';
import 'katex/dist/katex.min.css';
import { API_BASE_URL } from '@/config';
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
  const [facultyId, setFacultyId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Validate file size (max 10MB)
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
          setSelectedQuestions(previewResponse.data.items);

          if (previewResponse.data.items.length === 0) {
            setError('Không tìm thấy câu hỏi nào trong tệp tin');
          }
        } else {
          setError('Invalid response format from server');
        }
      } else {
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Error processing file. Please check format and try again.');
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

  const handleSaveQuestions = () => {
    if (!facultyId || !subjectId || !chapterId) {
      alert('Vui lòng chọn đầy đủ Khoa, Môn học và Chương/Phần');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('Chưa có câu hỏi nào được chọn');
      return;
    }

    setIsLoading(true);
    setError(null);

        // We need to get the fileId from the response we got earlier
    // For simplicity, assuming the first question contains the fileId
    const fileId = selectedQuestions[0]?.fileId;

    if (!fileId) {
      setError('Missing file information. Please upload again.');
      setIsLoading(false);
      return;
    }

    // Get the IDs of all selected questions
    const questionIds = selectedQuestions.map(q => q.id);

    axios.post(`${API_BASE_URL}/questions-import/save`, {
      fileId,
      questionIds,
      maPhan: chapterId // Using chapterId as maPhan
    })
    .then(response => {
      alert('Lưu câu hỏi thành công!');
      // Optionally clear questions or redirect
      // setSelectedQuestions([]);
    })
    .catch(err => {
      console.error('Error saving questions:', err);
      setError('Lỗi khi lưu câu hỏi. Vui lòng thử lại.');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Function to render LaTeX in question content
  const renderContent = (content: string) => {
    // Check if content contains LaTeX (enclosed in $ signs)
    if (content.includes('$')) {
      const parts = content.split(/(\$.*?\$)/g);
      return parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          try {
            const latex = part.slice(1, -1);
            const html = KaTeX.renderToString(latex, { throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={index}>{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      });
    }
    return content;
  };

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
              onChange={(e) => setFacultyId(e.target.value)}
            >
              <option value="">Chọn khoa</option>
              <option value="khoa1">Khoa 1</option>
              <option value="khoa2">Khoa 2</option>
            </select>
          </div>
          {/* Select Môn Học */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium">Chọn Môn Học: <span className="text-red-500">*</span></label>
            <select
              className="border p-1 sm:p-2 rounded-md w-full text-xs sm:text-sm"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!facultyId}
            >
              <option value="">Chọn môn học</option>
              <option value="mon1">Môn học 1</option>
              <option value="mon2">Môn học 2</option>
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
              <option value="chuong1">Chương 1</option>
              <option value="chuong2">Chương 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="w-8 sm:w-12 p-1 sm:p-2"><input type="checkbox" className="w-3 h-3 sm:w-4 sm:h-4" /></th>
              <th className="w-10 sm:w-16 p-1 sm:p-2 text-xs sm:text-sm">STT</th>
              <th className="p-1 sm:p-2 text-xs sm:text-sm">Nội dung câu hỏi</th>
              <th className="w-24 sm:w-32 p-1 sm:p-2 text-xs sm:text-sm">Loại câu hỏi</th>
            </tr>
          </thead>
          <tbody>
            {selectedQuestions.length > 0 ? (
              selectedQuestions.map((question, index) => (
                <tr key={index} className="border-t">
                  <td className="p-1 sm:p-2"><input type="checkbox" className="w-3 h-3 sm:w-4 sm:h-4" checked /></td>
                  <td className="p-1 sm:p-2 text-xs sm:text-sm">{index + 1}</td>
                  <td className="p-1 sm:p-2 text-xs sm:text-sm">
                    <div className="space-y-1 sm:space-y-2">
                      <div>{renderContent(question.content)}</div>
                      <div className="pl-3 sm:pl-4 space-y-0.5 sm:space-y-1">
                        {question.options?.map((option: any, i: number) => (
                          <div key={i}>{renderContent(option)}</div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-1 sm:p-2 text-xs sm:text-sm">{question.type}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t">
                <td colSpan={4} className="p-2 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
                  Chưa có câu hỏi nào được tải lên
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Statistics Button (Mobile) */}
      <div className="md:hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="fixed bottom-16 right-4 bg-white p-2 rounded-full shadow-md z-20 border border-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9"/>
            <path d="M13 17V5"/>
            <path d="M8 17v-3"/>
          </svg>
        </button>
      </div>

      {/* Statistics Card */}
      {/* <div className={`
        md:w-64 md:fixed md:top-[100px] md:right-4 bg-white p-3 sm:p-4 rounded-lg shadow-lg
        ${showStats ? 'fixed inset-x-4 bottom-16 z-20' : 'hidden md:block'}
      `}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm sm:text-base">Thống kê</h3>
          <button
            onClick={() => setShowStats(false)}
            className="md:hidden text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-1 sm:space-y-2 mt-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span>Tổng số câu:</span>
            <span>{selectedQuestions.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Số câu hỏi nhóm:</span>
            <span>0</span>
          </div>
          <div className="flex justify-between">
            <span>Số câu hỏi con:</span>
            <span>0</span>
          </div>
          <div className="flex justify-between">
            <span>Số câu hỏi đơn:</span>
            <span>0</span>
          </div>
          <div className="flex justify-between">
            <span>Số câu bị lỗi:</span>
            <span>0</span>
          </div>
        </div>
      </div> */}

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
    </div>
  );
};

export default UploadQuestions;
