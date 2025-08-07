import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, Trash2, RefreshCw, BookOpen, Edit, RotateCcw } from 'lucide-react'
import { monHocApi, khoaApi } from '@/services/api'
import { usePermissions } from '@/hooks/usePermissions'

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
  const { facultyId } = useParams()
  const { isAdmin } = usePermissions()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectCode, setNewSubjectCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchFaculty = async () => {
    if (!facultyId) {
      console.error('No facultyId provided');
      toast.error('Không thể tải thông tin khoa - thiếu ID');
      return;
    }

    try {
      const response = await khoaApi.getKhoaById(facultyId);
      setFaculty(response.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Không thể tải thông tin khoa');
    }
  }

  const fetchSubjects = async () => {
    if (!facultyId) {
      console.error('No facultyId provided');
      toast.error('Không thể tải danh sách môn học - thiếu ID khoa');
      return;
    }

    try {
      setIsLoading(true);
      const response = await monHocApi.getMonHocByKhoa(facultyId);
      setSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Không thể tải danh sách môn học');
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (facultyId) {
      fetchFaculty();
      fetchSubjects();
    }
  }, [facultyId])

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin môn học')
      return
    }

    try {
      await monHocApi.createMonHoc({
        TenMonHoc: newSubjectName.trim(),
        MaSoMonHoc: newSubjectCode.trim(),
        MaKhoa: facultyId as string
      });

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
      await monHocApi.softDeleteMonHoc(maMonHoc);
      toast.success('Xóa môn học thành công')
      fetchSubjects()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa môn học')
      console.error('Error deleting subject:', error)
    }
  }

  const handleRestoreSubject = async (maMonHoc: string) => {
    try {
      await monHocApi.restoreMonHoc(maMonHoc);
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

  const filteredSubjects = subjects.filter(subject =>
    subject.TenMonHoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.MaSoMonHoc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSubjects = subjects.length
  const activeSubjects = subjects.filter(s => !s.XoaTamMonHoc).length
  const deletedSubjects = subjects.filter(s => s.XoaTamMonHoc).length

  return (
    <div className="flex flex-col h-[calc(94vh-56px)] overflow-hidden">
      {/* Header với tiêu đề và nút tạo môn học */}
      <div className="bg-white border-b px-6 py-3 flex flex-wrap justify-between items-center gap-y-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Môn học - {faculty?.TenKhoa || 'Đang tải...'}
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Quản lý các môn học thuộc khoa {faculty?.TenKhoa}
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
              Thêm Môn Học
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
                <p className="text-sm font-medium text-gray-600">Tổng số môn học</p>
                <p className="text-2xl font-bold text-gray-900">{totalSubjects}</p>
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
                <p className="text-2xl font-bold text-green-600">{activeSubjects}</p>
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
                <p className="text-2xl font-bold text-red-600">{deletedSubjects}</p>
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
              placeholder="Tìm kiếm môn học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button variant="outline" onClick={fetchSubjects} disabled={isLoading} size="sm" className="h-9">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <Card
              key={subject.MaMonHoc}
              className={`${subject.XoaTamMonHoc ? 'opacity-50' : ''} hover:shadow-lg transition-shadow`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{subject.TenMonHoc}</CardTitle>
                <Badge variant={subject.XoaTamMonHoc ? 'destructive' : 'default'}
                  className={!subject.XoaTamMonHoc ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                  {subject.XoaTamMonHoc ? 'Đã xóa' : 'Đang hoạt động'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Mã môn học: {subject.MaSoMonHoc}</p>
                  <p>Khoa: {subject.Khoa?.TenKhoa || faculty?.TenKhoa}</p>
                  {/* <p>Ngày tạo: {formatDate(subject.NgayTao)}</p>
                  <p>Ngày sửa: {formatDate(subject.NgaySua)}</p> */}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  {subject.XoaTamMonHoc ? (
                    isAdmin() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreSubject(subject.MaMonHoc)}
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
                        onClick={() => viewChapters(subject.MaMonHoc)}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Chương/Phần
                      </Button>
                      {isAdmin() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.MaMonHoc)}
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
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              'Không tìm thấy môn học nào'
            )}
          </div>
        )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Môn Học Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject-name" className="text-sm font-medium">Tên Môn Học</label>
              <Input
                id="subject-name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Nhập tên môn học"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="subject-code" className="text-sm font-medium">Mã Môn Học</label>
              <Input
                id="subject-code"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
                placeholder="Nhập mã môn học"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateSubject}>Tạo Môn Học</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubjectList
