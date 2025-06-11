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
    return <div className="p-8 text-red-500 font-semibold">Không xác định được loại câu hỏi!</div>;
  }

  if (loading) {
    return <div className="p-8 text-gray-500 font-semibold">Đang tải câu hỏi...</div>;
  }

  if (id !== 'new' && error) {
    return <div className="p-8 text-red-500 font-semibold">{error}</div>;
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
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        {id === 'new' && (
          <Button variant="outline" className="flex items-center gap-2 px-0" onClick={() => navigate('/questions/create')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
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
