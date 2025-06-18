import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronDown, ChevronRight, Users, RefreshCw } from 'lucide-react';
import { useThemeStyles, cx } from "../utils/theme";
import { useNavigate } from 'react-router-dom';
import { renderLatex } from '@/utils/latex';
import ChildQuestionCard from './ChildQuestionCard';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

// Define the Answer interface based on the API response
export interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

// Updated Question interface to support group questions
export interface Question {
  MaCauHoi: string;
  MaPhan: string;
  MaSoCauHoi: number;
  NoiDung: string;
  HoanVi: boolean;
  CapDo: number;
  SoCauHoiCon: number;
  DoPhanCachCauHoi: number | null;
  MaCauHoiCha: string | null;
  XoaTamCauHoi: boolean;
  SoLanDuocThi: number;
  SoLanDung: number;
  NgayTao: string;
  NgaySua: string;
  MaCLO: string;
  TenCLO?: string;
  cloInfo?: {
    MaCLO: string;
    TenCLO: string;
  };
  khoa?: {
    MaKhoa: string;
    TenKhoa: string;
  };
  monHoc?: {
    MaMonHoc: string;
    TenMonHoc: string;
  };
  phan?: {
    MaPhan: string;
    TenPhan: string;
  };
  answers: Answer[];
  LaCauHoiNhom?: boolean;
  CauHoiCon?: ChildQuestion[];
}

// Define ChildQuestion interface for group questions
export interface ChildQuestion {
  MaCauHoi: string;
  MaSoCauHoi: number;
  NoiDung: string;
  CauTraLoi: Answer[];
}

interface QuestionItemProps {
  question: Question;
  index: number;
  page: number;
  limit: number;
  expandedGroups: string[];
  toggleGroup: (id: string) => void;
  refetchQuestions: () => void;
}

const typeColors: Record<string, string> = {
  'CLO 1': 'bg-green-100 text-green-700',
  'CLO 2': 'bg-blue-100 text-blue-700',
  'CLO 3': 'bg-purple-100 text-purple-700',
  'CLO 4': 'bg-orange-100 text-orange-700',
  'CLO 5': 'bg-yellow-100 text-yellow-700',
};

const statusColors: Record<string, string> = {
  'active': 'text-green-600',
  'deleted': 'text-red-500',
};

