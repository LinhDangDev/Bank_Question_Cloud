import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, Trash2, RefreshCw, BookOpen, Edit, RotateCcw } from 'lucide-react'
import PageContainer from '@/components/ui/PageContainer'
import { khoaApi } from '@/services/api'
import { usePermissions } from '@/hooks/usePermissions'

interface Faculty {
    MaKhoa: string
    TenKhoa: string
    XoaTamKhoa: boolean
    NgayTao: string
    NgaySua: string
    MoTa?: string
}

const Faculty = () => {
    const navigate = useNavigate()

    const { isAdmin } = usePermissions()
    const [faculties, setFaculties] = useState<Faculty[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [newFacultyName, setNewFacultyName] = useState('')
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
    const [editFacultyName, setEditFacultyName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [facultyDescription, setFacultyDescription] = useState('')
    const [editFacultyDescription, setEditFacultyDescription] = useState('')

    const fetchFaculties = async () => {
        try {
            setIsLoading(true)
            const response = await khoaApi.getAll()
            setFaculties(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            toast.error('Failed to fetch faculties')
            setFaculties([])
            console.error('Error fetching faculties:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFaculties()
    }, [])

    const handleCreateFaculty = async () => {
        if (!newFacultyName.trim()) {
            toast.error('Faculty name cannot be empty')
            return
        }

        try {
            const response = await khoaApi.createKhoa({
                TenKhoa: newFacultyName.trim(),
                MoTa: facultyDescription.trim()
            })

            if (response.data.message === 'Khoa đã được khôi phục') {
                toast.success('Faculty restored successfully')
            } else {
                toast.success('Faculty created successfully')
            }

            setIsCreateDialogOpen(false)
            setNewFacultyName('')
            setFacultyDescription('')
            fetchFaculties()
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error('Faculty name already exists')
            } else {
                toast.error('Failed to create faculty')
            }
            console.error('Error creating faculty:', error)
        }
    }

    const handleUpdateFaculty = async () => {
        if (!editingFaculty || !editFacultyName.trim()) {
            toast.error('Faculty name cannot be empty')
            return
        }

        try {
            await khoaApi.updateKhoa(editingFaculty.MaKhoa, {
                TenKhoa: editFacultyName.trim(),
                MoTa: editFacultyDescription.trim()
            })

            toast.success('Faculty updated successfully')
            setIsEditDialogOpen(false)
            setEditingFaculty(null)
            setEditFacultyName('')
            setEditFacultyDescription('')
            fetchFaculties()
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error('Faculty name already exists')
            } else {
                toast.error('Failed to update faculty')
            }
            console.error('Error updating faculty:', error)
        }
    }

    const handleDeleteFaculty = async (faculty: Faculty) => {
        try {
            await khoaApi.softDeleteKhoa(faculty.MaKhoa)
            toast.success('Faculty deleted successfully')
            fetchFaculties()
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error('Faculty is already deleted')
            } else {
                toast.error('Failed to delete faculty')
            }
            console.error('Error deleting faculty:', error)
        }
    }

    const handleRestoreFaculty = async (faculty: Faculty) => {
        try {
            await khoaApi.restoreKhoa(faculty.MaKhoa)
            toast.success('Faculty restored successfully')
            fetchFaculties()
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error('Faculty is not deleted')
            } else {
                toast.error('Failed to restore faculty')
            }
            console.error('Error restoring faculty:', error)
        }
    }

    const openEditDialog = (faculty: Faculty) => {
        setEditingFaculty(faculty)
        setEditFacultyName(faculty.TenKhoa)
        setEditFacultyDescription(faculty.MoTa || '')
        setIsEditDialogOpen(true)
    }

    const viewSubjects = (faculty: Faculty) => {
        navigate(`/subjects/${faculty.MaKhoa}`)
    }

    const filteredFaculties = faculties.filter(faculty =>
        faculty.TenKhoa.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalFaculties = faculties.length
    const activeFaculties = faculties.filter(f => !f.XoaTamKhoa).length
    const deletedFaculties = faculties.filter(f => f.XoaTamKhoa).length

    return (
        <div className="flex flex-col h-[calc(94vh-56px)] overflow-hidden">
            {/* Header với tiêu đề và nút tạo khoa */}
            <div className="bg-white border-b px-6 py-3 flex flex-wrap justify-between items-center gap-y-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Quản lý Khoa</h1>
                    <p className="text-sm text-gray-600 mt-0.5">
                        Quản lý thông tin các khoa trong hệ thống
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
                            Thêm Khoa
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
                                <p className="text-sm font-medium text-gray-600">Tổng số khoa</p>
                                <p className="text-2xl font-bold text-gray-900">{totalFaculties}</p>
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
                                <p className="text-2xl font-bold text-green-600">{activeFaculties}</p>
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
                                <p className="text-2xl font-bold text-red-600">{deletedFaculties}</p>
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
                            placeholder="Tìm kiếm khoa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-9"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchFaculties} disabled={isLoading} size="sm" className="h-9">
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFaculties.map((faculty) => (
                    <Card
                        key={faculty.MaKhoa}
                        className={`${faculty.XoaTamKhoa ? 'opacity-50' : ''} hover:shadow-lg transition-shadow`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">{faculty.TenKhoa}</CardTitle>
                            <Badge variant={faculty.XoaTamKhoa ? 'destructive' : 'default'}
                                className={!faculty.XoaTamKhoa ? 'bg-green-400 hover:bg-green-600' : ''}>
                                {faculty.XoaTamKhoa ? 'Đã xóa' : 'Đang hoạt động'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4">
                                {faculty.MoTa && <p className="mb-2">{faculty.MoTa}</p>}
                                {/* <p>Ngày tạo: {new Date(faculty.NgayTao).toLocaleDateString('vi-VN')}</p>
                                <p>Ngày sửa: {new Date(faculty.NgaySua).toLocaleDateString('vi-VN')}</p> */}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                {!faculty.XoaTamKhoa && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center"
                                            onClick={() => viewSubjects(faculty)}
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Xem môn học
                                        </Button>

                                        {isAdmin() && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditDialog(faculty)}
                                                className="p-2"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        )}

                                        {isAdmin() && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteFaculty(faculty)}
                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </>
                                )}
                                {faculty.XoaTamKhoa && isAdmin() && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRestoreFaculty(faculty)}
                                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Khôi phục"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
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
                        <DialogTitle>Thêm Khoa Mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Tên Khoa
                            </label>
                            <Input
                                id="name"
                                value={newFacultyName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFacultyName(e.target.value)}
                                placeholder="Nhập tên khoa..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Mô tả
                            </label>
                            <Input
                                id="description"
                                value={facultyDescription}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFacultyDescription(e.target.value)}
                                placeholder="Nhập mô tả khoa..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>Hủy</Button>
                        <Button variant="primary" onClick={handleCreateFaculty}>
                            Tạo mới
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa Khoa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="editName" className="text-sm font-medium">
                                Tên Khoa
                            </label>
                            <Input
                                id="editName"
                                value={editFacultyName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFacultyName(e.target.value)}
                                placeholder="Nhập tên khoa..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="editDescription" className="text-sm font-medium">
                                Mô tả
                            </label>
                            <Input
                                id="editDescription"
                                value={editFacultyDescription}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFacultyDescription(e.target.value)}
                                placeholder="Nhập mô tả khoa..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
                        <Button variant="primary" onClick={handleUpdateFaculty}>
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Faculty
