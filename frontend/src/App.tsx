import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home/Home'
import SignIn from '@/pages/Auth/SignIn'
import Questions from '@/pages/Questions/Questions'
import ChapterQuestions from '@/pages/Questions/ChapterQuestions'
import CreateQuestion from '@/pages/Questions/CreateQuestion'
import UploadQuestions from '@/pages/Questions/UploadQuestions'
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
import EditUser from '@/pages/Users/EditUser'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import FirstTimePassword from '@/pages/Auth/FirstTimePassword'

// RequireAuth component
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  // Log authentication status
//   console.log('RequireAuth - Authentication status:', { isAuthenticated: !!user, user });

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
  const { user } = useAuth()

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

function App() {
  return (
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
        <Routes>
          <Route path="/login" element={<SignIn />} />
          <Route path="/change-password" element={<FirstTimePassword />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="subjects/:facultyId" element={<SubjectList />} />
              <Route path="chapters/:subjectId" element={<ChapterList />} />
              <Route path="questions" element={<Questions />} />
              <Route path="questions/create" element={<CreateQuestion />} />
              <Route path="questions/edit/:id" element={<EditQuestion />} />
              <Route path="questions/upload" element={<UploadQuestions />} />
              <Route path="questions/chapter/:chapterId" element={<ChapterQuestions />} />
              <Route path="extract" element={<Extract />} />
              <Route path="pdf" element={<PDF />} />
              <Route path="pdf/:id" element={<PDF />} />
              <Route path="exams" element={<Exams />} />
              <Route path="exams/:id" element={<ExamDetail />} />
              <Route path="exams/edit/:id" element={<ExamDetail />} />
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
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
