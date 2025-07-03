import { useState, useEffect } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useThemeStyles, cx } from '../../utils/theme'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/services/api'

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const styles = useThemeStyles();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate password when it changes
    if (password.length > 0 && password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
    } else {
      setPasswordError('');
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    // Validate password length
    if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      login(response.data.user, response.data.access_token);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);

      // Specific error messages based on response
      if (err.response?.status === 401) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác');
      } else if (err.response?.data?.message) {
        // Parse server error message
        const message = err.response.data.message;

        if (message.includes('password') || message.includes('mật khẩu')) {
          setError('Mật khẩu không chính xác');
        } else if (message.includes('user') || message.includes('username') || message.includes('not found')) {
          setError('Tài khoản không tồn tại');
        } else {
          setError(message);
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi khi đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4 py-12">
        <div className="space-y-2 text-center">
          <img src="/logo_fullname.png" alt="Sign In Image" className="mx-auto h-24 w-72" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Tên đăng nhập"
                required
                className="w-full pl-10 border-gray-300"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                required
                className={`w-full pl-10 pr-10 ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Ghi nhớ đăng nhập
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  )
}

export default SignIn
