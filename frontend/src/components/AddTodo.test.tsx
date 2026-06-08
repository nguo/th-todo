import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AddTodo } from './AddTodo'
import { ApiError } from '../api/client'

describe('AddTodo', () => {
  it('submits trimmed text and clears the field on success', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<AddTodo onAdd={onAdd} />)

    const input = screen.getByTestId('add-todo-input')
    await user.type(input, '  hello  ')
    await user.click(screen.getByTestId('add-todo-submit'))

    expect(onAdd).toHaveBeenCalledWith('hello')
    expect(input).toHaveValue('')
  })

  it('keeps the text and shows an error when onAdd fails', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockRejectedValue(new ApiError(500, 'boom'))
    render(<AddTodo onAdd={onAdd} />)

    const input = screen.getByTestId('add-todo-input')
    await user.type(input, 'task')
    await user.click(screen.getByTestId('add-todo-submit'))

    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
    expect(input).toHaveValue('task')
  })

  it('does not submit blank input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddTodo onAdd={onAdd} />)

    await user.type(screen.getByTestId('add-todo-input'), '   {Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })
})
