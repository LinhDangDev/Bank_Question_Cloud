import { useState } from 'react';
import { Eye, EyeOff, Key, Save, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userApi } from '@/services/api';

const FirstTimePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordStrength === 'weak') {
      setError('Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn');
      return;
    }

    setLoading(true);

    try {
      if (!user?.userId) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      await userApi.changePassword(user.userId, password);

      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');

      // Đăng xuất để người dùng đăng nhập lại với mật khẩu mới
      logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Error changing password:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <img src="/logo_fullname.png" alt="Logo" className="mx-auto h-16" />
          <h1 className="text-2xl font-bold">Đổi mật khẩu lần đầu</h1>
          <p className="text-gray-500">
            Bạn cần đổi mật khẩu trước khi có thể sử dụng hệ thống
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-10 border ${
                    error && !confirmPassword ? 'border-red-500' :
                    passwordStrength === 'strong' ? 'border-green-500' :
                    passwordStrength === 'medium' ? 'border-yellow-500' :
                    passwordStrength === 'weak' ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu mới"
                  required
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {passwordStrength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        passwordStrength === 'strong' ? 'bg-green-500 w-full' :
                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-red-500 w-1/3'
                      }`}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs flex items-center">
                    <ShieldAlert size={14} className={`mr-1 ${
                      passwordStrength === 'strong' ? 'text-green-500' :
                      passwordStrength === 'medium' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    {passwordStrength === 'strong' ? 'Mật khẩu mạnh' :
                     passwordStrength === 'medium' ? 'Mật khẩu trung bình' :
                     'Mật khẩu yếu'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 border ${
                    error && password && password !== confirmPassword ? 'border-red-500' :
                    password && password === confirmPassword ? 'border-green-500' :
                    'border-gray-300'
                  }`}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {password && confirmPassword && password === confirmPassword && (
                <p className="mt-1 text-xs text-green-500">Mật khẩu khớp</p>
              )}
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center"
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu mật khẩu mới
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={logout}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstTimePassword;
