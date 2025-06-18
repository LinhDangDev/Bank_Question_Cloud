import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';
import { useThemeStyles, cx } from "../utils/theme";
import { renderLatex } from '@/utils/latex';
import { ChildQuestion } from './QuestionItem';
import { NavigateFunction } from 'react-router-dom';

interface ChildQuestionCardProps {
  childQuestion: ChildQuestion;
  parentId: string;
  childIndex: number;
  navigate: NavigateFunction;
}

const ChildQuestionCard = ({ childQuestion, parentId, childIndex, navigate }: ChildQuestionCardProps) => {
  const styles = useThemeStyles();

  return (
    <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-sm">
          Câu {childQuestion.MaSoCauHoi}:
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => navigate(`/questions/edit/${childQuestion.MaCauHoi}?parent=${parentId}`)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-sm mb-3">
        <span dangerouslySetInnerHTML={{ __html: renderLatex(childQuestion.NoiDung) }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {childQuestion.CauTraLoi && childQuestion.CauTraLoi.map((answer, idx) => (
          <div
            key={answer.MaCauTraLoi}
            className={cx(
              "flex items-start gap-2 p-2 rounded",
              answer.LaDapAn
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
            )}
          >
            <span className={cx(
              "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium",
              answer.LaDapAn
                ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            )}>
              {String.fromCharCode(65 + idx)}
            </span>
            <span className={answer.LaDapAn ? "text-green-700 text-sm" : "text-sm"}>
              <div dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildQuestionCard;
