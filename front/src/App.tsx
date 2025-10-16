import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type User = {
  id: number
  subject: string
  name: string
  createdAt: string
  isActive: boolean
  isAdmin: boolean
  adminRightBy: number | null
}

type Vlan = {
  vlanId: number
  description: string
}

type RequestRecord = {
  id: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  vlanId: number
  userId: number
  updatedBy: number | null
  createdBy: number | null
  requesterName: string
  requesterSubject: string
  vlanDescription: string
  updatedByName: string | null
  createdByName: string | null
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

const statusLabels: Record<RequestRecord['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString()
}

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    const message = data?.error
      ? typeof data.error === 'string'
        ? data.error
        : JSON.stringify(data.error)
      : response.statusText
    throw new Error(message)
  }

  return data as T
}

type View = 'login' | 'user' | 'admin'
type AdminTab = 'requests' | 'createUser' | 'adminControls' | 'vlans'

type LoginPageProps = {
  users: User[]
  isLoading: boolean
  message: string | null
  error: string | null
  onLogin: (userId: number) => void
  onReload: () => Promise<void>
}

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

type AdminPageProps = {
  currentUser: User
  users: User[]
  adminUsers: User[]
  vlans: Vlan[]
  requests: RequestRecord[]
  message: string | null
  error: string | null
  isRefreshing: boolean
  onBack: () => void
  onLogout: () => void
  onRefresh: () => Promise<void>
  onApprove: (requestId: number, status: 'approved' | 'rejected', actingAdminId: number) => Promise<void>
  onCreateUser: (input: { subject: string; name: string; isAdmin: boolean; adminRightBy?: number }) => Promise<void>
  onUpdateAdminRights: (input: { targetUserId: number; isAdmin: boolean; adminId?: number }) => Promise<void>
  onCreateVlan: (input: { vlanId: number; description: string }) => Promise<void>
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [view, setView] = useState<View>('login')
  const [vlans, setVlans] = useState<Vlan[]>([])
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isRefreshingData, setIsRefreshingData] = useState(false)

  const currentUser = useMemo(() => {
    if (currentUserId === null) {
      return null
    }
    return users.find(user => user.id === currentUserId) ?? null
  }, [currentUserId, users])

  const showMessage = useCallback((text: string) => {
    setMessage(text)
    setError(null)
  }, [])

  const showError = useCallback((text: string) => {
    setError(text)
    setMessage(null)
  }, [])

  const refreshUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const data = await handleResponse<User[]>(await fetch(`${API_BASE}/users`))
      setUsers(data)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  const refreshVlans = useCallback(async () => {
    const data = await handleResponse<Vlan[]>(await fetch(`${API_BASE}/vlans`))
    setVlans(data)
  }, [])

  const refreshRequests = useCallback(async () => {
    const data = await handleResponse<RequestRecord[]>(await fetch(`${API_BASE}/requests`))
    setRequests(data)
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      await refreshUsers()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました。')
      throw err
    }
  }, [refreshUsers, showError])

  const refreshAll = useCallback(async () => {
    setIsRefreshingData(true)
    try {
      await Promise.all([refreshUsers(), refreshVlans(), refreshRequests()])
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'データの再取得に失敗しました。')
      throw err
    } finally {
      setIsRefreshingData(false)
    }
  }, [refreshUsers, refreshVlans, refreshRequests, showError])

  useEffect(() => {
    loadUsers().catch(() => undefined)
  }, [loadUsers])

  useEffect(() => {
    if (currentUserId === null || !currentUser) {
      return
    }

    setIsRefreshingData(true)
    Promise.all([refreshVlans(), refreshRequests()])
      .catch((err: unknown) => {
        showError(err instanceof Error ? err.message : 'データの取得に失敗しました。')
      })
      .finally(() => {
        setIsRefreshingData(false)
      })
  }, [currentUser, currentUserId, refreshRequests, refreshVlans, showError])

  useEffect(() => {
    if (currentUserId !== null && !currentUser && !isLoadingUsers) {
      setCurrentUserId(null)
      setView('login')
      showError('選択したユーザーが存在しなくなりました。別のユーザーでログインしてください。')
    }
  }, [currentUser, currentUserId, isLoadingUsers, showError])

  useEffect(() => {
    if (view === 'admin' && (!currentUser || !currentUser.isAdmin)) {
      setView('user')
    }
  }, [currentUser, view])

  const handleLogin = useCallback(
    (userId: number) => {
      if (!users.some(user => user.id === userId)) {
        showError('選択したユーザーが見つかりません。')
        return
      }
      setCurrentUserId(userId)
      setView('user')
      setMessage(null)
      setError(null)
    },
    [users, showError]
  )

  const handleLogout = useCallback(() => {
    setCurrentUserId(null)
    setView('login')
    setMessage(null)
    setError(null)
  }, [])

  const submitRequest = useCallback(
    async (vlanId: number) => {
      if (!currentUser) {
        throw new Error('ログイン状態が無効です。')
      }
      try {
        await handleResponse<RequestRecord>(
          await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              vlanId,
              createdBy: currentUser.id
            })
          })
        )
        await refreshRequests()
        showMessage('申請を作成しました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : '申請の作成に失敗しました。')
        throw err
      }
    },
    [currentUser, refreshRequests, showError, showMessage]
  )

  const cancelRequest = useCallback(
    async (requestId: number) => {
      if (!currentUser) {
        throw new Error('ログイン状態が無効です。')
      }
      try {
        await handleResponse<void>(
          await fetch(`${API_BASE}/requests/${requestId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          })
        )
        await refreshRequests()
        showMessage('申請をキャンセルしました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : '申請のキャンセルに失敗しました。')
        throw err
      }
    },
    [currentUser, refreshRequests, showError, showMessage]
  )

  const approveRequest = useCallback(
    async (requestId: number, status: 'approved' | 'rejected', actingAdminId: number) => {
      try {
        await handleResponse<RequestRecord>(
          await fetch(`${API_BASE}/requests/${requestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, updatedBy: actingAdminId })
          })
        )
        await refreshRequests()
        showMessage(status === 'approved' ? '申請を承認しました。' : '申請を却下しました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : '申請の更新に失敗しました。')
        throw err
      }
    },
    [refreshRequests, showError, showMessage]
  )

  const createUserAccount = useCallback(
    async (input: { subject: string; name: string; isAdmin: boolean; adminRightBy?: number }) => {
      try {
        const payload: Record<string, unknown> = {
          subject: input.subject,
          name: input.name,
          isAdmin: input.isAdmin
        }

        if (input.adminRightBy !== undefined) {
          payload.adminRightBy = input.adminRightBy
        }

        await handleResponse<User>(
          await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        )
        await refreshUsers()
        showMessage('ユーザーを作成しました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : 'ユーザーの作成に失敗しました。')
        throw err
      }
    },
    [refreshUsers, showError, showMessage]
  )

  const updateAdminRights = useCallback(
    async (input: { targetUserId: number; isAdmin: boolean; adminId?: number }) => {
      try {
        const payload: Record<string, unknown> = {
          isAdmin: input.isAdmin
        }

        if (input.adminId !== undefined) {
          payload.adminId = input.adminId
        }

        await handleResponse<User>(
          await fetch(`${API_BASE}/users/${input.targetUserId}/admin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        )
        await refreshUsers()
        showMessage('管理者権限を更新しました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : '管理者権限の更新に失敗しました。')
        throw err
      }
    },
    [refreshUsers, showError, showMessage]
  )

  const createVlan = useCallback(
    async (input: { vlanId: number; description: string }) => {
      try {
        await handleResponse<Vlan>(
          await fetch(`${API_BASE}/vlans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vlanId: input.vlanId, description: input.description })
          })
        )
        await refreshVlans()
        showMessage('VLANを追加しました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : 'VLANの登録に失敗しました。')
        throw err
      }
    },
    [refreshVlans, showError, showMessage]
  )

  const userRequests = useMemo(() => {
    if (!currentUser) {
      return []
    }
    return [...requests]
      .filter(request => request.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [currentUser, requests])

  const sortedVlans = useMemo(() => [...vlans].sort((a, b) => a.vlanId - b.vlanId), [vlans])
  const adminUsers = useMemo(() => users.filter(user => user.isAdmin), [users])

  const handleOpenAdmin = useCallback(() => {
    if (currentUser?.isAdmin) {
      setView('admin')
      setMessage(null)
      setError(null)
    }
  }, [currentUser])

  if (view === 'login') {
    return (
      <LoginPage
        users={users}
        isLoading={isLoadingUsers}
        message={message}
        error={error}
        onLogin={handleLogin}
        onReload={() => loadUsers()}
      />
    )
  }

  if (!currentUser) {
    return (
      <div className="page">
        <header className="hero">
          <h1>VLAN Access Portal</h1>
          <p>ユーザー情報の読み込み中です…</p>
        </header>
      </div>
    )
  }

  if (view === 'admin') {
    return (
      <AdminPage
        currentUser={currentUser}
        users={users}
        adminUsers={adminUsers}
        vlans={sortedVlans}
        requests={[...requests].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )}
        message={message}
        error={error}
        isRefreshing={isRefreshingData}
        onBack={() => setView('user')}
        onLogout={handleLogout}
        onRefresh={() => refreshAll()}
        onApprove={approveRequest}
        onCreateUser={createUserAccount}
        onUpdateAdminRights={updateAdminRights}
        onCreateVlan={createVlan}
      />
    )
  }

  return (
    <UserDashboard
      currentUser={currentUser}
      vlans={sortedVlans}
      requests={userRequests}
      message={message}
      error={error}
      isRefreshing={isRefreshingData}
      canOpenAdmin={Boolean(currentUser.isAdmin)}
      onSubmitRequest={submitRequest}
      onCancelRequest={cancelRequest}
      onRefresh={() => refreshAll()}
      onOpenAdmin={handleOpenAdmin}
      onLogout={handleLogout}
    />
  )
}

