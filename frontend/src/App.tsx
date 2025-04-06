import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import Questions from './pages/Questions'
import CreateQuestion from './pages/CreateQuestion'
import BlankQuestions from './pages/BlankQuestions'
import Faculty from './pages/Faculty'
import PDF from './pages/PDF'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="questions" element={<Questions />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="blank-questions" element={<BlankQuestions />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="pdf" element={<PDF />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
