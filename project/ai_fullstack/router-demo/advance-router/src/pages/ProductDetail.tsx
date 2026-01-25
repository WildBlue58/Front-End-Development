import { useParams } from 'react-router-dom'

export default function ProductDetail() {
  const { productId } = useParams()
  return (
    <div>
      <h4>Product Detail: {productId}</h4>
      <p>Here is the description for product {productId}.</p>
    </div>
  )
}
