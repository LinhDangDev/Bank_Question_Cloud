import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useThemeStyles, cx } from '../../utils/theme';
import { Eye, Plus, Trash2, Info, X, Save, ArrowLeft, CheckCircle, Building2, BookOpen, Layers, Target, Upload, Music, ChevronLeft, AlertTriangle, Sigma, GripVertical } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Editor } from '@tinymce/tinymce-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '@/config';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import MathModal from '../../components/Modal/MathModal';
import { useModal } from '../../hooks/useModal';
import { MathRenderer } from '../../components/MathRenderer';
import { cauHoiApi, monHocApi, phanApi, khoaApi, cloApi, fileApi, fetchWithAuth } from '@/services/api';
import { createTinyMCEConfig, TINYMCE_API_KEY } from '../../utils/tinymce-config';

// @ts-ignore
declare global {
  interface Window {
    MathJax?: any;
  }
}

const defaultAnswers = [
  { text: '', correct: false },
  { text: '', correct: false },
  { text: '', correct: false },
  { text: '', correct: false },
];

const layoutOptions = [
  { label: '1 cột', value: 1 },
  { label: '2 cột', value: 2 },
  { label: '3 cột', value: 3 },
  { label: '4 cột', value: 4 },
];

function splitAnswers(answers: { text: string; correct: boolean }[], columns: number) {
  const rows: { text: string; correct: boolean }[][] = [];
  for (let i = 0; i < answers.length; i += columns) {
    rows.push(answers.slice(i, i + columns));
  }
  return rows;
}

const EditorAny = Editor as any;

// Answer interfaces
interface AnswerForm {
  text: string;
  correct: boolean;
}

interface Answer {
  MaCauTraLoi: string;
  MaCauHoi: string;
  NoiDung: string;
  ThuTu: number;
  LaDapAn: boolean;
  HoanVi: boolean;
}

// Base question interfaces
interface Khoa { MaKhoa: string; TenKhoa: string; }
interface MonHoc { MaMonHoc: string; TenMonHoc: string; }
interface Phan { MaPhan: string; TenPhan: string; }
interface CLO { MaCLO: string; TenCLO: string; }

// For regular single-choice questions
interface SingleChoiceQuestionProps {
  question?: {
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
    // For displaying details
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
  };
  isGroup?: boolean; // Whether this is a group question or not
  latexMode?: boolean;
  toggleLatexMode?: () => void;
  parentId?: string | null;
}

// For group questions (parent + child questions)
interface SubQuestion {
  MaCauHoi: string;
  MaPhan?: string;
  MaSoCauHoi: number;
  NoiDung: string;
  HoanVi: boolean;
  CapDo?: number;
  SoCauHoiCon: number;
  DoPhanCachCauHoi?: number | null;
  MaCauHoiCha: string | null;
  XoaTamCauHoi?: boolean;
  SoLanDuocThi?: number;
  SoLanDung?: number;
  NgayTao?: string;
  NgaySua?: string;
  MaCLO?: string;
  LaCauHoiNhom?: boolean;
  answers: Answer[];
}

