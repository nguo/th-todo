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
  const [hideCompleted, setHideCompleted] = useState(false)

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

  const uncheckAll = useCallback(async () => {
    if (!listId) return
    const targets = items.filter((i) => i.isCompleted)
    if (targets.length === 0) return
    try {
      const updated = await Promise.all(
        targets.map((it) =>
          api.put<TodoItem>(`/lists/${listId}/todos/${it.id}`, { isCompleted: false }),
        ),
      )
      const byId = new Map(updated.map((u) => [u.id, u]))
      setItems((prev) => prev.map((it) => byId.get(it.id) ?? it))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update tasks.')
    }
  }, [listId, items])

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
  const completed = items.length - remaining
  // Guarded by the items.length > 0 branch below, so no divide-by-zero.
  const percent = items.length === 0 ? 0 : Math.floor((completed / items.length) * 100)
  const visibleItems = hideCompleted ? items.filter((i) => !i.isCompleted) : items

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

      <main>

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
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Completion progress"
              >
                <span className="progress-pct">{percent}%</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <div className="toolbar">
                <button
                  type="button"
                  className="toolbar-toggle"
                  aria-pressed={hideCompleted}
                  data-testid="toggle-hide-completed"
                  onClick={() => setHideCompleted((v) => !v)}
                >
                  {hideCompleted ? 'Show completed' : 'Hide completed'}
                </button>
                {completed > 0 && (
                  <button
                    type="button"
                    className="toolbar-action"
                    data-testid="uncheck-all"
                    onClick={uncheckAll}
                  >
                    Uncheck all
                  </button>
                )}
              </div>
              <ul className="todo-list">
                {visibleItems.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggle={(completed) => updateTodo(item.id, { isCompleted: completed })}
                    onRename={(title) => updateTodo(item.id, { title })}
                    onDelete={() => deleteTodo(item.id)}
                  />
                ))}
              </ul>
            </>
          ))}

        <AddTodo onAdd={addTodo} disabled={!listId} />
      </main>
    </div>
  )
}
