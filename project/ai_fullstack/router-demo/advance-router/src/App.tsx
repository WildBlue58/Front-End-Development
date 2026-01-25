import {
  Suspense
} from 'react'
import {
  BrowserRouter as Router, // html5 history mode
} from 'react-router-dom'
import Navigation from './components/Navigation'
import LoadingFallback from './components/LoadingFallback'
import AppRoutes from './router'

export default function App() {
  return (
    <Router>
      <Navigation />

      <Suspense fallback={<LoadingFallback />}>
        <AppRoutes />
      </Suspense>
    </Router>
  )
}
