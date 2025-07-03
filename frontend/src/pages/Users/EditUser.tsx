import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { userApi, khoaApi, authApi } from '@/services/api'
import { useThemeStyles, cx } from '../../utils/theme'
import { useAuth } from '../../context/AuthContext'

interface Khoa {
  MaKhoa: string;
  TenKhoa: string;
}

interface UserData {
  MaNguoiDung: string;
  TenDangNhap: string;
  Email: string;
  HoTen: string;
  LaNguoiDungHeThong: boolean;
  DaXoa: boolean;
  BiKhoa: boolean;
  MaKhoa?: string;
  Khoa?: Khoa;
}

const EditUser = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const styles = useThemeStyles()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    HoTen: '',
    Email: '',
    TenDangNhap: '',
    LaNguoiDungHeThong: false,
    MaKhoa: '',
    DaXoa: false,
    BiKhoa: false,
    resetPassword: false,
    newPassword: '',
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [faculties, setFaculties] = useState<Khoa[]>([])
  const [loadingFaculties, setLoadingFaculties] = useState(false)

  const roles = ['Quản trị viên', 'Giảng viên']

  // Fetch faculties
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

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await userApi.getById(id);
        const userData = response.data as UserData;

        setFormData({
          HoTen: userData.HoTen,
          Email: userData.Email,
          TenDangNhap: userData.TenDangNhap,
          LaNguoiDungHeThong: userData.LaNguoiDungHeThong,
          MaKhoa: userData.MaKhoa || '',
          DaXoa: userData.DaXoa,
          BiKhoa: userData.BiKhoa,
          resetPassword: false,
          newPassword: '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Không thể tải thông tin người dùng');
        navigate('/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.HoTen.trim()) {
      newErrors.HoTen = 'Tên người dùng không được để trống';
    }

    if (!formData.Email.trim()) {
      newErrors.Email = 'Email không được để trống';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.Email)) {
      newErrors.Email = 'Email không hợp lệ';
    }

    if (!formData.TenDangNhap.trim()) {
      newErrors.TenDangNhap = 'Tên đăng nhập không được để trống';
    }

    if (!formData.LaNguoiDungHeThong && !formData.MaKhoa) {
      newErrors.MaKhoa = 'Vui lòng chọn khoa cho giảng viên';
    }

    if (formData.resetPassword && !formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.resetPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const updateData = {
          HoTen: formData.HoTen,
          Email: formData.Email,
          TenDangNhap: formData.TenDangNhap,
          LaNguoiDungHeThong: formData.LaNguoiDungHeThong,
          MaKhoa: formData.LaNguoiDungHeThong ? null : formData.MaKhoa,
          DaXoa: formData.DaXoa,
          BiKhoa: formData.BiKhoa
        };

        await userApi.update(id as string, updateData);

        // If reset password is checked, update password
        if (formData.resetPassword && formData.newPassword) {
          await userApi.changePassword(id as string, formData.newPassword);
        }

        toast.success('Cập nhật thông tin người dùng thành công!');
        navigate('/users');
      } catch (error: any) {
        console.error('Error updating user:', error);
        if (error.response?.data?.message?.includes('username or email already exists')) {
          toast.error('Tên đăng nhập hoặc email đã tồn tại!');
          setErrors(prev => ({
            ...prev,
            TenDangNhap: 'Tên đăng nhập hoặc email đã tồn tại',
            Email: 'Tên đăng nhập hoặc email đã tồn tại'
          }));
        } else {
          toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin người dùng');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Force logout user
  const handleForceLogout = async () => {
    if (!id) return;

    if (window.confirm('Bạn có chắc chắn muốn đăng xuất người dùng này?')) {
      try {
        const response = await authApi.forceLogout(id);
        if (response.data?.success) {
          toast.success('Đã đăng xuất người dùng thành công!');
        } else {
          toast.error(response.data?.message || 'Không thể đăng xuất người dùng');
        }
      } catch (error: any) {
        console.error('Error forcing logout:', error);
        toast.error(error.response?.data?.message || 'Không thể đăng xuất người dùng');
      }
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Bạn không có quyền truy cập trang này.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link to="/users" className="mr-4 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa người dùng</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name field */}
            <div>
              <label htmlFor="HoTen" className="block text-sm font-medium text-gray-700 mb-1">
                Tên người dùng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="HoTen"
                name="HoTen"
                value={formData.HoTen}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.HoTen ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.HoTen && <p className="mt-1 text-red-500 text-sm">{errors.HoTen}</p>}
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="Email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="Email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.Email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.Email && <p className="mt-1 text-red-500 text-sm">{errors.Email}</p>}
            </div>

            {/* Login Name field */}
            <div>
              <label htmlFor="TenDangNhap" className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="TenDangNhap"
                name="TenDangNhap"
                value={formData.TenDangNhap}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.TenDangNhap ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.TenDangNhap && <p className="mt-1 text-red-500 text-sm">{errors.TenDangNhap}</p>}
            </div>

            {/* Role field - Read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className={`w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 ${
                  errors.LaNguoiDungHeThong ? 'border-red-500' : 'border-gray-300'
                }`}>
                  {formData.LaNguoiDungHeThong ? 'Quản trị viên' : 'Giảng viên'}
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none rounded-r-lg text-xs text-gray-500">
                  Không thể thay đổi
                </div>
              </div>
            </div>

            {/* Faculty field - Only for teachers */}
            {!formData.LaNguoiDungHeThong && (
              <div>
                <label htmlFor="MaKhoa" className="block text-sm font-medium text-gray-700 mb-1">
                  Khoa <span className="text-red-500">*</span>
                </label>
                <select
                  id="MaKhoa"
                  name="MaKhoa"
                  value={formData.MaKhoa}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none ${
                    errors.MaKhoa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loadingFaculties}
                >
                  <option value="">Chọn khoa</option>
                  {faculties.map(faculty => (
                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>{faculty.TenKhoa}</option>
                  ))}
                </select>
                {errors.MaKhoa && <p className="mt-1 text-red-500 text-sm">{errors.MaKhoa}</p>}
                {loadingFaculties && <p className="mt-1 text-sm text-gray-500">Đang tải danh sách khoa...</p>}
              </div>
            )}

            {/* Reset Password */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="resetPassword"
                  name="resetPassword"
                  checked={formData.resetPassword}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="resetPassword" className="ml-2 block text-sm text-gray-700">
                  Đặt lại mật khẩu
                </label>
              </div>

              {formData.resetPassword && (
                <div>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu mới"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.newPassword && <p className="mt-1 text-red-500 text-sm">{errors.newPassword}</p>}
                </div>
              )}
            </div>

            {/* Active status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="IsDeleted"
                checked={!formData.DaXoa}
                onChange={(e) => setFormData(prev => ({ ...prev, DaXoa: !e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Tài khoản hoạt động
              </label>
            </div>

            {/* Force logout button */}
            <div className="col-span-2 md:col-span-1">
              <button
                type="button"
                onClick={handleForceLogout}
                className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                Đăng xuất người dùng này
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Link
              to="/users"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-2"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
              disabled={isSubmitting}
            >
              <Save size={18} className="mr-2" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUser
