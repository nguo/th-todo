import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the API client (api methods + ApiError, which AddTodo imports at runtime)...
vi.mock('../api/client', () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { ApiError, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() } }
})
// ...and auth, so TodoPage doesn't need a real provider.
vi.mock('../auth/auth-context', () => ({
  useAuth: () => ({ username: 'tester', logout: vi.fn() }),
}))

import { TodoPage } from './TodoPage'
import { api, type TodoItem } from '../api/client'

const todo = (over: Partial<TodoItem>): TodoItem => ({
  id: 'x',
  listId: 'L1',
  title: 't',
  isCompleted: false,
  position: 0,
  createdAt: '',
  updatedAt: '',
  ...over,
})

// Address-based GET stub: returns data by request path (not call order), so the test doesn't
// care how many times or in what sequence TodoPage fetches. An unexpected path fails loudly.
function stubGet(routes: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation((path: string) =>
    path in routes
      ? Promise.resolve(routes[path] as never)
      : Promise.reject(new Error(`unexpected GET ${path}`)),
  )
}

beforeEach(() => {
  vi.mocked(api.get).mockReset()
  vi.mocked(api.put).mockReset()
})

describe('TodoPage', () => {
  it('renders items and the floored completion percentage', async () => {
    stubGet({
      '/lists': [{ id: 'L1' }],
      '/lists/L1/todos': [
        todo({ id: 't1', title: 'one', isCompleted: true, position: 0 }),
        todo({ id: 't2', title: 'two', isCompleted: false, position: 1 }),
        todo({ id: 't3', title: 'three', isCompleted: false, position: 2 }),
      ],
    })

    render(<TodoPage />)

    expect(await screen.findByText('one')).toBeInTheDocument()
    expect(screen.getByText('three')).toBeInTheDocument()
    // 1 of 3 complete → Math.floor(33.33) = 33%
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('toggling a checkbox calls api.put on the nested list path', async () => {
    const user = userEvent.setup()
    stubGet({
      '/lists': [{ id: 'L1' }],
      '/lists/L1/todos': [todo({ id: 't2', title: 'two', isCompleted: false })],
    })
    vi.mocked(api.put).mockResolvedValue(todo({ id: 't2', title: 'two', isCompleted: true }) as never)

    render(<TodoPage />)
    await screen.findByText('two')

    await user.click(screen.getByTestId('todo-checkbox'))
    expect(api.put).toHaveBeenCalledWith('/lists/L1/todos/t2', { isCompleted: true })
  })
})
