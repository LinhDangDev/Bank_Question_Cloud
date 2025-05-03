import { useState } from 'react'
import { Save, Lock, User, Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account')
  const { theme, setTheme } = useTheme()
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    questionUpdates: true,
    examUpdates: true,
    systemUpdates: false
  })
  const [accountSettings, setAccountSettings] = useState({
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    role: 'Quản trị viên',
    department: 'Khoa CNTT'
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark')
  }

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAccountSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    setIsSaving(true)

    // Mock saving settings
    setTimeout(() => {
      console.log('Saved settings:', {
        theme,
        notificationSettings,
        accountSettings,
        passwordData: passwordData.newPassword ? 'Updated' : 'Unchanged'
      })

      setIsSaving(false)
      setSaveSuccess(true)

      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      // Hide success message after some time
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1000)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cài đặt hệ thống</h1>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md">
          Cài đặt đã được lưu thành công!
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'account'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User size={16} className="mr-2" />
            Tài khoản
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'security'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock size={16} className="mr-2" />
            Bảo mật
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'notifications'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell size={16} className="mr-2" />
            Thông báo
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-3 font-medium text-sm flex items-center ${
              activeTab === 'appearance'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {theme === 'light' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
            Giao diện
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* Account settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Thông tin tài khoản</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={accountSettings.name}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={accountSettings.email}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi.</p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={accountSettings.role}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                    disabled
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Khoa
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={accountSettings.department}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                    disabled
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Để thay đổi vai trò hoặc khoa, vui lòng liên hệ với quản trị viên hệ thống.
                </p>
              </div>
            </div>
          )}

          {/* Security settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Đổi mật khẩu</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                  <li>Ít nhất 8 ký tự</li>
                  <li>Ít nhất 1 chữ hoa</li>
                  <li>Ít nhất 1 chữ thường</li>
                  <li>Ít nhất 1 số hoặc ký tự đặc biệt</li>
                </ul>
              </div>
            </div>
          )}

          {/* Notification settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Cài đặt thông báo</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailNotifications"
                      name="emailNotifications"
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                      Thông báo qua email
                    </label>
                    <p className="text-gray-500">Nhận thông báo quan trọng qua email.</p>
                  </div>
                </div>

                <div className="pl-7 space-y-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="questionUpdates"
                        name="questionUpdates"
                        type="checkbox"
                        checked={notificationSettings.questionUpdates}
                        onChange={handleNotificationChange}
                        disabled={!notificationSettings.emailNotifications}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="questionUpdates" className={`font-medium ${notificationSettings.emailNotifications ? 'text-gray-700' : 'text-gray-400'}`}>
                        Cập nhật câu hỏi
                      </label>
                      <p className={notificationSettings.emailNotifications ? 'text-gray-500' : 'text-gray-400'}>
                        Thông báo khi có câu hỏi mới được thêm hoặc cập nhật.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="examUpdates"
                        name="examUpdates"
                        type="checkbox"
                        checked={notificationSettings.examUpdates}
                        onChange={handleNotificationChange}
                        disabled={!notificationSettings.emailNotifications}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="examUpdates" className={`font-medium ${notificationSettings.emailNotifications ? 'text-gray-700' : 'text-gray-400'}`}>
                        Cập nhật đề thi
                      </label>
                      <p className={notificationSettings.emailNotifications ? 'text-gray-500' : 'text-gray-400'}>
                        Thông báo khi có đề thi mới được tạo hoặc cập nhật.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="systemUpdates"
                        name="systemUpdates"
                        type="checkbox"
                        checked={notificationSettings.systemUpdates}
                        onChange={handleNotificationChange}
                        disabled={!notificationSettings.emailNotifications}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="systemUpdates" className={`font-medium ${notificationSettings.emailNotifications ? 'text-gray-700' : 'text-gray-400'}`}>
                        Cập nhật hệ thống
                      </label>
                      <p className={notificationSettings.emailNotifications ? 'text-gray-500' : 'text-gray-400'}>
                        Thông báo về các bản cập nhật và bảo trì hệ thống.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Cài đặt giao diện</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chủ đề
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer flex items-center ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={20} className="text-yellow-500 mr-3" />
                    <div>
                      <p className="font-medium">Chủ đề sáng</p>
                      <p className="text-sm text-gray-500">Giao diện với nền sáng và văn bản tối.</p>
                    </div>
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer flex items-center ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={20} className="text-indigo-600 mr-3" />
                    <div>
                      <p className="font-medium">Chủ đề tối</p>
                      <p className="text-sm text-gray-500">Giao diện với nền tối và văn bản sáng.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other appearance settings can be added here */}
            </div>
          )}

          {/* Save button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
