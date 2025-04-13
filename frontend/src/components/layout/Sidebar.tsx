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
} from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  return (
    <nav
      className="fixed top-0 left-0 h-screen bg-white text-gray-800 p-4 z-[51] transition-all duration-300 shadow-sm flex flex-col"
      style={{ width: isExpanded ? '200px' : '64px' }}
    >
      {/* Header with logo */}
      <div className=" flex items-center justify-center relative -mx-1">
        <img
          src="/logo_fullname.png"
          alt="logo"
          className={`w-[90%] max-w-[180px] ${!isExpanded && 'hidden'}`}
        />
        <img
          src="/logo_icon.png"
          alt="logo"
          className={`w-12 ${isExpanded && 'hidden'}`}
        />
      </div>

      {/* Menu sections */}
      <div className="space-y-6 mt-8 overflow-y-auto flex-grow">
        {/* Home section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold text-gray-500 mb-2 ${
              !isExpanded && 'sr-only'
            }`}
          >
            Home
          </h2>
          <div className="space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Dashboard
              </span>
            </Link>
            <Link
              to="/explore"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <Search className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>Explore</span>
            </Link>
          </div>
        </div>

        {/* Đề section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold text-gray-500 mb-2 ${
              !isExpanded && 'sr-only'
            }`}
          >
            Đề
          </h2>
          <div className="space-y-2">
            <Link
              to="/faculty"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <Users className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                List Khoa
              </span>
            </Link>
            <Link
              to="/exams"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <List className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>List Đề</span>
            </Link>
          </div>
        </div>

        {/* Câu Hỏi section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold text-gray-500 mb-2 ${
              !isExpanded && 'sr-only'
            }`}
          >
            Câu Hỏi
          </h2>
          <div className="space-y-2">
            <Link
              to="/questions"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <List className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Danh sách câu hỏi
              </span>
            </Link>
            <Link
              to="/create-question"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Tạo câu hỏi
              </span>
            </Link>
            <Link
              to="/upload-questions"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Tải lên câu hỏi
              </span>
            </Link>
          </div>
        </div>

        {/* Công cụ section */}
        <div>
          <h2
            className={`text-xs uppercase font-semibold text-gray-500 mb-2 ${
              !isExpanded && 'sr-only'
            }`}
          >
            Công cụ
          </h2>
          <div className="space-y-2">
            <Link
              to="/pdf"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Xuất file PDF
              </span>
            </Link>
            <Link
              to="/extract"
              className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                !isExpanded ? 'justify-center' : ''
              }`}
            >
              <Download className="w-5 h-5" />
              <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                Rút trích đề thi
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Toggle button at bottom */}
      <div className={`mt-auto pt-4 flex ${isExpanded ? 'justify-end pr-0' : 'justify-center'}`}>
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <PanelRightClose
            className="h-5 w-5 text-gray-600"
            style={{ transform: isExpanded ? 'none' : 'rotate(180deg)' }}
          />
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
