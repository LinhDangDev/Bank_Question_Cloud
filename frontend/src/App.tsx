import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home/Home'
import SignIn from './pages/Auth/SignIn'
import Questions from './pages/Questions/Questions'
import CreateQuestion from './pages/Questions/CreateQuestion'
import UploadQuestions from './pages/Questions/UploadQuestions'
import Faculty from './pages/Subject/Faculty'
import PDF from './pages/Tool/PDF'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Home />} />
          <Route path="questions" element={<Questions />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="upload-questions" element={<UploadQuestions />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="pdf" element={<PDF />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
