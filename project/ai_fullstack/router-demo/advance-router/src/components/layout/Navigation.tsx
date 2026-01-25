import { Link, useNavigate, useMatch, useResolvedPath, type LinkProps } from 'react-router-dom'

// 自定义 Link 组件，使用 useResolvedPath 和 useMatch 实现类似 NavLink 的功能
// 这让我们可以完全控制激活状态的逻辑，比如不仅改变颜色，还能添加额外的元素（如激活时的指示点）
function CustomLink({ children, to, ...props }: LinkProps) {
  const resolved = useResolvedPath(to)
  // useMatch 接受一个 pattern。
  // end: true 表示精确匹配 (用于首页 /)
  // end: false 表示前缀匹配 (用于 /products 匹配 /products/123)
  // 这里我们需要根据路径是否为 '/' 来自动判断是否需要精确匹配，或者由 props 传入
  const isHome = resolved.pathname === '/'
  const match = useMatch({ path: resolved.pathname, end: isHome })

  const baseClass = "text-lg font-medium transition-colors relative"
  const inactiveClass = "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
  const activeClass = "text-blue-600 dark:text-blue-400"

  return (
    <Link
      to={to}
      className={`${baseClass} ${match ? activeClass : inactiveClass}`}
      {...props}
    >
      {children}
      {/* 使用 hooks 的好处：我们可以在组件内部根据 match 状态渲染额外的内容 */}
      {match && (
        <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
      )}
    </Link>
  )
}

// 提取 NewPathButton 到这里，或者保持导入
const NewPathButton = () => {
  const navigate = useNavigate()
  return (
    <button 
      onClick={() => navigate('/new-path')}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Go to New Path
    </button>
  )
}

export default function Navigation() {
  return (
    <nav className="flex items-center gap-6 p-4 border-b border-gray-200 dark:border-gray-700 mb-5 bg-white dark:bg-gray-800 shadow-sm">
      <CustomLink to="/">Home</CustomLink>
      <CustomLink to="/about">About</CustomLink>
      <CustomLink to="/products">Products</CustomLink>
      <CustomLink to="/login">Login</CustomLink>
      <CustomLink to="/user/123">User Profile</CustomLink>
      <CustomLink to="/pay">Pay</CustomLink>
      
      <div className="ml-auto">
        <NewPathButton />
      </div>
    </nav>
  )
}
