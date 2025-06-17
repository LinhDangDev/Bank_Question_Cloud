import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

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

  return (
    <Card
      className={`relative transition-all duration-300 hover:shadow-lg cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
          : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <CheckCircle className="h-6 w-6 text-blue-500 bg-white rounded-full" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {icon}
          </div>
          <div className="flex-1">
            <Badge variant="outline" className="text-xs">
              Lớp {pkg.grade}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg font-semibold text-gray-800">
          {pkg.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {pkg.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {pkg.questionCount} câu hỏi
          </span>
          <Badge className={`text-xs ${getDifficultyColor(pkg.difficulty)}`}>
            {pkg.difficulty}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Chủ đề:</p>
          <div className="flex flex-wrap gap-1">
            {pkg.topics.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
            {pkg.topics.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{pkg.topics.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant={isSelected ? "primary" : "outline"}
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? "Đã chọn" : "Chọn gói này"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExamPackageCard;
