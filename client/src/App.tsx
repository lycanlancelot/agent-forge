import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import AgentDetail from './pages/AgentDetail'
import Tasks from './pages/Tasks'
import Worktrees from './pages/Worktrees'
import Commits from './pages/Commits'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agent/:id" element={<AgentDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/worktrees" element={<Worktrees />} />
            <Route path="/commits" element={<Commits />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  )
}
