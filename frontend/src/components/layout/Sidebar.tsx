import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Home, Database, HelpCircle, Settings } from 'lucide-react'

interface SidebarProps {
  isExpanded: boolean
  onToggle: () => void
}

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed z-60 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2431] text-white transition-all duration-300"
        style={{
          left: isExpanded ? '190px' : '44px',
          bottom: '20px',
          transform: isExpanded ? 'none' : 'rotate(180deg)'
        }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <nav className="fixed top-0 left-0 h-full bg-[#1B2431] text-white p-4 z-[51] transition-all duration-300"
        style={{ width: isExpanded ? '200px' : '64px' }}
      >
        <div className="mb-2 px-2">
          <img
            src="/logo_fullname.png"
            alt="logo"
            className={`w-full ${!isExpanded && 'hidden'}`}
          />
          <img
            src="/logo_icon.png"
            alt="logo"
            className={`w-8 ${isExpanded && 'hidden'}`}
          />
        </div>

        <div className="space-y-6 min-w-[180px] mt-2">
          <Link to="/" className="flex items-center px-2 py-2 text-white rounded-lg">
            <Home className="w-5 h-5" />
            <span className={`ml-3 ${!isExpanded && 'hidden'}`}>Trang Chủ</span>
          </Link>

          <div>
            <button
              onClick={() => toggleDropdown('de')}
              className="w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg"
            >
              <div className="flex items-center">
                <Database className="w-5 h-5" />
                <span className={`ml-3 ${!isExpanded && 'hidden'}`}>Quản lý đề</span>
              </div>
            </button>
            {activeDropdown === 'de' && isExpanded && (
              <div className="pl-6 mt-2 space-y-2">
                <Link to="/faculty" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Danh sách khoa</span>
                </Link>
                <Link to="/questions" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Danh sách đề</span>
                </Link>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleDropdown('cauhoi')}
              className="w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg"
            >
              <div className="flex items-center">
                <HelpCircle className="w-5 h-5" />
                <span className={`ml-3 ${!isExpanded && 'hidden'}`}>Quản lý câu hỏi</span>
              </div>
            </button>
            {activeDropdown === 'cauhoi' && isExpanded && (
              <div className="pl-6 mt-2 space-y-2">
                <Link to="/questions" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Danh sách câu hỏi</span>
                </Link>
                <Link to="/create-question" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Tạo câu hỏi</span>
                </Link>
                <Link to="/upload-questions" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Upload câu hỏi</span>
                </Link>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleDropdown('congcu')}
              className="w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg"
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5" />
                <span className={`ml-3 ${!isExpanded && 'hidden'}`}>Công cụ</span>
              </div>
            </button>
            {activeDropdown === 'congcu' && isExpanded && (
              <div className="pl-6 mt-2 space-y-2">
                <Link to="/pdf" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Xuất PDF</span>
                </Link>
                <Link to="/extract" className="flex items-center px-2 py-2 text-sm rounded-lg">
                  <span className="ml-3">Rút trích đề thi</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
