import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TodoItemRow } from './TodoItemRow'
import type { TodoItem } from '../api/client'

const item: TodoItem = {
  id: 't1',
  listId: 'L1',
  title: 'Buy milk',
  isCompleted: false,
  position: 0,
  createdAt: '',
  updatedAt: '',
}

function setup() {
  const onToggle = vi.fn()
  const onRename = vi.fn()
  const onDelete = vi.fn()
  render(
    <ul>
      <TodoItemRow item={item} onToggle={onToggle} onRename={onRename} onDelete={onDelete} />
    </ul>,
  )
  return { onToggle, onRename, onDelete }
}

// Enter edit mode and return the edit field.
const enterEdit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId('todo-title'))
  return screen.getByTestId('todo-edit-input')
}

describe('TodoItemRow', () => {
  it('enters edit mode when the title is clicked', async () => {
    const user = userEvent.setup()
    setup()
    expect(await enterEdit(user)).toBeInTheDocument()
  })

  it('saves once with the new value on Enter', async () => {
    const user = userEvent.setup()
    const { onRename } = setup()
    const box = await enterEdit(user)
    await user.clear(box)
    await user.type(box, 'Buy oat milk{Enter}')
    expect(onRename).toHaveBeenCalledTimes(1)
    expect(onRename).toHaveBeenCalledWith('Buy oat milk')
  })

  it('saves via the Save button', async () => {
    const user = userEvent.setup()
    const { onRename } = setup()
    const box = await enterEdit(user)
    await user.clear(box)
    await user.type(box, 'Saved via button')
    await user.click(screen.getByTestId('todo-save'))
    expect(onRename).toHaveBeenCalledWith('Saved via button')
  })

  it('discards on Escape', async () => {
    const user = userEvent.setup()
    const { onRename } = setup()
    const box = await enterEdit(user)
    await user.type(box, 'changed{Escape}')
    expect(onRename).not.toHaveBeenCalled()
  })

  it('discards via the Cancel button', async () => {
    const user = userEvent.setup()
    const { onRename } = setup()
    const box = await enterEdit(user)
    await user.type(box, 'changed')
    await user.click(screen.getByTestId('todo-cancel'))
    expect(onRename).not.toHaveBeenCalled()
  })

  it('discards on blur', async () => {
    const user = userEvent.setup()
    const { onRename } = setup()
    const box = await enterEdit(user)
    await user.type(box, 'changed')
    fireEvent.blur(box)
    expect(onRename).not.toHaveBeenCalled()
  })

  it('toggles completion via the checkbox', async () => {
    const user = userEvent.setup()
    const { onToggle } = setup()
    await user.click(screen.getByTestId('todo-checkbox'))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('deletes via the Delete button', async () => {
    const user = userEvent.setup()
    const { onDelete } = setup()
    await user.click(screen.getByTestId('todo-delete'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
