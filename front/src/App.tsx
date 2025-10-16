import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

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

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [vlans, setVlans] = useState<Vlan[]>([])
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [newUserSubject, setNewUserSubject] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)

  const [requestUserId, setRequestUserId] = useState('')
  const [requestVlanId, setRequestVlanId] = useState('')
  const [requestCreatorId, setRequestCreatorId] = useState('')

  const [actingAdminId, setActingAdminId] = useState('')
  const [adminTargetId, setAdminTargetId] = useState('')
  const [grantAdmin, setGrantAdmin] = useState(true)

  const adminUsers = useMemo(() => users.filter(user => user.isAdmin), [users])

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.id - b.id),
    [users]
  )

  const sortedVlans = useMemo(
    () => [...vlans].sort((a, b) => a.vlanId - b.vlanId),
    [vlans]
  )

  const refreshUsers = useCallback(async () => {
    const data = await handleResponse<User[]>(await fetch(`${API_BASE}/users`))
    setUsers(data)
  }, [])

  const refreshVlans = useCallback(async () => {
    const data = await handleResponse<Vlan[]>(await fetch(`${API_BASE}/vlans`))
    setVlans(data)
  }, [])

  const refreshRequests = useCallback(async () => {
    const data = await handleResponse<RequestRecord[]>(await fetch(`${API_BASE}/requests`))
    setRequests(data)
  }, [])

  const showMessage = useCallback((text: string) => {
    setMessage(text)
    setError(null)
  }, [])

  const showError = useCallback((text: string) => {
    setError(text)
    setMessage(null)
  }, [])

  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([refreshUsers(), refreshVlans(), refreshRequests()])
    } catch (err) {
      if (err instanceof Error) {
        showError(err.message)
      } else {
        showError('Failed to load data')
      }
    }
  }, [refreshRequests, refreshUsers, refreshVlans, showError])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  async function submitNewUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const payload = {
        subject: newUserSubject,
        name: newUserName,
        isAdmin: newUserIsAdmin
      }

      await handleResponse<User>(
        await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      )

      setNewUserSubject('')
      setNewUserName('')
      setNewUserIsAdmin(false)
      await refreshUsers()
      showMessage('User created successfully.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      if (!requestUserId || !requestVlanId) {
        showError('Please select both a user and a VLAN.')
        return
      }

      const payload = {
        userId: Number(requestUserId),
        vlanId: Number(requestVlanId),
        createdBy: requestCreatorId ? Number(requestCreatorId) : undefined
      }

      await handleResponse<RequestRecord>(
        await fetch(`${API_BASE}/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      )

      setRequestVlanId('')
      setRequestCreatorId('')
      showMessage('Request submitted successfully.')
      await refreshRequests()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to submit request')
    }
  }

  async function toggleAdminRights(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      if (!adminTargetId) {
        showError('Select a user to update admin rights.')
        return
      }

      const payload: { isAdmin: boolean; adminId?: number } = {
        isAdmin: grantAdmin
      }

      if (actingAdminId) {
        payload.adminId = Number(actingAdminId)
      }

      await handleResponse<User>(
        await fetch(`${API_BASE}/users/${adminTargetId}/admin`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      )

      await refreshUsers()
      showMessage('Admin rights updated successfully.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update admin rights')
    }
  }

  async function updateRequestStatus(requestId: number, status: 'approved' | 'rejected') {
    try {
      if (!actingAdminId) {
        showError('Select an acting admin to approve or reject requests.')
        return
      }

      await handleResponse<RequestRecord>(
        await fetch(`${API_BASE}/requests/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            updatedBy: Number(actingAdminId)
          })
        })
      )

      await refreshRequests()
      showMessage(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully.`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update request status')
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>VLAN Access Requests</h1>
        <p>Submit new VLAN access requests and manage approvals.</p>
      </header>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <h2>Create a New User</h2>
        <form className="form-grid" onSubmit={submitNewUser}>
          <label>
            Subject
            <input
              type="text"
              value={newUserSubject}
              onChange={event => setNewUserSubject(event.target.value)}
              placeholder="user@example.com"
              required
            />
          </label>
          <label>
            Display name
            <input
              type="text"
              value={newUserName}
              onChange={event => setNewUserName(event.target.value)}
              placeholder="Jane Doe"
              required
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={newUserIsAdmin}
              onChange={event => setNewUserIsAdmin(event.target.checked)}
            />
            Grant admin rights on creation
          </label>
          <div className="actions">
            <button type="submit">Create user</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Submit a VLAN Request</h2>
        <form className="form-grid" onSubmit={submitRequest}>
          <label>
            Requesting user
            <select value={requestUserId} onChange={event => setRequestUserId(event.target.value)} required>
              <option value="">Select a user</option>
              {sortedUsers
                .filter(user => user.isActive)
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.subject})
                  </option>
                ))}
            </select>
          </label>
          <label>
            VLAN
            <select value={requestVlanId} onChange={event => setRequestVlanId(event.target.value)} required>
              <option value="">Select a VLAN</option>
              {sortedVlans.map(vlan => (
                <option key={vlan.vlanId} value={vlan.vlanId}>
                  {vlan.vlanId} – {vlan.description}
                </option>
              ))}
            </select>
          </label>
          <label>
            Request submitted by (optional)
            <select value={requestCreatorId} onChange={event => setRequestCreatorId(event.target.value)}>
              <option value="">Same as requesting user</option>
              {sortedUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.subject})
                </option>
              ))}
            </select>
          </label>
          <div className="actions">
            <button type="submit">Submit request</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Admin Controls</h2>
        <form className="form-grid" onSubmit={toggleAdminRights}>
          <label>
            Acting admin (optional)
            <select value={actingAdminId} onChange={event => setActingAdminId(event.target.value)}>
              <option value="">Select an admin</option>
              {adminUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.subject})
                </option>
              ))}
            </select>
          </label>
          <label>
            Target user
            <select value={adminTargetId} onChange={event => setAdminTargetId(event.target.value)} required>
              <option value="">Select a user</option>
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
            Grant admin rights
          </label>
          <div className="actions">
            <button type="submit">Update admin rights</button>
          </div>
        </form>
        <p className="hint">
          Selecting an acting admin enforces that only administrators can approve requests. Leaving it blank allows
          creating the first admin user.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Requests</h2>
          <div className="legend">
            <span className="status pending">Pending</span>
            <span className="status approved">Approved</span>
            <span className="status rejected">Rejected</span>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>VLAN</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Created by</th>
                <th>Updated by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    No requests have been submitted yet.
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
                  <td>{request.createdByName ?? '-'}</td>
                  <td>{request.updatedByName ?? '-'}</td>
                  <td>
                    <div className="actions-inline">
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(request.id, 'approved')}
                        disabled={request.status !== 'pending' || !actingAdminId}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                        disabled={request.status !== 'pending' || !actingAdminId}
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
    </div>
  )
}

export default App
