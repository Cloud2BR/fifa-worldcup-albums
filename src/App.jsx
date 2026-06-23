import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import WorldCups from './pages/WorldCups'
import Albums from './pages/Albums'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/worldcups" element={<WorldCups />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
