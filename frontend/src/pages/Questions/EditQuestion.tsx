import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultiChoiceQuestion from './MultiChoiceQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import EssayQuestion from './EssayQuestion';
import ImageQuestion from './ImageQuestion';
import AudioQuestion from './AudioQuestion';
import GroupQuestion from './GroupQuestion';
import { ChevronLeft } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

interface Question {
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
  answers: Answer[];
}

const EditQuestion = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nếu là tạo mới, lấy type từ query param
  const type = searchParams.get('type');

  useEffect(() => {
    if (id && id !== 'new') {
      setLoading(true);
      fetch(`http://localhost:3000/cau-hoi/${id}/with-answers`)
        .then(res => {
          if (!res.ok) throw new Error('Không tìm thấy câu hỏi!');
          return res.json();
        })
        .then(data => {
          setQuestion({ ...data.question, answers: data.answers });
          setLoading(false);
        })
        .catch(err => {
          setError('Không tìm thấy câu hỏi!');
          setLoading(false);
        });
    }
  }, [id]);

  if (id === 'new' && !type) {
    return (
      <div className="p-8 bg-red-50 text-red-500 font-semibold rounded-lg border border-red-200 shadow-sm">
        Không xác định được loại câu hỏi!
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-500 font-semibold">Đang tải câu hỏi...</span>
      </div>
    );
  }

  if (id !== 'new' && error) {
    return (
      <div className="p-8 bg-red-50 text-red-500 font-semibold rounded-lg border border-red-200 shadow-sm flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  // Render form động theo loại
  const renderForm = () => {
    if (id === 'new') {
      switch (type) {
        case 'single-choice':
          return <SingleChoiceQuestion />;
        case 'multi-choice':
          return <MultiChoiceQuestion />;
        case 'fill-blank':
          return <FillBlankQuestion />;
        case 'essay':
          return <EssayQuestion />;
        case 'image':
          return <ImageQuestion />;
        case 'audio':
          return <AudioQuestion />;
        case 'group':
          return <GroupQuestion />;
        default:
          return <div className="p-8 text-red-500 font-semibold">Loại câu hỏi không hỗ trợ!</div>;
      }
    }
    if (!question) return null;
    // Pass question data to the form component (to be implemented)
    return <SingleChoiceQuestion question={question} />;
  };

  return (
    <div className="max-w-full px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        {id === 'new' && (
          <Button
            variant="outline"
            className="flex items-center justify-center h-9 w-9 p-0 rounded-full"
            onClick={() => navigate('/questions/create')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <h2 className={cx("text-2xl font-bold", styles.isDark ? 'text-gray-200' : '')}>
          {id === 'new' ? 'Tạo câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
        </h2>
      </div>
      <div>
        {renderForm()}
      </div>
    </div>
  );
};

export default EditQuestion;
