import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, Settings, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExamWordExportDialogProps {
    examId: string;
    examTitle?: string;
    trigger?: React.ReactNode;
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
 * Dialog component for exporting exams to Word with custom headers
 * Author: Linh Dang Dev
 */
export const ExamWordExportDialog: React.FC<ExamWordExportDialogProps> = ({
    examId,
    examTitle,
    trigger
}) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingDefaults, setLoadingDefaults] = useState(false);

    const [options, setOptions] = useState<ExportOptions>({
        examTitle: examTitle || '',
        subject: '',
        course: '',
        semester: '',
        academicYear: new Date().getFullYear().toString(),
        examDate: new Date().toLocaleDateString('vi-VN'),
        duration: '90 phút',
        instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
        allowMaterials: false,
        showAnswers: false,
        separateAnswerSheet: false,
        studentInfo: {
            studentId: '',
            studentName: '',
            className: ''
        }
    });

    // Load default options when dialog opens
    useEffect(() => {
        if (open && examId) {
            loadDefaultOptions();
        }
    }, [open, examId]);

    const loadDefaultOptions = async () => {
        setLoadingDefaults(true);
        try {
            const response = await fetch(`/api/exam-word-export/${examId}/default-options`);
            const result = await response.json();

            if (result.success) {
                setOptions(prev => ({
                    ...prev,
                    ...result.data,
                    examTitle: result.data.examTitle || examTitle || prev.examTitle
                }));
            }
        } catch (error) {
            console.error('Error loading default options:', error);
            toast.error('Không thể tải thông tin mặc định');
        } finally {
            setLoadingDefaults(false);
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
        // Auto-fill examTitle if empty
        if (!options.examTitle.trim()) {
            setOptions(prev => ({
                ...prev,
                examTitle: examTitle || 'ĐỀ THI'
            }));
        }

        console.log('🚀 Starting export for exam:', examId);
        console.log('📋 Export options:', options);
        setLoading(true);

        try {
            const response = await fetch(`/api/exam-word-export/${examId}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Export failed:', errorText);
                throw new Error(`Export failed: ${response.status} - ${errorText}`);
            }

            // Download file
            const blob = await response.blob();
            console.log('📁 File blob size:', blob.size);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${options.examTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('✅ Export successful!');
            toast.success('Xuất file Word thành công!');
            setOpen(false);

        } catch (error: any) {
            console.error('❌ Export error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            toast.error(error.message || 'Lỗi khi xuất file Word');
        } finally {
            setLoading(false);
        }
    };

    const defaultTrigger = (
        <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Tải Word
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Xuất đề thi ra Word
                    </DialogTitle>
                </DialogHeader>

                {loadingDefaults ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>Đang tải thông tin...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Thông tin đề thi */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Settings className="w-4 h-4" />
                                <h3 className="font-medium">Thông tin đề thi</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="examTitle">Tiêu đề đề thi *</Label>
                                    <Input
                                        id="examTitle"
                                        value={options.examTitle}
                                        onChange={(e) => handleInputChange('examTitle', e.target.value)}
                                        placeholder="ĐỀ THI HỌC KỲ ..."
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="subject">Môn học</Label>
                                    <Input
                                        id="subject"
                                        value={options.subject}
                                        onChange={(e) => handleInputChange('subject', e.target.value)}
                                        placeholder="Tên môn học"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="course">Khoa/Lớp</Label>
                                    <Input
                                        id="course"
                                        value={options.course}
                                        onChange={(e) => handleInputChange('course', e.target.value)}
                                        placeholder="Khoa CNTT"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="semester">Học kỳ</Label>
                                    <Input
                                        id="semester"
                                        value={options.semester}
                                        onChange={(e) => handleInputChange('semester', e.target.value)}
                                        placeholder="Học kỳ 1"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="academicYear">Năm học</Label>
                                    <Input
                                        id="academicYear"
                                        value={options.academicYear}
                                        onChange={(e) => handleInputChange('academicYear', e.target.value)}
                                        placeholder="2024-2025"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="examDate">Ngày thi</Label>
                                    <Input
                                        id="examDate"
                                        value={options.examDate}
                                        onChange={(e) => handleInputChange('examDate', e.target.value)}
                                        placeholder="15/12/2024"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="duration">Thời gian làm bài</Label>
                                    <Input
                                        id="duration"
                                        value={options.duration}
                                        onChange={(e) => handleInputChange('duration', e.target.value)}
                                        placeholder="90 phút"
                                        className="mt-1"
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
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Thông tin sinh viên */}
                        <div className="space-y-4">
                            <h3 className="font-medium border-b pb-2">Thông tin sinh viên (tùy chọn)</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="studentId">Mã số sinh viên</Label>
                                    <Input
                                        id="studentId"
                                        value={options.studentInfo.studentId}
                                        onChange={(e) => handleInputChange('studentInfo.studentId', e.target.value)}
                                        placeholder="SV001"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="studentName">Họ tên</Label>
                                    <Input
                                        id="studentName"
                                        value={options.studentInfo.studentName}
                                        onChange={(e) => handleInputChange('studentInfo.studentName', e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="className">Lớp</Label>
                                    <Input
                                        id="className"
                                        value={options.studentInfo.className}
                                        onChange={(e) => handleInputChange('studentInfo.className', e.target.value)}
                                        placeholder="CNTT01"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tùy chọn xuất */}
                        <div className="space-y-4">
                            <h3 className="font-medium border-b pb-2">Tùy chọn xuất</h3>
                            <div className="space-y-3">
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
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={loading || !options.examTitle.trim()}
                                className="flex items-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {loading ? 'Đang xuất...' : 'Xuất file Word'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
