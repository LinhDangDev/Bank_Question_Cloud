import { Bell, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  isExpanded: boolean
}

const Header = ({ isExpanded }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme()
  const [hasNotifications, setHasNotifications] = useState(true)
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mock notification data
  const notifications = [
    { id: 1, text: 'Câu hỏi mới đã được thêm vào hệ thống', time: '5 phút trước' },
    { id: 2, text: 'Đề thi Mạng máy tính vừa được cập nhật', time: '1 giờ trước' },
    { id: 3, text: 'Người dùng mới đã được thêm vào hệ thống', time: '3 giờ trước' },
  ]

  const clearNotifications = () => {
    setHasNotifications(false)
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <header
      className="fixed right-0 z-50 flex h-16 items-center justify-end border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-6 transition-all duration-300"
      style={{ left: isExpanded ? '200px' : '64px' }}
    >
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Sun className="h-5 w-5 text-gray-300" />
          )}
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2" aria-label="Notifications">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">Thông báo</span>
              {hasNotifications && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification.id} className="px-4 py-3 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <p className="text-sm">{notification.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Không có thông báo mới
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Xem tất cả thông báo
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-1">
            <Avatar>
              <AvatarImage src="/logo_icon.png" alt="Admin avatar" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-black dark:text-white">
              {user?.name || 'Admin'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 ml-2">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'teacher' ? 'Teacher' : ''}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
