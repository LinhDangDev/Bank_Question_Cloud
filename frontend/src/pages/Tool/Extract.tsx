import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, FileText, Plus, Upload, Download, Eye, Edit2, AlertTriangle, Save, Trash2, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '@/config';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import ExamPackageCard from '@/components/ExamPackageCard';
import TemplateUpload from '@/components/TemplateUpload';
import { khoaApi, monHocApi, phanApi } from '@/services/api';
import { examApi } from '@/services/api';

interface MatrixRow {
  chapter: string;
  chapterId: string;
  clo1: number;
  clo2: number;
  clo3: number;
  clo4: number;
  clo5: number;
  availableClo1?: number;
  availableClo2?: number;
  availableClo3?: number;
  availableClo4?: number;
  availableClo5?: number;
}

interface Faculty {
  MaKhoa: string;
  TenKhoa: string;
  XoaTamKhoa: boolean;
}

interface Subject {
  MaMonHoc: string;
  TenMonHoc: string;
  XoaTamMonHoc: boolean;
}

interface Chapter {
  MaPhan: string;
  TenPhan: string;
  XoaTamPhan: boolean;
}

interface CLO {
  MaCLO: string;
  TenCLO: string;
  MoTa: string;
  ThuTu: number;
  XoaTamCLO: boolean;
}

interface ApiResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const Extract = () => {
  const navigate = useNavigate();
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [soLuongDeThi, setSoLuongDeThi] = useState(1);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [importedData, setImportedData] = useState<MatrixRow[] | null>(null);
  const [loaiBoChuongPhan, setLoaiBoChuongPhan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Add state for API data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [clos, setClos] = useState<CLO[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [autoCheckAvailability, setAutoCheckAvailability] = useState(true);

  // Fetch faculties on component mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await khoaApi.getAll();
        const filtered = response.data.filter((faculty: Faculty) => !faculty.XoaTamKhoa);
        setFaculties(filtered);

        // Nếu là teacher và chỉ có 1 khoa, tự động chọn khoa đó
        if (filtered.length === 1) {
          setSelectedFaculty(filtered[0].MaKhoa);
        }
      } catch (error) {
        console.error('Error fetching faculties:', error);
        toast.error('Lỗi khi tải danh sách khoa');
      }
    };

