import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Upload, FileSpreadsheet, AlertCircle, Check, X, ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { userApi, khoaApi, authApi } from '@/services/api'

interface Khoa {
  MaKhoa: string;
  TenKhoa: string;
}

interface UserData {
  UserId: string;
  LoginName: string;
  Email: string;
  Name: string;
  IsBuildInUser: boolean;
  IsDeleted: boolean;
}

const AddUser = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Bạn không có quyền truy cập trang này.</div>
  }

  const [formData, setFormData] = useState({
    Name: '',
    Email: '',
    LoginName: '',
    Password: '',
    confirmPassword: '',
    IsBuildInUser: false,
    MaKhoa: '',
    IsDeleted: false,
    NeedChangePassword: true
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [importedUsers, setImportedUsers] = useState<any[]>([])
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [faculties, setFaculties] = useState<Khoa[]>([])
  const [loadingFaculties, setLoadingFaculties] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const roles = ['Quản trị viên', 'Giảng viên']

  useEffect(() => {
    const fetchFaculties = async () => {
      setLoadingFaculties(true);
      try {
        const response = await khoaApi.getAll();
        setFaculties(response.data || []);
      } catch (error) {
        console.error('Error fetching faculties:', error);
        toast.error('Không thể tải danh sách khoa');
      } finally {
        setLoadingFaculties(false);
      }
    };

    fetchFaculties();
  }, []);

  // Kiểm tra độ mạnh của mật khẩu
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    // Điều kiện cho mật khẩu mạnh
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const isLongEnough = password.length >= 8;

    // Tính điểm mạnh của mật khẩu
    let strength = 0;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;
    if (isLongEnough) strength++;

    // Phân loại theo điểm
    if (strength <= 2) {
      setPasswordStrength('weak');
    } else if (strength <= 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await authApi.checkUsername(username);
      const isAvailable = response.data?.available;

      setUsernameAvailable(isAvailable);

      if (!isAvailable) {
        setErrors(prev => ({
          ...prev,
          LoginName: 'Tên đăng nhập đã tồn tại'
        }));
      } else {
        setErrors(prev => {
          const newErrors = {...prev};
          if (newErrors.LoginName === 'Tên đăng nhập đã tồn tại') {
            delete newErrors.LoginName;
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

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

    // Check username availability after a delay
    if (name === 'LoginName' && value.trim() !== '') {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }

      usernameTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    }

    // Check email format
    if (name === 'Email' && value.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setErrors(prev => ({
          ...prev,
          Email: 'Email không hợp lệ'
        }));
      }
    }

    // Check password strength
    if (name === 'Password') {
      checkPasswordStrength(value);
    }

    // Check password confirmation match
    if (name === 'confirmPassword' || (name === 'Password' && formData.confirmPassword)) {
      const passwordToCheck = name === 'Password' ? value : formData.Password;
      const confirmToCheck = name === 'confirmPassword' ? value : formData.confirmPassword;

      if (confirmToCheck && passwordToCheck !== confirmToCheck) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Mật khẩu xác nhận không khớp'
        }));
      } else if (confirmToCheck) {
        setErrors(prev => {
          const newErrors = {...prev};
          if (newErrors.confirmPassword === 'Mật khẩu xác nhận không khớp') {
            delete newErrors.confirmPassword;
          }
          return newErrors;
        });
      }
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.Name.trim()) {
      newErrors.Name = 'Tên người dùng không được để trống'
    }

    if (!formData.Email.trim()) {
      newErrors.Email = 'Email không được để trống'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.Email)) {
      newErrors.Email = 'Email không hợp lệ'
    }

    if (!formData.LoginName.trim()) {
      newErrors.LoginName = 'Tên đăng nhập không được để trống'
    } else if (formData.LoginName.length < 3) {
      newErrors.LoginName = 'Tên đăng nhập phải có ít nhất 3 ký tự'
    } else if (usernameAvailable === false) {
      newErrors.LoginName = 'Tên đăng nhập đã tồn tại'
    }

    if (!formData.Password) {
      newErrors.Password = 'Mật khẩu không được để trống'
    } else if (formData.Password.length < 6) {
      newErrors.Password = 'Mật khẩu phải có ít nhất 6 ký tự'
    } else if (passwordStrength === 'weak') {
      newErrors.Password = 'Mật khẩu quá yếu, cần kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt'
    }

    if (formData.Password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (!formData.IsBuildInUser && !formData.MaKhoa) {
      newErrors.MaKhoa = 'Vui lòng chọn khoa cho giảng viên'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        // Prepare payload for API
        const payload = {
          Name: formData.Name,
          Email: formData.Email,
          LoginName: formData.LoginName,
          Password: formData.Password,
          IsBuildInUser: formData.IsBuildInUser,
          IsDeleted: formData.IsDeleted,
          NeedChangePassword: formData.NeedChangePassword,
          MaKhoa: formData.IsBuildInUser ? null : formData.MaKhoa
        }

        console.log('Creating user with payload:', payload);
        await userApi.create(payload)
        toast.success('Người dùng đã được thêm thành công!')
        navigate('/users')
      } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.response?.data?.message?.includes('username or email already exists')) {
          toast.error('Tên đăng nhập hoặc email đã tồn tại!');
          setErrors(prev => ({
            ...prev,
            LoginName: 'Tên đăng nhập hoặc email đã tồn tại',
            Email: 'Tên đăng nhập hoặc email đã tồn tại'
          }));
        } else {
          toast.error(error.response?.data?.message || 'Lỗi khi thêm người dùng!');
        }
      } finally {
        setIsSubmitting(false)
      }
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
          MaKhoa: faculties.length > 0 ? faculties[0].MaKhoa : null,
          role: 'Giảng viên',
          password: 'password123',
          status: 'valid'
        },
        {
          name: 'Trần Thị B',
          email: 'tranthib@example.com',
          MaKhoa: faculties.length > 1 ? faculties[1].MaKhoa : null,
          role: 'Giảng viên',
          password: 'password123',
          status: 'valid'
        },
        {
          name: 'Lê Văn C',
          email: 'invalid-email',
          MaKhoa: null,
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

  const handleImportSubmit = async () => {
    // Here we would submit valid users to the API
    const validUsers = importedUsers.filter(user => user.status === 'valid')

    if (validUsers.length === 0) {
      toast.error('Không có người dùng hợp lệ để nhập')
      return
    }

    setIsSubmitting(true)

    try {
      // Transform the data to match our API format
      const formattedUsers = validUsers.map(user => ({
        Name: user.name,
        Email: user.email,
        LoginName: user.email.split('@')[0], // Use first part of email as loginName
        Password: user.password,
        IsBuildInUser: user.role === 'Quản trị viên',
        IsDeleted: false,
        NeedChangePassword: false,
        MaKhoa: user.role !== 'Quản trị viên' ? user.MaKhoa : null
      }))

      // Send to API
      await userApi.importUsers(formattedUsers)
      toast.success(`Đã nhập ${validUsers.length} người dùng thành công!`)
      setShowImportPreview(false)
      setImportedUsers([])
      setImportErrors([])

      // Redirect to users list
      navigate('/users')
    } catch (error) {
      console.error('Error importing users:', error)
      toast.error('Có lỗi khi nhập danh sách người dùng')
    } finally {
      setIsSubmitting(false)
    }
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
          Nhập danh sách người dùng từ Excel
        </h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition"
          >
            <Upload size={40} className="mb-2" />
            <span className="text-lg font-medium">Chọn tệp Excel để tải lên</span>
            <span className="text-sm mt-1">Hỗ trợ định dạng .xlsx, .xls</span>
          </label>
        </div>
      </div>

      {showImportPreview && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Xác nhận nhập danh sách người dùng</h2>

          {importErrors.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-700">Lưu ý</h3>
                  <ul className="mt-1 list-disc list-inside text-sm text-yellow-700">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importedUsers.map((user, index) => {
                  const faculty = faculties.find(f => f.MaKhoa === user.MaKhoa);
                  return (
                    <tr key={index} className={user.status === 'invalid' ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{faculty?.TenKhoa || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === 'valid' ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <Check size={14} className="mr-1" /> Hợp lệ
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <X size={14} className="mr-1" /> Không hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelImport}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting || importedUsers.filter(u => u.status === 'valid').length === 0}
            >
              {isSubmitting ? 'Đang xử lý...' : `Nhập ${importedUsers.filter(u => u.status === 'valid').length} người dùng`}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Thêm người dùng mới</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên người dùng
              </label>
              <input
                type="text"
                name="Name"
                id="Name"
                value={formData.Name}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.Name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.Name && <p className="mt-1 text-sm text-red-500">{errors.Name}</p>}
            </div>

            <div>
              <label htmlFor="Email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="Email"
                id="Email"
                value={formData.Email}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.Email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.Email && <p className="mt-1 text-sm text-red-500">{errors.Email}</p>}
            </div>

            <div>
              <label htmlFor="LoginName" className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="LoginName"
                  id="LoginName"
                  value={formData.LoginName}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.LoginName ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {isCheckingUsername ? (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : usernameAvailable === true && formData.LoginName ? (
                  <div className="absolute right-3 top-2.5 text-green-500">
                    <Check size={18} />
                  </div>
                ) : usernameAvailable === false ? (
                  <div className="absolute right-3 top-2.5 text-red-500">
                    <X size={18} />
                  </div>
                ) : null}
              </div>
              {errors.LoginName && <p className="mt-1 text-sm text-red-500">{errors.LoginName}</p>}
              {usernameAvailable === true && formData.LoginName && !errors.LoginName && (
                <p className="mt-1 text-sm text-green-500 flex items-center">
                  <Check size={14} className="mr-1" /> Tên đăng nhập có thể sử dụng
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <div className="flex items-center space-x-6 mt-1">
                {roles.map(role => (
                  <label key={role} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="IsBuildInUser"
                      checked={role === 'Quản trị viên' ? formData.IsBuildInUser : !formData.IsBuildInUser}
                      onChange={() => setFormData(prev => ({ ...prev, IsBuildInUser: role === 'Quản trị viên' }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="Password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="Password"
                  id="Password"
                  value={formData.Password}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.Password ? 'border-red-500' : passwordStrength === 'strong' ? 'border-green-500' : passwordStrength === 'medium' ? 'border-yellow-500' : passwordStrength === 'weak' ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {passwordStrength && (
                  <div className="absolute right-3 top-2.5">
                    <ShieldAlert size={18} className={passwordStrength === 'strong' ? 'text-green-500' : passwordStrength === 'medium' ? 'text-yellow-500' : 'text-red-500'} />
                  </div>
                )}
              </div>
              {errors.Password && <p className="mt-1 text-sm text-red-500">{errors.Password}</p>}
              {passwordStrength && !errors.Password && (
                <div className="mt-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength === 'strong' ? 'bg-green-500 w-full' : passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-1/3'}`}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {passwordStrength === 'strong' ? 'Mật khẩu mạnh' : passwordStrength === 'medium' ? 'Mật khẩu trung bình' : 'Mật khẩu yếu'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              {formData.Password && formData.confirmPassword && formData.Password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-500 flex items-center">
                  <Check size={14} className="mr-1" /> Mật khẩu khớp
                </p>
              )}
            </div>

            {!formData.IsBuildInUser && (
              <div>
                <label htmlFor="MaKhoa" className="block text-sm font-medium text-gray-700 mb-1">
                  Khoa
                </label>
                <select
                  name="MaKhoa"
                  id="MaKhoa"
                  value={formData.MaKhoa}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.MaKhoa ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  disabled={loadingFaculties}
                >
                  <option value="">Chọn khoa</option>
                  {faculties.map(faculty => (
                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                      {faculty.TenKhoa}
                    </option>
                  ))}
                </select>
                {errors.MaKhoa && <p className="mt-1 text-sm text-red-500">{errors.MaKhoa}</p>}
                {loadingFaculties && <p className="mt-1 text-sm text-gray-500">Đang tải danh sách khoa...</p>}
              </div>
            )}

            <div className="col-span-2">
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="NeedChangePassword"
                  name="NeedChangePassword"
                  checked={formData.NeedChangePassword}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="NeedChangePassword" className="ml-2 block text-sm text-gray-700">
                  Yêu cầu đổi mật khẩu khi đăng nhập lần đầu
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Khi tùy chọn này được bật, người dùng sẽ cần đổi mật khẩu khi đăng nhập lần đầu tiên.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              to="/users"
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
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
