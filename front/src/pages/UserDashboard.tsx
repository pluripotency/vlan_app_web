import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { RequestRecord, User, Vlan } from '../types'
import { statusLabels } from '../constants'
import { formatDate } from '../utils/date'

type UserDashboardProps = {
  currentUser: User
  vlans: Vlan[]
  requests: RequestRecord[]
  message: string | null
  error: string | null
  isRefreshing: boolean
  canOpenAdmin: boolean
  onSubmitRequest: (vlanId: number) => Promise<void>
  onCancelRequest: (requestId: number) => Promise<void>
  onRefresh: () => Promise<void>
  onOpenAdmin: () => void
  onLogout: () => void
}

export default function UserDashboard({
  currentUser,
  vlans,
  requests,
  message,
  error,
  isRefreshing,
  canOpenAdmin,
  onSubmitRequest,
  onCancelRequest,
  onRefresh,
  onOpenAdmin,
  onLogout
}: UserDashboardProps) {
  const [selectedVlan, setSelectedVlan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requests]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedVlan) {
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmitRequest(Number(selectedVlan))
      setSelectedVlan('')
    } catch {
      // エラー表示は親で行う
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (requestId: number) => {
    setCancelingId(requestId)
    try {
      await onCancelRequest(requestId)
    } catch {
      // エラー表示は親で行う
    } finally {
      setCancelingId(null)
    }
  }

  const handleRefresh = async () => {
    try {
      await onRefresh()
    } catch {
      // エラー表示は親で行う
    }
  }

  return (
    <div className="page">
      <header className="hero hero-left">
        <h1>ようこそ、{currentUser.name} さん</h1>
        <p>自分の VLAN 申請を確認し、新規申請やキャンセルができます。</p>
      </header>

      <div className="top-bar">
        <div className="top-bar__info">
          現在のユーザー: {currentUser.name} ({currentUser.subject})
        </div>
        <div className="top-bar__actions">
          <button type="button" className="secondary" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? '更新中…' : 'データ再読込'}
          </button>
          {canOpenAdmin && (
            <button type="button" onClick={onOpenAdmin}>
              Admin ページへ
            </button>
          )}
          <button type="button" className="secondary" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <h2>新規申請</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            VLAN
            <select value={selectedVlan} onChange={event => setSelectedVlan(event.target.value)} required>
              <option value="">VLAN を選択</option>
              {vlans.map(vlan => (
                <option key={vlan.vlanId} value={vlan.vlanId}>
                  {vlan.vlanId} – {vlan.description}
                </option>
              ))}
            </select>
          </label>
          <div className="actions">
            <button type="submit" disabled={!selectedVlan || isSubmitting}>
              {isSubmitting ? '送信中…' : '申請する'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>自分の申請一覧</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>VLAN</th>
                <th>状態</th>
                <th>申請日時</th>
                <th>更新日時</th>
                <th>キャンセル</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    まだ申請がありません。新しい申請を作成してください。
                  </td>
                </tr>
              )}
              {sortedRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>
                    <div className="cell-primary">{request.vlanId}</div>
                    <div className="cell-secondary">{request.vlanDescription}</div>
                  </td>
                  <td>
                    <span className={`status ${request.status}`}>{statusLabels[request.status]}</span>
                  </td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>{formatDate(request.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleCancel(request.id)}
                      disabled={request.status !== 'pending' || cancelingId === request.id}
                    >
                      {cancelingId === request.id ? '処理中…' : 'キャンセル'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
