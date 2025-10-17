import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '../../types'

type AdminControlsTabProps = {
  users: User[]
  adminUsers: User[]
  defaultAdminId: string
  onUpdateAdminRights: (input: { targetUserId: number; isAdmin: boolean; adminId?: number }) => Promise<void>
}

export default function AdminControlsTab({
  users,
  adminUsers,
  defaultAdminId,
  onUpdateAdminRights
}: AdminControlsTabProps) {
  const [adminActingId, setAdminActingId] = useState(defaultAdminId)
  const [adminTargetId, setAdminTargetId] = useState('')
  const [grantAdmin, setGrantAdmin] = useState(true)
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false)

  useEffect(() => {
    setAdminActingId(defaultAdminId)
  }, [defaultAdminId])

  const sortedAdminUsers = useMemo(
    () => [...adminUsers].sort((a, b) => a.id - b.id),
    [adminUsers]
  )

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.id - b.id),
    [users]
  )

  const handleAdminControl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!adminTargetId) {
      return
    }
    setIsUpdatingAdmin(true)
    try {
      await onUpdateAdminRights({
        targetUserId: Number(adminTargetId),
        isAdmin: grantAdmin,
        adminId: adminActingId ? Number(adminActingId) : undefined
      })
      setAdminTargetId('')
    } catch {
      // エラー表示は親で行う
    } finally {
      setIsUpdatingAdmin(false)
    }
  }

  return (
    <section className="card">
      <h2>Admin Controls</h2>
      <form className="form-grid" onSubmit={handleAdminControl}>
        <label>
          Acting admin (任意)
          <select value={adminActingId} onChange={event => setAdminActingId(event.target.value)}>
            <option value="">未指定</option>
            {sortedAdminUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.subject})
              </option>
            ))}
          </select>
        </label>
        <label>
          対象ユーザー
          <select value={adminTargetId} onChange={event => setAdminTargetId(event.target.value)} required>
            <option value="">ユーザーを選択</option>
            {sortedUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.subject})
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={grantAdmin}
            onChange={event => setGrantAdmin(event.target.checked)}
          />
          管理者権限を付与する
        </label>
        <div className="actions">
          <button type="submit" disabled={isUpdatingAdmin}>
            {isUpdatingAdmin ? '更新中…' : '権限を更新'}
          </button>
        </div>
      </form>
      <p className="hint">初期管理者を作成する場合は Acting admin を空にしたまま送信してください。</p>
    </section>
  )
}
