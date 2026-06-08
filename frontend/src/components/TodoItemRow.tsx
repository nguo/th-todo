import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
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
  // One edit session commits at most once. Leaving edit mode unmounts the input, which fires a
  // blur on top of any Enter-submit — without this guard the rename would fire twice. Reset
  // only when a new edit starts (not at the end of commit), so that trailing blur is ignored.
  const committed = useRef(false)

  const startEdit = () => {
    committed.current = false
    setDraft(item.title)
    setEditing(true)
  }

  const commit = () => {
    if (committed.current) return
    committed.current = true
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.title) onRename(trimmed)
    else setDraft(item.title)
    setEditing(false)
  }

  const cancel = () => {
    committed.current = true // suppress the unmount blur
    setDraft(item.title)
    setEditing(false)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    commit()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cancel()
  }

  return (
    <li className={`todo-item ${item.isCompleted ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="todo-check"
        checked={item.isCompleted}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
      />

      {editing ? (
        <form className="todo-edit" onSubmit={onSubmit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            // TODO(revisit): blur currently auto-commits the rename. Decide after using the app
            // whether renames should instead require explicit confirmation (Save button).
            onBlur={commit}
            onKeyDown={onKeyDown}
            aria-label="Edit task"
            autoFocus
          />
          {/* TODO(revisit): no visible Save/Cancel controls yet — only Enter (save) / Escape
              (cancel). Consider whether the edit row needs explicit buttons. */}
        </form>
      ) : (
        <span className="todo-title" onDoubleClick={startEdit} title="Double-click to edit">
          {item.title}
        </span>
      )}

      <div className="todo-actions">
        {!editing && (
          <button type="button" className="icon-button" onClick={startEdit} aria-label="Edit task">
            Edit
          </button>
        )}
        <button type="button" className="icon-button danger" onClick={onDelete} aria-label="Delete task">
          Delete
        </button>
      </div>
    </li>
  )
}
