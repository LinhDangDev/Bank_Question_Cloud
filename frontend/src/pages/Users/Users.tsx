import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '@/config'
import { useThemeStyles, cx } from '../../utils/theme'
import { Search, Filter, Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageContainer from '../../components/ui/PageContainer'
import { Card } from '@/components/ui/card'
import { Input } from "@/components/ui/input"


const Users = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const styles = useThemeStyles();

  // Mock data - would be replaced with API data
  const users = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'Quản trị viên', department: 'Khoa CNTT', status: 'Hoạt động', lastLogin: '12/04/2025 08:30' },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@gmail.com', role: 'Giảng viên', department: 'Khoa CNTT', status: 'Hoạt động', lastLogin: '10/04/2025 14:15' },
    { id: 3, name: 'Lê Văn C', email: 'levanc@gmail.com', role: 'Giảng viên', department: 'Khoa Vật lý', status: 'Không hoạt động', lastLogin: '02/03/2025 09:45' },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@gmail.com', role: 'Quản trị viên', department: 'Khoa Toán', status: 'Hoạt động', lastLogin: '11/04/2025 16:20' },
  ]

  const roles = ['Tất cả', 'Quản trị viên', 'Giảng viên']
  const statuses = ['Tất cả', 'Hoạt động', 'Không hoạt động']

  const filteredUsers = users.filter(user => {
    const matchesQuery = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === '' || roleFilter === 'Tất cả' || user.role === roleFilter
    const matchesStatus = statusFilter === '' || statusFilter === 'Tất cả' || user.status === statusFilter

    return matchesQuery && matchesRole && matchesStatus
  })

  return (
    <PageContainer className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách người dùng</h1>
        <Link
          to="/add-user"
          className={cx("mt-4 sm:mt-0 flex items-center px-4 py-2 rounded-lg transition", styles.primaryButton)}
        >
          <Plus size={18} className="mr-2" />
          Thêm người dùng
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-2.5 text-gray-400 z-10" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={cx("w-full pl-10 pr-4 py-2 border rounded-lg outline-none appearance-none", styles.select, styles.borderInput)}
            >
              <option value="">Chọn vai trò</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-2.5 text-gray-400 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cx("w-full pl-10 pr-4 py-2 border rounded-lg outline-none appearance-none", styles.select, styles.borderInput)}
            >
              <option value="">Chọn trạng thái</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={styles.table.header}>
                <th className="py-3 px-6 text-left">Tên người dùng</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Vai trò</th>
                <th className="py-3 px-6 text-left">Khoa</th>
                <th className="py-3 px-6 text-center">Trạng thái</th>
                <th className="py-3 px-6 text-center">Đăng nhập cuối</th>
                <th className="py-3 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className={styles.textMuted}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className={cx("border-b", styles.table.row, styles.table.rowHover)}>
                    <td className="py-3 px-6 text-left">{user.name}</td>
                    <td className="py-3 px-6 text-left">{user.email}</td>
                    <td className="py-3 px-6 text-left">
                      <span className={cx("px-2 py-1 rounded-full text-xs",
                        user.role === 'Quản trị viên' ? styles.roleAdmin : styles.roleTeacher
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">{user.department}</td>
                    <td className="py-3 px-6 text-center">
                      <span className={cx("px-2 py-1 rounded-full text-xs",
                        user.status === 'Hoạt động' ? styles.statusActive : styles.statusInactive
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">{user.lastLogin}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button className="transform hover:text-green-500 hover:scale-110 transition-all p-1">
                          {user.status === 'Hoạt động' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button className="transform hover:text-yellow-500 hover:scale-110 transition-all p-1 ml-2">
                          <Edit size={18} />
                        </button>
                        <button className="transform hover:text-red-500 hover:scale-110 transition-all p-1 ml-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 px-6 text-center">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  )
}

export default Users
