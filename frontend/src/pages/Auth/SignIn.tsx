import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useThemeStyles, cx } from '../../utils/theme'

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false)
  const styles = useThemeStyles();

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4 py-12">
        <div className="space-y-2 text-center">
          <img src="/logo_fullname.png" alt="Sign In Image" className="mx-auto h-24 w-72" />
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Account"
                required
                className="w-full pl-10"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="w-full pl-10 pr-10"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className={cx(
                "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                styles.isDark ? "bg-gray-700 border-gray-600" : ""
              )}
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}

export default SignIn
