import type { Filter } from "../App";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "active", label: "未完成" },
  { value: "completed", label: "已完成" },
];

type Props = {
  filter: Filter;
  onFilterChange: (f: Filter) => void;
};

export function TodoFilter({ filter, onFilterChange }: Props) {
  return (
    <div className="todo-filter" role="tablist" aria-label="筛选">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={filter === value}
          className={`todo-filter__btn ${filter === value ? "todo-filter__btn--active" : ""}`}
          onClick={() => onFilterChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
