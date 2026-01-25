import { useParams } from 'react-router-dom'

export default function UserProfile() {
  const { id } = useParams() // 路由参数对象
  return (
    <>
      <h1>UserProfile {id}</h1>
    </>
  )
}