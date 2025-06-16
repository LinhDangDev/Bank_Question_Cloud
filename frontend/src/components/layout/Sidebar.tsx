import { Link } from 'react-router-dom';
import {
  PanelRightClose,
  LayoutDashboard,
  Search,
  Users,
  List,
  PlusCircle,
  Upload,
  FileText,
  Download,
  Settings,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav
      className={`fixed top-0 left-0 h-screen p-4 z-[51] transition-all duration-300 shadow-sm flex flex-col ${
        isDark
          ? 'bg-gray-800 text-gray-200'
          : 'bg-white text-gray-800'
      }`}
      style={{ width: isExpanded ? '200px' : '64px', overflowY: 'hidden' }}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-center relative -mx-1">
        <img
          src="/logo_fullname.png"
          alt="Logo"
          className={`w-[90%] max-w-[180px] ${!isExpanded && 'hidden'}`}
        />
        <img
          src="/logo_icon.png"
          alt="Logo Icon"
          className={`w-12 ${isExpanded && 'hidden'}`}
        />
      </div>

      {/* Menu sections */}
      <div className="space-y-2 mt-5 flex-grow overflow-hidden hover:overflow-y-auto">
        {/* Home section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Home
          </h2>
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Dashboard
              </span>
            </Link>
            <Link
              to="/search"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Tìm kiếm nhanh"
            >
              <Search className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Tìm kiếm nhanh
              </span>
            </Link>
          </div>
        </div>

        {/* Đề section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Đề
          </h2>
          <div className="space-y-1">
            <Link
              to="/faculty"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Danh sách khoa"
            >
              <Users className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Danh sách khoa
              </span>
            </Link>
            <Link
              to="/exams"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Danh sách đề"
            >
              <List className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Danh sách đề
              </span>
            </Link>
          </div>
        </div>

        {/* Câu Hỏi section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Câu Hỏi
          </h2>
          <div className="space-y-1">
            <Link
              to="/questions"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Danh sách câu hỏi"
            >
              <List className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Danh sách câu hỏi
              </span>
            </Link>
            <Link
              to="/questions/create"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Tạo câu hỏi"
            >
              <PlusCircle className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Tạo câu hỏi
              </span>
            </Link>
            <Link
              to="/questions/upload"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Tải lên câu hỏi"
            >
              <Upload className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Tải lên câu hỏi
              </span>
            </Link>
          </div>
        </div>

        {/* Quản lý người dùng section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Quản lý người dùng
          </h2>
          <div className="space-y-1">
            <Link
              to="/users"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Danh sách người dùng"
            >
              <Users className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Danh sách người dùng
              </span>
            </Link>
            <Link
              to="/add-user"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Thêm người dùng"
            >
              <PlusCircle className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Thêm người dùng
              </span>
            </Link>
          </div>
        </div>

        {/* Công cụ section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Công cụ
          </h2>
          <div className="space-y-1">
            <Link
              to="/pdf"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Xuất file PDF"
            >
              <FileText className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Xuất file PDF
              </span>
            </Link>
            <Link
              to="/extract"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Rút trích đề thi"
            >
              <Download className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Rút trích đề thi
              </span>
            </Link>
          </div>
        </div>

        {/* Hỗ trợ section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Hỗ trợ
          </h2>
          <div className="space-y-1">
            <Link
              to="/help"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Hướng dẫn sử dụng"
            >
              <BookOpen className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Hướng dẫn sử dụng
              </span>
            </Link>
            <Link
              to="/feedback"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Gửi phản hồi"
            >
              <MessageSquare className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Gửi phản hồi
              </span>
            </Link>
          </div>
        </div>

        {/* Cài đặt section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold mb-1 ${
              !isExpanded && 'sr-only'
            } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Cài đặt
          </h2>
          <div className="space-y-1">
            <Link
              to="/settings"
              className={`flex items-center px-2 py-2 text-sm rounded-lg ${
                !isExpanded ? 'justify-center' : ''
              } ${isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
              }`}
              aria-label="Cài đặt hệ thống"
            >
              <Settings className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Cài đặt hệ thống
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Toggle button at bottom */}
      <div className={`mt-auto pt-4 flex ${isExpanded ? 'justify-end pr-0' : 'justify-center'}`}>
        <button
          onClick={onToggle}
          className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-200`}
          aria-label="Toggle sidebar"
        >
          <PanelRightClose
            className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            style={{ transform: isExpanded ? 'none' : 'rotate(180deg)' }}
          />
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
