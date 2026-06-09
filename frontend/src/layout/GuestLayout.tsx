 import { Wordmark } from '../components/Wordmark'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'

interface GuestLayoutProps {
  type: 'login' | 'register'
}

export function GuestLayout({ type }: GuestLayoutProps) {
  return (
    <div className="screen-center guest-layout">
      <div className="title-group">
        <Wordmark size="hero" />
        <div className="lead">
          Turn plans into progress
        </div>
      </div>
      { type === 'login' ? (
        <LoginPage />
      ) : (
        <RegisterPage />
      )}
    </div>
  )
}
