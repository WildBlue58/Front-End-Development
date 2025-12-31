// SVG 图标组件库
// 使用方式: <Icons.Search size={16} className="..." />

const defaultProps = {
  size: 20,
  className: "",
  strokeWidth: 2,
};

const IconWrapper = ({
  children,
  size,
  className,
  viewBox = "0 0 24 24",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

export const Icons = {
  // 搜索
  Search: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </IconWrapper>
  ),

  // 刷新
  Refresh: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <path d="M23 4v6h-6"></path>
      <path d="M1 20v-6h6"></path>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </IconWrapper>
  ),

  // 加号/新增
  Plus: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </IconWrapper>
  ),

  // 编辑
  Edit: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </IconWrapper>
  ),

  // 删除
  Trash: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </IconWrapper>
  ),

  // 数据库
  Database: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </IconWrapper>
  ),

  // 表格
  Table: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </IconWrapper>
  ),

  // 代码/SQL
  Code: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </IconWrapper>
  ),

  // 结构
  Structure: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </IconWrapper>
  ),

  // 更多
  More: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </IconWrapper>
  ),

  // 关闭
  X: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </IconWrapper>
  ),

  // 视图
  View: (props) => (
    <IconWrapper {...defaultProps} {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </IconWrapper>
  ),
};

export default Icons;
