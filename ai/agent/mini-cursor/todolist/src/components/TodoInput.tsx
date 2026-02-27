import { useState, FormEvent } from "react";

type Props = {
  onAdd: (text: string) => void;
};

export function TodoInput({ onAdd }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAdd(value);
    setValue("");
  };

  return (
    <form className="todo-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="添加新待办..."
        className="todo-input__field"
        aria-label="新待办内容"
      />
      <button type="submit" className="todo-input__btn" aria-label="添加">
        {/* Plus icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        添加
      </button>
    </form>
  );
}