function LoginPage({ users, isLoading, message, error, onLogin, onReload }: LoginPageProps) {
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
        {isLoading && <p className="hint">ユーザー一覧を取得しています…</p>}
      </section>
    </div>
  )
}

function UserDashboard({
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

function AdminPage({
  currentUser,
  users,
  adminUsers,
  vlans,
  requests,
  message,
  error,
  isRefreshing,
  onBack,
  onLogout,
  onRefresh,
  onApprove,
  onCreateUser,
  onUpdateAdminRights,
  onCreateVlan
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('requests')
  const [actingAdminId, setActingAdminId] = useState<string>(() => String(currentUser.id))
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null)
  const [newUserSubject, setNewUserSubject] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [newUserAdminRightBy, setNewUserAdminRightBy] = useState('')
  const [adminTargetId, setAdminTargetId] = useState('')
  const [grantAdmin, setGrantAdmin] = useState(true)
  const [adminActingId, setAdminActingId] = useState<string>(() => String(currentUser.id))
  const [newVlanId, setNewVlanId] = useState('')
  const [newVlanDescription, setNewVlanDescription] = useState('')
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false)
  const [isCreatingVlan, setIsCreatingVlan] = useState(false)

  useEffect(() => {
    setActingAdminId(String(currentUser.id))
    setAdminActingId(String(currentUser.id))
  }, [currentUser.id])

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.id - b.id), [users])
  const sortedVlans = useMemo(() => [...vlans].sort((a, b) => a.vlanId - b.vlanId), [vlans])

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

  const handleCreateVlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newVlanId || !newVlanDescription) {
      return
    }
    setIsCreatingVlan(true)
    try {
      await onCreateVlan({ vlanId: Number(newVlanId), description: newVlanDescription })
      setNewVlanId('')
      setNewVlanDescription('')
    } catch {
      // エラー表示は親で行う
    } finally {
      setIsCreatingVlan(false)
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
        <h1>Admin コントロール</h1>
        <p>リクエスト審査やユーザー・VLAN 管理を行います。</p>
      </header>

      <div className="top-bar">
        <div className="top-bar__info">
          ログイン中: {currentUser.name} ({currentUser.subject})
        </div>
        <div className="top-bar__actions">
          <button type="button" className="secondary" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? '更新中…' : 'データ再読込'}
          </button>
          <button type="button" onClick={onBack}>
            ユーザーページへ戻る
          </button>
          <button type="button" className="secondary" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'createUser' ? 'active' : ''}`}
          onClick={() => setActiveTab('createUser')}
        >
          Create New User
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'adminControls' ? 'active' : ''}`}
          onClick={() => setActiveTab('adminControls')}
        >
          Admin Controls
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'vlans' ? 'active' : ''}`}
          onClick={() => setActiveTab('vlans')}
        >
          VLAN マスター
        </button>
      </div>

      {activeTab === 'requests' && (
        <section className="card">
          <div className="card-header">
            <h2>Requests</h2>
            <div className="actions-inline">
              <select value={actingAdminId} onChange={event => setActingAdminId(event.target.value)}>
                <option value="">承認担当者を選択</option>
                {adminUsers.map(user => (
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
                          disabled={
                            request.status !== 'pending' || !actingAdminId || busyRequestId === request.id
                          }
                        >
                          {busyRequestId === request.id ? '処理中…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleApprove(request.id, 'rejected')}
                          disabled={
                            request.status !== 'pending' || !actingAdminId || busyRequestId === request.id
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'createUser' && (
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
              <select
                value={newUserAdminRightBy}
                onChange={event => setNewUserAdminRightBy(event.target.value)}
              >
                <option value="">未指定</option>
                {adminUsers.map(user => (
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
      )}

      {activeTab === 'adminControls' && (
        <section className="card">
          <h2>Admin Controls</h2>
          <form className="form-grid" onSubmit={handleAdminControl}>
            <label>
              Acting admin (任意)
              <select value={adminActingId} onChange={event => setAdminActingId(event.target.value)}>
                <option value="">未指定</option>
                {adminUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.subject})
                  </option>
                ))}
              </select>
            </label>
            <label>
              対象ユーザー
              <select
                value={adminTargetId}
                onChange={event => setAdminTargetId(event.target.value)}
                required
              >
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
      )}

      {activeTab === 'vlans' && (
        <section className="card">
          <h2>VLAN マスター</h2>
          <form className="form-grid" onSubmit={handleCreateVlan}>
            <label>
              VLAN ID
              <input
                type="text"
                value={newVlanId}
                onChange={event => setNewVlanId(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10"
                required
              />
            </label>
            <label>
              説明
              <input
                type="text"
                value={newVlanDescription}
                onChange={event => setNewVlanDescription(event.target.value)}
                placeholder="Corporate LAN"
                required
              />
            </label>
            <div className="actions">
              <button type="submit" disabled={isCreatingVlan}>
                {isCreatingVlan ? '登録中…' : 'VLAN を追加'}
              </button>
            </div>
          </form>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>VLAN ID</th>
                  <th>説明</th>
                </tr>
              </thead>
              <tbody>
                {sortedVlans.length === 0 && (
                  <tr>
                    <td colSpan={2} className="empty">
                      VLAN が登録されていません。
                    </td>
                  </tr>
                )}
                {sortedVlans.map(vlan => (
                  <tr key={vlan.vlanId}>
                    <td>{vlan.vlanId}</td>
                    <td>{vlan.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
