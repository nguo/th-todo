import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UserMenu } from './UserMenu'

describe('UserMenu', () => {
  it('opens the menu and logs out when the item is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<UserMenu username="ada" onLogout={onLogout} />)

    expect(screen.queryByTestId('user-menu-logout')).toBeNull()
    await user.click(screen.getByTestId('user-menu-trigger'))
    await user.click(screen.getByTestId('user-menu-logout'))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<UserMenu username="ada" onLogout={vi.fn()} />)

    await user.click(screen.getByTestId('user-menu-trigger'))
    expect(screen.getByTestId('user-menu-logout')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('user-menu-logout')).toBeNull()
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <UserMenu username="ada" onLogout={vi.fn()} />
        <button data-testid="outside">outside</button>
      </div>,
    )

    await user.click(screen.getByTestId('user-menu-trigger'))
    expect(screen.getByTestId('user-menu-logout')).toBeInTheDocument()
    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByTestId('user-menu-logout')).toBeNull()
  })
})
