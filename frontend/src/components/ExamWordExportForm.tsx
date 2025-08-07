import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, Eye, Settings, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExamWordExportFormProps {
    examId: string;
    onClose?: () => void;
}

interface ExportOptions {
    examTitle: string;
    subject: string;
    course: string;
    semester: string;
    academicYear: string;
    examDate: string;
    duration: string;
    instructions: string;
    allowMaterials: boolean;
    showAnswers: boolean;
    separateAnswerSheet: boolean;
    studentInfo: {
        studentId: string;
        studentName: string;
        className: string;
    };
}

/**
 * Form component for exporting exams to Word with custom headers
 * Author: Linh Dang Dev
 */
export const ExamWordExportForm: React.FC<ExamWordExportFormProps> = ({ examId, onClose }) => {
    const [options, setOptions] = useState<ExportOptions>({
        examTitle: '',
        subject: '',
        course: '',
        semester: '',
        academicYear: '',
        examDate: '',
        duration: '',
        instructions: '',
        allowMaterials: false,
        showAnswers: false,
        separateAnswerSheet: false,
        studentInfo: {
            studentId: '',
            studentName: '',
            className: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    // Load default options when component mounts
    useEffect(() => {
        loadDefaultOptions();
        loadPreviewData();
    }, [examId]);

    const loadDefaultOptions = async () => {
        try {
            const response = await fetch(`/api/exam-word-export/${examId}/default-options`);
            const result = await response.json();

            if (result.success) {
                setOptions(prev => ({
                    ...prev,
                    ...result.data
                }));
            }
        } catch (error) {
            console.error('Error loading default options:', error);
            toast.error('Không thể tải thông tin mặc định');
        }
    };

    const loadPreviewData = async () => {
        try {
            const response = await fetch(`/api/exam-word-export/${examId}/preview`);
            const result = await response.json();

            if (result.success) {
                setPreviewData(result.data);
            }
        } catch (error) {
            console.error('Error loading preview data:', error);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        if (field.startsWith('studentInfo.')) {
            const studentField = field.replace('studentInfo.', '');
            setOptions(prev => ({
                ...prev,
                studentInfo: {
                    ...prev.studentInfo,
                    [studentField]: value
                }
            }));
        } else {
            setOptions(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleExport = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/exam-word-export/${examId}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${options.examTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Xuất file Word thành công!');

            if (onClose) {
                onClose();
            }

        } catch (error) {
            console.error('Export error:', error);
            toast.error('Lỗi khi xuất file Word');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Xuất đề thi ra Word
                </h2>
                {onClose && (
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                )}
            </div>

            {/* Preview Card */}
            {previewData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Xem trước đề thi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>Tiêu đề:</strong> {previewData.examTitle}
                            </div>
                            <div>
                                <strong>Môn học:</strong> {previewData.subject}
                            </div>
                            <div>
                                <strong>Tổng số câu:</strong> {previewData.totalQuestions}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Export Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Thông tin đề thi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="examTitle">Tiêu đề đề thi</Label>
                            <Input
                                id="examTitle"
                                value={options.examTitle}
                                onChange={(e) => handleInputChange('examTitle', e.target.value)}
                                placeholder="ĐỀ THI HỌC KỲ ..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="subject">Môn học</Label>
                            <Input
                                id="subject"
                                value={options.subject}
                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                placeholder="Tên môn học"
                            />
                        </div>
                        <div>
                            <Label htmlFor="course">Khoa/Lớp</Label>
                            <Input
                                id="course"
                                value={options.course}
                                onChange={(e) => handleInputChange('course', e.target.value)}
                                placeholder="Khoa CNTT"
                            />
                        </div>
                        <div>
                            <Label htmlFor="semester">Học kỳ</Label>
                            <Input
                                id="semester"
                                value={options.semester}
                                onChange={(e) => handleInputChange('semester', e.target.value)}
                                placeholder="Học kỳ 1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="academicYear">Năm học</Label>
                            <Input
                                id="academicYear"
                                value={options.academicYear}
                                onChange={(e) => handleInputChange('academicYear', e.target.value)}
                                placeholder="2024-2025"
                            />
                        </div>
                        <div>
                            <Label htmlFor="examDate">Ngày thi</Label>
                            <Input
                                id="examDate"
                                value={options.examDate}
                                onChange={(e) => handleInputChange('examDate', e.target.value)}
                                placeholder="15/12/2024"
                            />
                        </div>
                        <div>
                            <Label htmlFor="duration">Thời gian làm bài</Label>
                            <Input
                                id="duration"
                                value={options.duration}
                                onChange={(e) => handleInputChange('duration', e.target.value)}
                                placeholder="90 phút"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="instructions">Hướng dẫn làm bài</Label>
                        <Textarea
                            id="instructions"
                            value={options.instructions}
                            onChange={(e) => handleInputChange('instructions', e.target.value)}
                            placeholder="Thời gian làm bài: 90 phút. Không được sử dụng tài liệu."
                            rows={3}
                        />
                    </div>

                    {/* Student Info */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Thông tin sinh viên (tùy chọn)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="studentId">Mã số sinh viên</Label>
                                <Input
                                    id="studentId"
                                    value={options.studentInfo.studentId}
                                    onChange={(e) => handleInputChange('studentInfo.studentId', e.target.value)}
                                    placeholder="SV001"
                                />
                            </div>
                            <div>
                                <Label htmlFor="studentName">Họ tên</Label>
                                <Input
                                    id="studentName"
                                    value={options.studentInfo.studentName}
                                    onChange={(e) => handleInputChange('studentInfo.studentName', e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div>
                                <Label htmlFor="className">Lớp</Label>
                                <Input
                                    id="className"
                                    value={options.studentInfo.className}
                                    onChange={(e) => handleInputChange('studentInfo.className', e.target.value)}
                                    placeholder="CNTT01"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="border-t pt-4 space-y-3">
                        <h4 className="font-medium">Tùy chọn xuất</h4>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowMaterials"
                                checked={options.allowMaterials}
                                onCheckedChange={(checked) => handleInputChange('allowMaterials', checked)}
                            />
                            <Label htmlFor="allowMaterials">Cho phép sử dụng tài liệu</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="showAnswers"
                                checked={options.showAnswers}
                                onCheckedChange={(checked) => handleInputChange('showAnswers', checked)}
                            />
                            <Label htmlFor="showAnswers">Hiển thị đáp án</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="separateAnswerSheet"
                                checked={options.separateAnswerSheet}
                                onCheckedChange={(checked) => handleInputChange('separateAnswerSheet', checked)}
                            />
                            <Label htmlFor="separateAnswerSheet">Tách riêng bảng đáp án</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Export Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleExport}
                    disabled={loading || !options.examTitle}
                    className="flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {loading ? 'Đang xuất...' : 'Xuất file Word'}
                </Button>
            </div>
        </div>
    );
};
