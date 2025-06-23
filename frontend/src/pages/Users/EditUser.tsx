import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { API_BASE_URL } from '@/config'
import axios from 'axios'
import { useThemeStyles, cx } from '../../utils/theme'
import { useAuth } from '../../context/AuthContext'

const EditUser = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const styles = useThemeStyles()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    active: true,
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const departments = ['Khoa CNTT', 'Khoa Toán', 'Khoa Vật lý', 'Khoa Hóa học', 'Khoa Điện tử']
  const roles = ['Quản trị viên', 'Giảng viên']

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        // In a real app, this would make an API call to get user data
        // const response = await axios.get(`${API_BASE_URL}/users/${id}`)

        // For now, we'll simulate the API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500))
        const mockUsers = [
          { id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'Quản trị viên', department: 'Khoa CNTT', active: true },
          { id: '2', name: 'Trần Thị B', email: 'tranthib@gmail.com', role: 'Giảng viên', department: 'Khoa CNTT', active: true },
          { id: '3', name: 'Lê Văn C', email: 'levanc@gmail.com', role: 'Giảng viên', department: 'Khoa Vật lý', active: false },
          { id: '4', name: 'Phạm Thị D', email: 'phamthid@gmail.com', role: 'Quản trị viên', department: 'Khoa Toán', active: true },
        ]

        const user = mockUsers.find(user => user.id === id)

        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            active: user.active
          })
        } else {
          toast.error('Không tìm thấy thông tin người dùng')
          navigate('/users')
        }
      } catch (error) {
        toast.error('Lỗi khi tải thông tin người dùng')
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [id, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => ({
      ...prev,
      [name]: val
    }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Tên người dùng không được để trống'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.role) {
      newErrors.role = 'Vui lòng chọn vai trò'
    }

    if (!formData.department) {
      newErrors.department = 'Vui lòng chọn khoa'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      try {
        // In a real app, this would make an API call to update the user
        // await axios.put(`${API_BASE_URL}/users/${id}`, formData)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.success('Cập nhật thông tin người dùng thành công!')
        navigate('/users')
      } catch (error) {
        console.error('Error updating user:', error)
        toast.error('Lỗi khi cập nhật thông tin người dùng')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Bạn không có quyền truy cập trang này.</div>
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link to="/users" className="mr-4 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa người dùng</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên người dùng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* Role field - Read-only */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none bg-gray-100 rounded-r-lg text-xs text-gray-500">
                  Không thể thay đổi
                </div>
              </div>
              {errors.role && <p className="mt-1 text-red-500 text-sm">{errors.role}</p>}
            </div>

            {/* Department field */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Khoa <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn khoa</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-red-500 text-sm">{errors.department}</p>}
            </div>

            {/* Active status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Kích hoạt tài khoản
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/users"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cx(
                "flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
                "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUser
