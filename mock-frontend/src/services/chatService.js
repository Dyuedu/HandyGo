import axiosClient from '../api/axiosClient'

export function getConversations(params) {
  return axiosClient.get('/api/chat/conversations', { params })
}
