import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home/Home'
import SignIn from './pages/Auth/SignIn'
import Questions from './pages/Questions/Questions'
import ChapterQuestions from './pages/Questions/ChapterQuestions'
import CreateQuestion from './pages/Questions/CreateQuestion'
import UploadQuestions from './pages/Questions/UploadQuestions'
import Faculty from './pages/Subject/Faculty'
import SubjectList from './pages/Subject/SubjectList'
import ChapterList from './pages/Subject/ChapterList'
import PDF from './pages/Tool/PDF'
import Search from './pages/Home/Search'
import Exams from './pages/Subject/Exams'
import Users from './pages/Users/Users'
import AddUser from './pages/Users/AddUser'
import Extract from './pages/Tool/Extract'
import Help from './pages/Support/Help'
import Feedback from './pages/Support/Feedback'
import Settings from './pages/Settings/Settings'
import NotFound from './pages/NotFound'
import EditQuestion from './pages/Questions/EditQuestion'
import { ThemeProvider } from './context/ThemeContext'
import 'katex/dist/katex.min.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="faculty" element={<Faculty />} />
            <Route path="subjects/:maKhoa" element={<SubjectList />} />
            <Route path="chapters/:maMonHoc" element={<ChapterList />} />
            <Route path="chapter-questions/:maPhan" element={<ChapterQuestions />} />
            <Route path="exams" element={<Exams />} />

            {/* Questions routes */}
            <Route path="questions">
              <Route index element={<Questions />} />
              <Route path="create" element={<CreateQuestion />} />
              <Route path="upload" element={<UploadQuestions />} />
              <Route path="edit/:id" element={<EditQuestion />} />
              <Route path="view/:id" element={<EditQuestion />} />
            </Route>

            {/* Keep backward compatibility with old routes */}
            <Route path="create-question" element={<CreateQuestion />} />
            <Route path="upload-questions" element={<UploadQuestions />} />
            <Route path="questions/:maPhan" element={<ChapterQuestions />} /> {/* Keep for backward compatibility */}

            <Route path="users" element={<Users />} />
            <Route path="add-user" element={<AddUser />} />
            <Route path="pdf" element={<PDF />} />
            <Route path="extract" element={<Extract />} />
            <Route path="help" element={<Help />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
