import { Routes, Route } from 'react-router-dom'
import WorkerSelect from './pages/WorkerSelect.jsx'
import Inventory from './pages/Inventory.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkerSelect />} />
      <Route path="/inventory/:worker" element={<Inventory />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<WorkerSelect />} />
    </Routes>
  )
}