// Combined props interface that works for both question types
const SingleChoiceQuestion = ({ question, isGroup = false, latexMode = false, toggleLatexMode, parentId }: SingleChoiceQuestionProps) => {
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(question?.NoiDung || '');
  const [answers, setAnswers] = useState<AnswerForm[]>(
    question?.answers && question.answers.length > 0
      ? question.answers.map(a => ({ text: a.NoiDung || '', correct: a.LaDapAn }))
      : defaultAnswers
  );
  const [explanation, setExplanation] = useState('');
  const [layout, setLayout] = useState(1);
  const [fixedOrder, setFixedOrder] = useState(question?.HoanVi === false);
  const [advanced, setAdvanced] = useState(false);
  const [saveLocation, setSaveLocation] = useState('frame');
  const [frame, setFrame] = useState('');
  const [knowledgeUnit, setKnowledgeUnit] = useState('');
  const [level, setLevel] = useState(question?.CapDo?.toString() || '');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [khoaList, setKhoaList] = useState<Khoa[]>([]);
  const [monHocList, setMonHocList] = useState<MonHoc[]>([]);
  const [phanList, setPhanList] = useState<Phan[]>([]);
  const [cloList, setCloList] = useState<CLO[]>([]);
  const [maKhoa, setMaKhoa] = useState(question?.khoa?.MaKhoa || '');
  const [maMonHoc, setMaMonHoc] = useState(question?.monHoc?.MaMonHoc || '');
  const [maPhan, setMaPhan] = useState(question?.MaPhan || question?.phan?.MaPhan || '');
  const [maCLO, setMaCLO] = useState(question?.MaCLO || question?.clo?.MaCLO || '');
  const [selectedCLOName, setSelectedCLOName] = useState(question?.clo?.TenCLO || '');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { showModal, hideModal } = useModal();
  const previewRef = useRef<HTMLDivElement>(null);
  const [shuffleSpecificAnswers, setShuffleSpecificAnswers] = useState<boolean[]>(
    question?.answers
      ? question.answers.map(a => a.HoanVi ?? true)
      : Array(defaultAnswers.length).fill(true)
  );
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([]);

  // Enhanced effect to populate dropdowns when question props change
  useEffect(() => {
    if (question) {
      // Update form fields based on question data
      setContent(question.NoiDung || '');

      if (question.answers && question.answers.length > 0) {
        setAnswers(question.answers.map(a => ({
          text: a.NoiDung || '',
          correct: a.LaDapAn
        })));
      }

      setLevel(question.CapDo?.toString() || '');
      setFixedOrder(question.HoanVi === false);

      // Handle faculty data
      if (question.khoa?.MaKhoa) {
        setMaKhoa(question.khoa.MaKhoa);

        // Fetch subjects for this faculty
        fetchWithAuth(`${API_BASE_URL}/mon-hoc/khoa/${question.khoa.MaKhoa}`)
          .then(res => res.json())
          .then(data => setMonHocList(data))
          .catch(err => console.error("Error fetching subjects:", err));
      }

      // Handle subject data
      if (question.monHoc?.MaMonHoc) {
        setMaMonHoc(question.monHoc.MaMonHoc);

        // Fetch chapters for this subject
        fetchWithAuth(`${API_BASE_URL}/phan/mon-hoc/${question.monHoc.MaMonHoc}`)
          .then(res => res.json())
          .then(data => setPhanList(data))
          .catch(err => console.error("Error fetching chapters:", err));
      }

      // Handle chapter data
      if (question.phan?.MaPhan || question.MaPhan) {
        setMaPhan(question.phan?.MaPhan || question.MaPhan || '');
      }

      // Handle CLO data
      if (question.clo?.MaCLO || question.MaCLO) {
        setMaCLO(question.clo?.MaCLO || question.MaCLO || '');
        if (question.clo?.TenCLO) {
          setSelectedCLOName(question.clo.TenCLO);
        }
      }
    }
  }, [question]);

  // Fetch CLO list from backend
  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/clo`)
      .then(res => res.json())
      .then(data => setCloList(data))
      .catch(err => console.error("Error fetching CLO list:", err));
  }, []);

  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const maPhanParam = searchParams.get('maPhan');

    if (maPhanParam) {
      setMaPhan(maPhanParam);

      // Fetch chapter info to get monHoc and khoa
      const fetchChapterInfo = async () => {
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/phan/${maPhanParam}`);
          if (response.ok) {
            const chapter = await response.json();
            if (chapter.MaMonHoc) {
              setMaMonHoc(chapter.MaMonHoc);

              // Fetch subject info to get khoa
              const subjectResponse = await fetchWithAuth(`${API_BASE_URL}/mon-hoc/${chapter.MaMonHoc}`);
              if (subjectResponse.ok) {
                const subject = await subjectResponse.json();
                if (subject.MaKhoa) {
                  setMaKhoa(subject.MaKhoa);

                  // Now that we have maKhoa, fetch the monHoc list
                  const monHocResponse = await fetchWithAuth(`${API_BASE_URL}/mon-hoc/khoa/${subject.MaKhoa}`);
                  if (monHocResponse.ok) {
                    setMonHocList(await monHocResponse.json());
                  }
                }
              }

              // Fetch phan list for this monHoc
              const phanResponse = await fetchWithAuth(`${API_BASE_URL}/phan/mon-hoc/${chapter.MaMonHoc}`);
              if (phanResponse.ok) {
                setPhanList(await phanResponse.json());
              }
            }
          }
        } catch (error) {
          console.error("Error fetching chapter info:", error);
        }
      };

      fetchChapterInfo();
    }
  }, [location.search]);

  // Load khoa list always
  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/khoa`)
      .then(res => res.json())
      .then(data => setKhoaList(data))
      .catch(err => console.error("Error loading khoa list:", err));
  }, []);

  // Load monHoc list when khoa changes
  useEffect(() => {
    if (maKhoa) {
      fetchWithAuth(`${API_BASE_URL}/mon-hoc/khoa/${maKhoa}`)
        .then(res => res.json())
        .then(data => setMonHocList(data))
        .catch(err => console.error("Error loading mon hoc list:", err));
    } else {
      // Reset monHoc list when khoa is not selected
      setMonHocList([]);
    }
  }, [maKhoa]);

  // Load phan list when monHoc changes
  useEffect(() => {
    if (maMonHoc) {
      fetchWithAuth(`${API_BASE_URL}/phan/mon-hoc/${maMonHoc}`)
        .then(res => res.json())
        .then(data => setPhanList(data))
        .catch(err => console.error("Error loading phan list:", err));
    } else {
      // Reset phan list when monHoc is not selected
      setPhanList([]);
    }
  }, [maMonHoc]);

  // Update selectedCLOName when maCLO changes
  useEffect(() => {
    if (maCLO) {
      const selectedCLO = cloList.find(clo => clo.MaCLO === maCLO);
      if (selectedCLO) {
        setSelectedCLOName(selectedCLO.TenCLO);
      }
    }
  }, [maCLO, cloList]);

  // Fetch audio files for the question if editing
  useEffect(() => {
    if (question?.MaCauHoi) {
      fetchWithAuth(`${API_BASE_URL}/files/question/${question.MaCauHoi}`)
        .then(res => res.json())
        .then(data => {
          // Get the first audio file if it exists
          const audioFiles = data.filter((file: {LoaiFile: number; TenFile: string}) => file.LoaiFile === 1);
          if (audioFiles.length > 0) {
            // Set the URL for the audio player
            setAudioUrl(`${API_BASE_URL}/${audioFiles[0].TenFile}`);
          }
        })
        .catch(err => console.error("Error fetching audio files:", err));
    }
  }, [question]);

  // Initialize sub questions if editing a group question
  useEffect(() => {
    if (isGroup && question?.MaCauHoi) {
      // Fetch child questions for this group question
      fetchWithAuth(`${API_BASE_URL}/cau-hoi/cau-hoi-cha/${question.MaCauHoi}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.items && Array.isArray(data.items)) {
            // Transform to SubQuestion format
            const fetchedSubQuestions = data.items.map((item: any) => ({
              MaCauHoi: item.MaCauHoi,
              MaSoCauHoi: item.MaSoCauHoi,
              NoiDung: item.NoiDung,
              HoanVi: item.HoanVi,
              SoCauHoiCon: item.SoCauHoiCon,
              MaCauHoiCha: item.MaCauHoiCha,
              CapDo: item.CapDo,
              answers: item.answers || []
            }));
            setSubQuestions(fetchedSubQuestions);
          }
        })
        .catch(err => console.error("Error fetching sub questions:", err));
    } else if (isGroup && !subQuestions.length) {
      // If creating a new group question, add initial sub question
      addSubQuestion();
    }
  }, [isGroup, question?.MaCauHoi]);

  const handleAnswerChange = (idx: number, value: string) => {
    // Kiểm tra nếu nội dung có chứa thẻ <em> hoặc <i> (in nghiêng)
    const hasItalicText = /<(em|i)>.*?<\/(em|i)>/.test(value);

    // Nếu có in nghiêng, tự động đánh dấu đáp án này không hoán vị
    if (hasItalicText && shuffleSpecificAnswers[idx]) {
      setShuffleSpecificAnswers(prev =>
        prev.map((val, i) => i === idx ? false : val)
      );
    }

    setAnswers(ans => ans.map((a, i) => (i === idx ? { ...a, text: value } : a)));
  };
  const handleCorrectChange = (idx: number) => {
    setAnswers(ans => ans.map((a, i) => ({ ...a, correct: i === idx })));
  };
  const handleRemoveAnswer = (idx: number) => {
    if (answers.length <= 2) return;
    setAnswers(prev => prev.filter((_, i) => i !== idx));
    setShuffleSpecificAnswers(prev => prev.filter((_, i) => i !== idx));
  };
  const handleAddAnswer = () => {
    setAnswers(prev => [...prev, { text: '', correct: false }]);
    setShuffleSpecificAnswers(prev => [...prev, true]);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if it's an audio file
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        // Create a preview URL
        const objectUrl = URL.createObjectURL(file);
        setAudioUrl(objectUrl);
      } else {
        setErrorMsg('Please select an audio file (.mp3, .wav, etc.)');
      }
    }
  };

  const handleAudioUpload = async () => {
    if (!audioFile) return;
    if (!question || !question.MaCauHoi) {
      setErrorMsg("Không thể tải lên file audio: Không có câu hỏi!");
      return;
    }

    setUploadingAudio(true);

    try {
      const response = await fileApi.uploadQuestionFile(audioFile, question.MaCauHoi);

      if (response.data) {
        setAudioUrl(response.data.url);
        setMessage("Tải lên file audio thành công!");
      } else {
        throw new Error("Không nhận được phản hồi từ server");
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      setErrorMsg("Tải lên file audio thất bại!");
    } finally {
      setUploadingAudio(false);
    }
  };

  const answerRows = splitAnswers(answers, 1);

  useEffect(() => {
    if (showPreview && window.MathJax) {
      window.MathJax.typesetPromise && window.MathJax.typesetPromise();
    }
  }, [showPreview, content, answers, explanation]);

  useEffect(() => {
    if (window.MathJax && showPreview) {
      setTimeout(() => {
        window.MathJax.typeset && window.MathJax.typeset();
      }, 100);
    }
  }, [content, showPreview, answers]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      // Common validation for all question types
      if (!maKhoa) {
        setErrorMsg('Vui lòng chọn Khoa!');
        setSaving(false);
        return;
      }
      if (!maMonHoc) {
        setErrorMsg('Vui lòng chọn Môn học!');
        setSaving(false);
        return;
      }
      if (!maPhan) {
        setErrorMsg('Vui lòng chọn Phần!');
        setSaving(false);
        return;
      }
      if (!maCLO) {
        setErrorMsg('Vui lòng chọn CLO!');
        setSaving(false);
        return;
      }
      if (!content) {
        setErrorMsg('Vui lòng nhập nội dung câu hỏi!');
        setSaving(false);
        return;
      }

      if (isGroup) {
        // Group question validation
        if (subQuestions.length === 0) {
          setErrorMsg('Câu hỏi nhóm phải có ít nhất 1 câu hỏi con!');
          setSaving(false);
          return;
        }

        // Validate each sub-question
        for (let i = 0; i < subQuestions.length; i++) {
          const subQ = subQuestions[i];
          if (!subQ.NoiDung) {
            setErrorMsg(`Câu hỏi con #${i + 1} không được để trống!`);
            setSaving(false);
            return;
          }
          if (subQ.answers.length === 0) {
            setErrorMsg(`Câu hỏi con #${i + 1} phải có ít nhất 1 đáp án!`);
            setSaving(false);
            return;
          }
          if (!subQ.answers.some(a => a.LaDapAn)) {
            setErrorMsg(`Câu hỏi con #${i + 1} phải có ít nhất 1 đáp án đúng!`);
            setSaving(false);
            return;
          }
        }

        // Create or update group question
        if (question && question.MaCauHoi) {
          // Update existing group question
          const parentQuestion = {
            MaCauHoi: question.MaCauHoi,
            NoiDung: content,
            MaPhan: maPhan,
            MaCLO: maCLO,
            CapDo: parseInt(level) || 1,
            HoanVi: !fixedOrder,
            SoCauHoiCon: subQuestions.length,
          };

          try {
            // Update parent question
            const parentRes = await cauHoiApi.update(question.MaCauHoi, parentQuestion);
            if (!parentRes.data) {
              throw new Error('Lưu câu hỏi nhóm thất bại!');
            }

            // Update each sub-question
            for (const subQ of subQuestions) {
              const isNew = subQ.MaCauHoi.startsWith('temp-');

              const subQuestionData = {
                question: {
                  ...(isNew ? {} : { MaCauHoi: subQ.MaCauHoi }),
                  NoiDung: subQ.NoiDung,
                  MaPhan: maPhan,
                  MaCLO: maCLO,
                  CapDo: parseInt(level) || 1,
                  HoanVi: subQ.HoanVi,
                  SoCauHoiCon: 0,
                  MaCauHoiCha: question.MaCauHoi,
                  XoaTamCauHoi: false,
                },
                answers: subQ.answers.map((a, idx) => ({
                  ...(isNew ? {} : { MaCauTraLoi: a.MaCauTraLoi }),
                  NoiDung: a.NoiDung,
                  ThuTu: idx + 1,
                  LaDapAn: a.LaDapAn,
                  HoanVi: a.HoanVi
                }))
              };

              if (isNew) {
                const subRes = await cauHoiApi.createWithAnswers(subQuestionData);
                if (!subRes.data) {
                  throw new Error(`Lưu câu hỏi con ${subQ.MaSoCauHoi} thất bại!`);
                }
              } else {
                const subRes = await cauHoiApi.updateWithAnswers(subQ.MaCauHoi, subQuestionData);
                if (!subRes.data) {
                  throw new Error(`Lưu câu hỏi con ${subQ.MaSoCauHoi} thất bại!`);
                }
              }
            }

            setMessage('Lưu câu hỏi nhóm thành công!');
            setTimeout(() => navigate('/questions'), 1200);
          } catch (error) {
            console.error("Error updating group question:", error);
            setErrorMsg(error instanceof Error ? error.message : 'Lưu câu hỏi nhóm thất bại!');
            setSaving(false);
          }
        } else {
          // Create new group question
          try {
            // First, create the parent question
            const parentQuestion = {
              MaPhan: maPhan,
              MaSoCauHoi: Math.floor(Math.random() * 9000) + 1000,
              NoiDung: content,
              HoanVi: !fixedOrder,
              CapDo: parseInt(level) || 1,
              SoCauHoiCon: subQuestions.length,
              MaCLO: maCLO,
              XoaTamCauHoi: false,
              SoLanDuocThi: 0,
              SoLanDung: 0
            };

            const parentRes = await cauHoiApi.create(parentQuestion);
            if (!parentRes.data) {
              throw new Error('Tạo câu hỏi nhóm thất bại!');
            }

            const parentData = parentRes.data;
            const parentId = parentData.MaCauHoi;

            // Then create each sub-question
            for (const subQ of subQuestions) {
              const subQuestionData = {
                question: {
                  NoiDung: subQ.NoiDung,
                  MaPhan: maPhan,
                  MaCLO: maCLO,
                  CapDo: parseInt(level) || 1,
                  HoanVi: subQ.HoanVi,
                  SoCauHoiCon: 0,
                  MaCauHoiCha: parentId,
                  XoaTamCauHoi: false,
                },
                answers: subQ.answers.map((a, idx) => ({
                  NoiDung: a.NoiDung,
                  ThuTu: idx + 1,
                  LaDapAn: a.LaDapAn,
                  HoanVi: a.HoanVi
                }))
              };

              const subRes = await cauHoiApi.createWithAnswers(subQuestionData);
              if (!subRes.data) {
                throw new Error(`Tạo câu hỏi con ${subQ.MaSoCauHoi} thất bại!`);
              }
            }

            setMessage('Tạo câu hỏi nhóm thành công!');
            setTimeout(() => navigate('/questions'), 1200);
          } catch (error) {
            console.error("Error creating group question:", error);
            setErrorMsg(error instanceof Error ? error.message : 'Tạo câu hỏi nhóm thất bại!');
            setSaving(false);
            return;
          }
        }
      } else {
        // Regular question handling (single choice, etc.)
        // Validate answers
        if (!answers.some(a => a.correct)) {
          setErrorMsg('Phải có ít nhất 1 đáp án đúng!');
          setSaving(false);
          return;
        }

        // Format the question data
        const payload = {
          question: {
            ...(question && question.MaCauHoi ? { MaCauHoi: question.MaCauHoi } : {}),
            NoiDung: content,
            MaPhan: maPhan,
            MaCLO: maCLO,
            CapDo: parseInt(level) || 1,
            HoanVi: !fixedOrder,
            MaCauHoiCha: parentId || null
          },
          answers: answers.map((answer, idx) => ({
            ...(question && question.answers && question.answers[idx] ?
              { MaCauTraLoi: question.answers[idx].MaCauTraLoi } : {}),
            NoiDung: answer.text,
            ThuTu: idx + 1,
            LaDapAn: answer.correct,
            HoanVi: !shuffleSpecificAnswers[idx]
          }))
        };

        try {
          let response;

          if (question && question.MaCauHoi) {
            // Update existing question
            response = await cauHoiApi.updateWithAnswers(question.MaCauHoi, payload);
          } else {
            // Create new question
            response = await cauHoiApi.createWithAnswers(payload);
          }

          if (!response.data) {
            throw new Error('Lưu câu hỏi thất bại!');
          }

          setMessage(`Câu hỏi đã được ${question && question.MaCauHoi ? 'cập nhật' : 'tạo'} thành công!`);

          // Redirect after successful save
          setTimeout(() => {
            if (parentId) {
              navigate(`/questions/edit/${parentId}`);
            } else {
              navigate('/questions');
            }
          }, 1200);
        } catch (error) {
          console.error("Error saving question:", error);
          setErrorMsg(error instanceof Error ? error.message : 'Lưu câu hỏi thất bại!');
        }
      }
    } catch (error) {
      console.error("Error in handleSave:", error);
      setErrorMsg(error instanceof Error ? error.message : 'Đã xảy ra lỗi!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAdd = async () => {
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      if (question) {
        // Update existing question
        const mappedAnswers = answers.map((a, idx) => ({
          MaCauTraLoi: question.answers?.[idx]?.MaCauTraLoi || undefined,
          MaCauHoi: question.MaCauHoi,
          NoiDung: a.text,
          ThuTu: idx + 1,
          LaDapAn: a.correct,
          HoanVi: shuffleSpecificAnswers[idx]
        }));

        // Create a copy of the question without the answers property
        const { answers: _, ...questionWithoutAnswers } = question;

        const payload = {
          question: {
            ...questionWithoutAnswers,
            NoiDung: content,
            MaPhan: maPhan,
            MaCLO: maCLO,
            HoanVi: !fixedOrder,
            CapDo: parseInt(level) || 1
          },
          answers: mappedAnswers
        };

        const res = await fetchWithAuth(`${API_BASE_URL}/cau-hoi/${question.MaCauHoi}/with-answers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error('Lưu thất bại!');
        }
        setMessage('Lưu thành công!');
      } else {
        // Validate các trường bắt buộc
        if (!maKhoa) {
          setErrorMsg('Vui lòng chọn Khoa!');
          setSaving(false);
          return;
        }
        if (!maMonHoc) {
          setErrorMsg('Vui lòng chọn Môn học!');
          setSaving(false);
          return;
        }
        if (!maPhan) {
          setErrorMsg('Vui lòng chọn Phần!');
          setSaving(false);
          return;
        }
        if (!maCLO) {
          setErrorMsg('Vui lòng chọn CLO!');
          setSaving(false);
          return;
        }
        if (!content) {
          setErrorMsg('Vui lòng nhập nội dung câu hỏi!');
          setSaving(false);
          return;
        }
        if (!answers.some(a => a.correct)) {
          setErrorMsg('Vui lòng chọn ít nhất một đáp án đúng!');
          setSaving(false);
          return;
        }

        // Create the question object first
        const questionData = {
          MaPhan: maPhan,
          MaSoCauHoi: Math.floor(Math.random() * 9000) + 1000, // Generate a random question number
          NoiDung: content,
          HoanVi: !fixedOrder,
          CapDo: parseInt(level) || 1,
          SoCauHoiCon: 0,
          MaCLO: maCLO,
          XoaTamCauHoi: false, // Explicitly set to false
          SoLanDuocThi: 0,     // Explicitly set to 0
          SoLanDung: 0         // Explicitly set to 0
        };

        // For the answers, we don't need to include MaCauHoi
        const mappedAnswers = answers.map((a, idx) => ({
          NoiDung: a.text,
          ThuTu: idx + 1,
          LaDapAn: a.correct,
          HoanVi: shuffleSpecificAnswers[idx]
        }));

        const payload = {
          question: questionData,
          answers: mappedAnswers
        };

        console.log("Sending payload:", JSON.stringify(payload, null, 2));

        const res = await fetchWithAuth(`${API_BASE_URL}/cau-hoi/with-answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("API error response:", errorData);
          throw new Error('Tạo câu hỏi thất bại!');
        }

        setMessage('Tạo câu hỏi thành công!');

        // Reset form for adding another question
        setContent('');
        setAnswers(defaultAnswers);
        setExplanation('');
        setFixedOrder(false);
        setAdvanced(false);
      }
    } catch (err) {
      console.error("Error saving question:", err);
      setErrorMsg(err instanceof Error ? err.message : 'Lưu thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const handleShowMathModal = () => {
    showModal(
      <MathModal
        onClose={hideModal}
        onInsert={(latex) => {
          setContent(prev => prev + ' ' + latex + ' ');
        }}
      />
    );
  };

  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
    // Force MathJax to process the content when showing preview
    if (!showPreview && window.MathJax) {
      setTimeout(() => {
        if (previewRef.current) {
          window.MathJax.typeset([previewRef.current]);
        }
      }, 100);
    }
  };

  const handleToggleSpecificShuffle = (idx: number) => {
    setShuffleSpecificAnswers(prev =>
      prev.map((value, i) => i === idx ? !value : value)
    );
  };

  // Function to render LaTeX in preview
  const renderLatex = (text: string) => {
    if (!text) return '';
    return text;
  };

  // For group questions - add/remove/update sub questions
  const addSubQuestion = () => {
    const newSubQuestion: SubQuestion = {
      MaCauHoi: `temp-${Date.now()}`,
      MaSoCauHoi: subQuestions.length + 1,
      NoiDung: "",
      HoanVi: false,
      SoCauHoiCon: 0,
      MaCauHoiCha: question?.MaCauHoi || null,
      answers: [
        {
          MaCauTraLoi: `temp-answer-${Date.now()}-1`,
          MaCauHoi: `temp-${Date.now()}`,
          NoiDung: "",
          ThuTu: 1,
          LaDapAn: true,
          HoanVi: false,
        },
        {
          MaCauTraLoi: `temp-answer-${Date.now()}-2`,
          MaCauHoi: `temp-${Date.now()}`,
          NoiDung: "",
          ThuTu: 2,
          LaDapAn: false,
          HoanVi: false,
        },
      ],
    };

    setSubQuestions(prev => [...prev, newSubQuestion]);
  };

  const removeSubQuestion = (index: number) => {
    setSubQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubQuestion = (index: number, field: string, value: any) => {
    setSubQuestions(prev => prev.map((subQ, i) =>
      i === index ? { ...subQ, [field]: value } : subQ
    ));
  };

  const addAnswerToSubQuestion = (subQuestionIndex: number) => {
    const subQuestion = subQuestions[subQuestionIndex];
    const newAnswer: Answer = {
      MaCauTraLoi: `temp-answer-${Date.now()}`,
      MaCauHoi: subQuestion.MaCauHoi,
      NoiDung: "",
      ThuTu: subQuestion.answers.length + 1,
      LaDapAn: false,
      HoanVi: false,
    };

    setSubQuestions(prev => prev.map((subQ, i) =>
      i === subQuestionIndex ? { ...subQ, answers: [...subQ.answers, newAnswer] } : subQ
    ));
  };

  const removeAnswerFromSubQuestion = (subQuestionIndex: number, answerIndex: number) => {
    setSubQuestions(prev => prev.map((subQ, i) =>
      i === subQuestionIndex
        ? { ...subQ, answers: subQ.answers.filter((_, j) => j !== answerIndex) }
        : subQ
    ));
  };

  const updateSubQuestionAnswer = (subQuestionIndex: number, answerIndex: number, field: string, value: any) => {
    setSubQuestions(prev => prev.map((subQ, i) =>
      i === subQuestionIndex
        ? {
            ...subQ,
            answers: subQ.answers.map((ans, j) =>
              j === answerIndex ? { ...ans, [field]: value } : ans
            )
          }
        : subQ
    ));
  };

  const setSubQuestionCorrectAnswer = (subQuestionIndex: number, answerIndex: number) => {
    setSubQuestions(prev => prev.map((subQ, i) =>
      i === subQuestionIndex
        ? {
            ...subQ,
            answers: subQ.answers.map((ans, j) =>
              ({ ...ans, LaDapAn: j === answerIndex })
            )
          }
        : subQ
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-full mx-auto min-h-screen py-8 bg-gradient-to-br from-blue-50 to-white text-[15px]">
      {/* Left: Main form */}
      <div className="lg:col-span-8 p-4">
        <div className="rounded-xl p-6 bg-white shadow-md border border-blue-100 mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-blue-100">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-blue-800">
              {isGroup ? 'Câu hỏi nhóm' : 'Câu hỏi trắc nghiệm 1 đáp án'}
            </h2>
          </div>

          {/* Content Area */}
          <div className="mb-6">
            <label className="font-semibold mb-2 flex items-center gap-2 text-gray-800 text-sm">
              <span className="text-blue-600">Câu hỏi</span>
              <Info className="w-4 h-4 text-blue-400" />
            </label>
            <div className="rounded-xl border border-blue-200 bg-white p-1.5 shadow-sm">
              <EditorAny
                apiKey={TINYMCE_API_KEY}
                value={content}
                onEditorChange={setContent}
                init={createTinyMCEConfig(120, false)}
              />
            </div>
          </div>

          {/* Answers Section */}
          {isGroup ? (
            // Group Questions UI
            <div className="space-y-4">
              {subQuestions.map((subQuestion, subIdx) => (
                <div key={subQuestion.MaCauHoi} className="border border-blue-200 rounded-xl p-4 bg-blue-50/30 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {subIdx + 1}
                      </div>
                      <h3 className="font-medium text-blue-800">Câu hỏi con #{subIdx + 1}</h3>
                    </div>

                    <button
                      onClick={() => removeSubQuestion(subIdx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung câu hỏi con</label>
                    <div className="rounded-lg border border-blue-200 bg-white p-1.5 shadow-sm">
                      <EditorAny
                        apiKey={TINYMCE_API_KEY}
                        value={subQuestion.NoiDung}
                        onEditorChange={(content: string) => updateSubQuestion(subIdx, 'NoiDung', content)}
                        init={createTinyMCEConfig(80, true)}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Đáp án</label>
                      <button
                        onClick={() => addAnswerToSubQuestion(subIdx)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        <Plus className="w-3 h-3" /> Thêm đáp án
                      </button>
                    </div>

                    <div className="space-y-2">
                      {subQuestion.answers.map((answer, ansIdx) => (
                        <div key={`${subQuestion.MaCauHoi}-ans-${ansIdx}`} className={`flex items-center gap-2 p-2 rounded-lg border ${answer.LaDapAn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center justify-center">
                            <input
                              type="radio"
                              name={`ans-correct-${subQuestion.MaCauHoi}`}
                              checked={answer.LaDapAn}
                              onChange={() => setSubQuestionCorrectAnswer(subIdx, ansIdx)}
                              className="w-4 h-4 accent-green-600"
                            />
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              value={answer.NoiDung}
                              onChange={(e) => updateSubQuestionAnswer(subIdx, ansIdx, 'NoiDung', e.target.value)}
                              className={`w-full border-0 focus:ring-0 ${answer.LaDapAn ? 'bg-green-50' : 'bg-white'}`}
                              placeholder={`Đáp án ${String.fromCharCode(65 + ansIdx)}`}
                            />
                          </div>

                          {subQuestion.answers.length > 2 && (
                            <button
                              onClick={() => removeAnswerFromSubQuestion(subIdx, ansIdx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      id={`hoanvi-${subQuestion.MaCauHoi}`}
                      checked={subQuestion.HoanVi}
                      onChange={(e) => updateSubQuestion(subIdx, 'HoanVi', e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <label htmlFor={`hoanvi-${subQuestion.MaCauHoi}`} className="text-gray-600">
                      Hoán vị đáp án
                    </label>
                  </div>
                </div>
              ))}

              <button
                onClick={addSubQuestion}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-blue-300 rounded-xl p-3 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm câu hỏi con
              </button>
            </div>
          ) : (
            // Single Choice Question UI
            <div className="mb-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-blue-800">Các đáp án</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAnswer}
                  className="text-blue-700 flex items-center gap-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 font-semibold text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Thêm đáp án
                </Button>
              </div>

              {answers.map((a, idx) => (
                <div
                  key={idx}
                  className={cx(
                    "group transition-all duration-200 rounded-xl border bg-white shadow-sm p-4 flex gap-3 items-start hover:shadow-md",
                    a.correct ? "border-green-300 bg-green-50/30" : "border-gray-200 hover:border-blue-300"
                  )}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {String.fromCharCode(65 + idx)}
                  </div>

                  <div className="flex-1">
                    <ReactQuill
                      theme="snow"
                      value={a.text}
                      onChange={value => handleAnswerChange(idx, value)}
                      style={{
                        minHeight: 80,
                        maxHeight: 120,
                        overflowY: 'auto',
                        backgroundColor: a.correct ? '#f0fdf4' : '#ffffff',
                        borderRadius: 8,
                        fontSize: 14,
                        border: a.correct ? '1px solid #86efac' : '1px solid #e5e7eb'
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-1">
                    <div className="flex items-center justify-center">
                      <input
                        type="radio"
                        name="correct"
                        checked={a.correct}
                        onChange={() => handleCorrectChange(idx)}
                        className="sr-only"
                        id={`answer-${idx}`}
                      />
                      <label
                        htmlFor={`answer-${idx}`}
                        className={cx(
                          "w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all",
                          a.correct
                            ? "bg-green-500 text-white border-2 border-green-600"
                            : "bg-gray-100 text-gray-400 border-2 border-gray-300 hover:bg-gray-200"
                        )}
                      >
                        {a.correct ? <CheckCircle className="w-5 h-5" /> : null}
                      </label>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAnswer(idx)}
                      disabled={answers.length <= 2}
                      className={cx(
                        "rounded-full w-8 h-8 p-0 flex items-center justify-center",
                        answers.length <= 2
                          ? "text-gray-300 border-gray-200"
                          : "text-red-400 hover:text-red-600 hover:bg-red-50 border-red-200"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="lg:col-span-4 p-4">
        <div className="bg-white rounded-xl shadow-md h-fit text-left border border-blue-100 sticky top-6 overflow-hidden">
          {/* Action buttons */}
          <div className="p-4 grid grid-cols-2 gap-3 bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
            <Button
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 font-semibold text-sm shadow-md flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>

            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 font-semibold text-sm shadow-md"
              onClick={handleSaveAndAdd}
              disabled={saving}
            >
              Lưu & Thêm
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-lg px-3 py-2 font-semibold text-sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4" /> Xem trước
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-lg px-3 py-2 font-semibold text-sm"
              onClick={() => navigate('/questions')}
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
          </div>

          {/* Notification */}
          {message && (
            <div className="bg-green-50 p-3 border-b border-green-100 flex items-center gap-2 text-green-700 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" /> {message}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2 text-red-700 font-semibold text-sm">
              <X className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          {/* Layout options - only for single choice questions */}
          {!isGroup && (
            <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <label className="block font-bold mb-2 text-gray-800 text-sm">Bố cục đáp án <span className="text-red-500">*</span></label>
              <div className="relative mb-3">
                <select
                  className="w-full border rounded-lg p-2 pr-8 bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-gray-800 text-sm font-semibold appearance-none h-10"
                  value={layout}
                  onChange={e => setLayout(Number(e.target.value))}
                >
                  {layoutOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1 bg-blue-50 p-2 rounded-lg">
                <input
                  type="checkbox"
                  id="fixedOrder"
                  checked={fixedOrder}
                  onChange={e => setFixedOrder(e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                <label htmlFor="fixedOrder" className="text-gray-700 text-sm cursor-pointer">Cố định thứ tự đáp án</label>
              </div>
            </div>
          )}

          {/* Thông tin câu hỏi */}
          <div className="p-4">
            <div className="font-bold mb-3 text-left text-blue-800 text-sm flex items-center gap-2">
              <span className="bg-blue-100 p-1 rounded">
                <Info className="w-4 h-4 text-blue-600" />
              </span>
              Thông tin câu hỏi
            </div>

            {/* Always show dropdown menus for all questions */}
            <div className="space-y-3">
                <div>
                  <label className=" text-sm mb-1 text-left text-gray-700 font-medium flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-blue-500" /> Khoa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative bg-blue-50 rounded-lg p-3">
                    <select
                      value={maKhoa}
                      onChange={e => {
                        setMaKhoa(e.target.value);
                        // Reset dependent fields when changing khoa
                        setMaMonHoc('');
                        setMaPhan('');
                      }}
                      className="w-full appearance-none rounded-lg border border-blue-200 p-2 pl-3 pr-10 text-sm h-10 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white cursor-pointer"
                    >
                      <option value="" disabled>Chọn khoa</option>
                      {khoaList.map(khoa => (
                        <option key={khoa.MaKhoa} value={khoa.MaKhoa}>{khoa.TenKhoa}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label className=" text-sm mb-1 text-left text-gray-700 font-medium flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-green-500" /> Môn học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative bg-green-50 rounded-lg p-3">
                    <select
                      value={maMonHoc}
                      onChange={e => {
                        setMaMonHoc(e.target.value);
                        // Reset dependent field when changing monHoc
                        setMaPhan('');
                      }}
                      className="w-full appearance-none rounded-lg border border-green-200 p-2 pl-3 pr-10 text-sm h-10 focus:border-green-400 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white cursor-pointer"
                      disabled={!maKhoa}
                    >
                      <option value="" disabled>Chọn môn học</option>
                      {monHocList.map(mon => (
                        <option key={mon.MaMonHoc} value={mon.MaMonHoc}>{mon.TenMonHoc}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label className=" text-sm mb-1 text-left text-gray-700 font-medium flex items-center gap-1">
                    <Layers className="w-4 h-4 text-yellow-600" /> Phần <span className="text-red-500">*</span>
                  </label>
                  <div className="relative bg-yellow-50 rounded-lg p-3">
                    <select
                      value={maPhan}
                      onChange={e => setMaPhan(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-yellow-200 p-2 pl-3 pr-10 text-sm h-10 focus:border-yellow-400 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 bg-white cursor-pointer"
                      disabled={!maMonHoc}
                    >
                      <option value="" disabled>Chọn phần</option>
                      {phanList.map(phan => (
                        <option key={phan.MaPhan} value={phan.MaPhan}>{phan.TenPhan}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label className=" text-sm mb-1 text-left text-gray-700 font-medium flex items-center gap-1">
                    <Target className="w-4 h-4 text-purple-500" /> CLO <span className="text-red-500">*</span>
                  </label>
                  <div className="relative bg-purple-50 rounded-lg p-3">
                    <select
                      value={maCLO}
                      onChange={e => setMaCLO(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-purple-200 p-2 pl-3 pr-10 text-sm h-10 focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white cursor-pointer"
                    >
                      <option value="" disabled>Chọn CLO</option>
                      {cloList.map(clo => (
                        <option key={clo.MaCLO} value={clo.MaCLO}>{clo.TenCLO}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>

              </div>
            </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 relative border border-blue-100 animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowPreview(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-blue-700">Xem trước câu hỏi</h3>
            </div>

            {isGroup ? (
              // Group question preview
              <div>
                <div className="mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="font-medium mb-4 text-left" dangerouslySetInnerHTML={{ __html: content }} />
                </div>

                <div className="space-y-4">
                  {subQuestions.map((subQ, idx) => (
                    <div key={subQ.MaCauHoi} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <h4 className="font-medium text-gray-900">Câu hỏi {idx + 1}</h4>
                      </div>

                      <div className="mb-3" dangerouslySetInnerHTML={{ __html: subQ.NoiDung }} />

                      <div className="space-y-2">
                        {subQ.answers.map((ans, ansIdx) => (
                          <div
                            key={ans.MaCauTraLoi}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${ans.LaDapAn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                          >
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full ${ans.LaDapAn ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-gray-100 border border-gray-300 text-gray-700'}`}>
                              {String.fromCharCode(65 + ansIdx)}
                            </div>
                            <div className="flex-1" dangerouslySetInnerHTML={{ __html: ans.NoiDung }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Single choice question preview
              <div>
                <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="font-medium mb-4 text-left" dangerouslySetInnerHTML={{ __html: content || '<span class=\"italic text-gray-400\">[Chưa nhập nội dung câu hỏi]</span>' }} />

                  <div className="space-y-3">
                    {splitAnswers(answers, layout).map((row, rowIdx) => (
                      <div key={rowIdx} className="flex flex-wrap gap-4 mb-2">
                        {row.map((a: { text: string; correct: boolean }, idx: number) => {
                          const answerIdx = rowIdx * layout + idx;
                          return (
                            <div key={answerIdx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex-1 min-w-[200px]">
                              <span className={cx(
                                'inline-flex items-center justify-center w-8 h-8 rounded-full border font-semibold',
                                a.correct ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700'
                              )}>
                                {String.fromCharCode(65 + answerIdx)}
                              </span>
                              <span className={cx('flex-1', a.text ? '' : 'italic text-gray-400')} dangerouslySetInnerHTML={{ __html: a.text || '[Chưa nhập đáp án]' }} />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SingleChoiceQuestion;
