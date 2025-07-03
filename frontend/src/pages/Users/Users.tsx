import React, { useEffect, useState } from 'react'
import { userApi } from '@/services/api'
import { useThemeStyles, cx } from '../../utils/theme'
import { Search, Filter, Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageContainer from '../../components/PageContainer'
import { Card } from '@/components/ui/card'
import { Input } from "@/components/ui/input"
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

interface User {
  MaNguoiDung: string;
  TenDangNhap: string;
  Email: string;
  HoTen: string;
  LaNguoiDungHeThong: boolean;
  DaXoa: boolean;
  NgayDangNhapCuoi: string | null;
  MaKhoa?: string;
  Khoa?: {
    MaKhoa: string;
    TenKhoa: string;
  };
}

const Users = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Bạn không có quyền truy cập trang này.</div>;
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const styles = useThemeStyles();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching users...');
        const res = await userApi.getAll();
        console.log('Users API response:', res);
        setUsers(res.data || []);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError('Không thể tải danh sách người dùng.');
        toast.error('Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const roles = ['Tất cả', 'Quản trị viên', 'Giảng viên']
  const statuses = ['Tất cả', 'Hoạt động', 'Không hoạt động']

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      await userApi.changeStatus(userId, newStatus);
      setUsers(users.map(user =>
        user.MaNguoiDung === userId
          ? {...user, DaXoa: !newStatus}
          : user
      ));
      toast.success(newStatus ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng');
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái người dùng');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await userApi.delete(userId);
        setUsers(users.filter(user => user.MaNguoiDung !== userId));
        toast.success('Đã xóa người dùng');
      } catch (err) {
        toast.error('Không thể xóa người dùng');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesQuery = user.HoTen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.TenDangNhap?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === '' || roleFilter === 'Tất cả' ||
                       (user.LaNguoiDungHeThong ? 'Quản trị viên' : 'Giảng viên') === roleFilter;

    const matchesStatus = statusFilter === '' || statusFilter === 'Tất cả' ||
                         (user.DaXoa ? 'Không hoạt động' : 'Hoạt động') === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <PageContainer className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách người dùng</h1>
        <Link
          to="/users/add"
          className={cx("mt-4 sm:mt-0 flex items-center px-4 py-2 rounded-lg transition", styles.primaryButton)}
        >
          <Plus size={18} className="mr-2" />
          Thêm người dùng
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cx("pl-10", styles.searchInput)}
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

        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : (
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
                    <tr key={user.MaNguoiDung} className={cx("border-b", styles.table.row, styles.table.rowHover)}>
                      <td className="py-3 px-6 text-left">{user.HoTen}</td>
                      <td className="py-3 px-6 text-left">{user.Email}</td>
                      <td className="py-3 px-6 text-left">
                        <span className={cx("px-2 py-1 rounded-full text-xs",
                          user.LaNguoiDungHeThong ? styles.roleAdmin : styles.roleTeacher
                        )}>
                          {user.LaNguoiDungHeThong ? 'Quản trị viên' : 'Giảng viên'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-left">{user.Khoa?.TenKhoa || '-'}</td>
                      <td className="py-3 px-6 text-center">
                        <span className={cx("px-2 py-1 rounded-full text-xs",
                          !user.DaXoa ? styles.statusActive : styles.statusInactive
                        )}>
                          {!user.DaXoa ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">{user.NgayDangNhapCuoi ? new Date(user.NgayDangNhapCuoi).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            className="transform hover:text-green-500 hover:scale-110 transition-all p-1"
                            onClick={() => handleStatusChange(user.MaNguoiDung, user.DaXoa)}
                          >
                            {!user.DaXoa ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                          <Link
                            to={`/users/edit/${user.MaNguoiDung}`}
                            className="transform hover:text-yellow-500 hover:scale-110 transition-all p-1 ml-2"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            className="transform hover:text-red-500 hover:scale-110 transition-all p-1 ml-2"
                            onClick={() => handleDeleteUser(user.MaNguoiDung)}
                          >
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
        )}
      </Card>
    </PageContainer>
  )
}

export default Users
