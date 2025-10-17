import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Vlan } from '../../types'

type VlansTabProps = {
  vlans: Vlan[]
  onCreateVlan: (input: { vlanId: number; description: string }) => Promise<void>
}

export default function VlansTab({ vlans, onCreateVlan }: VlansTabProps) {
  const [newVlanId, setNewVlanId] = useState('')
  const [newVlanDescription, setNewVlanDescription] = useState('')
  const [isCreatingVlan, setIsCreatingVlan] = useState(false)
  const [vlanSearch, setVlanSearch] = useState('')

  const sortedVlans = useMemo(
    () => [...vlans].sort((a, b) => a.vlanId - b.vlanId),
    [vlans]
  )

  const filteredVlans = useMemo(() => {
    const query = vlanSearch.trim().toLowerCase()
    if (!query) {
      return sortedVlans
    }
    const tokens = query.split(/\s+/)
    return sortedVlans.filter(vlan => {
      const haystack = vlan.description.toLowerCase()
      return tokens.every(token => haystack.includes(token))
    })
  }, [sortedVlans, vlanSearch])

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

  return (
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
        <div className="table-toolbar">
          <label>
            説明で検索
            <input
              type="search"
              value={vlanSearch}
              onChange={event => setVlanSearch(event.target.value)}
              placeholder="例: Corporate"
            />
          </label>
          <div className="hint">
            {filteredVlans.length} / {sortedVlans.length}
          </div>
        </div>
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
            {sortedVlans.length > 0 && filteredVlans.length === 0 && (
              <tr>
                <td colSpan={2} className="empty">
                  条件に一致する VLAN がありません。
                </td>
              </tr>
            )}
            {filteredVlans.map(vlan => (
              <tr key={vlan.vlanId}>
                <td>{vlan.vlanId}</td>
                <td>{vlan.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
