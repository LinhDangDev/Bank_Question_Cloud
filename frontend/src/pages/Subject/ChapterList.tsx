import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, Trash2, RefreshCw, BookOpen, Edit, RotateCcw } from 'lucide-react'
import { monHocApi, phanApi } from '@/services/api'
import { usePermissions } from '@/hooks/usePermissions'

interface Chapter {
  MaPhan: string
  TenPhan: string
  NoiDung?: string
  ThuTu: number
  SoLuongCauHoi: number
  MaMonHoc: string
  XoaTamPhan: boolean
  NgayTao: string
  NgaySua: string
  MonHoc: {
    TenMonHoc: string
    Khoa: {
      TenKhoa: string
    }
  }
}

interface Subject {
  MaMonHoc: string
  TenMonHoc: string
  MaKhoa: string
  Khoa: {
    TenKhoa: string
  }
}

const ChapterList = () => {
  const navigate = useNavigate()
  const { subjectId } = useParams()
  const { isAdmin } = usePermissions()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [subject, setSubject] = useState<Subject | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newChapterName, setNewChapterName] = useState('')
  const [newChapterOrder, setNewChapterOrder] = useState('')
  const [newChapterQuestionCount, setNewChapterQuestionCount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchSubject = async () => {
    try {
      const response = await monHocApi.getMonHocById(subjectId as string);
      setSubject(response.data)
    } catch (error) {
      toast.error('Không thể tải thông tin môn học')
      console.error('Error fetching subject:', error)
    }
  }

  const fetchChapters = async () => {
    try {
      setIsLoading(true)
      const response = await phanApi.getPhanByMonHoc(subjectId as string);
      setChapters(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error('Không thể tải danh sách chương')
      setChapters([])
      console.error('Error fetching chapters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (subjectId) {
      fetchSubject()
      fetchChapters()
    }
  }, [subjectId])

  const handleCreateChapter = async () => {
    if (!newChapterName.trim() || !newChapterOrder.trim() || !newChapterQuestionCount.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin chương')
      return
    }

    try {
      await phanApi.createPhan({
        TenPhan: newChapterName.trim(),
        ThuTu: parseInt(newChapterOrder),
        SoLuongCauHoi: parseInt(newChapterQuestionCount),
        MaMonHoc: subjectId,
        LaCauHoiNhom: false
      });

      toast.success('Tạo chương mới thành công')
      setIsCreateDialogOpen(false)
      setNewChapterName('')
      setNewChapterOrder('')
      setNewChapterQuestionCount('')
      fetchChapters()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo chương mới')
      console.error('Error creating chapter:', error)
    }
  }

  const handleDeleteChapter = async (maPhan: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chương này?')) return

    try {
      await phanApi.softDeletePhan(maPhan);
      toast.success('Xóa chương thành công')
      fetchChapters()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa chương')
      console.error('Error deleting chapter:', error)
    }
  }

  const handleRestoreChapter = async (maPhan: string) => {
    try {
      await phanApi.restorePhan(maPhan);
      toast.success('Khôi phục chương thành công')
      fetchChapters()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể khôi phục chương')
      console.error('Error restoring chapter:', error)
    }
  }

  const viewQuestions = (maPhan: string) => {
    navigate(`/questions/chapter/${maPhan}`)
  }

  // Format date to show both date and time in a user-friendly format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.TenPhan.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalChapters = chapters.length
  const activeChapters = chapters.filter(c => !c.XoaTamPhan).length
  const deletedChapters = chapters.filter(c => c.XoaTamPhan).length

  return (
    <div className="flex flex-col h-[calc(94vh-56px)] overflow-hidden">
      {/* Header với tiêu đề và nút tạo chương */}
      <div className="bg-white border-b px-6 py-3 flex flex-wrap justify-between items-center gap-y-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Chương - {subject?.TenMonHoc || 'Đang tải...'}
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {subject?.Khoa && `Khoa ${subject.Khoa.TenKhoa} - `}Quản lý các chương/phần của môn học
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} size="sm" className="h-9">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại
          </Button>
          {isAdmin() && (
            <Button
              variant="primary"
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm Chương
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số chương</p>
                <p className="text-2xl font-bold text-gray-900">{totalChapters}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{activeChapters}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã xóa</p>
                <p className="text-2xl font-bold text-red-600">{deletedChapters}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm chương..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button variant="outline" onClick={fetchChapters} disabled={isLoading} size="sm" className="h-9">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChapters.map((chapter) => (
          <Card
            key={chapter.MaPhan}
            className={`${chapter.XoaTamPhan ? 'opacity-50' : ''} hover:shadow-lg transition-shadow`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{chapter.TenPhan}</CardTitle>
              <Badge variant={chapter.XoaTamPhan ? 'destructive' : 'default'}
                className={!chapter.XoaTamPhan ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                {chapter.XoaTamPhan ? 'Đã xóa' : 'Đang hoạt động'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Thứ tự: {chapter.ThuTu}</p>
                <p>Số lượng câu hỏi: {chapter.SoLuongCauHoi}</p>
                <p>Môn học: {chapter.MonHoc?.TenMonHoc || subject?.TenMonHoc}</p>
                <p>Khoa: {chapter.MonHoc?.Khoa?.TenKhoa || subject?.Khoa?.TenKhoa}</p>
                    {/* <p>Ngày tạo: {formatDate(chapter.NgayTao)}</p>
                    <p>Ngày sửa: {formatDate(chapter.NgaySua)}</p> */}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {chapter.XoaTamPhan ? (
                  isAdmin() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreChapter(chapter.MaPhan)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Khôi phục"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => viewQuestions(chapter.MaPhan)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Xem câu hỏi
                    </Button>
                    {isAdmin() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteChapter(chapter.MaPhan)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Chương Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Tên Chương
              </label>
              <Input
                id="name"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="Nhập tên chương..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="order" className="text-sm font-medium">
                Thứ Tự
              </label>
              <Input
                id="order"
                type="number"
                value={newChapterOrder}
                onChange={(e) => setNewChapterOrder(e.target.value)}
                placeholder="Nhập thứ tự..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="questionCount" className="text-sm font-medium">
                Số Lượng Câu Hỏi
              </label>
              <Input
                id="questionCount"
                type="number"
                value={newChapterQuestionCount}
                onChange={(e) => setNewChapterQuestionCount(e.target.value)}
                placeholder="Nhập số lượng câu hỏi..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateChapter}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChapterList
