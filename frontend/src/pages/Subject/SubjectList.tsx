import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, Trash2, RefreshCw, BookOpen } from 'lucide-react'
import PageContainer from '@/components/ui/PageContainer'
import axios from 'axios'

interface Subject {
  MaMonHoc: string
  TenMonHoc: string
  MaSoMonHoc: string
  MaKhoa: string
  XoaTamMonHoc: boolean
  NgayTao: string
  NgaySua: string
  Khoa: {
    TenKhoa: string
  }
}

interface Faculty {
  MaKhoa: string
  TenKhoa: string
}

const SubjectList = () => {
  const navigate = useNavigate()
  const { maKhoa } = useParams()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectCode, setNewSubjectCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchFaculty = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/khoa/${maKhoa}`)
      setFaculty(response.data)
    } catch (error) {
      toast.error('Không thể tải thông tin khoa')
      console.error('Error fetching faculty:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`http://localhost:3000/mon-hoc/khoa/${maKhoa}`)
      setSubjects(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error('Không thể tải danh sách môn học')
      setSubjects([])
      console.error('Error fetching subjects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (maKhoa) {
      fetchFaculty()
      fetchSubjects()
    }
  }, [maKhoa])

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin môn học')
      return
    }

    try {
      const response = await axios.post('http://localhost:3000/mon-hoc', {
        TenMonHoc: newSubjectName.trim(),
        MaSoMonHoc: newSubjectCode.trim(),
        MaKhoa: maKhoa
      })

      toast.success('Tạo môn học mới thành công')
      setIsCreateDialogOpen(false)
      setNewSubjectName('')
      setNewSubjectCode('')
      fetchSubjects()
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Môn học với tên hoặc mã số này đã tồn tại')
      } else {
        toast.error(error.response?.data?.message || 'Không thể tạo môn học mới')
      }
      console.error('Error creating subject:', error)
    }
  }

  const handleDeleteSubject = async (maMonHoc: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return

    try {
      await axios.patch(`http://localhost:3000/mon-hoc/${maMonHoc}/soft-delete`)
      toast.success('Xóa môn học thành công')
      fetchSubjects()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa môn học')
      console.error('Error deleting subject:', error)
    }
  }

  const handleRestoreSubject = async (maMonHoc: string) => {
    try {
      await axios.patch(`http://localhost:3000/mon-hoc/${maMonHoc}/restore`)
      toast.success('Khôi phục môn học thành công')
      fetchSubjects()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể khôi phục môn học')
      console.error('Error restoring subject:', error)
    }
  }

  const viewChapters = (maMonHoc: string) => {
    navigate(`/chapters/${maMonHoc}`)
  }

  const filteredSubjects = subjects.filter(subject =>
    subject.TenMonHoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.MaSoMonHoc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSubjects = subjects.length
  const activeSubjects = subjects.filter(s => !s.XoaTamMonHoc).length
  const deletedSubjects = subjects.filter(s => s.XoaTamMonHoc).length

  return (
    <PageContainer className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/faculty')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">
            Môn học - {faculty?.TenKhoa || 'Đang tải...'}
          </h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Môn Học
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số Môn Học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSubjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học đã xóa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{deletedSubjects}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={fetchSubjects} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <Card
            key={subject.MaMonHoc}
            className={`${subject.XoaTamMonHoc ? 'opacity-50' : ''} hover:shadow-lg transition-shadow`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{subject.TenMonHoc}</CardTitle>
              <Badge variant={subject.XoaTamMonHoc ? 'destructive' : 'default'}>
                {subject.XoaTamMonHoc ? 'Đã xóa' : 'Đang hoạt động'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Mã môn học: {subject.MaSoMonHoc}</p>
                <p>Khoa: {subject.Khoa?.TenKhoa || faculty?.TenKhoa}</p>
                <p>Ngày tạo: {new Date(subject.NgayTao).toLocaleDateString('vi-VN')}</p>
                <p>Ngày sửa: {new Date(subject.NgaySua).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {subject.XoaTamMonHoc ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreSubject(subject.MaMonHoc)}
                  >
                    Khôi phục
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => viewChapters(subject.MaMonHoc)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Xem chương
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSubject(subject.MaMonHoc)}
                    >
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
            <DialogTitle>Thêm Môn Học Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Tên Môn Học
              </label>
              <Input
                id="name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Nhập tên môn học..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Mã Môn Học
              </label>
              <Input
                id="code"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
                placeholder="Nhập mã môn học..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSubject}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

export default SubjectList
