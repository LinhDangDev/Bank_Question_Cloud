import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home/Home'
import Dashboard from '@/pages/Home/Dashboard'
import SignIn from '@/pages/Auth/SignIn'
import Questions from '@/pages/Questions/Questions'
import ChapterQuestions from '@/pages/Questions/ChapterQuestions'
import CreateQuestion from '@/pages/Questions/CreateQuestion'
import CreateGroupQuestion from '@/pages/Questions/CreateGroupQuestion'
import EditGroupQuestion from '@/pages/Questions/EditGroupQuestion'
import UploadQuestions from '@/pages/Questions/UploadQuestions'
import QuestionsApproval from '@/pages/Questions/QuestionsApproval'

import Faculty from '@/pages/Subject/Faculty'
import SubjectList from '@/pages/Subject/SubjectList'
import ChapterList from '@/pages/Subject/ChapterList'
import PDF from '@/pages/Tool/PDF'
import Search from '@/pages/Home/Search'
import Exams from '@/pages/Tool/Exams'
import Users from '@/pages/Users/Users'
import AddUser from '@/pages/Users/AddUser'
import Extract from '@/pages/Tool/Extract'
import Help from '@/pages/Support/Help'
import Feedback from '@/pages/Support/Feedback'
import Settings from '@/pages/Settings/Settings'
import NotFound from '@/pages/NotFound'
import EditQuestion from '@/pages/Questions/EditQuestion'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'katex/dist/katex.min.css'
import '@/styles/mathlive.css'
import ExamDetail from '@/pages/Tool/ExamDetail/ExamDetail'
import EditExamQuestions from '@/pages/Tool/ExamDetail/EditExamQuestions'
import EditUser from '@/pages/Users/EditUser'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import FirstTimePassword from '@/pages/Auth/FirstTimePassword'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useEffect } from 'react'

// RequireAuth component
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Hiển thị loader khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to password change if needed
  if (user.needChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

function AuthenticatedRoute({ element, requireAdmin = false }: { element: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth()

  // Hiển thị loader khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Redirect to password change if needed
  if (user.needChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return element
}

// AppRoutes component để tách biệt logic routing
function AppRoutes() {
  const { loading } = useAuth();

  // Hiển thị loader khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<SignIn />} />
      <Route path="/change-password" element={<FirstTimePassword />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="subjects/:facultyId" element={<SubjectList />} />
          <Route path="chapters/:subjectId" element={<ChapterList />} />
          <Route path="questions" element={<Questions />} />
          <Route path="questions/create" element={<CreateQuestion />} />
          <Route path="questions/create-group" element={<CreateGroupQuestion />} />
          <Route path="questions/edit-group/:id" element={<EditGroupQuestion />} />
          <Route path="questions/edit/:id" element={<EditQuestion />} />
          <Route path="questions/upload" element={<UploadQuestions />} />
          <Route path="questions/approval" element={<QuestionsApproval />} />
          <Route path="questions/chapter/:chapterId" element={<ChapterQuestions />} />

          <Route path="extract" element={<Extract />} />
          <Route path="pdf" element={<PDF />} />
          <Route path="pdf/:id" element={<PDF />} />
          <Route path="exams" element={<Exams />} />
          <Route path="exams/:id" element={<ExamDetail />} />
          <Route path="exams/edit/:id" element={<ExamDetail />} />
          <Route path="exams/edit-questions/:id" element={<EditExamQuestions />} />
          <Route path="users" element={<Users />} />
          <Route path="users/add" element={<AddUser />} />
          <Route path="users/edit/:id" element={<EditUser />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="search" element={<Search />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      // Prevent the default browser behavior (logging to console)
      event.preventDefault();

      // Show user-friendly error message
      if (event.reason?.message?.includes('fetch') || event.reason?.message?.includes('network')) {
        console.warn('Network error caught by global handler');
      } else if (event.reason?.message?.includes('Receiving end does not exist') ||
                event.reason?.message?.includes('Could not establish connection')) {
        // Ignore Chrome extension connection errors - these are often from content scripts or extensions
        console.warn('Extension connection error - ignoring:', event.reason?.message);
        return; // Don't log as unhandled error
      } else {
        console.error('Unhandled error:', event.reason);
      }
    };

    // Global error handler for JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);

      // Prevent infinite loops by checking if error is from error boundary
      if (event.error?.message?.includes('ErrorBoundary')) {
        return;
      }

      // Ignore Chrome extension connection errors
      if (event.error?.message?.includes('Receiving end does not exist') ||
          event.error?.message?.includes('Could not establish connection')) {
        console.warn('Extension connection error caught by global handler:', event.error?.message);
        event.preventDefault(); // Prevent default error handling
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
