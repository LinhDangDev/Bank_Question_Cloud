import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useTheme } from '../../context/ThemeContext'

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const { theme } = useTheme()

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={toggleSidebar} />
      <Header isExpanded={isSidebarExpanded} />
      <main
        className="pt-16 transition-all duration-300"
        style={{
          marginLeft: isSidebarExpanded ? '200px' : '64px',
          minHeight: 'calc(100vh - 4rem)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
