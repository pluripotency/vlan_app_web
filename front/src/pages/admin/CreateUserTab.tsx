import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '../../types'

type CreateUserTabProps = {
  adminUsers: User[]
  onCreateUser: (input: { subject: string; name: string; isAdmin: boolean; adminRightBy?: number }) => Promise<void>
}

export default function CreateUserTab({ adminUsers, onCreateUser }: CreateUserTabProps) {
  const [newUserSubject, setNewUserSubject] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [newUserAdminRightBy, setNewUserAdminRightBy] = useState('')
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const sortedAdminUsers = useMemo(
    () => [...adminUsers].sort((a, b) => a.id - b.id),
    [adminUsers]
  )

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreatingUser(true)
    try {
      await onCreateUser({
        subject: newUserSubject,
        name: newUserName,
        isAdmin: newUserIsAdmin,
        adminRightBy: newUserAdminRightBy ? Number(newUserAdminRightBy) : undefined
      })
      setNewUserSubject('')
      setNewUserName('')
      setNewUserIsAdmin(false)
      setNewUserAdminRightBy('')
    } catch {
      // エラー表示は親で行う
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <section className="card">
      <h2>Create New User</h2>
      <form className="form-grid" onSubmit={handleCreateUser}>
        <label>
          Subject
          <input
            type="text"
            value={newUserSubject}
            onChange={event => setNewUserSubject(event.target.value)}
            placeholder="user:example"
            required
          />
        </label>
        <label>
          Display name
          <input
            type="text"
            value={newUserName}
            onChange={event => setNewUserName(event.target.value)}
            placeholder="Example User"
            required
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={newUserIsAdmin}
            onChange={event => setNewUserIsAdmin(event.target.checked)}
          />
          管理者権限を付与する
        </label>
        <label>
          権限付与者 (任意)
          <select value={newUserAdminRightBy} onChange={event => setNewUserAdminRightBy(event.target.value)}>
            <option value="">未指定</option>
            {sortedAdminUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.subject})
              </option>
            ))}
          </select>
        </label>
        <div className="actions">
          <button type="submit" disabled={isCreatingUser}>
            {isCreatingUser ? '作成中…' : 'ユーザーを作成'}
          </button>
        </div>
      </form>
    </section>
  )
}
