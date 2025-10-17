export type User = {
  id: number
  subject: string
  name: string
  createdAt: string
  isActive: boolean
  isAdmin: boolean
  adminRightBy: number | null
}

export type Vlan = {
  vlanId: number
  description: string
}

export type RequestRecord = {
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
