import { useState } from "react";
import { TodoInput } from "./components/TodoInput";
import { TodoList } from "./components/TodoList";
import { TodoFilter } from "./components/TodoFilter";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

export type Filter = "all" | "active" | "completed";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const addTodo = (text: string) => {
    if (!text.trim()) return;
    setTodos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: text.trim(),
        done: false,
        createdAt: Date.now(),
      },
    ]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTodos =
    filter === "active"
      ? todos.filter((t) => !t.done)
      : filter === "completed"
        ? todos.filter((t) => t.done)
        : todos;

  const activeCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="app">
      <header className="header">
        <h1>待办清单</h1>
        <p className="subtitle">今日事今日毕 · Focus &amp; Flow</p>
      </header>

      <TodoInput onAdd={addTodo} />

      {todos.length > 0 && (
        <>
          <TodoFilter filter={filter} onFilterChange={setFilter} />
          <TodoList
            todos={filteredTodos}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
          <p className="footer-count">
            {activeCount > 0
              ? `${activeCount} 项未完成${doneCount > 0 ? ` · ${doneCount} 项已完成` : ""}`
              : `全部 ${doneCount} 项已完成 🎉`}
          </p>
        </>
      )}

      {todos.length === 0 && (
        <div className="empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="8"
              y="12"
              width="48"
              height="44"
              rx="6"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M20 26h24M20 34h18M20 42h12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M40 8v8M24 8v8M32 8v8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span>暂无待办，添加第一条任务开始吧</span>
        </div>
      )}
    </div>
  );
}

export default App;
