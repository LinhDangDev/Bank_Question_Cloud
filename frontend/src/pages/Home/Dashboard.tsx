import { useState, useEffect } from 'react';
import PageContainer from '../../components/ui/PageContainer';
import {
  Filter, BarChart2, PieChart, TrendingUp, Calendar,
  Users, FileText, Loader2, Book, Clock, RefreshCw,
  CheckCircle, AlertCircle, BookOpen, HelpCircle, Database, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { dashboardService, type DashboardStats } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [selectedRange, setSelectedRange] = useState('week');
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Departments (would come from API)
  const departments = ['Tất cả', 'Khoa CNTT', 'Khoa Toán', 'Khoa Vật lý', 'Khoa Hóa học', 'Khoa Điện tử'];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <p className="text-lg text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.name ? `Xin chào, ${user.name}` : 'Xin chào'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        {/* Time range filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar size={16} className="text-gray-400" />
          </div>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none dark:bg-gray-800 dark:text-white dark:border-gray-700"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="quarter">3 tháng qua</option>
            <option value="year">1 năm qua</option>
          </select>
        </div>

        {/* Department filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter size={16} className="text-gray-400" />
          </div>
          <select
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none dark:bg-gray-800 dark:text-white dark:border-gray-700"
          >
            <option value="">Chọn khoa</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <HelpCircle size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số câu hỏi</h2>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold dark:text-gray-100">{dashboardData?.questionsCount || 0}</p>
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">+24</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp size={14} className="text-green-500 mr-1" />
                <span className="text-xs text-green-500">+5.6% so với tuần trước</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigateTo('/questions')}>
                Chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <FileText size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số đề thi</h2>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold dark:text-gray-100">{dashboardData?.examsCount || 0}</p>
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">+8</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp size={14} className="text-green-500 mr-1" />
                <span className="text-xs text-green-500">+3.2% so với tuần trước</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigateTo('/exams')}>
                Chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Database size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số môn học</h2>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold dark:text-gray-100">{dashboardData?.subjectsCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Không thay đổi</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigateTo('/subjects')}>
                Chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Người dùng hoạt động</h2>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold dark:text-gray-100">{dashboardData?.activeUsersCount || 0}</p>
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">+3</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp size={14} className="text-green-500 mr-1" />
                <span className="text-xs text-green-500">+1.5% so với tuần trước</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigateTo('/users')}>
                Chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-800">
                <EyeOff size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Câu hỏi chờ duyệt</h2>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold">{dashboardData?.pendingQuestions || 0}</p>
                  {(dashboardData?.pendingQuestions || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">Cần xử lý</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-amber-300 hover:bg-amber-50"
                onClick={() => navigateTo('/questions/pending')}
              >
                Xem câu hỏi chờ duyệt
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-800">
                <FileText size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Đề thi chờ duyệt</h2>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold">{dashboardData?.pendingExams || 0}</p>
                  {(dashboardData?.pendingExams || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">Cần xử lý</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-amber-300 hover:bg-amber-50"
                onClick={() => navigateTo('/exams/pending')}
              >
                Xem đề thi chờ duyệt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left side: 2/3 width for charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="distribution">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">Phân tích dữ liệu</h2>
                  <TabsList>
                    <TabsTrigger value="distribution">Phân bố câu hỏi</TabsTrigger>
                    <TabsTrigger value="timeline">Thời gian</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="distribution" className="pt-4">
                  <div className="h-80 flex items-center justify-center">
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 flex items-end space-x-6">
                        {dashboardData?.questionsPerSubject?.map((item, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full rounded-t-md"
                              style={{
                                height: `${(item.count / Math.max(...dashboardData.questionsPerSubject.map(s => s.count))) * 65}%`,
                                backgroundColor: item.color
                              }}
                            ></div>
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{item.subject}</p>
                            <p className="text-sm font-semibold">{item.count}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-10 border-t dark:border-gray-700 mt-4 flex items-center justify-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Tổng số câu hỏi: {dashboardData?.questionsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                  <div className="h-80 flex items-center justify-center">
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 flex items-end space-x-2">
                        {dashboardData?.questionsOverTime?.map((item, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-blue-500 w-full rounded-t-md"
                              style={{
                                height: `${(item.count / Math.max(...dashboardData.questionsOverTime.map(m => m.count))) * 70}%`
                              }}
                            ></div>
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{item.month}</p>
                            <p className="text-sm font-semibold">{item.count}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-10 border-t dark:border-gray-700 mt-4 flex items-center justify-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Năm 2023 - 2024</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Thống kê hệ thống</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Khoa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Môn học
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Số câu hỏi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Số đề thi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cập nhật gần nhất
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dashboardData?.systemOverview?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.faculty}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.subject}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.questionCount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.examCount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.lastUpdated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side: 1/3 width for recent activities and other widgets */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Hoạt động gần đây</h2>
              <div className="space-y-4">
                {dashboardData?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center">
                        {activity.action.includes('tạo') ? (
                          <FileText size={16} />
                        ) : activity.action.includes('cập nhật') ? (
                          <RefreshCw size={16} />
                        ) : activity.action.includes('xóa') ? (
                          <AlertCircle size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium dark:text-white">{activity.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Clock size={12} className="mr-1" />{activity.timeAgo}
                        {activity.user && <span className="ml-2">bởi {activity.user}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Tóm tắt thống kê</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Câu hỏi chờ duyệt</span>
                  <span className="text-sm font-semibold dark:text-white">{dashboardData?.pendingQuestions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Đề thi chờ duyệt</span>
                  <span className="text-sm font-semibold dark:text-white">{dashboardData?.pendingExams || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Tổng số khoa</span>
                  <span className="text-sm font-semibold dark:text-white">{dashboardData?.facultiesCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Tổng số môn học</span>
                  <span className="text-sm font-semibold dark:text-white">{dashboardData?.subjectsCount || 0}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateTo('/questions/import')}
                >
                  Nhập câu hỏi mới
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
