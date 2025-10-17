import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '../types'

type LoginPageProps = {
  users: User[]
  isLoading: boolean
  message: string | null
  error: string | null
  onLogin: (userId: number) => void
  onReload: () => Promise<void>
}

export default function LoginPage({
  users,
  isLoading,
  message,
  error,
  onLogin,
  onReload
}: LoginPageProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isReloading, setIsReloading] = useState(false)

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name))
  }, [users])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUserId) {
      return
    }
    onLogin(Number(selectedUserId))
  }

  const handleReload = async () => {
    setIsReloading(true)
    try {
      await onReload()
    } catch {
      // エラー表示は親で行う
    } finally {
      setIsReloading(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>VLAN Access Portal</h1>
        <p>ユーザーを選択してログインしてください。</p>
      </header>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <h2>ログイン</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            ユーザー
            <select
              value={selectedUserId}
              onChange={event => setSelectedUserId(event.target.value)}
              disabled={isLoading}
            >
              <option value="">ユーザーを選択</option>
              {sortedUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.subject})
                </option>
              ))}
            </select>
          </label>
          <div className="actions">
            <button type="submit" disabled={!selectedUserId || isLoading}>
              ログイン
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleReload}
              disabled={isLoading || isReloading}
            >
              {isReloading ? '再読込中…' : 'ユーザー再読込'}
            </button>
          </div>
        </form>
      </section>
      {isLoading && <p className="hint">ユーザー一覧を取得しています…</p>}
    </div>
  )
}
