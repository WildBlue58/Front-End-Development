import { lazy } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import ProtectRoute from '../components/auth/ProtectRoute'

const Home = lazy(() => import('../pages/core/Home'))
const About = lazy(() => import('../pages/core/About'))
const UserProfile = lazy(() => import('../pages/user/UserProfile'))
const Products = lazy(() => import('../pages/product'))
const ProductDetail = lazy(() => import('../pages/product/ProductDetail'))
const Login = lazy(() => import('../pages/auth/Login'))
const Pay = lazy(() => import('../pages/order/Pay'))
const NotFound = lazy(() => import('../pages/core/NotFound'))
const NewPath = lazy(() => import('../pages/demo/NewPath'))

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
