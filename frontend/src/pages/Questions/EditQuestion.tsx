import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
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

// Dữ liệu mẫu giống Questions.tsx (nên sau này sẽ lấy từ API hoặc context)
const sampleQuestions = [
  {
    id: 760633,
    content: "Câu hỏi này là gì\n1. dfsf",
    answers: [
      { label: 'A', text: 'fdsfs', correct: true },
      { label: 'B', text: 'sfsd' },
      { label: 'C', text: 'sdf' },
      { label: 'D', text: 'sdf' },
    ],
    type: 'Biết',
    status: 'Đã xoá',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 21:53:36',
    code: 760632,
  },
  {
    id: 760631,
    content: "Đánh giá tác động của mạng xã hội đối với giới trẻ hiện nay.",
    type: 'Vận dụng cao',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:33',
    code: 760631,
  },
  {
    id: 760630,
    content: "Vận dụng kiến thức về điện từ, giải thích cách hoạt động của một chiếc máy biến áp.",
    type: 'Vận dụng',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:33',
    code: 760630,
  },
  {
    id: 760629,
    content: "Giải thích nguyên nhân gây ra hiện tượng hiệu ứng nhà kính.",
    type: 'Hiểu',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:33',
    code: 760629,
  },
  {
    id: 760613,
    content: "Nguyên nhân chính nào dẫn đến sự sụp đổ của Đế quốc La Mã?",
    answers: [
      { label: 'A', text: 'Sự trỗi dậy của Đế quốc Ottoman' },
      { label: 'B', text: 'Sự suy thoái kinh tế và bất ổn chính trị', correct: true },
      { label: 'C', text: 'Các cuộc xâm lược của người Viking' },
      { label: 'D', text: 'Sự lan rộng của Kitô giáo' },
    ],
    type: 'Hiểu',
    status: 'Hoạt động',
    createdBy: 'Light Hunter',
    createdAt: '28/11/2024 15:21:32',
    code: 760613,
  },
];

interface Question {
  id: number;
  content: string;
  answers?: Array<{
    label: string;
    text: string;
    correct?: boolean;
  }>;
  type: string;
  status: string;
  createdBy: string;
  createdAt: string;
  code: number;
}

const EditQuestion = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const styles = useThemeStyles();
  const navigate = useNavigate();

  // Nếu là tạo mới, lấy type từ query param
  const type = searchParams.get('type');

  // Nếu là chỉnh sửa, lấy dữ liệu mẫu (cũ)
  const question = useMemo(() =>
    sampleQuestions.find(q => String(q.id) === String(id)) as Question | undefined,
    [id]
  );

  // Nếu là tạo mới mà không có type, báo lỗi
  if (id === 'new' && !type) {
    return <div className="p-8 text-red-500 font-semibold">Không xác định được loại câu hỏi!</div>;
  }

  // Nếu là chỉnh sửa mà không tìm thấy câu hỏi
  if (id !== 'new' && !question) {
    return <div className="p-8 text-red-500 font-semibold">Không tìm thấy câu hỏi!</div>;
  }

  // Render form động theo loại
  const renderForm = () => {
    // Nếu là tạo mới
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

    // Nếu là chỉnh sửa, render form tương ứng với loại câu hỏi
    if (!question) return null;

    switch (question.type) {
      case 'Biết':
      case 'Hiểu':
        return question.answers ? <SingleChoiceQuestion /> : <EssayQuestion />;
      case 'Vận dụng':
      case 'Vận dụng cao':
        return <EssayQuestion />;
      default:
        return <div className="p-8 text-red-500 font-semibold">Loại câu hỏi không hỗ trợ!</div>;
    }
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
      <div className="flex-1 min-w-[340px] max-w-[800px] bg-white rounded-lg p-6 shadow">
        {renderForm()}
      </div>
    </div>
  );
};

export default EditQuestion;
