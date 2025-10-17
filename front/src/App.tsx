import { useCallback, useEffect, useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage'
import UserDashboard from './pages/UserDashboard'
import AdminPage from './pages/AdminPage'
import type { RequestRecord, User, Vlan } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

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


  const undoRequest = useCallback(
    async (requestId: number, actingAdminId: number) => {
      try {
        await handleResponse<RequestRecord>(
          await fetch(`${API_BASE}/requests/${requestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'pending', updatedBy: actingAdminId })
          })
        )
        await refreshRequests()
        showMessage('申請を元に戻しました。')
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : '申請を元の状態に戻せませんでした。')
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
        onUndo={undoRequest}
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

export default App
