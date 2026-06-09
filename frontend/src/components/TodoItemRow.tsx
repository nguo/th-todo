import { useRef, useState, type SyntheticEvent, type KeyboardEvent } from 'react'
import type { TodoItem } from '../api/client'

interface TodoItemRowProps {
  item: TodoItem
  onToggle: (completed: boolean) => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function TodoItemRow({ item, onToggle, onRename, onDelete }: TodoItemRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)
  // An edit session finishes once. Leaving edit mode unmounts the input, firing a blur on top of
  // an Enter/Save commit; this guard stops that trailing blur from also running cancel(). Reset
  // only when a new edit starts.
  const finishing = useRef(false)

  const startEdit = () => {
    finishing.current = false
    setDraft(item.title)
    setEditing(true)
  }

  const commit = () => {
    if (finishing.current) return
    finishing.current = true
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.title) onRename(trimmed)
    setEditing(false)
  }

  const cancel = () => {
    if (finishing.current) return
    finishing.current = true
    setDraft(item.title)
    setEditing(false)
  }

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    commit()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    // A textarea doesn't submit on Enter, so save here. preventDefault stops a newline — titles
    // stay single-line, the textarea just wraps/grows visually.
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      cancel()
    }
  }

  return (
    <li className={`todo-item ${item.isCompleted ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="todo-check"
        data-testid="todo-checkbox"
        checked={item.isCompleted}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
      />

      {editing ? (
        <form className="todo-edit" onSubmit={onSubmit}>
          <textarea
            rows={1}
            data-testid="todo-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            // Blur discards the edit; saving is explicit (Enter or Save).
            onBlur={cancel}
            onKeyDown={onKeyDown}
            aria-label="Edit task"
            autoFocus
          />
          <div className="todo-edit-actions">
            {/* preventDefault on mousedown keeps focus so the input's blur (= cancel) doesn't
                fire before this click commits */}
            <button type="submit" data-testid="todo-save" onMouseDown={(e) => e.preventDefault()}>
              Save
            </button>
            <button type="button" className="icon-button" data-testid="todo-cancel" onClick={cancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <span className="todo-title" data-testid="todo-title" onClick={startEdit} title="Click to edit">
          {item.title}
        </span>
      )}

      {!editing && (
        <div className="todo-actions">
          <button
            type="button"
            className="icon-button danger"
            data-testid="todo-delete"
            onClick={onDelete}
            aria-label="Delete task"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  )
}
