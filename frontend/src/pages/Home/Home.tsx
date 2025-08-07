import PageContainer from '../../components/ui/PageContainer';
import { Database, Book, Users, FileText, BookOpen, Search, Upload, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-6">
          <Database size={48} className="text-white" />
        </div>

        <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Chào mừng đến với Ngân hàng Câu hỏi
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">
          Hệ thống quản lý và tạo ngân hàng câu hỏi trắc nghiệm cho các khoa, giảng viên và sinh viên
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mb-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
            <Book size={36} className="text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Kho câu hỏi đa dạng</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Hơn 350+ câu hỏi trắc nghiệm chất lượng cao từ nhiều môn học khác nhau
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
            <FileText size={36} className="text-green-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Tạo đề thi dễ dàng</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tạo và quản lý các đề thi với nhiều cấu trúc và mức độ khác nhau
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
            <Search size={36} className="text-purple-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Tìm kiếm thông minh</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Dễ dàng tìm kiếm câu hỏi theo nhiều tiêu chí khác nhau
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mb-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="mr-2 text-blue-500" size={24} />
              Bắt đầu sử dụng
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">1</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Duyệt qua các khoa và môn học</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">2</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Tìm kiếm câu hỏi phù hợp</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">3</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Tạo đề thi theo yêu cầu</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2 text-green-500" size={24} />
              Công cụ chính
            </h3>
            <div className="space-y-3">
              <Link to="/questions" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Book size={18} className="mr-2" />
                  Quản lý câu hỏi
                </Button>
              </Link>
              <Link to="/exams" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText size={18} className="mr-2" />
                  Quản lý đề thi
                </Button>
              </Link>
              <Link to="/questions/upload" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Upload size={18} className="mr-2" />
                  Nhập câu hỏi từ Word
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Users size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-2">Trang thống kê chi tiết</h3>
                <p className="text-blue-700 dark:text-blue-400 mb-4">
                  Bạn muốn xem thông tin chi tiết về ngân hàng câu hỏi? Hãy truy cập trang Dashboard để xem các báo cáo và thống kê.
                </p>
                <Link to="/dashboard">
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                    Đi đến Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Home;
