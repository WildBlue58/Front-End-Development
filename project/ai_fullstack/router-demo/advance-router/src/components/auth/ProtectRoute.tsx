import { Navigate } from 'react-router-dom'

export default function ProtectRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = true // 假设这是一个认证状态
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  return children
}