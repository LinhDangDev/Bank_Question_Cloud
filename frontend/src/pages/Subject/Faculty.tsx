import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ArrowLeft, Trash2, RefreshCw, BookOpen } from 'lucide-react'
import PageContainer from '@/components/ui/PageContainer'
import axios from 'axios'
import {
    Box,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    useTheme,
    TextField,
    Typography,
    Paper,
} from '@mui/material'
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Restore as RestoreIcon,
    MenuBook as MenuBookIcon
} from '@mui/icons-material'
import { API_BASE_URL } from '@/config'

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
    const theme = useTheme()
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
            const response = await axios.get(`${API_BASE_URL}/khoa`)
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
            const response = await axios.post(`${API_BASE_URL}/khoa`, {
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
            await axios.patch(`${API_BASE_URL}/khoa/${editingFaculty.MaKhoa}`, {
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
            await axios.patch(`${API_BASE_URL}/khoa/${faculty.MaKhoa}/soft-delete`)
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
            await axios.patch(`${API_BASE_URL}/khoa/${faculty.MaKhoa}/restore`)
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
        <PageContainer className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-2xl font-bold">Quản lý Khoa</h1>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Khoa
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số Khoa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFaculties}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Khoa đang hoạt động</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeFaculties}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Khoa đã xóa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{deletedFaculties}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm khoa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" onClick={fetchFaculties} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

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
                                <p>Ngày tạo: {new Date(faculty.NgayTao).toLocaleDateString('vi-VN')}</p>
                                <p>Ngày sửa: {new Date(faculty.NgaySua).toLocaleDateString('vi-VN')}</p>
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
                                            <MenuBookIcon className="w-4 h-4 mr-2" />
                                            Xem môn học
                                        </Button>
                                        <Tooltip title="Chỉnh sửa">
                                            <IconButton
                                                onClick={() => openEditDialog(faculty)}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa">
                                            <IconButton
                                                onClick={() => handleDeleteFaculty(faculty)}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                                {faculty.XoaTamKhoa && (
                                    <Tooltip title="Khôi phục">
                                        <IconButton
                                            onClick={() => handleRestoreFaculty(faculty)}
                                            size="small"
                                            color="primary"
                                        >
                                            <RestoreIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
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
        </PageContainer>
    )
}

export default Faculty
