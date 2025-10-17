import { useEffect, useMemo, useState } from 'react'
import type { RequestRecord, User } from '../../types'
import { statusLabels } from '../../constants'
import { formatDate } from '../../utils/date'

type RequestsTabProps = {
  requests: RequestRecord[]
  adminUsers: User[]
  defaultActingAdminId: string
  onApprove: (requestId: number, status: 'approved' | 'rejected', actingAdminId: number) => Promise<void>
  onUndo: (requestId: number, actingAdminId: number) => Promise<void>
}

export default function RequestsTab({
  requests,
  adminUsers,
  defaultActingAdminId,
  onApprove,
  onUndo
}: RequestsTabProps) {
  const [actingAdminId, setActingAdminId] = useState(defaultActingAdminId)
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null)

  useEffect(() => {
    setActingAdminId(defaultActingAdminId)
  }, [defaultActingAdminId])

  const sortedAdminUsers = useMemo(
    () => [...adminUsers].sort((a, b) => a.id - b.id),
    [adminUsers]
  )

  const handleApprove = async (requestId: number, status: 'approved' | 'rejected') => {
    if (!actingAdminId) {
      return
    }
    setBusyRequestId(requestId)
    try {
      await onApprove(requestId, status, Number(actingAdminId))
    } catch {
      // エラー表示は親で行う
    } finally {
      setBusyRequestId(null)
    }
  }

  const handleUndo = async (requestId: number) => {
    if (!actingAdminId) {
      return
    }
    setBusyRequestId(requestId)
    try {
      await onUndo(requestId, Number(actingAdminId))
    } catch {
      // エラー表示は親で行う
    } finally {
      setBusyRequestId(null)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>Requests</h2>
        <div className="actions-inline">
          <select value={actingAdminId} onChange={event => setActingAdminId(event.target.value)}>
            <option value="">承認担当者を選択</option>
            {sortedAdminUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.subject})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ユーザー</th>
              <th>VLAN</th>
              <th>状態</th>
              <th>作成</th>
              <th>更新</th>
              <th>最終更新者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  申請がありません。
                </td>
              </tr>
            )}
            {requests.map(request => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>
                  <div className="cell-primary">{request.requesterName}</div>
                  <div className="cell-secondary">{request.requesterSubject}</div>
                </td>
                <td>
                  <div className="cell-primary">{request.vlanId}</div>
                  <div className="cell-secondary">{request.vlanDescription}</div>
                </td>
                <td>
                  <span className={`status ${request.status}`}>{statusLabels[request.status]}</span>
                </td>
                <td>{formatDate(request.createdAt)}</td>
                <td>{formatDate(request.updatedAt)}</td>
                <td>{request.updatedByName ?? '-'}</td>
                <td>
                  <div className="actions-inline">
                    <button
                      type="button"
                      onClick={() => handleApprove(request.id, 'approved')}
                      disabled={request.status !== 'pending' || !actingAdminId || busyRequestId === request.id}
                    >
                      {busyRequestId === request.id ? '処理中…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleApprove(request.id, 'rejected')}
                      disabled={request.status !== 'pending' || !actingAdminId || busyRequestId === request.id}
                    >
                      Reject
                    </button>
                    {request.status !== 'pending' && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleUndo(request.id)}
                        disabled={!actingAdminId || busyRequestId === request.id}
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
