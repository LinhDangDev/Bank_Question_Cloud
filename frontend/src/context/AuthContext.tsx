import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

export interface User {
  userId: string;
  loginName: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  IsBuildInUser: boolean;
  needChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            // Kiểm tra xem token có hợp lệ không bằng cách gọi API profile
            const response = await authApi.getProfile();
            if (response.data) {
              // Token hợp lệ, cập nhật user từ profile API
              setUser(response.data);
              setToken(storedToken);
            } else {
              // Token không hợp lệ, xóa dữ liệu
              clearAuthData();
            }
          } catch (error) {
            console.error('Error validating token:', error);
            // Nếu có lỗi, xóa dữ liệu đăng nhập
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Xử lý đồng bộ trạng thái đăng nhập giữa các tab
  useEffect(() => {
    // Hàm lắng nghe sự kiện storage change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        // Token đã thay đổi ở tab khác
        if (e.newValue) {
          // Đăng nhập ở tab khác
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setToken(e.newValue);
          }
        } else {
          // Đăng xuất ở tab khác
          setUser(null);
          setToken(null);
        }
      }
    };

    // Đăng ký lắng nghe sự kiện storage
    window.addEventListener('storage', handleStorageChange);

    // Xóa lắng nghe khi component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Hàm xóa dữ liệu đăng nhập
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    // Gọi API logout nếu cần
    try {
      authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearAuthData();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
