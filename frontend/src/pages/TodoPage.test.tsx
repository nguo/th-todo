import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, type HttpHandler } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { tokenStore, type TodoItem } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import { TodoPage } from './TodoPage'

const LIST_ID = 'L1'
const todosUrl = `/api/lists/${LIST_ID}/todos`

const todo = (over: Partial<TodoItem>): TodoItem => ({
  id: 'x',
  listId: LIST_ID,
  title: 't',
  isCompleted: false,
  position: 0,
  createdAt: '',
  updatedAt: '',
  ...over,
})

beforeEach(() => {
  tokenStore.set('test-token')
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ username: 'tester' })),
    http.get('/api/lists', () => HttpResponse.json([{ id: LIST_ID, name: 'My Tasks' }])),
  )
})
afterEach(() => tokenStore.clear())

// Render TodoPage (real AuthProvider, seeded token) with a todos response + any mutation handlers
function renderWithTodos(items: TodoItem[], ...handlers: HttpHandler[]) {
  server.use(http.get(todosUrl, () => HttpResponse.json(items)), ...handlers)
  render(
    <AuthProvider>
      <MemoryRouter>
        <TodoPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('TodoPage', () => {
  it('renders items and the floored completion percentage', async () => {
    renderWithTodos([
      todo({ id: 't1', title: 'one', isCompleted: true }),
      todo({ id: 't2', title: 'two' }),
      todo({ id: 't3', title: 'three' }),
    ])
    expect(await screen.findByText('one')).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument() // 1 of 3 → floor(33.33)
  })

  it('toggling a checkbox persists and updates the percentage', async () => {
    const user = userEvent.setup()
    renderWithTodos(
      [todo({ id: 't1', title: 'one' })],
      http.put(`${todosUrl}/t1`, () => HttpResponse.json(todo({ id: 't1', title: 'one', isCompleted: true }))),
    )
    await user.click(await screen.findByTestId('todo-checkbox'))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument())
  })

  it('adds a new todo', async () => {
    const user = userEvent.setup()
    renderWithTodos(
      [],
      http.post(todosUrl, () => HttpResponse.json(todo({ id: 'new', title: 'new task' }), { status: 201 })),
    )
    const input = await screen.findByTestId('add-todo-input')
    await waitFor(() => expect(input).not.toBeDisabled())
    await user.type(input, 'new task')
    await user.click(screen.getByTestId('add-todo-submit'))
    expect(await screen.findByText('new task')).toBeInTheDocument()
  })

  it('deletes a todo', async () => {
    const user = userEvent.setup()
    renderWithTodos(
      [todo({ id: 't1', title: 'one' })],
      http.delete(`${todosUrl}/t1`, () => new HttpResponse(null, { status: 204 })),
    )
    await user.click(await screen.findByTestId('todo-delete'))
    await waitFor(() => expect(screen.queryByText('one')).toBeNull())
  })

  it('renames a todo', async () => {
    const user = userEvent.setup()
    renderWithTodos(
      [todo({ id: 't1', title: 'one' })],
      http.put(`${todosUrl}/t1`, () => HttpResponse.json(todo({ id: 't1', title: 'renamed' }))),
    )
    await user.click(await screen.findByTestId('todo-title'))
    const box = screen.getByTestId('todo-edit-input')
    await user.clear(box)
    await user.type(box, 'renamed{Enter}')
    await waitFor(() => expect(screen.getByText('renamed')).toBeInTheDocument())
  })

  it('shows the empty state (no rows) when there are no todos', async () => {
    renderWithTodos([])
    await waitFor(() => expect(screen.getByTestId('add-todo-input')).not.toBeDisabled())
    expect(screen.queryAllByTestId('todo-checkbox')).toHaveLength(0)
  })

  it('shows an error when the list fails to load', async () => {
    renderWithTodos([], http.get('/api/lists', () => new HttpResponse(null, { status: 500 })))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('shows an error when an update fails', async () => {
    const user = userEvent.setup()
    renderWithTodos(
      [todo({ id: 't1', title: 'one' })],
      http.put(`${todosUrl}/t1`, () => new HttpResponse(null, { status: 500 })),
    )
    await user.click(await screen.findByTestId('todo-checkbox'))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
