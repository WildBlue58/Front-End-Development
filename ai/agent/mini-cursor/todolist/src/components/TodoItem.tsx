import type { Todo } from "../App";

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function TodoItem({ todo, onToggle, onRemove }: Props) {
  return (
    <li
      className={`todo-item ${todo.done ? "todo-item--done" : ""}`}
      data-testid={`todo-${todo.id}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        className="todo-item__checkbox"
        onClick={() => onToggle(todo.id)}
        aria-label={todo.done ? "标记为未完成" : "标记为已完成"}
        aria-pressed={todo.done}
      >
        {/* Heroicons check */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>

      <span className="todo-item__text">{todo.text}</span>

      {/* Delete button — trash icon */}
      <button
        type="button"
        className="todo-item__remove"
        onClick={() => onRemove(todo.id)}
        aria-label="删除"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </li>
  );
}
