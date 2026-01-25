import { Link, Outlet } from 'react-router-dom'

export default function Products() {
  const products = [
    { id: 1, name: 'Product 1' },
    { id: 2, name: 'Product 2' },
    { id: 3, name: 'Product 3' },
  ]

  return (
    <div>
      <h1>Products List</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <Link to={`/products/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
      
      <hr />
      
      {/* 嵌套路由的渲染出口 */}
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
        <h3>Product Details Area:</h3>
        <Outlet />
      </div>
    </div>
  )
}