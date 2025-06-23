import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ExamPackage {
  id: number;
  title: string;
  subject: string;
  grade: string;
  questionCount: number;
  difficulty: string;
  category: string;
  description: string;
  topics: string[];
  createdAt: string;
}

interface ExamPackageCardProps {
  package: ExamPackage;
  isSelected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}

const ExamPackageCard: React.FC<ExamPackageCardProps> = ({
  package: pkg,
  isSelected,
  onSelect,
  icon
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Dễ': return 'bg-green-100 text-green-800';
      case 'Trung bình': return 'bg-yellow-100 text-yellow-800';
      case 'Khó': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formattedDate = format(new Date(pkg.createdAt), 'dd/MM/yyyy', { locale: vi });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium truncate">{pkg.title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{pkg.subject}</p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{pkg.questionCount} câu hỏi</span>
          </div>
        </div>
        <Button
          onClick={onSelect}
          className="w-full mt-auto"
          variant="primary"
        >
          Chọn bộ đề này
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExamPackageCard;
