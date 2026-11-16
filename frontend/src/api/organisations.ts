import type { Organisation, OrganisationInput } from '../types/api'
import { api } from './client'

export const getMyOrganisation = () => api<Organisation | null>('/organisations/mine')

export const applyOrganisation = (input: OrganisationInput) =>
  api<Organisation>('/organisations', { method: 'POST', body: JSON.stringify(input) })

export const updateMyOrganisation = (input: OrganisationInput) =>
  api<Organisation>('/organisations/mine', { method: 'PUT', body: JSON.stringify(input) })
