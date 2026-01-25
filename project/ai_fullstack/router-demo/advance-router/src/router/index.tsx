import { lazy } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import ProtectRoute from '../components/ProtectRoute'

const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const UserProfile = lazy(() => import('../pages/UserProfile'))
const Products = lazy(() => import('../pages/product'))
const ProductDetail = lazy(() => import('../pages/product/ProductDetail'))
const Login = lazy(() => import('../pages/Login'))
const Pay = lazy(() => import('../pages/Pay'))
const NotFound = lazy(() => import('../pages/NotFound'))
const NewPath = lazy(() => import('../pages/NewPath'))

export default function AppRoutes() {
  const elements = useRoutes([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '/about',
      element: <About />,
    },
    {
      path: '/pay',
      element: (
        <ProtectRoute>
          <Pay />
        </ProtectRoute>
      ),
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/old-path',
      element: <Navigate to="/new-path" />,
    },
    {
      path: '/new-path',
      element: <NewPath />,
    },
    {
      path: '/user/:id',
      element: <UserProfile />,
    },
    {
      path: '/products',
      element: <Products />,
      children: [
        {
          path: ':productId',
          element: <ProductDetail />,
        },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ])

  return elements
}
