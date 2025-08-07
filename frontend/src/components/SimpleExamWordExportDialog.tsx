import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleExamWordExportDialogProps {
    examId: string;
    examTitle?: string;
    trigger?: React.ReactNode;
}

/**
 * Simple dialog component for testing exam word export
 * Author: Linh Dang Dev
 */
export const SimpleExamWordExportDialog: React.FC<SimpleExamWordExportDialogProps> = ({ 
    examId, 
    examTitle,
    trigger 
}) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        console.log('🚀 Starting export for exam:', examId);
        setLoading(true);
        
        try {
            const exportOptions = {
                examTitle: examTitle || 'ĐỀ THI TEST',
                subject: 'Cơ sở dữ liệu',
                course: 'Khoa CNTT',
                semester: 'Học kỳ 1',
                academicYear: '2024-2025',
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
            };

            console.log('📋 Export options:', exportOptions);

            const response = await fetch(`/api/exam-word-export/${examId}/export-python`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(exportOptions)
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
            a.download = `${(examTitle || 'DeThi').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('✅ Export successful!');
            toast.success('Xuất file Word thành công!');
            setOpen(false);

        } catch (error: any) {
            console.error('❌ Export error:', error);
            toast.error(error.message || 'Lỗi khi xuất file Word');
        } finally {
            setLoading(false);
        }
    };

    const defaultTrigger = (
        <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Tải Word (Debug)
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Xuất đề thi ra Word</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <p><strong>Exam ID:</strong> {examId}</p>
                        <p><strong>Title:</strong> {examTitle || 'N/A'}</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {loading ? 'Đang xuất...' : 'Xuất ngay'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
