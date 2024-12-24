import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Agents from '../pages/Agents'
import Challenge from '../pages/Challenge'
import CreateAgent from '../pages/CreateAgent'
import Profile from '../pages/Profile'
import Leaderboard from '../pages/Leaderboard'
import TestAPI from '../pages/TestAPI'

const AppRouter = () => {
  const { connected } = useWallet()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="agents"
            element={connected ? <Agents /> : <Navigate to="/" />}
          />
          <Route
            path="agents/create"
            element={connected ? <CreateAgent /> : <Navigate to="/" />}
          />
          <Route
            path="agents/:id"
            element={connected ? <Challenge /> : <Navigate to="/" />}
          />
          <Route
            path="profile"
            element={connected ? <Profile /> : <Navigate to="/" />}
          />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="test" element={<TestAPI />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default AppRouter 