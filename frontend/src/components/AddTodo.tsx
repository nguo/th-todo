import { useState, type SyntheticEvent } from 'react'
import { ApiError } from '../api/client'

interface AddTodoProps {
  // Rejects on failure so we keep the typed text and show an error.
  onAdd: (title: string) => Promise<void>
  disabled?: boolean
}

export function AddTodo({ onAdd, disabled }: AddTodoProps) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      await onAdd(trimmed)
      setTitle('') // Clear only on success
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add task.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="add-todo" onSubmit={submit}>
      <div className="add-todo-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
          data-testid="add-todo-input"
          disabled={disabled || busy}
        />
        <button type="submit" data-testid="add-todo-submit" disabled={disabled || busy || !title.trim()}>
          Add
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
