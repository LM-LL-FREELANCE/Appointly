import { request } from './api.js'

export const uploadAvatar = ({ dni, file }) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return request(`/api/storage/avatar/${dni}`, {
    method: 'POST',
    body: formData,
  })
}

export const deleteAvatar = ({ dni }) => {
  return request(`/api/storage/avatar/${dni}`, {
    method: 'DELETE',
  })
}
