import { useNavigate } from 'react-router-dom'
export default function NewPath() {
  return (
    <>
      <h1>New Path</h1>
    </>
  )
}
export function NewPathButton() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/new-path')}>Go to New Path</button>
  )
}