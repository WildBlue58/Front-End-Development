export default function App() {
    const [count, setCount] = useState(0)
    console.log('render',count)
    return (
        <div className="App">
            <h1>{count}</h1>
            <button onClick={() => {
                setCount(count + 1)
                setTimeout(() => console.log('setTimeout', count), 1000)
            }}
            >
            +1
        </button>
        </div>
    )
}
//这个组件点击按钮后，控制台的输出顺序和值如下：

// 1. render 1 (组件重新渲染， count 更新为 1)
// 2. setTimeout 0 (1秒后输出，注意这里是 0 而不是 1)