import { useState } from 'react'
import type { RequestRecord, User, Vlan } from '../types'
import RequestsTab from './admin/RequestsTab'
import CreateUserTab from './admin/CreateUserTab'
import AdminControlsTab from './admin/AdminControlsTab'
import VlansTab from './admin/VlansTab'

type AdminTab = 'requests' | 'createUser' | 'adminControls' | 'vlans'

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
  onUndo: (requestId: number, actingAdminId: number) => Promise<void>
}

export default function AdminPage({
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
  onCreateVlan,
  onUndo
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('requests')

  const handleRefresh = async () => {
    try {
      await onRefresh()
    } catch {
      // エラー表示は親で行う
    }
  }

  const defaultAdminId = String(currentUser.id)

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
        <RequestsTab
          requests={requests}
          adminUsers={adminUsers}
          defaultActingAdminId={defaultAdminId}
          onApprove={onApprove}
          onUndo={onUndo}
        />
      )}

      {activeTab === 'createUser' && (
        <CreateUserTab adminUsers={adminUsers} onCreateUser={onCreateUser} />
      )}

      {activeTab === 'adminControls' && (
        <AdminControlsTab
          users={users}
          adminUsers={adminUsers}
          defaultAdminId={defaultAdminId}
          onUpdateAdminRights={onUpdateAdminRights}
        />
      )}

      {activeTab === 'vlans' && <VlansTab vlans={vlans} onCreateVlan={onCreateVlan} />}
    </div>
  )
}
