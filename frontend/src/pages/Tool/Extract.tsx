import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BookOpen, GraduationCap, FileText, Plus, Minus, Upload, Eye, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface MatrixRow {
  chapter: string;
  easy: number;
  medium: number;
  hard: number;
}

const Extract = () => {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('');
  const [matrix, setMatrix] = useState<MatrixRow[]>([
    { chapter: 'Chương 1', easy: 2, medium: 2, hard: 1 },
    { chapter: 'Chương 2', easy: 3, medium: 2, hard: 1 },
  ]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [importedData, setImportedData] = useState<MatrixRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const faculties = [
    'Công nghệ thông tin',
    'Kinh tế',
    'Ngoại ngữ',
    'Kỹ thuật',
    'Y dược',
  ];

  const subjects: Record<string, string[]> = {
    'Công nghệ thông tin': ['Lập trình C++', 'Cơ sở dữ liệu', 'Mạng máy tính', 'Phân tích thiết kế hệ thống'],
    'Kinh tế': ['Kinh tế vi mô', 'Kinh tế vĩ mô', 'Kế toán tài chính', 'Marketing'],
    'Ngoại ngữ': ['Tiếng Anh giao tiếp', 'Ngữ pháp tiếng Anh', 'Tiếng Anh chuyên ngành', 'TOEIC'],
    'Kỹ thuật': ['Vật lý đại cương', 'Toán cao cấp', 'Cơ học kỹ thuật', 'Điện tử'],
    'Y dược': ['Giải phẫu', 'Sinh lý', 'Dược lý', 'Bệnh lý'],
  };

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
        const matrixData: MatrixRow[] = jsonData.slice(1).map((row, index) => ({
          chapter: row[0] || `Chương ${index + 1}`,
          easy: parseInt(row[1]) || 0,
          medium: parseInt(row[2]) || 0,
          hard: parseInt(row[3]) || 0,
        })).filter(row => row.chapter);

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
      setMatrix(importedData);
      setImportedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const cancelImport = () => {
    setImportedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addMatrixRow = () => {
    setMatrix([...matrix, { chapter: `Chương ${matrix.length + 1}`, easy: 0, medium: 0, hard: 0 }]);
  };

  const removeMatrixRow = (index: number) => {
    if (matrix.length > 1) {
      setMatrix(matrix.filter((_, i) => i !== index));
    }
  };

  const updateMatrix = (index: number, field: keyof MatrixRow, value: string | number) => {
    const newMatrix = [...matrix];
    newMatrix[index] = { ...newMatrix[index], [field]: value };
    setMatrix(newMatrix);
  };

  const getTotalQuestions = (data: MatrixRow[] = matrix) => {
    return data.reduce((total, row) => total + row.easy + row.medium + row.hard, 0);
  };

  const generateExam = () => {
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

      if (!examDuration || parseInt(examDuration) <= 0) {
        toast.error("Thiếu thông tin", {
          description: "Vui lòng nhập thời gian làm bài hợp lệ"
        });
        return;
      }

      if (getTotalQuestions() === 0) {
        toast.error("Ma trận không hợp lệ", {
          description: "Ma trận đề thi phải có ít nhất 1 câu hỏi"
        });
        return;
      }

      const examData = {
        faculty: selectedFaculty,
        subject: selectedSubject,
        title: examTitle,
        duration: examDuration,
        matrix: matrix,
        totalQuestions: getTotalQuestions(),
        createdAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(examData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `de-thi-${selectedSubject.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success("Xuất đề thi thành công", {
        description: `Đã tạo và tải xuống đề thi "${examTitle}" với ${getTotalQuestions()} câu hỏi`
      });

    } catch (error) {
      console.error('Error generating exam:', error);
      toast.error("Lỗi xuất đề thi", {
        description: "Có lỗi xảy ra khi tạo đề thi. Vui lòng thử lại."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid xl:grid-cols-3 gap-8">
          {/* Form thông tin đề thi */}
          <div className="xl:col-span-1">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="w-6 h-6" />
                  Thông tin đề thi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="faculty" className="text-sm font-semibold text-slate-700">Khoa</Label>
                  <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-blue-500 rounded-lg">
                      <SelectValue placeholder="Chọn khoa" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 shadow-xl rounded-lg">
                      {faculties.map((faculty) => (
                        <SelectItem key={faculty} value={faculty} className="py-3">{faculty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="subject" className="text-sm font-semibold text-slate-700">Môn học</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedFaculty}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-blue-500 rounded-lg">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 shadow-xl rounded-lg">
                      {selectedFaculty && subjects[selectedFaculty]?.map((subject) => (
                        <SelectItem key={subject} value={subject} className="py-3">{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Tên đề thi</Label>
                  <Input
                    id="title"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Nhập tên đề thi"
                    className="h-12 border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Thời gian làm bài (phút)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    placeholder="90"
                    className="h-12 border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Tổng số câu hỏi</div>
                  <div className="text-3xl font-bold text-blue-600">{getTotalQuestions()}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ma trận đề thi */}
          <div className="xl:col-span-2">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-6 h-6" />
                  Ma trận đề thi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant={isPreviewMode ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setIsPreviewMode(true)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </Button>
                    <Button
                      variant={!isPreviewMode ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setIsPreviewMode(false)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Chỉnh sửa
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
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
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Import Excel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={addMatrixRow}
                      className="flex items-center gap-2"
                      disabled={isPreviewMode}
                    >
                      <Plus className="w-4 h-4" />
                      Thêm chương
                    </Button>
                  </div>
                </div>

                {/* Import Preview */}
                {importedData && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-amber-800">Xem trước dữ liệu import</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={applyImportedData}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Áp dụng
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelImport}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Hủy
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-amber-700 mb-2">
                      Tổng số câu hỏi: <span className="font-bold">{getTotalQuestions(importedData)}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-amber-100">
                            <th className="text-left p-2 text-sm font-medium">Chương</th>
                            <th className="text-center p-2 text-sm font-medium">Dễ</th>
                            <th className="text-center p-2 text-sm font-medium">Trung bình</th>
                            <th className="text-center p-2 text-sm font-medium">Khó</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importedData.map((row, index) => (
                            <tr key={index} className="border-b border-amber-200">
                              <td className="p-2 text-sm font-medium">{row.chapter}</td>
                              <td className="p-2 text-center text-sm">{row.easy}</td>
                              <td className="p-2 text-center text-sm">{row.medium}</td>
                              <td className="p-2 text-center text-sm">{row.hard}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isPreviewMode ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left p-2 text-sm font-medium text-slate-700">Chương</th>
                          <th className="text-center p-2 text-sm font-medium text-slate-700">Dễ</th>
                          <th className="text-center p-2 text-sm font-medium text-slate-700">Trung bình</th>
                          <th className="text-center p-2 text-sm font-medium text-slate-700">Khó</th>
                          <th className="text-center p-2 text-sm font-medium text-slate-700">Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.map((row, index) => (
                          <tr key={index} className="border-b hover:bg-slate-50">
                            <td className="p-2 text-sm font-medium">{row.chapter}</td>
                            <td className="p-2 text-center text-sm">{row.easy}</td>
                            <td className="p-2 text-center text-sm">{row.medium}</td>
                            <td className="p-2 text-center text-sm">{row.hard}</td>
                            <td className="p-2 text-center text-sm font-semibold text-blue-600">
                              {row.easy + row.medium + row.hard}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 font-medium">
                          <td className="p-2 text-sm">Tổng cộng</td>
                          <td className="p-2 text-center text-sm text-blue-600">
                            {matrix.reduce((sum, row) => sum + row.easy, 0)}
                          </td>
                          <td className="p-2 text-center text-sm text-blue-600">
                            {matrix.reduce((sum, row) => sum + row.medium, 0)}
                          </td>
                          <td className="p-2 text-center text-sm text-blue-600">
                            {matrix.reduce((sum, row) => sum + row.hard, 0)}
                          </td>
                          <td className="p-2 text-center text-sm text-blue-600 font-bold">
                            {getTotalQuestions()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matrix.map((row, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <Input
                          value={row.chapter}
                          onChange={(e) => updateMatrix(index, 'chapter', e.target.value)}
                          className="flex-1 h-10"
                          placeholder="Tên chương"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={row.easy}
                          onChange={(e) => updateMatrix(index, 'easy', parseInt(e.target.value) || 0)}
                          className="w-16 h-10 text-center"
                          placeholder="0"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={row.medium}
                          onChange={(e) => updateMatrix(index, 'medium', parseInt(e.target.value) || 0)}
                          className="w-16 h-10 text-center"
                          placeholder="0"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={row.hard}
                          onChange={(e) => updateMatrix(index, 'hard', parseInt(e.target.value) || 0)}
                          className="w-16 h-10 text-center"
                          placeholder="0"
                        />
                        {matrix.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMatrixRow(index)}
                            className="text-red-500 h-10 w-10 p-0 flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Nút tạo đề thi */}
        <div className="flex justify-end pt-10">
          <Button
            onClick={generateExam}
            disabled={!selectedFaculty || !selectedSubject || !examTitle || getTotalQuestions() === 0}
            className="bg-blue-600 text-white px-6 py-2 text-base font-medium shadow-md hover:shadow-lg"
            variant="primary"
          >
            <Download className="w-5 h-5 mr-2" />
            Tạo và tải xuống đề thi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Extract;
