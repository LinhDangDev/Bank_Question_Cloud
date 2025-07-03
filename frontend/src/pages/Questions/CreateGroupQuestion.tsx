import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { questionService } from '@/services/questionService';
import { phanService } from '@/services/phanService';
import { cloService } from '@/services/cloService';
import { useToast } from '@/components/ui/toast';

interface Answer {
  NoiDung: string;
  LaDapAn: boolean;
  ThuTu: number;
  HoanVi: boolean;
}

interface ChildQuestionData {
  NoiDung: string;
  HoanVi: boolean;
  CapDo: number;
  MaCLO?: string;
  answers: Answer[];
}

interface GroupQuestionData {
  parentQuestion: {
    MaPhan: string;
    NoiDung: string;
    HoanVi: boolean;
    CapDo: number;
    MaCLO?: string;
  };
  childQuestions: ChildQuestionData[];
}

interface Phan {
  MaPhan: string;
  TenPhan: string;
  MaMonHoc: string;
}

interface CLO {
  MaCLO: string;
  TenCLO: string;
}

interface FormattedChildQuestion {
  question: {
    NoiDung: string;
    HoanVi: boolean;
    CapDo: number;
    MaCLO?: string;
    MaPhan: string;
    MaSoCauHoi: number;
    SoCauHoiCon: number;
    DoPhanCachCauHoi: null;
    XoaTamCauHoi: boolean;
    SoLanDuocThi: number;
    SoLanDung: number;
  };
  answers: Answer[];
}

