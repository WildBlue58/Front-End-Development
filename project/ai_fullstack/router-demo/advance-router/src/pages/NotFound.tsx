// import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function NotFound() {
  // const navigate = useNavigate()
  useEffect(() => {
    const timer = setTimeout(() => {
      document.title = '404 Not Found'
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <>
      <h1>404 Not Found</h1>
    </>
  )
}
