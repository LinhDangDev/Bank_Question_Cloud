import { useState } from 'react'
import { Filter, BarChart2, PieChart, TrendingUp, Calendar } from 'lucide-react'

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('all')
  const [department, setDepartment] = useState('')

  // Mock data - would be replaced with API data
  const departments = ['Tất cả', 'Khoa CNTT', 'Khoa Toán', 'Khoa Vật lý', 'Khoa Hóa học', 'Khoa Điện tử']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Phân tích thống kê</h1>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        {/* Time range filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar size={16} className="text-gray-400" />
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
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
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
          >
            <option value="">Chọn khoa</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-800">
              <BarChart2 size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Tổng số câu hỏi</h2>
              <p className="text-2xl font-semibold">356</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp size={14} className="text-green-500 mr-1" />
              <span className="text-xs text-green-500">+24 trong tháng này</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-800">
              <PieChart size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Tổng số đề thi</h2>
              <p className="text-2xl font-semibold">42</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp size={14} className="text-green-500 mr-1" />
              <span className="text-xs text-green-500">+8 trong tháng này</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-800">
              <BarChart2 size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Tổng số khoa</h2>
              <p className="text-2xl font-semibold">5</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-xs text-gray-500">Không thay đổi</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
              <BarChart2 size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Người dùng hoạt động</h2>
              <p className="text-2xl font-semibold">18</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp size={14} className="text-green-500 mr-1" />
              <span className="text-xs text-green-500">+3 trong tháng này</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Question Distribution by Subject */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Phân bố câu hỏi theo môn học</h2>
          <div className="h-80 flex items-center justify-center">
            {/* Placeholder for chart - would use a library like Chart.js or Recharts */}
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 flex items-end space-x-6">
                <div className="flex-1 flex flex-col items-center">
                  <div className="bg-blue-500 w-full" style={{ height: '65%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">CNTT</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="bg-green-500 w-full" style={{ height: '40%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Toán</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="bg-yellow-500 w-full" style={{ height: '30%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Vật lý</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="bg-purple-500 w-full" style={{ height: '25%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Hóa học</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="bg-red-500 w-full" style={{ height: '15%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Điện tử</p>
                </div>
              </div>
              <div className="h-10 border-t mt-4 flex items-center justify-center">
                <span className="text-sm text-gray-500">Số lượng câu hỏi: 356</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Creation Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tạo câu hỏi theo thời gian</h2>
          <div className="h-80 flex items-center justify-center">
            {/* Placeholder for chart - would use a library like Chart.js or Recharts */}
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 flex items-end space-x-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 w-full"
                      style={{ height: `${Math.floor(Math.random() * 70) + 10}%` }}
                    ></div>
                    <p className="mt-2 text-xs text-gray-600">{`T${index + 1}`}</p>
                  </div>
                ))}
              </div>
              <div className="h-10 border-t mt-4 flex items-center justify-center">
                <span className="text-sm text-gray-500">Năm 2023</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Thống kê hệ thống</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khoa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Môn học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số câu hỏi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số đề thi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày cập nhật gần nhất
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Khoa CNTT
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Lập trình Web
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  85
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  12
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  10/04/2023
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Khoa CNTT
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Mạng máy tính
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  64
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  8
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  15/03/2023
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Khoa Toán
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Đại số
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  72
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  6
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  22/02/2023
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Khoa Vật lý
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Vật lý đại cương
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  58
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  5
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  05/04/2023
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics
