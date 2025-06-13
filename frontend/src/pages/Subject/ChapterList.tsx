import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, Trash2, RefreshCw } from 'lucide-react'
import PageContainer from '@/components/ui/PageContainer'

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

const ChapterList = () => {
  const navigate = useNavigate()
  const { maMonHoc } = useParams()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newChapterName, setNewChapterName] = useState('')
  const [newChapterOrder, setNewChapterOrder] = useState('')
  const [newChapterQuestionCount, setNewChapterQuestionCount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchChapters = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`http://localhost:3000/phan/mon-hoc/${maMonHoc}`)
      if (!response.ok) throw new Error('Không thể tải danh sách chương')
      const data = await response.json()
      setChapters(data)
    } catch (error) {
      toast.error('Không thể tải danh sách chương')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChapters()
  }, [maMonHoc])

  const handleCreateChapter = async () => {
    if (!newChapterName.trim() || !newChapterOrder.trim() || !newChapterQuestionCount.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin chương')
      return
    }

    try {
      const response = await fetch('http://localhost:3000/phan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TenPhan: newChapterName.trim(),
          ThuTu: parseInt(newChapterOrder),
          SoLuongCauHoi: parseInt(newChapterQuestionCount),
          MaMonHoc: maMonHoc
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Không thể tạo chương mới')
      }

      toast.success('Tạo chương mới thành công')
      setIsCreateDialogOpen(false)
      setNewChapterName('')
      setNewChapterOrder('')
      setNewChapterQuestionCount('')
      fetchChapters()
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo chương mới')
    }
  }

  const handleDeleteChapter = async (maPhan: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chương này?')) return

    try {
      const response = await fetch(`http://localhost:3000/phan/${maPhan}/soft-delete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Không thể xóa chương')
      }

      toast.success('Xóa chương thành công')
      fetchChapters()
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa chương')
    }
  }

  const handleRestoreChapter = async (maPhan: string) => {
    try {
      const response = await fetch(`http://localhost:3000/phan/${maPhan}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Không thể khôi phục chương')
      }

      toast.success('Khôi phục chương thành công')
      fetchChapters()
    } catch (error: any) {
      toast.error(error.message || 'Không thể khôi phục chương')
    }
  }

  const filteredChapters = chapters.filter(chapter =>
    chapter.TenPhan.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalChapters = chapters.length
  const activeChapters = chapters.filter(c => !c.XoaTamPhan).length
  const deletedChapters = chapters.filter(c => c.XoaTamPhan).length

  return (
    <PageContainer className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/subjects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Quản lý Chương</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Chương
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số Chương</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChapters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chương đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeChapters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chương đã xóa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{deletedChapters}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm chương..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={fetchChapters} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChapters.map((chapter) => (
          <Card key={chapter.MaPhan} className={chapter.XoaTamPhan ? 'opacity-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{chapter.TenPhan}</CardTitle>
              <Badge variant={chapter.XoaTamPhan ? 'destructive' : 'default'}>
                {chapter.XoaTamPhan ? 'Đã xóa' : 'Đang hoạt động'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Thứ tự: {chapter.ThuTu}</p>
                <p>Số lượng câu hỏi: {chapter.SoLuongCauHoi}</p>
                <p>Môn học: {chapter.MonHoc?.TenMonHoc}</p>
                <p>Khoa: {chapter.MonHoc?.Khoa?.TenKhoa}</p>
                <p>Ngày tạo: {new Date(chapter.NgayTao).toLocaleDateString('vi-VN')}</p>
                <p>Ngày sửa: {new Date(chapter.NgaySua).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {chapter.XoaTamPhan ? (
                  <Button variant="outline" size="sm" onClick={() => handleRestoreChapter(chapter.MaPhan)}>
                    Khôi phục
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/questions/${chapter.MaPhan}`)}>
                      Xem câu hỏi
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteChapter(chapter.MaPhan)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
    </PageContainer>
  )
}

export default ChapterList
