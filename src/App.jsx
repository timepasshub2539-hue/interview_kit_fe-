import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewSession from './pages/NewSession'
import Interview from './pages/Interview'
import Report from './pages/Report'
import Roadmap from './pages/Roadmap'
import ResumeCreator from './pages/ResumeCreator'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import Bookmarks from './pages/Bookmarks'
import BehavioralBank from './pages/BehavioralBank'
import StudyCourse from './pages/StudyCourse'
import ChatWidget from './components/ChatWidget'
import ErrorBoundary from './components/ErrorBoundary'

function PrivateRoute({ children }) {
  return localStorage.getItem('access_token') ? children : <Navigate to="/login" replace />
}

function AppContent() {
  const loc = useLocation()
  const isAuth = ['/login', '/register'].includes(loc.pathname)
  const token = localStorage.getItem('access_token')
  return (
    <>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/roadmap"        element={<PrivateRoute><Roadmap /></PrivateRoute>} />
        <Route path="/resume-creator" element={<PrivateRoute><ResumeCreator /></PrivateRoute>} />
        <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/analytics"      element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/bookmarks"      element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
        <Route path="/behavioral"     element={<PrivateRoute><BehavioralBank /></PrivateRoute>} />
        <Route path="/study"          element={<PrivateRoute><StudyCourse /></PrivateRoute>} />
        <Route path="/sessions/new" element={<PrivateRoute><NewSession /></PrivateRoute>} />
        <Route path="/sessions/:sessionId/interview" element={<PrivateRoute><ErrorBoundary><Interview /></ErrorBoundary></PrivateRoute>} />
        <Route path="/sessions/:sessionId/report"    element={<PrivateRoute><Report /></PrivateRoute>} />
      </Routes>
      {!isAuth && token && <ChatWidget />}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  )
}
