import type { RequestRecord } from './types'

export const statusLabels: Record<RequestRecord['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}
