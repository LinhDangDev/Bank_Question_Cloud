import { useState, useRef } from 'react'
import { ArrowLeft, Save, Upload, FileSpreadsheet, AlertCircle, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const AddUser = () => {
  const { user } = useAuth()
  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Bạn không có quyền truy cập trang này.</div>
  }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    active: true,
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [importedUsers, setImportedUsers] = useState<any[]>([])
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const departments = ['Khoa CNTT', 'Khoa Toán', 'Khoa Vật lý', 'Khoa Hóa học', 'Khoa Điện tử']
  const roles = ['Quản trị viên', 'Giảng viên']

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

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      // Mock API call
      setTimeout(() => {
        console.log('Submitted:', formData)
        setIsSubmitting(false)
        setSubmitSuccess(true)

        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          department: '',
          active: true,
        })

        // Reset success message after some time
        setTimeout(() => setSubmitSuccess(false), 5000)
      }, 1000)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Vui lòng chọn tệp Excel (.xlsx hoặc .xls)')
      return
    }

    setIsSubmitting(true)
    try {
      // Here we would normally process the Excel file
      // For this example, we'll simulate parsing with a mock result

      // Simulated delay for mock processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock imported data
      const mockUsers = [
        {
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          department: 'Khoa CNTT',
          role: 'Giảng viên',
          password: 'password123',
          status: 'valid'
        },
        {
          name: 'Trần Thị B',
          email: 'tranthib@example.com',
          department: 'Khoa Toán',
          role: 'Giảng viên',
          password: 'password123',
          status: 'valid'
        },
        {
          name: 'Lê Văn C',
          email: 'invalid-email',
          department: 'Khoa Vật lý',
          role: 'Quản trị viên',
          password: 'pass',
          status: 'invalid',
          errors: ['Email không hợp lệ', 'Mật khẩu quá ngắn']
        }
      ]

      setImportedUsers(mockUsers)
      setShowImportPreview(true)

      // Collect any validation errors
      const errors = mockUsers
        .filter(user => user.status === 'invalid')
        .map(user => `Lỗi với người dùng ${user.name}: ${(user.errors as string[]).join(', ')}`)

      setImportErrors(errors)

      if (errors.length > 0) {
        toast.warning(`Nhập tệp có ${errors.length} lỗi. Vui lòng xem chi tiết bên dưới.`)
      } else {
        toast.success('Tệp Excel đã được xử lý thành công!')
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      toast.error('Có lỗi khi xử lý tệp Excel')
    } finally {
      setIsSubmitting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportSubmit = () => {
    // Here we would submit valid users to the API
    const validUsers = importedUsers.filter(user => user.status === 'valid')

    if (validUsers.length === 0) {
      toast.error('Không có người dùng hợp lệ để nhập')
      return
    }

    setIsSubmitting(true)

    // Mock API call
    setTimeout(() => {
      console.log('Imported users:', validUsers)
      setIsSubmitting(false)
      setShowImportPreview(false)
      setImportedUsers([])
      setImportErrors([])
      toast.success(`Đã nhập ${validUsers.length} người dùng thành công!`)
    }, 1000)
  }

  const handleCancelImport = () => {
    setShowImportPreview(false)
    setImportedUsers([])
    setImportErrors([])
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link to="/users" className="mr-4 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Thêm người dùng mới</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FileSpreadsheet className="mr-2" size={20} />
          Nhập từ tệp Excel
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-import"
          />

          <div className="mb-4">
            <FileSpreadsheet size={40} className="mx-auto text-gray-400" />
          </div>

          <p className="text-gray-600 mb-4">
            Tải lên tệp Excel (.xlsx, .xls) chứa danh sách người dùng
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Tệp Excel cần có các cột: Tên, Email, Mật khẩu, Vai trò, Khoa
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center mx-auto"
            disabled={isSubmitting}
          >
            <Upload size={18} className="mr-2" />
            {isSubmitting ? 'Đang xử lý...' : 'Chọn tệp Excel'}
          </button>
        </div>

        {showImportPreview && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Xem trước dữ liệu nhập</h3>

            {importErrors.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-500 mr-2 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-medium text-yellow-800">Phát hiện {importErrors.length} lỗi:</h4>
                    <ul className="list-disc pl-5 mt-1 text-sm text-yellow-700">
                      {importErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left border">Trạng thái</th>
                    <th className="px-4 py-2 text-left border">Tên</th>
                    <th className="px-4 py-2 text-left border">Email</th>
                    <th className="px-4 py-2 text-left border">Vai trò</th>
                    <th className="px-4 py-2 text-left border">Khoa</th>
                  </tr>
                </thead>
                <tbody>
                  {importedUsers.map((user, idx) => (
                    <tr key={idx} className={user.status === 'invalid' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 border">
                        {user.status === 'valid' ? (
                          <span className="flex items-center text-green-600">
                            <Check size={16} className="mr-1" /> Hợp lệ
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <X size={16} className="mr-1" /> Lỗi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 border">{user.name}</td>
                      <td className="px-4 py-2 border">{user.email}</td>
                      <td className="px-4 py-2 border">{user.role}</td>
                      <td className="px-4 py-2 border">{user.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Hủy
              </button>

              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={isSubmitting || importedUsers.filter(u => u.status === 'valid').length === 0}
              >
                {isSubmitting ? 'Đang xử lý...' : `Nhập ${importedUsers.filter(u => u.status === 'valid').length} người dùng`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Thêm người dùng thủ công</h2>

        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md">
            Người dùng đã được thêm thành công!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="mt-1 text-red-500 text-sm">{errors.password}</p>}
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && <p className="mt-1 text-red-500 text-sm">{errors.confirmPassword}</p>}
            </div>

            {/* Role field */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn vai trò</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
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
                Kích hoạt tài khoản ngay
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              disabled={isSubmitting}
            >
              <Save size={18} className="mr-2" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu người dùng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUser
