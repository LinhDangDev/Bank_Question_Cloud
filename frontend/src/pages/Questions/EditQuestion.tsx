import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { useThemeStyles, cx } from '../../utils/theme';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultiChoiceQuestion from './MultiChoiceQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import EssayQuestion from './EssayQuestion';
import ImageQuestion from './ImageQuestion';
import AudioQuestion from './AudioQuestion';
import GroupQuestion from './GroupQuestion';
import { ChevronLeft, AlertTriangle, Sigma } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { MathRenderer } from '@/components/MathRenderer';
import { questionApi, monHocApi, phanApi, khoaApi, cloApi } from '@/services/api';

// Add interface definitions for the props of each question component
interface LatexProps {
  latexMode?: boolean;
  toggleLatexMode?: () => void;
  parentId?: string | null;
}

interface SingleChoiceQuestionProps extends LatexProps {
  question?: any;
}

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
  NgaySua?: string;
  MaCLO: string;
  answers?: Answer[];
  LaCauHoiNhom?: boolean;
  LoaiBoChuongPhan?: boolean;
}

interface QuestionDetails {
  question: Question;
  answers: Answer[];
  khoa?: {
    MaKhoa: string;
    TenKhoa: string;
    XoaTamKhoa: boolean;
  };
  monHoc?: {
    MaMonHoc: string;
    MaKhoa: string;
    MaSoMonHoc: string;
    TenMonHoc: string;
    XoaTamMonHoc: boolean;
  };
  phan?: {
    MaPhan: string;
    MaMonHoc: string;
    TenPhan: string;
    ThuTu: number;
    SoLuongCauHoi: number;
    XoaTamPhan: boolean;
  };
  clo?: {
    MaCLO: string;
    TenCLO: string;
    ThuTu: number;
    XoaTamCLO: boolean;
  };
}

interface ExtendedQuestionProps {
  MaCauHoi?: string;
  NoiDung?: string;
  MaPhan?: string;
  MaCLO?: string;
  CapDo?: number;
  HoanVi?: boolean;
  answers?: Array<{
    MaCauTraLoi: string;
    NoiDung: string;
    ThuTu: number;
    LaDapAn: boolean;
    HoanVi?: boolean;
  }>;
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
  clo?: {
    MaCLO: string;
    TenCLO: string;
  };
  parentQuestion?: Question;
}

const EditQuestion = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latexMode, setLatexMode] = useState<boolean>(false);
  const [parentQuestion, setParentQuestion] = useState<Question | null>(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [maKhoa, setMaKhoa] = useState<string | null>(null);
  const [monHocList, setMonHocList] = useState<any[]>([]);
  const [maMonHoc, setMaMonHoc] = useState<string | null>(null);
  const [phanList, setPhanList] = useState<any[]>([]);
  const [maPhan, setMaPhan] = useState<string | null>(null);
  const [maCLO, setMaCLO] = useState<string | null>(null);
  const [selectedCLOName, setSelectedCLOName] = useState<string>('');
  const [cloList, setCloList] = useState<any[]>([]);

  // Nếu là tạo mới, lấy type từ query param
  const type = searchParams.get('type');
  const parentId = searchParams.get('parentId');

  useEffect(() => {
    if (id && id !== 'new') {
      setLoading(true);

      // Use questionApi instead of direct fetch
      questionApi.getFullDetails(id)
        .then(async (response) => {
          if (!response.data) throw new Error('Không tìm thấy câu hỏi!');

          const detailsData = response.data;
          console.log('Question details:', detailsData);

          // Make sure we have both question and answers data
          if (!detailsData.question || !detailsData.answers) {
            throw new Error('Dữ liệu câu hỏi không đầy đủ');
          }

          // Cập nhật question và gán answers trực tiếp vào đối tượng question để SingleChoiceQuestion có thể nhận được
          const enrichedQuestion = {
            ...detailsData.question,
            answers: detailsData.answers,
            khoa: detailsData.khoa,
            monHoc: detailsData.monHoc,
            phan: detailsData.phan,
            clo: detailsData.clo
          };

          setQuestion(enrichedQuestion);
          setQuestionDetails(detailsData);

          // Set faculty, subject, chapter and CLO data if available
          if (detailsData.khoa) {
            setMaKhoa(detailsData.khoa.MaKhoa);

            // If we have a khoa, load the monHoc list for that khoa
            try {
              const monHocResponse = await monHocApi.getMonHocByKhoa(detailsData.khoa.MaKhoa);
              setMonHocList(Array.isArray(monHocResponse.data) ? monHocResponse.data : []);
            } catch (err) {
              console.error("Error loading monHoc list:", err);
            }
          }

          if (detailsData.monHoc) {
            setMaMonHoc(detailsData.monHoc.MaMonHoc);

            // If we have a monHoc, load the phan list for that monHoc
            try {
              const phanResponse = await phanApi.getPhanByMonHoc(detailsData.monHoc.MaMonHoc);
              setPhanList(Array.isArray(phanResponse.data) ? phanResponse.data : []);
            } catch (err) {
              console.error("Error loading phan list:", err);
            }
          }

          if (detailsData.phan) {
            setMaPhan(detailsData.phan.MaPhan);
          }

          if (detailsData.clo) {
            setMaCLO(detailsData.clo.MaCLO);
            setSelectedCLOName(detailsData.clo.TenCLO || '');
          }

          // Automatically enable LaTeX mode if content contains LaTeX
          if (detailsData.question?.NoiDung &&
              (detailsData.question.NoiDung.includes('$$') ||
               detailsData.question.NoiDung.includes('\\(') ||
               detailsData.question.NoiDung.includes('\\['))) {
            setLatexMode(true);
          }

          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching question:', err);
          setError('Không thể tải thông tin câu hỏi: ' + (err.message || 'Đã xảy ra lỗi'));
          setLoading(false);
        });
    }
  }, [id]);

  // Fetch parent question if this is a child question
  useEffect(() => {
    if (parentId) {
      setLoadingParent(true);
      questionApi.getById(parentId)
        .then(response => {
          if (response.data) {
            setParentQuestion(response.data);
          } else {
            throw new Error('Không tìm thấy câu hỏi cha!');
          }
        })
        .catch(err => {
          console.error('Error fetching parent question:', err);
        })
        .finally(() => {
          setLoadingParent(false);
        });
    }
  }, [parentId]);

  // Fetch CLO list from backend
  useEffect(() => {
    cloApi.getAll()
      .then(response => {
        if (response.data) {
          setCloList(response.data);
        }
      })
      .catch(err => console.error("Error fetching CLO list:", err));
  }, []);

  const toggleLatexMode = () => {
    setLatexMode(!latexMode);
  };

  if (id === 'new' && !type) {
    return (
      <div className="p-6 bg-red-50 text-red-500 font-semibold rounded-lg border border-red-200 shadow-md">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3" />
          <span>Không xác định được loại câu hỏi!</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-500 font-semibold">Đang tải câu hỏi...</span>
      </div>
    );
  }

  if (id !== 'new' && error) {
    return (
      <div className="p-6 bg-red-50 text-red-500 font-semibold rounded-lg border border-red-200 shadow-md flex items-center">
        <AlertTriangle className="w-6 h-6 mr-3" />
        {error}
      </div>
    );
  }

  // Render form động theo loại
  const renderForm = () => {
    if (id === 'new') {
      switch (type) {
        case 'single-choice':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <SingleChoiceQuestion latexMode={latexMode} toggleLatexMode={toggleLatexMode} parentId={parentId} />;
        case 'multi-choice':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <MultiChoiceQuestion latexMode={latexMode} toggleLatexMode={toggleLatexMode} parentId={parentId} />;
        case 'fill-blank':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <FillBlankQuestion latexMode={latexMode} toggleLatexMode={toggleLatexMode} parentId={parentId} />;
        case 'essay':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <EssayQuestion latexMode={latexMode} toggleLatexMode={toggleLatexMode} parentId={parentId} />;
        case 'image':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <ImageQuestion latexMode={latexMode} toggleLatexMode={toggleLatexMode} parentId={parentId} />;
        case 'audio':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <AudioQuestion latexMode={latexMode} toggleLatexMode={toggleLatexMode} parentId={parentId} />;
        case 'group':
          // @ts-ignore - Component accepts these props but TypeScript definitions need updating
          return <SingleChoiceQuestion isGroup={true} latexMode={latexMode} toggleLatexMode={toggleLatexMode} />;
        default:
          return <div className="p-6 text-red-500 font-semibold">Loại câu hỏi không hỗ trợ!</div>;
      }
    } else if (question) {
      // Check if this is a group question with parent-child structure
      const isGroupQuestion = question.SoCauHoiCon > 0;

      console.log('Question data passing to SingleChoiceQuestion:', question);

      return (
        <SingleChoiceQuestion
          question={question}
          isGroup={isGroupQuestion}
          latexMode={latexMode}
          toggleLatexMode={toggleLatexMode}
          parentId={parentId}
        />
      );
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">

          {/* Parent question breadcrumb if editing a child question */}
          {parentQuestion && (
            <div className="mt-4 flex items-center text-sm bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-md">
              <span className="text-blue-600 dark:text-blue-400">Câu hỏi con thuộc:</span>
              <Button
                variant="text"
                size="sm"
                className="ml-2 text-blue-700 dark:text-blue-300"
                onClick={() => navigate(`/questions/edit/${parentQuestion.MaCauHoi}`)}
              >
                Câu hỏi nhóm #{parentQuestion.MaSoCauHoi}
              </Button>
            </div>
          )}
        </div>

        {/* Question form container */}
        <div className="p-6">
          {renderForm()}
        </div>
      </div>
  );
};

export default EditQuestion;
