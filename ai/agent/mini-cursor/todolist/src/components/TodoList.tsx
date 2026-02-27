import type { Todo } from '../App'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TodoList({ todos, onToggle, onRemove }: Props) {
  return (
    <ul className="todo-list" aria-label="待办列表">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}