const CreateGroupQuestion: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phans, setPhans] = useState<Phan[]>([]);
  const [clos, setClos] = useState<CLO[]>([]);

  // Parent question state
  const [parentQuestion, setParentQuestion] = useState({
    MaPhan: '',
    NoiDung: '',
    HoanVi: true,
    CapDo: 1,
    MaCLO: ''
  });

  const [childQuestions, setChildQuestions] = useState<ChildQuestionData[]>([
    {
      NoiDung: '',
      HoanVi: true,
      CapDo: 1,
      answers: [
        { NoiDung: '', LaDapAn: true, ThuTu: 1, HoanVi: true },
        { NoiDung: '', LaDapAn: false, ThuTu: 2, HoanVi: true }
      ]
    }
  ]);

  useEffect(() => {
    fetchPhans();
    fetchCLOs();
  }, []);

  const fetchPhans = async () => {
    try {
      const response = await phanService.getAllPhans();
      setPhans(response.data || []);
    } catch (error) {
      console.error('Error fetching phans:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phần",
        variant: "destructive"
      });
    }
  };

  const fetchCLOs = async () => {
    try {
      const response = await cloService.getAllCLOs();
      setClos(response.data || []);
    } catch (error) {
      console.error('Error fetching CLOs:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách CLO",
        variant: "destructive"
      });
    }
  };

  const addChildQuestion = () => {
    setChildQuestions([
      ...childQuestions,
      {
        NoiDung: '',
        HoanVi: true,
        CapDo: 1,
        answers: [
          { NoiDung: '', LaDapAn: true, ThuTu: 1, HoanVi: true },
          { NoiDung: '', LaDapAn: false, ThuTu: 2, HoanVi: true }
        ]
      }
    ]);
  };

  const removeChildQuestion = (index: number) => {
    if (childQuestions.length > 1) {
      const newChildQuestions = childQuestions.filter((_, i) => i !== index);
      setChildQuestions(newChildQuestions);
    }
  };

  const updateChildQuestion = (index: number, field: keyof ChildQuestionData, value: any) => {
    const newChildQuestions = [...childQuestions];
    newChildQuestions[index] = { ...newChildQuestions[index], [field]: value };
    setChildQuestions(newChildQuestions);
  };

  const addAnswer = (questionIndex: number) => {
    const newChildQuestions = [...childQuestions];
    const currentAnswers = newChildQuestions[questionIndex].answers;
    newChildQuestions[questionIndex].answers = [
      ...currentAnswers,
      {
        NoiDung: '',
        LaDapAn: false,
        ThuTu: currentAnswers.length + 1,
        HoanVi: true
      }
    ];
    setChildQuestions(newChildQuestions);
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const newChildQuestions = [...childQuestions];
    if (newChildQuestions[questionIndex].answers.length > 2) {
      newChildQuestions[questionIndex].answers = newChildQuestions[questionIndex].answers
        .filter((_, i) => i !== answerIndex)
        .map((answer, i) => ({ ...answer, ThuTu: i + 1 }));
      setChildQuestions(newChildQuestions);
    }
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: keyof Answer, value: any) => {
    const newChildQuestions = [...childQuestions];
    newChildQuestions[questionIndex].answers[answerIndex] = {
      ...newChildQuestions[questionIndex].answers[answerIndex],
      [field]: value
    };

    if (field === 'LaDapAn' && value === true) {
      newChildQuestions[questionIndex].answers.forEach((answer, i) => {
        if (i !== answerIndex) {
          answer.LaDapAn = false;
        }
      });
    }

    setChildQuestions(newChildQuestions);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!parentQuestion.MaPhan || !parentQuestion.NoiDung.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin câu hỏi cha",
        variant: "destructive"
      });
      return;
    }

    // Validate child questions
    if (childQuestions.length === 0) {
      toast({
        title: "Lỗi",
        description: "Cần ít nhất một câu hỏi con",
        variant: "destructive"
      });
      return;
    }

    for (let i = 0; i < childQuestions.length; i++) {
      const child = childQuestions[i];
      if (!child.NoiDung.trim()) {
        toast({
          title: "Lỗi",
          description: `Vui lòng điền nội dung cho câu hỏi con ${i + 1}`,
          variant: "destructive"
        });
        return;
      }

      const validAnswers = child.answers.filter(answer => answer.NoiDung.trim() !== '');
      if (validAnswers.length < 2) {
        toast({
          title: "Lỗi",
          description: `Câu hỏi con ${i + 1} cần ít nhất 2 câu trả lời`,
          variant: "destructive"
        });
        return;
      }

      const correctAnswers = validAnswers.filter(answer => answer.LaDapAn);
      if (correctAnswers.length === 0) {
        toast({
          title: "Lỗi",
          description: `Câu hỏi con ${i + 1} cần có ít nhất 1 đáp án đúng`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Chuẩn bị dữ liệu câu hỏi con
      const formattedChildQuestions = childQuestions.map((child, index) => {
        return {
          question: {
            MaPhan: parentQuestion.MaPhan,
            NoiDung: child.NoiDung,
            HoanVi: Boolean(child.HoanVi),
            CapDo: Number(child.CapDo || 1),
            SoCauHoiCon: 0,
            MaCLO: child.MaCLO || parentQuestion.MaCLO,
          },
          answers: child.answers
            .filter(answer => answer.NoiDung.trim() !== '')
            .map((answer, ansIndex) => ({
              NoiDung: answer.NoiDung,
              ThuTu: ansIndex + 1,
              LaDapAn: Boolean(answer.LaDapAn),
              HoanVi: Boolean(answer.HoanVi !== undefined ? answer.HoanVi : true)
            }))
        };
      });

      // Chuẩn bị dữ liệu câu hỏi cha
      const groupQuestionData = {
        parentQuestion: {
          MaPhan: parentQuestion.MaPhan,
          NoiDung: parentQuestion.NoiDung,
          HoanVi: Boolean(parentQuestion.HoanVi !== undefined ? parentQuestion.HoanVi : true),
          CapDo: Number(parentQuestion.CapDo || 1),
          SoCauHoiCon: formattedChildQuestions.length,
          MaCLO: parentQuestion.MaCLO,
        },
        childQuestions: formattedChildQuestions
      };

      console.log('Dữ liệu thô câu hỏi nhóm trước khi kiểm tra:', JSON.stringify(groupQuestionData, null, 2));

      // Sử dụng questionService để kiểm tra và chuẩn hóa dữ liệu
      const checkedData = questionService.checkCreateGroupQuestion(groupQuestionData);

      console.log('Dữ liệu câu hỏi nhóm sau khi kiểm tra:', JSON.stringify(checkedData, null, 2));

      // Gửi dữ liệu đã kiểm tra tới server
      const response = await questionService.createGroupQuestion(checkedData);

      toast({
        title: "Thành công",
        description: "Tạo câu hỏi nhóm thành công!",
        variant: "default"
      });
      navigate('/questions');

    } catch (error: any) {
      console.error('Lỗi khi tạo câu hỏi nhóm:', error);

      // Hiển thị thông báo lỗi chi tiết
      let errorMessage = "Có lỗi xảy ra khi tạo câu hỏi nhóm";

      if (error.response) {
        // Hiển thị chi tiết lỗi từ response nếu có
        if (error.response.data && error.response.data.message) {
          if (Array.isArray(error.response.data.message)) {
            errorMessage = error.response.data.message.join(', ');
          } else {
            errorMessage = error.response.data.message;
          }
        }

        // Log thêm thông tin để debug
        console.error('Chi tiết lỗi:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/questions')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">
          Tạo Câu Hỏi Nhóm
        </h1>
      </div>

      <div className="space-y-6">
        {/* Parent Question Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Câu Hỏi Cha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phan">Phần *</Label>
                <Select
                  value={parentQuestion.MaPhan}
                  onValueChange={(value) => setParentQuestion({...parentQuestion, MaPhan: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phần" />
                  </SelectTrigger>
                  <SelectContent>
                    {phans.map(phan => (
                      <SelectItem key={phan.MaPhan} value={phan.MaPhan}>
                        {phan.TenPhan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clo">CLO</Label>
                <Select
                  value={parentQuestion.MaCLO}
                  onValueChange={(value) => setParentQuestion({...parentQuestion, MaCLO: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn CLO (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clos.map(clo => (
                      <SelectItem key={clo.MaCLO} value={clo.MaCLO}>
                        {clo.TenCLO}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentContent">Nội dung câu hỏi cha *</Label>
              <Textarea
                id="parentContent"
                value={parentQuestion.NoiDung}
                onChange={(e) => setParentQuestion({...parentQuestion, NoiDung: e.target.value})}
                placeholder="Nhập nội dung câu hỏi cha..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capDo">Cấp độ</Label>
                <Input
                  id="capDo"
                  type="number"
                  min="1"
                  max="5"
                  value={parentQuestion.CapDo}
                  onChange={(e) => setParentQuestion({...parentQuestion, CapDo: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="hoanVi"
                  checked={parentQuestion.HoanVi}
                  onCheckedChange={(checked) => setParentQuestion({...parentQuestion, HoanVi: checked})}
                />
                <Label htmlFor="hoanVi">Hoán vị</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Child Questions Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Câu Hỏi Con ({childQuestions.length})</CardTitle>
              <Button
                variant="outline"
                onClick={addChildQuestion}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm câu hỏi con
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {childQuestions.map((childQuestion, questionIndex) => (
              <Card key={questionIndex} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Câu hỏi con {questionIndex + 1}</CardTitle>
                    {childQuestions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeChildQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nội dung câu hỏi *</Label>
                    <Textarea
                      value={childQuestion.NoiDung}
                      onChange={(e) => updateChildQuestion(questionIndex, 'NoiDung', e.target.value)}
                      placeholder="Nhập nội dung câu hỏi con..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cấp độ</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={childQuestion.CapDo}
                        onChange={(e) => updateChildQuestion(questionIndex, 'CapDo', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        checked={childQuestion.HoanVi}
                        onCheckedChange={(checked) => updateChildQuestion(questionIndex, 'HoanVi', checked)}
                      />
                      <Label>Hoán vị</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>CLO</Label>
                      <Select
                        value={childQuestion.MaCLO || ''}
                        onValueChange={(value) => updateChildQuestion(questionIndex, 'MaCLO', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn CLO" />
                        </SelectTrigger>
                        <SelectContent>
                          {clos.map(clo => (
                            <SelectItem key={clo.MaCLO} value={clo.MaCLO}>
                              {clo.TenCLO}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Câu trả lời</Label>
                    {childQuestion.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="flex items-center gap-2">
                        <Switch
                          checked={answer.LaDapAn}
                          onCheckedChange={(checked) => updateAnswer(questionIndex, answerIndex, 'LaDapAn', checked)}
                        />
                        <Input
                          value={answer.NoiDung}
                          onChange={(e) => updateAnswer(questionIndex, answerIndex, 'NoiDung', e.target.value)}
                          placeholder={`Câu trả lời ${answerIndex + 1}${answer.LaDapAn ? ' (Đáp án đúng)' : ''}`}
                          className="flex-1"
                        />
                        {childQuestion.answers.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAnswer(questionIndex, answerIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => addAnswer(questionIndex)}
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm câu trả lời
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? 'Đang tạo...' : 'Tạo câu hỏi nhóm'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/questions')}
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupQuestion;
