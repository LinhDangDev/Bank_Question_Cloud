import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, FileText, Plus, Upload, Download, Eye, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '@/config';
import { useNavigate } from 'react-router-dom';

interface MatrixRow {
  chapter: string;
  chapterId: string;
  clo1: number;
  clo2: number;
  clo3: number;
  clo4: number;
  clo5: number;
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
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [importedData, setImportedData] = useState<MatrixRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for API data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [clos, setClos] = useState<CLO[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch faculties on component mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/khoa`);
        if (!response.ok) throw new Error('Failed to fetch faculties');
        const data = await response.json();
        const filtered = data.filter((faculty: Faculty) => !faculty.XoaTamKhoa);
        setFaculties(filtered);
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
        const response = await fetch(`${API_BASE_URL}/mon-hoc/khoa/${selectedFaculty}`);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data = await response.json();
        const filtered = data.filter((subject: Subject) => !subject.XoaTamMonHoc);
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
        const response = await fetch(`${API_BASE_URL}/phan/mon-hoc/${selectedSubject}`);
        if (!response.ok) throw new Error('Failed to fetch chapters');
        const data = await response.json();
        const filteredChapters = data.filter((chapter: Chapter) => !chapter.XoaTamPhan);
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
          // Find matching chapter by name or use placeholder
          const chapterName = row[0] || `Chương ${index + 1}`;
          const matchingChapter = chapters.find(c => c.TenPhan === chapterName);

          return {
            chapter: chapterName,
            chapterId: matchingChapter ? matchingChapter.MaPhan : '',
            clo1: parseInt(row[1]) || 0,
            clo2: parseInt(row[2]) || 0,
            clo3: parseInt(row[3]) || 0,
            clo4: parseInt(row[4]) || 0,
            clo5: parseInt(row[5]) || 0,
          };
        }).filter(row => row.chapter);

        // Check if chapter IDs are found
        const missingChapterIds = matrixData.filter(row => !row.chapterId);
        if (missingChapterIds.length > 0) {
          toast.warning("Cảnh báo", {
            description: `Không tìm thấy ${missingChapterIds.length} chương trong hệ thống. Vui lòng kiểm tra lại tên chương.`
          });
        }

        setImportedData(matrixData);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
  };

  const getTotalQuestions = (data: MatrixRow[] = matrix) => {
    return data.reduce((total, row) =>
      total + row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5, 0);
  };

  const exportMatrixToExcel = () => {
    try {
      // Create worksheet from matrix data
      const ws = XLSX.utils.json_to_sheet(matrix.map(row => ({
        'Chương': row.chapter,
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
    try {
      // Validation
      if (!selectedFaculty) {
        toast.error("Thiếu thông tin", {
          description: "Vui lòng chọn khoa"
        });
        return;
      }

      if (!selectedSubject) {
        toast.error("Thiếu thông tin", {
          description: "Vui lòng chọn môn học"
        });
        return;
      }

      if (!examTitle.trim()) {
        toast.error("Thiếu thông tin", {
          description: "Vui lòng nhập tên đề thi"
        });
        return;
      }

      if (getTotalQuestions() === 0) {
        toast.error("Ma trận không hợp lệ", {
          description: "Ma trận đề thi phải có ít nhất 1 câu hỏi"
        });
        return;
      }

      // Find any rows with missing chapter IDs
      const invalidRows = matrix.filter(row =>
        (row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5 > 0) && !row.chapterId);
      if (invalidRows.length > 0) {
        toast.error("Ma trận không hợp lệ", {
          description: `Có ${invalidRows.length} chương không có ID. Vui lòng chọn chương từ danh sách.`
        });
        return;
      }

      setLoading(true);

      // Format the matrix for API
      const apiMatrix = matrix
        .filter(row => row.chapterId && (row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5 > 0))
        .map(row => ({
          maPhan: row.chapterId,
          clo1: row.clo1,
          clo2: row.clo2,
          clo3: row.clo3,
          clo4: row.clo4,
          clo5: row.clo5
        }));

      // Prepare the request data
      const examData = {
        maMonHoc: selectedSubject,
        tenDeThi: examTitle,
        matrix: apiMatrix,
        hoanViDapAn: true, // Enable answer shuffling by default
        nguoiTao: localStorage.getItem('username') || "system"
      };

      // Send API request to generate exam
      const response = await fetch(`${API_BASE_URL}/exams/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(examData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tạo đề thi');
      }

      const result = await response.json();

      toast.success("Tạo đề thi thành công", {
        description: `Đã tạo đề thi "${examTitle}" với ${getTotalQuestions()} câu hỏi. Xem danh sách đề thi để tải xuống.`
      });

      // Navigate to exam list page after short delay
      setTimeout(() => {
        navigate('/exams');
      }, 2000);
    } catch (error) {
      console.error('Error generating exam:', error);
      toast.error("Lỗi tạo đề thi", {
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo đề thi."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thông tin đề thi */}
        <div className="lg:col-span-4">
          <Card className="shadow-md border-0">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="w-5 h-5" />
                Thông tin đề thi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="faculty">Khoa</Label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="subject">Môn học</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedFaculty}>
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="title">Tên đề thi</Label>
                <Input
                  id="title"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Nhập tên đề thi"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Tổng số câu hỏi</div>
                <div className="text-3xl font-bold text-blue-600">{getTotalQuestions()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ma trận đề thi */}
        <div className="lg:col-span-8">
          <Card className="shadow-md border-0">
            <CardHeader className="bg-emerald-600 text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                Ma trận đề thi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={isPreviewMode ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setIsPreviewMode(true)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Xem
                  </Button>
                  <Button
                    variant={!isPreviewMode ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setIsPreviewMode(false)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addMatrixRow}
                    className="flex items-center gap-1"
                    disabled={isPreviewMode || loading}
                  >
                    <Plus className="w-4 h-4" />
                    Thêm chương
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chương</TableHead>
                        <TableHead className="text-center">CLO 1</TableHead>
                        <TableHead className="text-center">CLO 2</TableHead>
                        <TableHead className="text-center">CLO 3</TableHead>
                        <TableHead className="text-center">CLO 4</TableHead>
                        <TableHead className="text-center">CLO 5</TableHead>
                        <TableHead className="text-center">Tổng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrix.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>
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
                          <TableCell className="text-center">
                            {isPreviewMode ? (
                              row.clo1
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={row.clo1}
                                onChange={(e) => updateMatrix(index, 'clo1', parseInt(e.target.value) || 0)}
                                className="w-16 text-center mx-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPreviewMode ? (
                              row.clo2
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={row.clo2}
                                onChange={(e) => updateMatrix(index, 'clo2', parseInt(e.target.value) || 0)}
                                className="w-16 text-center mx-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPreviewMode ? (
                              row.clo3
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={row.clo3}
                                onChange={(e) => updateMatrix(index, 'clo3', parseInt(e.target.value) || 0)}
                                className="w-16 text-center mx-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPreviewMode ? (
                              row.clo4
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={row.clo4}
                                onChange={(e) => updateMatrix(index, 'clo4', parseInt(e.target.value) || 0)}
                                className="w-16 text-center mx-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPreviewMode ? (
                              row.clo5
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={row.clo5}
                                onChange={(e) => updateMatrix(index, 'clo5', parseInt(e.target.value) || 0)}
                                className="w-16 text-center mx-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {row.clo1 + row.clo2 + row.clo3 + row.clo4 + row.clo5}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50 font-medium">
                        <TableCell>Tổng cộng</TableCell>
                        <TableCell className="text-center text-blue-600">
                          {matrix.reduce((sum, row) => sum + row.clo1, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-600">
                          {matrix.reduce((sum, row) => sum + row.clo2, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-600">
                          {matrix.reduce((sum, row) => sum + row.clo3, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-600">
                          {matrix.reduce((sum, row) => sum + row.clo4, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-600">
                          {matrix.reduce((sum, row) => sum + row.clo5, 0)}
                        </TableCell>
                        <TableCell className="text-center text-blue-600 font-bold">
                          {getTotalQuestions()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Nút tạo đề thi */}
      <div className="flex justify-end mt-6">
        <Button
          onClick={generateExam}
          disabled={!selectedFaculty || !selectedSubject || !examTitle || getTotalQuestions() === 0 || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              Đang xử lý...
            </>
          ) : (
            <>
              Tạo đề thi
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Extract;