    fetchFaculties();
  }, []);

  // Fetch subjects when faculty changes
  useEffect(() => {
    if (!selectedFaculty) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }

    const fetchSubjects = async () => {
      try {
        const response = await monHocApi.getMonHocByKhoa(selectedFaculty);
        const filtered = response.data.filter((subject: Subject) => !subject.XoaTamMonHoc);
        setSubjects(filtered);
        setSelectedSubject(''); // Reset selected subject
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Lỗi khi tải danh sách môn học');
      }
    };

    fetchSubjects();
  }, [selectedFaculty]);

  // Fetch CLOs
  useEffect(() => {
    const fetchCLOs = async () => {
      try {
        // Assuming there's a cloApi service, if not, keep using fetch
        const response = await fetch(`${API_BASE_URL}/clo`);
        if (!response.ok) throw new Error('Failed to fetch CLOs');
        const data = await response.json();
        setClos(data);
      } catch (error) {
        console.error('Error fetching CLOs:', error);
        toast.error('Lỗi khi tải danh sách CLO');
      }
    };

    fetchCLOs();
  }, []);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      setMatrix([]);
      return;
    }

    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await phanApi.getPhanByMonHoc(selectedSubject);
        const filteredChapters = response.data.filter((chapter: Chapter) => !chapter.XoaTamPhan);
        setChapters(filteredChapters);

        // Initialize matrix with the chapters
        const initialMatrix = filteredChapters.map((chapter: Chapter) => ({
          chapter: chapter.TenPhan,
          chapterId: chapter.MaPhan,
          clo1: 0,
          clo2: 0,
          clo3: 0,
          clo4: 0,
          clo5: 0
        }));
        setMatrix(initialMatrix);

        // Auto-check availability when subject changes
        if (autoCheckAvailability) {
          fetchAvailabilityData(initialMatrix);
        }
      } catch (error) {
        console.error('Error fetching chapters:', error);
        toast.error('Lỗi khi tải danh sách chương');
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [selectedSubject]);

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row and convert to MatrixRow format
        const matrixData: MatrixRow[] = jsonData.slice(1).map((row, index) => {
          // Get chapter name and ID from Excel
          const chapterName = row[0] || `Chương ${index + 1}`;
          const chapterIdFromExcel = row[1]; // Mã Chương column

          // Find matching chapter by ID first, then by name
          let matchingChapter = null;
          if (chapterIdFromExcel) {
            matchingChapter = chapters.find(c => c.MaPhan === chapterIdFromExcel);
          }

          if (!matchingChapter) {
            matchingChapter = chapters.find(c =>
              c.TenPhan === chapterName ||
              c.TenPhan.toLowerCase().includes(chapterName.toLowerCase()) ||
              chapterName.toLowerCase().includes(c.TenPhan.toLowerCase())
            );
          }

          return {
            chapter: chapterName,
            chapterId: matchingChapter ? matchingChapter.MaPhan : (chapterIdFromExcel || ''),
            clo1: parseInt(row[2]) || 0, // Adjusted for new column structure
            clo2: parseInt(row[3]) || 0,
            clo3: parseInt(row[4]) || 0,
            clo4: parseInt(row[5]) || 0,
            clo5: parseInt(row[6]) || 0,
          };
        }).filter(row => row.chapter && row.chapter !== 'Tổng cộng'); // Filter out total row

        // Check if chapter IDs are found
        const missingChapterIds = matrixData.filter(row => !row.chapterId);
        if (missingChapterIds.length > 0) {
          toast.warning("Cảnh báo", {
            description: `Không tìm thấy ${missingChapterIds.length} chương trong hệ thống. Vui lòng kiểm tra lại tên chương.`
          });
        }

        // Auto-apply if all chapters are found and matrix is empty or user confirms
        const allChaptersFound = missingChapterIds.length === 0;
        if (allChaptersFound && (matrix.length === 0 || getTotalQuestions() === 0)) {
          // Auto-apply if matrix is empty
          const updatedMatrix = [...matrix];
          matrixData.forEach(importedRow => {
            const existingIndex = updatedMatrix.findIndex(row =>
              row.chapterId === importedRow.chapterId
            );
            if (existingIndex >= 0) {
              updatedMatrix[existingIndex] = {
                ...updatedMatrix[existingIndex],
                clo1: importedRow.clo1,
                clo2: importedRow.clo2,
                clo3: importedRow.clo3,
                clo4: importedRow.clo4,
                clo5: importedRow.clo5
              };
            }
          });
          setMatrix(updatedMatrix);
          setUnsavedChanges(true);
          toast.success("Tự động áp dụng thành công", {
            description: `Đã tự động áp dụng ${matrixData.length} chương từ file Excel`
          });
        } else {
          setImportedData(matrixData);
        }

        toast.success("Import thành công", {
          description: `Đã import ${matrixData.length} chương từ file Excel`
        });
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error("Lỗi import file", {
          description: "Có lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file."
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const applyImportedData = () => {
    if (importedData) {
      // Merge imported data with existing matrix data
      const updatedMatrix = [...matrix];

      // Update values for existing chapters and add missing ones
      importedData.forEach(importedRow => {
        const existingIndex = updatedMatrix.findIndex(row =>
          row.chapterId === importedRow.chapterId || row.chapter === importedRow.chapter
        );

        if (existingIndex >= 0) {
          // Update existing chapter
          updatedMatrix[existingIndex] = {
            ...updatedMatrix[existingIndex],
            clo1: importedRow.clo1,
            clo2: importedRow.clo2,
            clo3: importedRow.clo3,
            clo4: importedRow.clo4,
            clo5: importedRow.clo5
          };
        } else if (importedRow.chapterId) {
          // Add new chapter if it has a valid ID
          updatedMatrix.push(importedRow);
        }
      });

      setMatrix(updatedMatrix);
      setImportedData(null);
      setUnsavedChanges(true); // Mark as having unsaved changes
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Áp dụng dữ liệu thành công', {
        description: 'Dữ liệu từ file Excel đã được áp dụng vào ma trận. Nhớ lưu thay đổi!'
      });
    }
  };

  const addMatrixRow = () => {
    setMatrix([...matrix, {
      chapter: `Chương ${matrix.length + 1}`,
      chapterId: '',
      clo1: 0,
      clo2: 0,
      clo3: 0,
      clo4: 0,
      clo5: 0
    }]);
  };

  const updateMatrix = (index: number, field: keyof MatrixRow, value: string | number) => {
    const newMatrix = [...matrix];
    newMatrix[index] = { ...newMatrix[index], [field]: value };
    setMatrix(newMatrix);
    setUnsavedChanges(true);
  };

  const getTotalQuestions = (data: MatrixRow[] = matrix) => {
    return data.reduce((total, row) =>
      total + row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5, 0);
  };

  const exportMatrixToExcel = () => {
    try {
      // Create worksheet from matrix data with chapter ID for better import matching
      const ws = XLSX.utils.json_to_sheet(matrix.map(row => ({
        'Chương': row.chapter,
        'Mã Chương': row.chapterId, // Add chapter ID for better matching
        'CLO 1': row.clo1,
        'CLO 2': row.clo2,
        'CLO 3': row.clo3,
        'CLO 4': row.clo4,
        'CLO 5': row.clo5,
        'Tổng': row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5
      })));

      // Add totals row
      const totalClo1 = matrix.reduce((sum, row) => sum + row.clo1, 0);
      const totalClo2 = matrix.reduce((sum, row) => sum + row.clo2, 0);
      const totalClo3 = matrix.reduce((sum, row) => sum + row.clo3, 0);
      const totalClo4 = matrix.reduce((sum, row) => sum + row.clo4, 0);
      const totalClo5 = matrix.reduce((sum, row) => sum + row.clo5, 0);
      const totalTotal = totalClo1 + totalClo2 + totalClo3 + totalClo4 + totalClo5;

      XLSX.utils.sheet_add_json(ws, [{
        'Chương': 'Tổng cộng',
        'Mã Chương': '',
        'CLO 1': totalClo1,
        'CLO 2': totalClo2,
        'CLO 3': totalClo3,
        'CLO 4': totalClo4,
        'CLO 5': totalClo5,
        'Tổng': totalTotal
      }], { skipHeader: true, origin: -1 });

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ma trận đề thi');

      // Export to file
      XLSX.writeFile(wb, `ma-tran-de-thi-${Date.now()}.xlsx`);

      toast.success('Xuất ma trận thành công', {
        description: 'Đã xuất ma trận đề thi ra file Excel'
      });
    } catch (error) {
      console.error('Error exporting matrix:', error);
      toast.error('Lỗi xuất ma trận', {
        description: 'Có lỗi khi xuất ma trận ra file Excel'
      });
    }
  };

  const generateExam = async () => {
    if (!selectedSubject || !examTitle.trim()) {
      toast.error('Vui lòng nhập tên đề thi và chọn môn học');
      return;
    }

    if (getTotalQuestions() === 0) {
      toast.error('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    const examData = {
      tenDeThi: examTitle,
      maMonHoc: selectedSubject,
      loaiBoChuongPhan: loaiBoChuongPhan,
      soLuongDe: 1, // Fixed to 1 for performance reasons
      matrix: matrix.map(row => ({
        maPhan: row.chapterId,
        clo1: row.clo1,
        clo2: row.clo2,
        clo3: row.clo3,
        clo4: row.clo4,
        clo5: row.clo5
      })).filter(row =>
        row.maPhan && (row.clo1 > 0 || row.clo2 > 0 || row.clo3 > 0 || row.clo4 > 0 || row.clo5 > 0)
      )
    };

    if (examData.matrix.length === 0) {
      toast.error('Không có dữ liệu hợp lệ để tạo đề thi');
      return;
    }

    try {
      setLoading(true);
      toast.info('Đang tạo đề thi, vui lòng chờ...');

      console.log('Sending exam data:', examData);
      const response = await examApi.generateExam(examData);

      console.log('Exam generation response:', response);

      if (response && response.data && response.data.success) {
        const responseData = response.data.data;

        // Xử lý response cho trường hợp tạo nhiều đề thi
        if (soLuongDeThi > 1 && responseData.deThiIds && Array.isArray(responseData.deThiIds)) {
          toast.success(`Tạo thành công ${responseData.deThiIds.length} đề thi!`, {
            description: `Đã tạo ${responseData.deThiIds.length} đề thi khác nhau từ ma trận "${examTitle}"`
          });
          // Chuyển đến trang danh sách đề thi
          navigate('/exams');
        } else {
          // Trường hợp tạo 1 đề thi (logic cũ)
          const newExam = responseData;
          toast.success('Tạo gói đề thi thành công!', {
            description: `Đề thi "${newExam.TenDeThi}" đã được tạo.`
          });
          navigate(`/exams/${newExam.MaDeThi}`);
        }
      } else {
        throw new Error(response.data.message || 'Không nhận được dữ liệu hợp lệ từ server');
      }
    } catch (error: any) {
      console.error('Error generating exam:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request
      });

      let errorMessage = 'Lỗi khi tạo đề thi';

      if (error.response) {
        // Server responded with error status
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else if (error.response.status === 404) {
          errorMessage = 'Không tìm thấy câu hỏi phù hợp cho ma trận đề thi.';
        } else if (error.response.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error('Tạo đề thi thất bại', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!selectedSubject) {
      toast.error('Vui lòng chọn môn học trước');
      return;
    }

    const examData = {
      maMonHoc: selectedSubject,
      matrix: matrix.map(row => ({
        maPhan: row.chapterId,
        clo1: row.clo1,
        clo2: row.clo2,
        clo3: row.clo3,
        clo4: row.clo4,
        clo5: row.clo5
      })).filter(row =>
        row.maPhan && (row.clo1 > 0 || row.clo2 > 0 || row.clo3 > 0 || row.clo4 > 0 || row.clo5 > 0)
      )
    };

    if (examData.matrix.length === 0) {
      toast.error('Không có dữ liệu hợp lệ để kiểm tra');
      return;
    }

    try {
      setLoading(true);
      const response = await examApi.checkQuestionAvailability(examData);

      if (response.data.success) {
        setAvailabilityData(response.data.availability);
        setAvailabilityChecked(true);

        if (response.data.availability.summary.canGenerate) {
          toast.success('Có đủ câu hỏi để tạo đề thi!', {
            description: `Có ${response.data.availability.summary.totalAvailable} câu hỏi khả dụng cho ${response.data.availability.summary.totalRequired} câu hỏi cần thiết`
          });
        } else {
          toast.warning('Không đủ câu hỏi để tạo đề thi', {
            description: response.data.availability.summary.warnings.join(', ')
          });
        }
      } else {
        toast.error('Lỗi khi kiểm tra tính khả dụng', {
          description: response.data.message
        });
      }
    } catch (error: any) {
      console.error('Error checking availability:', error);
      toast.error('Lỗi khi kiểm tra tính khả dụng của câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm lưu thay đổi
  const saveChanges = () => {
    setIsPreviewMode(true);
    setUnsavedChanges(false);
    toast.success('Đã lưu thay đổi ma trận đề thi');
  };

  // Thêm hàm xóa hàng khỏi ma trận
  const removeMatrixRow = (index: number) => {
    const newMatrix = matrix.filter((_, i) => i !== index);
    setMatrix(newMatrix);
    setUnsavedChanges(true);
  };

  // Cập nhật chế độ chỉnh sửa
  const toggleEditMode = () => {
    // Nếu đang ở chế độ chỉnh sửa và có thay đổi chưa lưu, hiển thị cảnh báo
    if (!isPreviewMode && unsavedChanges) {
      if (window.confirm("Bạn có thay đổi chưa lưu. Bạn có muốn lưu thay đổi không?")) {
        saveChanges();
      } else {
        setUnsavedChanges(false);
      }
    }
    setIsPreviewMode(!isPreviewMode);
  };

  // Function to check if a CLO value exceeds available questions
  const isExceedingAvailable = (row: MatrixRow, cloField: 'clo1' | 'clo2' | 'clo3' | 'clo4' | 'clo5'): boolean => {
    const availableField = `available${cloField.charAt(0).toUpperCase() + cloField.slice(1)}` as keyof MatrixRow;
    const available = row[availableField] as number | undefined;
    return available !== undefined && row[cloField] > available;
  };

  // Function to fetch availability data
  const fetchAvailabilityData = async (matrixData: MatrixRow[] = matrix) => {
    if (!selectedSubject || matrixData.length === 0) return;

    const examData = {
      maMonHoc: selectedSubject,
      matrix: matrixData.map(row => ({
        maPhan: row.chapterId,
        clo1: 0, // Send 0 to just get availability without checking if enough
        clo2: 0,
        clo3: 0,
        clo4: 0,
        clo5: 0
      })).filter(row => row.maPhan)
    };

    try {
      setAvailabilityLoading(true);
      const response = await examApi.checkQuestionAvailability(examData);

      if (response.data.success) {
        // Update matrix with availability data
        const updatedMatrix = [...matrixData];
        response.data.availability.chapters.forEach((chapterData: any) => {
          const rowIndex = updatedMatrix.findIndex(row => row.chapterId === chapterData.chapterId);
          if (rowIndex !== -1) {
            updatedMatrix[rowIndex] = {
              ...updatedMatrix[rowIndex],
              availableClo1: chapterData.available.clo1 || 0,
              availableClo2: chapterData.available.clo2 || 0,
              availableClo3: chapterData.available.clo3 || 0,
              availableClo4: chapterData.available.clo4 || 0,
              availableClo5: chapterData.available.clo5 || 0
            };
          }
        });
        setMatrix(updatedMatrix);
      }
    } catch (error) {
      console.error('Error fetching availability data:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Add auto-check toggle handler
  const toggleAutoCheck = (checked: boolean) => {
    setAutoCheckAvailability(checked);
    if (checked && selectedSubject) {
      fetchAvailabilityData();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-aspect-ratio-8x5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thông tin đề thi */}
        <div className="lg:col-span-4">
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="w-5 h-5" />
                Thông tin đề thi
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                Điền thông tin cho đề thi của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="faculty" className="text-sm font-medium">Khoa</Label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors">
                    <SelectValue placeholder="Chọn khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.MaKhoa} value={faculty.MaKhoa}>
                        {faculty.TenKhoa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">Môn học</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedFaculty}>
                  <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors">
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.MaMonHoc} value={subject.MaMonHoc}>
                        {subject.TenMonHoc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Tên đề thi</Label>
                <Input
                  id="title"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Nhập tên đề thi"
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soLuongDeThi" className="text-sm font-medium">Số lượng đề thi</Label>
                <Input
                  id="soLuongDeThi"
                  type="number"
                  min="1"
                  max="1"
                  value={1}
                  disabled
                  placeholder="Số lượng đề thi"
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <div className="text-xs text-gray-500">
                  Hiện tại chỉ hỗ trợ tạo 1 đề thi để đảm bảo hiệu năng hệ thống
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="loaiBoChuongPhan"
                    checked={loaiBoChuongPhan}
                    onCheckedChange={(checked) => setLoaiBoChuongPhan(checked === true)}
                  />
                  <Label htmlFor="loaiBoChuongPhan" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Bỏ cấu trúc chương/phần (chỉ hiển thị câu hỏi)
                  </Label>
                </div>
                <div className="text-xs text-gray-500 ml-6">
                  Khi được chọn, đề thi sẽ không hiển thị cấu trúc chương/phần, chỉ hiển thị các câu hỏi.
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-sm font-medium text-blue-800">Tổng số câu hỏi</div>
                <div className="text-3xl font-bold text-blue-600">{getTotalQuestions()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ma trận đề thi */}
        <div className="lg:col-span-8">
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="w-5 h-5" />
                    Ma trận đề thi
                  </CardTitle>
                  <CardDescription className="text-emerald-100 mt-1">
                    Phân bố câu hỏi theo chuẩn đầu ra học phần
                  </CardDescription>
                </div>
                {!isPreviewMode && (
                  <div className="flex items-center">
                    <Checkbox
                      id="autoCheck"
                      checked={autoCheckAvailability}
                      onCheckedChange={toggleAutoCheck}
                      className="mr-2"
                    />
                    <Label htmlFor="autoCheck" className="text-white text-sm cursor-pointer">
                      Tự động kiểm tra câu hỏi khả dụng
                    </Label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  {isPreviewMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleEditMode}
                      className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Chỉnh sửa</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={saveChanges}
                        className="flex items-center gap-1"
                        disabled={!unsavedChanges}
                      >
                        <Save className="w-4 h-4" />
                        <span>Lưu</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleEditMode}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Hủy</span>
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMatrixToExcel}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                  {!isPreviewMode && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={addMatrixRow}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4" />
                      Thêm chương
                    </Button>
                  )}
                </div>
              </div>

              {/* Hiển thị preview data sau khi import Excel */}
              {importedData && importedData.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-blue-800">
                      Dữ liệu đã import từ Excel ({importedData.length} chương)
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={applyImportedData}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Áp dụng dữ liệu
                      </Button>
                      <Button
                        onClick={() => setImportedData(null)}
                        variant="outline"
                        size="sm"
                      >
                        Hủy bỏ
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="px-3 py-2 text-left">Chương</th>
                          <th className="px-3 py-2 text-center">CLO 1</th>
                          <th className="px-3 py-2 text-center">CLO 2</th>
                          <th className="px-3 py-2 text-center">CLO 3</th>
                          <th className="px-3 py-2 text-center">CLO 4</th>
                          <th className="px-3 py-2 text-center">CLO 5</th>
                          <th className="px-3 py-2 text-center">Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedData.map((row, index) => (
                          <tr key={index} className="border-b border-blue-200">
                            <td className="px-3 py-2">
                              {row.chapter}
                              {!row.chapterId && (
                                <span className="ml-2 text-xs text-red-600">(Không tìm thấy trong hệ thống)</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">{row.clo1}</td>
                            <td className="px-3 py-2 text-center">{row.clo2}</td>
                            <td className="px-3 py-2 text-center">{row.clo3}</td>
                            <td className="px-3 py-2 text-center">{row.clo4}</td>
                            <td className="px-3 py-2 text-center">{row.clo5}</td>
                            <td className="px-3 py-2 text-center font-medium">
                              {row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : matrix.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-md">
                  <Info className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Chưa có dữ liệu</h3>
                  <p className="text-gray-500 mb-4">Chọn môn học hoặc thêm chương để tạo ma trận đề thi</p>
                  <Button onClick={addMatrixRow} disabled={isPreviewMode || loading} className="mx-auto">
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm chương
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 w-[200px]">Chương</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">CLO 1</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">CLO 2</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">CLO 3</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">CLO 4</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">CLO 5</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">Tổng</TableHead>
                        {!isPreviewMode && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrix.map((row, index) => (
                        <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium border">
                            {isPreviewMode ? (
                              row.chapter
                            ) : (
                              <Select
                                value={row.chapterId}
                                onValueChange={(value) => updateMatrix(index, 'chapterId', value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn chương" />
                                </SelectTrigger>
                                <SelectContent>
                                  {chapters.map((chapter) => (
                                    <SelectItem key={chapter.MaPhan} value={chapter.MaPhan}>
                                      {chapter.TenPhan}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-center border">
                            {isPreviewMode ? (
                              row.clo1
                            ) : (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  value={row.clo1}
                                  onChange={(e) => updateMatrix(index, 'clo1', parseInt(e.target.value) || 0)}
                                  className={`w-16 text-center mx-auto ${isExceedingAvailable(row, 'clo1') ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                                />
                                {row.availableClo1 !== undefined && (
                                  <div className={`text-xs mt-1 ${isExceedingAvailable(row, 'clo1') ? 'text-red-500' : 'text-gray-500'}`}>
                                    Có: {row.availableClo1}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center border">
                            {isPreviewMode ? (
                              row.clo2
                            ) : (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  value={row.clo2}
                                  onChange={(e) => updateMatrix(index, 'clo2', parseInt(e.target.value) || 0)}
                                  className={`w-16 text-center mx-auto ${isExceedingAvailable(row, 'clo2') ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                                />
                                {row.availableClo2 !== undefined && (
                                  <div className={`text-xs mt-1 ${isExceedingAvailable(row, 'clo2') ? 'text-red-500' : 'text-gray-500'}`}>
                                    Có: {row.availableClo2}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center border">
                            {isPreviewMode ? (
                              row.clo3
                            ) : (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  value={row.clo3}
                                  onChange={(e) => updateMatrix(index, 'clo3', parseInt(e.target.value) || 0)}
                                  className={`w-16 text-center mx-auto ${isExceedingAvailable(row, 'clo3') ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                                />
                                {row.availableClo3 !== undefined && (
                                  <div className={`text-xs mt-1 ${isExceedingAvailable(row, 'clo3') ? 'text-red-500' : 'text-gray-500'}`}>
                                    Có: {row.availableClo3}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center border">
                            {isPreviewMode ? (
                              row.clo4
                            ) : (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  value={row.clo4}
                                  onChange={(e) => updateMatrix(index, 'clo4', parseInt(e.target.value) || 0)}
                                  className={`w-16 text-center mx-auto ${isExceedingAvailable(row, 'clo4') ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                                />
                                {row.availableClo4 !== undefined && (
                                  <div className={`text-xs mt-1 ${isExceedingAvailable(row, 'clo4') ? 'text-red-500' : 'text-gray-500'}`}>
                                    Có: {row.availableClo4}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center border">
                            {isPreviewMode ? (
                              row.clo5
                            ) : (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  value={row.clo5}
                                  onChange={(e) => updateMatrix(index, 'clo5', parseInt(e.target.value) || 0)}
                                  className={`w-16 text-center mx-auto ${isExceedingAvailable(row, 'clo5') ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                                />
                                {row.availableClo5 !== undefined && (
                                  <div className={`text-xs mt-1 ${isExceedingAvailable(row, 'clo5') ? 'text-red-500' : 'text-gray-500'}`}>
                                    Có: {row.availableClo5}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium border bg-gray-50">
                            {row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5}
                          </TableCell>
                          {!isPreviewMode && (
                            <TableCell className="p-1 border">
                              <Button
                                variant="text"
                                size="sm"
                                onClick={() => removeMatrixRow(index)}
                                className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-50 font-medium">
                        <TableCell className="border-t-2 border-blue-200">Tổng cộng</TableCell>
                        <TableCell className="text-center text-blue-700 border-t-2 border-blue-200">
                          {matrix.reduce((sum, row) => sum + row.clo1, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-700 border-t-2 border-blue-200">
                          {matrix.reduce((sum, row) => sum + row.clo2, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-700 border-t-2 border-blue-200">
                          {matrix.reduce((sum, row) => sum + row.clo3, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-700 border-t-2 border-blue-200">
                          {matrix.reduce((sum, row) => sum + row.clo4, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-700 border-t-2 border-blue-200">
                          {matrix.reduce((sum, row) => sum + row.clo5, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-700 font-bold border-t-2 border-blue-200">
                          {getTotalQuestions()}
                        </TableCell>
                        {!isPreviewMode && <TableCell className="border-t-2 border-blue-200"></TableCell>}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {matrix.length > 0 && (
              <CardFooter className="bg-gray-50 border-t px-6 py-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Info className="w-4 h-4 mr-2 text-blue-500" />
                    <span>Nhấn "Chỉnh sửa" để thay đổi ma trận đề thi. Sau khi chỉnh sửa xong, nhấn "Lưu" để áp dụng thay đổi.</span>
                  </div>
                  {!isPreviewMode && autoCheckAvailability && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Info className="w-4 h-4 mr-2 text-orange-500" />
                      <span>Số câu hỏi hiển thị màu đỏ khi vượt quá số lượng câu hỏi khả dụng trong hệ thống.</span>
                    </div>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Thông báo unsaved changes */}
      {unsavedChanges && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Có thay đổi chưa được lưu</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Vui lòng lưu thay đổi ma trận trước khi tạo đề thi.
          </p>
        </div>
      )}

      {/* Nút tạo đề thi */}
      <div className="flex justify-end mt-6">
        <div className="flex gap-4">
          <Button
            onClick={checkAvailability}
            disabled={!selectedFaculty || !selectedSubject || getTotalQuestions() === 0 || loading}
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 gap-2 flex items-center shadow-md"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                Đang kiểm tra...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Kiểm tra tính khả dụng
              </>
            )}
          </Button>
          <Button
            onClick={generateExam}
            disabled={!selectedFaculty || !selectedSubject || !examTitle || getTotalQuestions() === 0 || loading || unsavedChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 gap-2 flex items-center shadow-md"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Tạo đề thi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hiển thị thông tin tính khả dụng */}
      {availabilityChecked && availabilityData && (
        <div className="mt-6">
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-5 h-5" />
                Kết quả kiểm tra tính khả dụng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white shadow rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{availabilityData.summary.totalRequired}</div>
                  <div className="text-sm text-gray-600">Tổng câu hỏi cần thiết</div>
                </div>
                <div className="bg-white shadow rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{availabilityData.summary.totalAvailable}</div>
                  <div className="text-sm text-gray-600">Tổng câu hỏi khả dụng</div>
                </div>
                <div className="bg-white shadow rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold flex justify-center items-center gap-2 ${availabilityData.summary.canGenerate ? 'text-green-600' : 'text-red-600'}`}>
                    {availabilityData.summary.canGenerate ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Có thể tạo
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Không thể tạo
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Trạng thái</div>
                </div>
              </div>

              {availabilityData.summary.warnings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-red-800 mb-2">Cảnh báo:</h4>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {availabilityData.summary.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <h4 className="font-semibold mb-4 text-gray-800">Chi tiết theo chương:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availabilityData.chapters.map((chapter: any, index: number) => (
                    <div key={index} className="border rounded-lg shadow-sm overflow-hidden">
                      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                        <span className="font-medium">Chương {chapter.chapterId}</span>
                        <span className={`px-2 py-1 rounded text-sm ${chapter.canFulfill ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {chapter.canFulfill ? 'Đủ câu hỏi' : 'Thiếu câu hỏi'}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map(clo => (
                            <div key={clo} className={`p-2 rounded ${chapter.required[`clo${clo}`] > 0 ? (chapter.available[`clo${clo}`] >= chapter.required[`clo${clo}`] ? 'bg-green-50' : 'bg-red-50') : 'bg-gray-50'}`}>
                              <div className="text-center">
                                <div className="font-medium text-gray-700">CLO {clo}</div>
                                <div className={`text-sm ${chapter.required[`clo${clo}`] > 0 ? (chapter.available[`clo${clo}`] >= chapter.required[`clo${clo}`] ? 'text-green-700' : 'text-red-700') : 'text-gray-500'}`}>
                                  {chapter.required[`clo${clo}`] || 0} / {chapter.available[`clo${clo}`] || 0}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {chapter.warnings.length > 0 && (
                          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {chapter.warnings.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Extract;
