import { useCallback, useEffect, useState } from 'react'
import { api, type TodoItem, type TodoList } from '../api/client'
import { useAuth } from '../auth/auth-context'
import { AddTodo } from '../components/AddTodo'
import { TodoItemRow } from '../components/TodoItemRow'

export function TodoPage() {
  const { username, logout } = useAuth()
  // MVP: every user has one default list. We resolve its id once and scope all calls to it.
  const [listId, setListId] = useState<string | null>(null)
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const lists = await api.get<TodoList[]>('/lists')
        if (!active) return
        const defaultList = lists[0]
        if (!defaultList) {
          setError('No list found for your account.')
          return
        }
        setListId(defaultList.id)
        const todos = await api.get<TodoItem[]>(`/lists/${defaultList.id}/todos`)
        if (active) setItems(todos)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load your todos.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // Throws on failure so AddTodo can keep the typed text and show the error.
  const addTodo = useCallback(
    async (title: string) => {
      if (!listId) return
      const created = await api.post<TodoItem>(`/lists/${listId}/todos`, { title })
      setItems((prev) => [...prev, created])
    },
    [listId],
  )

  const updateTodo = useCallback(
    async (id: string, patch: { title?: string; isCompleted?: boolean }) => {
      if (!listId) return
      try {
        const updated = await api.put<TodoItem>(`/lists/${listId}/todos/${id}`, patch)
        setItems((prev) => prev.map((it) => (it.id === id ? updated : it)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update task.')
      }
    },
    [listId],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      if (!listId) return
      try {
        await api.del(`/lists/${listId}/todos/${id}`)
        setItems((prev) => prev.filter((it) => it.id !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete task.')
      }
    },
    [listId],
  )

  const remaining = items.filter((i) => !i.isCompleted).length

  return (
    <div className="app">
      <header className="app-header">
        <h1>My Tasks</h1>
        <div className="user">
          <span className="muted">{username}</span>
          <button type="button" className="link-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="card">
        <AddTodo onAdd={addTodo} disabled={!listId} />

        {loading && <p className="muted">Loading…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!loading &&
          (items.length === 0 ? (
            <p className="muted empty">Nothing here yet. Add your first task above.</p>
          ) : (
            <>
              <ul className="todo-list">
                {items.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggle={(completed) => updateTodo(item.id, { isCompleted: completed })}
                    onRename={(title) => updateTodo(item.id, { title })}
                    onDelete={() => deleteTodo(item.id)}
                  />
                ))}
              </ul>
              <p className="muted count">
                {remaining} of {items.length} remaining
              </p>
            </>
          ))}
      </main>
    </div>
  )
}
