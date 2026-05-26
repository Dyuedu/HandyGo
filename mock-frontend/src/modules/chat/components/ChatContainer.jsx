import { useEffect, useRef, useState, Fragment } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { getConversations, getChatHistory, uploadChatFiles } from '../../../services/chatService'
import { AppIcon } from '../../../components/AppIcon'
import { useLanguage } from '../../../i18n/LanguageContext'
import '../../../styles/modules/chat/components/ChatContainer.css'

export default function ChatContainer() {
  const { session, mode } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // States
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [socketStatus, setSocketStatus] = useState('connecting') // connected, connecting, disconnected
  
  // Refs
  const wsRef = useRef(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const activeChatRef = useRef(null) // Keeps a ref of activeChat for WebSocket callback

  // Sync activeChatRef with activeChat state
  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  // Fetch all conversations from backend
  const fetchConversations = async (selectContactId = null) => {
    try {
      const response = await getConversations()
      const convList = response.data || []
      setConversations(convList)

      // Handle selecting active chat from URL parameters or existing list
      const contactIdParam = selectContactId || searchParams.get('contactId')
      if (contactIdParam) {
        const existing = convList.find((c) => c.contactId === contactIdParam)
        if (existing) {
          setActiveChat(existing)
        } else {
          // If not in existing conversations list, create a temporary active chat item
          const nameParam = searchParams.get('name')
          const roleParam = searchParams.get('role')
          const tempChat = {
            contactId: contactIdParam,
            contactName: nameParam ? decodeURIComponent(nameParam) : t('chat.newUser'),
            contactRole: roleParam || 'USER',
            lastMessage: t('chat.starting'),
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            isTemp: true,
          }
          setActiveChat(tempChat)
          setConversations((prev) => [tempChat, ...prev])
        }
        
        // Clear search parameters to avoid resetting on refresh
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('contactId')
        newParams.delete('name')
        newParams.delete('role')
        setSearchParams(newParams)
      } else if (!activeChat && convList.length > 0 && !selectContactId) {
        // Default to select first conversation if no active chat
        setActiveChat(convList[0])
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại', err)
    }
  }

  // Load chat history between current user and active contact
  const loadChatHistory = async (contactId) => {
    try {
      const response = await getChatHistory(contactId)
      setMessages(response.data || [])
    } catch (err) {
      console.error('Lỗi khi tải lịch sử nhắn tin', err)
    }
  }

  // Establish WebSocket connection
  const connectWebSocket = () => {
    if (!session?.accessToken) return

    // Close existing socket if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    setSocketStatus('connecting')
    const wsUrl = `ws://localhost:8080/ws?token=${session.accessToken}`
    const socket = new WebSocket(wsUrl)
    wsRef.current = socket

    socket.onopen = () => {
      console.log('Đã kết nối WebSocket Chat thành công')
      setSocketStatus('connected')
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const currentActive = activeChatRef.current

        // Check if the message is part of the currently active chat
        if (
          currentActive &&
          ((msg.senderId === currentActive.contactId && msg.receiverId === session.id) ||
            (msg.senderId === session.id && msg.receiverId === currentActive.contactId))
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            
            // If this message was sent by me and we have a temporary message in list, match and replace it
            if (msg.senderId === session.id) {
              const tempIndex = prev.findIndex((m) => m.id && m.id.toString().startsWith('temp-'))
              if (tempIndex !== -1) {
                const updated = [...prev]
                updated[tempIndex] = msg
                return updated
              }
            }
            return [...prev, msg]
          })
        }

        // Update the conversations list to reflect the new message
        setConversations((prevList) => {
          const updatedList = [...prevList]
          const contactId = msg.senderId === session.id ? msg.receiverId : msg.senderId
          const index = updatedList.findIndex((c) => c.contactId === contactId)

          if (index !== -1) {
            const updatedConv = {
              ...updatedList[index],
              lastMessage: msg.content || (msg.attachments && msg.attachments.length > 0 ? t('chat.image') : t('chat.message')),
              lastMessageTime: msg.sentAt,
              isTemp: false, // It's no longer temporary once a message is sent/received
            }
            // Remove from old position and move to top
            updatedList.splice(index, 1)
            return [updatedConv, ...updatedList]
          } else {
            // If contact is not in list, trigger full refresh to fetch details
            fetchConversations()
            return prevList
          }
        })
      } catch (err) {
        console.error('Lỗi phân tích tin nhắn WebSocket', err)
      }
    }

    socket.onclose = () => {
      console.log('Kết nối WebSocket Chat đã đóng. Đang kết nối lại...')
      setSocketStatus('disconnected')
      // Auto reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 3000)
    }

    socket.onerror = (err) => {
      console.error('Lỗi kết nối WebSocket Chat:', err)
      socket.close()
    }
  }

  // Initial load
  useEffect(() => {
    fetchConversations()
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect loops on unmount
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Load chat history whenever activeChat changes
  useEffect(() => {
    if (activeChat && !activeChat.isTemp) {
      loadChatHistory(activeChat.contactId)
    } else if (activeChat && activeChat.isTemp) {
      setMessages([]) // Empty history for new temporary chats
    }
  }, [activeChat])

  // Scroll to bottom of chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  // Handle removing a staged file from preview list
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle clipboard paste of images (Ctrl + V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          files.push(file)
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault()
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!activeChat) return

    // If there are files to upload, send via REST multipart request
    if (selectedFiles.length > 0) {
      const content = text.trim()
      const filesToSend = [...selectedFiles]

      // Generate tempId for optimistic UI update
      const tempId = `temp-${Date.now()}`
      const optimisticMsg = {
        id: tempId,
        senderId: session.id,
        receiverId: activeChat.contactId,
        content: content,
        messageType: 'IMAGE',
        sentAt: new Date().toISOString(),
        attachments: filesToSend.map((file, index) => ({
          id: `temp-att-${index}-${Date.now()}`,
          fileUrl: URL.createObjectURL(file), // Direct local file preview URL
          fileType: file.type,
        })),
        isSending: true,
      }

      // Append optimistic message to UI instantly
      setMessages((prev) => [...prev, optimisticMsg])

      // Reset states immediately for UI speed
      setText('')
      setSelectedFiles([])

      try {
        const response = await uploadChatFiles(activeChat.contactId, content, filesToSend)
        const savedMsg = response.data
        
        setMessages((prev) => {
          // If the message was already added or replaced by WebSocket, just remove the temp message
          if (prev.some((m) => m.id === savedMsg.id)) {
            return prev.filter((m) => m.id !== tempId)
          }
          // Otherwise, replace the temp message with saved message
          return prev.map((m) => (m.id === tempId ? savedMsg : m))
        })
      } catch (err) {
        console.error('Lỗi khi gửi tệp đính kèm', err)
        // Mark optimistic message as failed
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, isSending: false, isFailed: true } : m))
        )
      }
      return
    }

    // Otherwise, send text message via WebSockets
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const payload = {
      receiverId: activeChat.contactId,
      content: text.trim(),
      messageType: 'TEXT',
    }

    wsRef.current.send(JSON.stringify(payload))
    setText('')
  }

  // Helper: Format message send time (handles dates, strings, and Jackson arrays)
  const formatTime = (timeInput) => {
    if (!timeInput) return ''
    try {
      if (Array.isArray(timeInput)) {
        // timeInput format: [year, month, day, hour, minute, second, nano]
        const hour = timeInput[3] ?? 0
        const minute = timeInput[4] ?? 0
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      
      const date = new Date(timeInput)
      if (isNaN(date.getTime())) {
        // Try to parse out time segment manually if the string format is invalid
        if (typeof timeInput === 'string' && timeInput.includes('T')) {
          const timePart = timeInput.split('T')[1]
          if (timePart) {
            const [h, m] = timePart.split(':')
            if (h && m) {
              return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
            }
          }
        }
        return ''
      }
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  const parseTimeToMs = (timeInput) => {
    if (!timeInput) return null
    try {
      if (Array.isArray(timeInput)) {
        const [year, month, day, hour, minute, second] = timeInput
        const date = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0)
        return date.getTime()
      }
      const date = new Date(timeInput)
      if (isNaN(date.getTime())) {
        if (typeof timeInput === 'string' && timeInput.includes('T')) {
          const parts = timeInput.split('T')
          const dateParts = parts[0].split('-').map(Number)
          const timeParts = parts[1].split(':').map(Number)
          if (dateParts.length >= 3) {
            const date = new Date(
              dateParts[0],
              dateParts[1] - 1,
              dateParts[2],
              timeParts[0] || 0,
              timeParts[1] || 0,
              timeParts[2] || 0
            )
            return date.getTime()
          }
        }
        return null
      }
      return date.getTime()
    } catch {
      return null
    }
  }

  const shouldShowTimeDivider = (index) => {
    if (index === 0) return true
    const msg = messages[index]
    const prevMsg = messages[index - 1]
    const currTime = parseTimeToMs(msg.sentAt)
    const prevTime = parseTimeToMs(prevMsg.sentAt)
    if (!currTime || !prevTime) return false
    return currTime - prevTime > 5 * 60 * 1000 // 5 minutes threshold
  }

  const showBubbleTimestamp = (index) => {
    const msg = messages[index]
    const nextMsg = messages[index + 1]
    if (!nextMsg) return true // Last message always shows timestamp
    if (nextMsg.senderId !== msg.senderId) return true // Different sender shows timestamp
    const currTime = parseTimeToMs(msg.sentAt)
    const nextTime = parseTimeToMs(nextMsg.sentAt)
    if (currTime && nextTime && nextTime - currTime > 5 * 60 * 1000) return true // Next message > 5 minutes apart shows timestamp
    return false
  }

  const formatTimeDivider = (timeInput) => {
    if (!timeInput) return ''
    try {
      const ms = parseTimeToMs(timeInput)
      if (!ms) return ''
      const date = new Date(ms)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const timeStr = `${hours}:${minutes}`
      if (isToday) {
        return `${t('chat.today')}, ${timeStr}`
      } else {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year} ${timeStr}`
      }
    } catch {
      return ''
    }
  }

  const handleBookWorker = () => {
    if (!activeChat?.contactId) return

    const chatReturnPath = `/app/chat?contactId=${activeChat.contactId}&name=${encodeURIComponent(activeChat.contactName || '')}&role=${activeChat.contactRole || 'WORKER'}`
    navigate(`/app/worker/${activeChat.contactId}`, {
      state: {
        from: chatReturnPath,
        openBooking: true,
      },
    })
  }

  const canBookActiveWorker = mode === 'CUSTOMER' && activeChat?.contactRole === 'WORKER'

  // Filter conversations based on search text
  const filteredConversations = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="chat-module-container">
      {/* Sidebar - Conversations list */}
      <aside className="chat-sidebar" aria-label={t('chat.conversations')}>
        <div className="chat-sidebar-header">
          <h3>{t('chat.conversations')}</h3>
          <div className="search-contacts-wrapper">
            <span className="search-icon-placeholder">🔍</span>
            <input
              type="text"
              placeholder={t('chat.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-contacts-input"
            />
          </div>
        </div>

        <div className="conversations-scroll-list">
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>
              {t('chat.emptyConversations')}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeChat?.contactId === conv.contactId
              const initials = conv.contactName ? conv.contactName.substring(0, 2).toUpperCase() : 'US'
              const isWorker = conv.contactRole === 'WORKER'

              return (
                <div
                  key={conv.contactId}
                  className={`conversation-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveChat(conv)}
                >
                  <div className={`contact-avatar ${isWorker ? 'worker' : ''}`}>
                    {initials}
                    <span className="status-dot-indicator" />
                  </div>
                  <div className="conversation-item-info">
                    <div className="conversation-item-title-row">
                      <span className="conversation-item-name">
                        {conv.contactName}
                        <span className={`role-tag-badge ${isWorker ? 'worker' : 'customer'}`}>
                          {isWorker ? t('common.worker') : t('chat.customerShort')}
                        </span>
                      </span>
                      <span className="conversation-item-time">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="conversation-item-lastmsg-row">
                      <span className="conversation-item-lastmsg">{conv.lastMessage}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* Main chat window area */}
      <section className="chat-main-area" aria-label={t('chat.conversations')}>
        {activeChat ? (
          <>
            {/* Header info of active contact */}
            <div className="chat-main-header">
              <div className="active-contact-profile-card">
                <div className={`contact-avatar ${activeChat.contactRole === 'WORKER' ? 'worker' : ''}`} style={{ width: '40px', height: '40px', fontSize: '0.9rem', marginRight: '10px' }}>
                  {activeChat.contactName ? activeChat.contactName.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="active-contact-info-text">
                  <h4>{activeChat.contactName}</h4>
                  <p>{t('chat.online')}</p>
                </div>
              </div>
              {canBookActiveWorker && (
                <button
                  type="button"
                  className="chat-book-worker-btn"
                  onClick={handleBookWorker}
                  title={t('chat.bookWorker')}
                >
                  <AppIcon name="calendar" size={17} />
                  <span>{t('chat.bookWorker')}</span>
                </button>
              )}
            </div>

            {/* Connection Status indicator */}
            {socketStatus !== 'connected' && selectedFiles.length === 0 && (
              <div className={`ws-connection-status-bar ${socketStatus}`}>
                {socketStatus === 'connecting'
                  ? t('chat.reconnecting')
                  : t('chat.disconnected')}
              </div>
            )}

            {/* Messages box list */}
            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {t('chat.startMessage')}
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === session.id
                  const isWorker = activeChat.contactRole === 'WORKER'
                  const showDivider = shouldShowTimeDivider(index)
                  const showTimestamp = showBubbleTimestamp(index)

                  return (
                    <Fragment key={msg.id || `${msg.sentAt}-${Math.random()}`}>
                      {showDivider && (
                        <div className="chat-time-separator">
                          {formatTimeDivider(msg.sentAt)}
                        </div>
                      )}
                      <div className={`chat-message-row ${isMe ? 'outgoing' : 'incoming'}`}>
                        <div className="chat-bubble-wrapper">
                          {!isMe && (
                            <div className={`message-avatar ${isWorker ? 'worker' : ''}`}>
                              {activeChat.contactName ? activeChat.contactName.substring(0, 2).toUpperCase() : 'US'}
                            </div>
                          )}
                          <div className="chat-message-content-group">
                            {msg.content && (
                              <div className={`chat-bubble-body ${showTimestamp ? 'has-timestamp' : ''}`}>
                                <div className="chat-bubble-content-text">{msg.content}</div>
                                {showTimestamp && (
                                  <span className="message-bubble-timestamp">{formatTime(msg.sentAt)}</span>
                                )}
                              </div>
                            )}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="chat-message-attachments-grid">
                                {msg.attachments.map((att) => (
                                  <div key={att.id} className="attachment-img-wrapper">
                                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={att.fileUrl} 
                                        alt={t('chat.attachmentAlt')}
                                        className="attachment-img-preview" 
                                      />
                                    </a>
                                    {msg.isSending && (
                                      <div className="attachment-upload-loader">
                                        <div className="spinner-loader" />
                                        <span>{t('chat.sending')}</span>
                                      </div>
                                    )}
                                    {msg.isFailed && (
                                      <div className="attachment-upload-loader" style={{ backgroundColor: 'rgba(239, 68, 68, 0.75)' }}>
                                        <AppIcon name="alert" size={20} />
                                        <span>{t('chat.imageError')}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {showTimestamp && !msg.content && (
                              <span className="message-attachment-timestamp">{formatTime(msg.sentAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Staged file previews */}
            {selectedFiles.length > 0 && (
              <div className="file-previews-container">
                {selectedFiles.map((file, idx) => {
                  const url = URL.createObjectURL(file)
                  return (
                    <div key={idx} className="file-preview-item">
                      <img src={url} alt={t('chat.previewAlt')} className="file-preview-image" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="file-preview-remove-btn"
                        title={t('chat.removeImage')}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Input toolbar panel */}
            <div className="chat-input-toolbar-panel">
              <form onSubmit={handleSendMessage} className="chat-message-form">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="chat-upload-file-btn"
                  title={t('chat.attachImage')}
                >
                  📷
                </button>
                <input
                  type="text"
                  placeholder={t('chat.inputPlaceholder')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onPaste={handlePaste}
                  className="chat-message-textfield"
                />
                <button
                  type="submit"
                  disabled={(!text.trim() && selectedFiles.length === 0) || (selectedFiles.length === 0 && socketStatus !== 'connected')}
                  className="chat-send-action-btn"
                >
                  {t('chat.send')} ➔
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="empty-chat-state-panel">
            <span className="empty-chat-illustration" aria-hidden="true"><AppIcon name="chat" size={42} /></span>
            <h4>{t('chat.emptyTitle')}</h4>
            <p>{t('chat.emptyDesc')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
