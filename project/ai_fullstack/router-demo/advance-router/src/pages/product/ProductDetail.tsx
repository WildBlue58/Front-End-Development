import { useParams } from 'react-router-dom'

export default function ProductDetail() {
  const params = useParams()
  return (
    <div>
      <h1>Product Detail</h1>
      <p>Product ID: {params.productId}</p>
    </div>
  )
}