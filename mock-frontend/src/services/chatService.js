import axiosClient from '../api/axiosClient'

export function getConversations(params) {
  return axiosClient.get('/api/chat/conversations', { params })
}

export function getChatHistory(contactId) {
  return axiosClient.get('/api/chat/messages', { params: { contactId } })
}

export function uploadChatFiles(receiverId, content, files) {
  const formData = new FormData()
  formData.append('receiverId', receiverId)
  if (content) {
    formData.append('content', content)
  }
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file)
    })
  }
  return axiosClient.post('/api/chat/messages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
