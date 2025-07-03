import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Bell, Eye, EyeOff, Calendar, Mail, BookUser, Building, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/api';
import PageContainer from '@/components/PageContainer';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  userId: string;
  loginName: string;
  hoTen: string;
  email: string;
  role: string;
  khoa: {
    maKhoa: string;
    tenKhoa: string;
  } | null;
  isActive: boolean;
  createdDate: string;
  lastActivityDate: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getDetailedProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  // Function to check password strength and requirements
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordRequirements({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false
      });
      return;
    }

    setPasswordRequirements({
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    });
  };

  // Update password strength check when password changes
  useEffect(() => {
    checkPasswordStrength(newPassword);
  }, [newPassword]);

  // Calculate password strength score
  const getPasswordStrength = () => {
    if (!newPassword) return 0;

    const { length, lowercase, uppercase, number, special } = passwordRequirements;
    let score = 0;

    if (length) score += 1;
    if (lowercase) score += 1;
    if (uppercase) score += 1;
    if (number) score += 1;
    if (special) score += 1;

    return score;
  };

  // Get strength class for styling
  const getStrengthClass = () => {
    const score = getPasswordStrength();
    if (score === 0) return '';
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get strength text
  const getStrengthText = () => {
    const score = getPasswordStrength();
    if (score === 0) return '';
    if (score <= 2) return 'Yếu';
    if (score <= 3) return 'Trung bình';
    return 'Mạnh';
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    // Check if password meets minimum requirements
    const score = getPasswordStrength();
    if (score <= 2) {
      toast.error('Mật khẩu quá yếu, vui lòng thực hiện theo các yêu cầu');
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'teacher':
        return 'Giảng viên';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <PageContainer className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </PageContainer>
    );
  }
  return (
    <PageContainer className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Quản lý cài đặt tài khoản và tùy chọn cá nhân của bạn
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="inline-flex h-auto p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="account" className="px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Tài khoản</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bảo mật</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Thông báo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                  Xem chi tiết thông tin tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-blue-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold mb-4">
                      {profile?.hoTen?.charAt(0) || 'U'}
                    </div>
                    <h3 className="text-xl font-medium mb-1">{profile?.hoTen || 'User'}</h3>
                    <p className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      {getRoleDisplayName(profile?.role || '')}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-500">Họ và tên</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                          <BookUser size={16} className="text-gray-500" />
                          <span>{profile?.hoTen || ''}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                          <Mail size={16} className="text-gray-500" />
                          <span>{profile?.email || ''}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-500">Khoa</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                          <Building size={16} className="text-gray-500" />
                          <span>{profile?.khoa?.tenKhoa || 'Chưa được phân khoa'}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-500">Ngày tạo tài khoản</Label>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                          <Calendar size={16} className="text-gray-500" />
                          <span>{formatDate(profile?.createdDate || '')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t px-6 py-4">
                <p className="text-sm text-gray-500">
                  Để thay đổi thông tin tài khoản, vui lòng liên hệ với quản trị viên hệ thống.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Thay đổi mật khẩu
                </CardTitle>
                <CardDescription>
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="font-medium">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="text"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="font-medium">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="text"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Password strength meter */}
                    {newPassword && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Độ mạnh mật khẩu: <span className={`font-bold ${getStrengthClass() === 'bg-red-500' ? 'text-red-500' : getStrengthClass() === 'bg-yellow-500' ? 'text-yellow-500' : 'text-green-500'}`}>{getStrengthText()}</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getStrengthClass()}`} style={{ width: `${(getPasswordStrength() / 5) * 100}%` }}></div>
                        </div>

                        {/* Password requirements */}
                        <div className="bg-gray-50 border rounded-md p-3 space-y-1.5">
                          <p className="text-xs font-semibold mb-2">Mật khẩu cần:</p>
                          <div className="grid grid-cols-1 gap-1">
                            <div className="flex items-center gap-2 text-xs">
                              {passwordRequirements.length ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <X size={14} className="text-red-500" />
                              )}
                              <span className={passwordRequirements.length ? "text-green-700" : "text-gray-600"}>Ít nhất 6 ký tự</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {passwordRequirements.lowercase ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <X size={14} className="text-red-500" />
                              )}
                              <span className={passwordRequirements.lowercase ? "text-green-700" : "text-gray-600"}>Ít nhất 1 chữ thường (a-z)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {passwordRequirements.uppercase ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <X size={14} className="text-red-500" />
                              )}
                              <span className={passwordRequirements.uppercase ? "text-green-700" : "text-gray-600"}>Ít nhất 1 chữ hoa (A-Z)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {passwordRequirements.number ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <X size={14} className="text-red-500" />
                              )}
                              <span className={passwordRequirements.number ? "text-green-700" : "text-gray-600"}>Ít nhất 1 chữ số (0-9)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {passwordRequirements.special ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <X size={14} className="text-red-500" />
                              )}
                              <span className={passwordRequirements.special ? "text-green-700" : "text-gray-600"}>Ít nhất 1 ký tự đặc biệt (!@#$...)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-medium">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="text"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-start pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex items-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Đang thay đổi...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Thay đổi mật khẩu</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Cài đặt thông báo
                </CardTitle>
                <CardDescription>
                  Quản lý thông báo và cách hệ thống liên hệ với bạn
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Thông báo qua email
                      </h3>
                      <p className="text-sm text-gray-500">Nhận thông báo về hoạt động hệ thống qua email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-600" />
                        Thông báo hệ thống
                      </h3>
                      <p className="text-sm text-gray-500">Hiển thị thông báo trên giao diện hệ thống</p>
                    </div>
                    <Switch
                      checked={systemNotifications}
                      onCheckedChange={setSystemNotifications}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-start pt-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Lưu cài đặt thông báo</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Settings;
