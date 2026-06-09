import { useEffect, useRef, useState } from 'react'

interface UserMenuProps {
  username: string | null
  onLogout: () => void
}

export function UserMenu({ username, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="user-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" aria-hidden>{username && username[0].toUpperCase()}</span>
        {username}
      </button>
      {open && (
        <div className="user-menu" role="menu">
          <button type="button" className="link-button" role="menuitem" data-testid="user-menu-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