// Define helper functions for displaying question difficulty
const getDifficultyColor = (level: number) => {
  if (!level || level <= 2) return "bg-green-100 text-green-800";
  if (level <= 4) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

const getDifficultyText = (level: number) => {
  if (!level || level <= 2) return "Dễ";
  if (level <= 4) return "Trung bình";
  return "Khó";
};

// Format date from ISO string to local date format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const QuestionItem = ({ question: q, index, page, limit, expandedGroups, toggleGroup, refetchQuestions }: QuestionItemProps) => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (q.XoaTamCauHoi) {
        if (!confirm('Bạn có chắc chắn muốn xoá vĩnh viễn câu hỏi này?')) {
          setIsDeleting(false);
          return;
        }
        await axios.delete(`${API_BASE_URL}/cau-hoi/${q.MaCauHoi}`);
        toast.success('Đã xoá câu hỏi vĩnh viễn');
      } else {
        await axios.patch(`${API_BASE_URL}/cau-hoi/${q.MaCauHoi}/soft-delete`);
        toast.success('Đã xoá tạm thời câu hỏi');
      }
      refetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Xoá câu hỏi thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await axios.patch(`${API_BASE_URL}/cau-hoi/${q.MaCauHoi}/restore`);
      toast.success('Đã khôi phục câu hỏi');
      refetchQuestions();
    } catch (error) {
      console.error('Error restoring question:', error);
      toast.error('Khôi phục câu hỏi thất bại');
    } finally {
      setIsRestoring(false);
    }
  };

  // Render group question
  if (q.LaCauHoiNhom) {
    return (
      <div
        className={cx(
          "flex flex-col md:flex-row justify-between gap-3 p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700/30",
          styles.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-gray-500 text-sm font-medium">#{index + 1 + (page - 1) * limit}</span>
            <span className="text-gray-500 text-sm">#{q.MaSoCauHoi}</span>
            <span className="px-2 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700">
              Câu hỏi nhóm ({q.SoCauHoiCon})
            </span>
            <span className={cx(
              "px-2 py-1 rounded text-sm font-medium border",
              q.XoaTamCauHoi ? 'border-red-200 text-red-500' : 'border-green-200 text-green-600'
            )}>
              {q.XoaTamCauHoi ? 'Đã xoá' : 'Hoạt động'}
            </span>
          </div>

          <div className="font-semibold text-base mb-2">
            <div dangerouslySetInnerHTML={{ __html: renderLatex(q.NoiDung) }} />
          </div>

          <button
            onClick={() => toggleGroup(q.MaCauHoi)}
            className="w-full border border-gray-300 text-left px-3 py-2 rounded-md flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 mt-2"
          >
            <span>Xem {q.SoCauHoiCon} câu hỏi con</span>
            {expandedGroups.includes(q.MaCauHoi) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedGroups.includes(q.MaCauHoi) && q.CauHoiCon && (
            <div className="mt-3 space-y-2">
              {q.CauHoiCon.map((childQ, childIndex) => (
                <ChildQuestionCard
                  key={childQ.MaCauHoi}
                  childQuestion={childQ}
                  parentId={q.MaCauHoi}
                  childIndex={childIndex}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end min-w-[220px] gap-2">
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" className={cx("h-9 w-9 p-0", styles.outlineButton)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cx("h-9 w-9 p-0", styles.outlineButton)}
              onClick={() => navigate(`/questions/edit/${q.MaCauHoi}`)}
            >
              <Edit className="w-4 h-4" />
            </Button>

            {q.XoaTamCauHoi ? (
              <Button
                variant="outline"
                size="sm"
                className={cx(
                  "h-9 w-9 p-0",
                  styles.isDark
                    ? 'text-green-400 hover:text-green-300 border-green-800 hover:bg-green-900 hover:bg-opacity-30'
                    : 'text-green-500 hover:text-green-600 border-green-300 hover:bg-green-50'
                )}
                onClick={handleRestore}
                disabled={isRestoring}
              >
                <RefreshCw className={cx("w-4 h-4", isRestoring && "animate-spin")} />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={cx(
                  "h-9 w-9 p-0",
                  styles.isDark
                    ? 'text-red-400 hover:text-red-300 border-red-800 hover:bg-red-900 hover:bg-opacity-30'
                    : 'text-red-500 hover:text-red-600 border-red-300 hover:bg-red-50'
                )}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="text-sm text-right">
            <div className="mb-1">
              <span className="font-medium">{q.XoaTamCauHoi ? 'Đã xoá' : 'Hoạt động'}</span>
            </div>
            {q.khoa && <div className="text-gray-500">Khoa: <span className="font-semibold">{q.khoa.TenKhoa}</span></div>}
            {q.monHoc && <div className="text-gray-500">Môn học: <span className="font-semibold">{q.monHoc.TenMonHoc}</span></div>}
            {q.phan && <div className="text-gray-500">Phần: <span className="font-semibold">{q.phan.TenPhan}</span></div>}
            {q.cloInfo && <div className="text-gray-500">CLO: <span className="font-semibold">{q.cloInfo.TenCLO}</span></div>}
            <div className="text-gray-500">Cấp độ: <span className="font-semibold">{getDifficultyText(q.CapDo)}</span></div>
            <div className="text-gray-500">Ngày tạo: <span className="font-semibold">{formatDate(q.NgayTao)}</span></div>
            <div className="text-gray-500">Mã câu hỏi: <span className="font-semibold">{q.MaSoCauHoi}</span></div>
            <div className="text-gray-500">Số lần thi: <span className="font-semibold">{q.SoLanDuocThi}</span></div>
            <div className="text-gray-500">Số lần đúng: <span className="font-semibold">{q.SoLanDung}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Render regular question
  return (
    <div
      className={cx(
        "flex flex-col md:flex-row justify-between gap-3 p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700/30",
        styles.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-500 text-sm font-medium">#{index + 1 + (page - 1) * limit}</span>
          <span className="text-gray-500 text-sm">#{q.MaSoCauHoi}</span>
          {q.MaCLO && (
            <span className={cx(
              "px-2 py-1 rounded text-sm font-medium",
              q.cloInfo?.TenCLO ? typeColors[q.cloInfo.TenCLO] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
            )}>{q.cloInfo?.TenCLO || 'CLO'}</span>
          )}
          <span className={cx(
            "px-2 py-1 rounded text-sm font-medium border",
            q.XoaTamCauHoi ? 'border-red-200 text-red-500' : 'border-green-200 text-green-600'
          )}>
            {q.XoaTamCauHoi ? 'Đã xoá' : 'Hoạt động'}
          </span>
        </div>

        <div className="font-semibold text-base mb-2">
          <div dangerouslySetInnerHTML={{ __html: renderLatex(q.NoiDung) }} />
        </div>

        {q.answers && q.answers.length > 0 && (
          <div className="mt-3 space-y-2">
            {q.answers.map((answer, idx) => (
              <div
                key={answer.MaCauTraLoi}
                className={cx(
                  "flex items-start gap-2 p-3 rounded",
                  answer.LaDapAn
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                )}
              >
                <span className={cx(
                  "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium",
                  answer.LaDapAn
                    ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}>
                  {String.fromCharCode(65 + answer.ThuTu - 1)}
                </span>
                <div className="flex-1">
                  <div dangerouslySetInnerHTML={{ __html: renderLatex(answer.NoiDung) }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {q.SoCauHoiCon > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-green-700 border-green-300 hover:bg-green-50 h-8"
          >
            Xem {q.SoCauHoiCon} câu hỏi con <span className="ml-1 font-bold text-sm">+</span>
          </Button>
        )}
      </div>
      <div className="flex flex-col items-end min-w-[220px] gap-2">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" className={cx("h-9 w-9 p-0", styles.outlineButton)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cx("h-9 w-9 p-0", styles.outlineButton)}
            onClick={() => navigate(`/questions/edit/${q.MaCauHoi}`)}
          >
            <Edit className="w-4 h-4" />
          </Button>

          {q.XoaTamCauHoi ? (
            <Button
              variant="outline"
              size="sm"
              className={cx(
                "h-9 w-9 p-0",
                styles.isDark
                  ? 'text-green-400 hover:text-green-300 border-green-800 hover:bg-green-900 hover:bg-opacity-30'
                  : 'text-green-500 hover:text-green-600 border-green-300 hover:bg-green-50'
              )}
              onClick={handleRestore}
              disabled={isRestoring}
            >
              <RefreshCw className={cx("w-4 h-4", isRestoring && "animate-spin")} />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cx(
                "h-9 w-9 p-0",
                styles.isDark
                  ? 'text-red-400 hover:text-red-300 border-red-800 hover:bg-red-900 hover:bg-opacity-30'
                  : 'text-red-500 hover:text-red-600 border-red-300 hover:bg-red-50'
              )}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="text-sm text-right">
          <div className="mb-1">
            <span className="font-medium">{q.XoaTamCauHoi ? 'Đã xoá' : 'Hoạt động'}</span>
          </div>
          {q.khoa && <div className="text-gray-500">Khoa: <span className="font-semibold">{q.khoa.TenKhoa}</span></div>}
          {q.monHoc && <div className="text-gray-500">Môn học: <span className="font-semibold">{q.monHoc.TenMonHoc}</span></div>}
          {q.phan && <div className="text-gray-500">Phần: <span className="font-semibold">{q.phan.TenPhan}</span></div>}
          {q.cloInfo && <div className="text-gray-500">CLO: <span className="font-semibold">{q.cloInfo.TenCLO}</span></div>}
          <div className="text-gray-500">Cấp độ: <span className="font-semibold">{getDifficultyText(q.CapDo)}</span></div>
          <div className="text-gray-500">Ngày tạo: <span className="font-semibold">{formatDate(q.NgayTao)}</span></div>
          <div className="text-gray-500">Mã câu hỏi: <span className="font-semibold">{q.MaSoCauHoi}</span></div>
          <div className="text-gray-500">Số lần thi: <span className="font-semibold">{q.SoLanDuocThi}</span></div>
          <div className="text-gray-500">Số lần đúng: <span className="font-semibold">{q.SoLanDung}</span></div>
        </div>
      </div>
    </div>
  );
}

export default QuestionItem;
