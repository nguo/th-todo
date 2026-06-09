import { useAuth } from '../auth/auth-context'
import { UserMenu } from './UserMenu'
import { Wordmark } from './Wordmark'

export function Navbar() {
  const { username, logout } = useAuth()
  return (
    <header className="navbar">
      <Wordmark size="nav" />
      <UserMenu username={username} onLogout={logout} />
    </header>
  )
}
