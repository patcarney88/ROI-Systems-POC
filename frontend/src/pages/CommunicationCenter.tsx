import { useState, useRef, useEffect } from 'react';
import {
  Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, X,
  Check, CheckCheck, Image, FileText, Mic, Filter, Star, Archive,
  ChevronLeft, Plus, Edit3, Home
} from 'lucide-react';
import type {
  Conversation,
  Message,
  MessageTemplate,
  QuickReply
} from '../types/communications';
import { SMS_TEMPLATES, EMAIL_TEMPLATES, QUICK_REPLIES } from '../types/communications';
import DemoHeader from '../components/DemoHeader';
import Breadcrumb from '../components/Breadcrumb';

// Mock data
const mockConversations: Conversation[] = [
  {
    id: '1',
    clientId: 'c1',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.j@email.com',
    clientPhone: '(555) 123-4567',
    isOnline: true,
    lastMessage: {
      id: 'm1',
      conversationId: '1',
      senderId: 'c1',
      senderName: 'Sarah Johnson',
      senderType: 'client',
      content: 'Thanks for the update! When can we schedule a showing?',
      channel: 'in_app',
      status: 'read',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isTemplate: false
    },
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    status: 'active',
    channel: 'in_app',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    tags: ['hot-lead']
  },
  {
    id: '2',
    clientId: 'c2',
    clientName: 'Michael Chen',
    clientEmail: 'michael.c@email.com',
    clientPhone: '(555) 234-5678',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    lastMessage: {
      id: 'm2',
      conversationId: '2',
      senderId: 'agent1',
      senderName: 'Agent',
      senderType: 'agent',
      content: 'I sent over the documents you requested. Let me know if you have any questions!',
      channel: 'sms',
      status: 'delivered',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isTemplate: false
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    status: 'active',
    channel: 'sms',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: []
  },
  {
    id: '3',
    clientId: 'c3',
    clientName: 'Emma Wilson',
    clientEmail: 'emma.w@email.com',
    isOnline: false,
    lastMessage: {
      id: 'm3',
      conversationId: '3',
      senderId: 'c3',
      senderName: 'Emma Wilson',
      senderType: 'client',
      content: 'Got it, thanks!',
      channel: 'email',
      status: 'read',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isTemplate: false
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    status: 'active',
    channel: 'email',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: []
  }
];

const mockMessages: Message[] = [
  {
    id: 'm1',
    conversationId: '1',
    senderId: 'agent1',
    senderName: 'You',
    senderType: 'agent',
    content: 'Hi Sarah! I wanted to follow up on the property at 123 Oak Street. Are you still interested?',
    channel: 'in_app',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    isTemplate: false
  },
  {
    id: 'm2',
    conversationId: '1',
    senderId: 'c1',
    senderName: 'Sarah Johnson',
    senderType: 'client',
    content: 'Yes! I\'ve been thinking about it. The location is perfect.',
    channel: 'in_app',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    isTemplate: false
  },
  {
    id: 'm3',
    conversationId: '1',
    senderId: 'agent1',
    senderName: 'You',
    senderType: 'agent',
    content: 'Great! The seller just reduced the price by $10,000. Would you like to schedule a showing this week?',
    channel: 'in_app',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    isTemplate: false
  },
  {
    id: 'm4',
    conversationId: '1',
    senderId: 'c1',
    senderName: 'Sarah Johnson',
    senderType: 'client',
    content: 'Thanks for the update! When can we schedule a showing?',
    channel: 'in_app',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isTemplate: false
  }
];

// Breadcrumb configuration
const breadcrumbItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Realtor Dashboard', path: '/dashboard/realtor' },
  { label: 'Communications' }
];

export default function CommunicationCenter() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: 'agent1',
      senderName: 'You',
      senderType: 'agent',
      content: messageInput,
      channel: selectedConversation.channel,
      status: 'sent',
      timestamp: new Date().toISOString(),
      isTemplate: false
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    // Update conversation's last message
    setConversations(conversations.map(conv =>
      conv.id === selectedConversation.id
        ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
        : conv
    ));

    // Simulate delivery
    setTimeout(() => {
      setMessages(msgs => msgs.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'delivered', deliveredAt: new Date().toISOString() } : msg
      ));
    }, 1000);

    // Simulate read
    setTimeout(() => {
      setMessages(msgs => msgs.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'read', readAt: new Date().toISOString() } : msg
      ));
    }, 3000);
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setMessageInput(template.content);
    setShowTemplates(false);
  };

  const handleQuickReply = (reply: QuickReply) => {
    setMessageInput(reply.text);
    setShowQuickReplies(false);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMessageStatus = (message: Message) => {
    if (message.senderType === 'client') return null;
    
    switch (message.status) {
      case 'sent':
        return <Check size={14} />;
      case 'delivered':
      case 'read':
        return <CheckCheck size={14} className={message.status === 'read' ? 'read' : ''} />;
      default:
        return null;
    }
  };

  return (
    <div className="communication-center">
      <DemoHeader dashboardName="Communication Center" isDemoMode={true} />
      <Breadcrumb items={breadcrumbItems} />

      {/* Conversation List */}
      <div className={`conversation-list ${isMobileView && !showConversationList ? 'hidden' : ''}`}>
        <div className="conversation-header">
          <h2>Messages</h2>
          <div className="header-actions">
            <button className="icon-btn" title="Filter">
              <Filter size={18} />
            </button>
            <button className="icon-btn" title="New conversation">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="conversation-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="conversations">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => {
                setSelectedConversation(conv);
                if (isMobileView) setShowConversationList(false);
              }}
            >
              <div className="conversation-avatar">
                <div className="avatar-circle">
                  {conv.clientName.split(' ').map(n => n[0]).join('')}
                </div>
                {conv.isOnline && <div className="online-indicator" />}
              </div>

              <div className="conversation-info">
                <div className="conversation-top">
                  <h3>{conv.clientName}</h3>
                  <span className="conversation-time">
                    {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                  </span>
                </div>
                <div className="conversation-bottom">
                  <p className="last-message">
                    {conv.lastMessage?.senderType === 'agent' && 'You: '}
                    {conv.lastMessage?.content}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
              </div>

              {conv.isPinned && (
                <div className="pinned-indicator">
                  <Star size={14} fill="currentColor" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className={`message-thread ${isMobileView && showConversationList ? 'hidden' : ''}`}>
          <div className="thread-header">
            {isMobileView && (
              <button
                className="back-btn"
                onClick={() => setShowConversationList(true)}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div className="thread-client-info">
              <div className="client-avatar">
                {selectedConversation.clientName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3>{selectedConversation.clientName}</h3>
                <span className="client-status">
                  {selectedConversation.isOnline ? 'Online' : `Last seen ${formatTime(selectedConversation.lastSeen || '')}`}
                </span>
              </div>
            </div>

            <div className="thread-actions">
              <button className="icon-btn" title="Call">
                <Phone size={18} />
              </button>
              <button className="icon-btn" title="Video call">
                <Video size={18} />
              </button>
              <button className="icon-btn" title="More">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          <div className="messages-container" ref={messagesContainerRef}>
            {messages
              .filter(msg => msg.conversationId === selectedConversation.id)
              .map(message => (
                <div
                  key={message.id}
                  className={`message ${message.senderType === 'agent' ? 'sent' : 'received'}`}
                >
                  {message.senderType === 'client' && (
                    <div className="message-avatar">
                      {message.senderName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}

                  <div className="message-content">
                    <div className="message-bubble">
                      <p>{message.content}</p>
                    </div>
                    <div className="message-meta">
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                      {getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              ))}

            {isTyping && (
              <div className="message received">
                <div className="message-avatar">
                  {selectedConversation.clientName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="message-content">
                  <div className="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {showQuickReplies && (
            <div className="quick-replies">
              {QUICK_REPLIES.map(reply => (
                <button
                  key={reply.id}
                  className="quick-reply-btn"
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply.text}
                </button>
              ))}
            </div>
          )}

          {/* Templates */}
          {showTemplates && (
            <div className="templates-panel">
              <div className="templates-header">
                <h3>Message Templates</h3>
                <button onClick={() => setShowTemplates(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="templates-list">
                <div className="template-category">
                  <h4>SMS Templates</h4>
                  {SMS_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      className="template-item"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="template-name">{template.name}</div>
                      <div className="template-preview">{template.content.substring(0, 60)}...</div>
                    </button>
                  ))}
                </div>
                <div className="template-category">
                  <h4>Email Templates</h4>
                  {EMAIL_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      className="template-item"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="template-name">{template.name}</div>
                      <div className="template-preview">{template.content.substring(0, 60)}...</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Composer */}
          <div className="message-composer">
            <div className="composer-actions">
              <button
                className="composer-btn"
                onClick={handleFileAttach}
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <button
                className="composer-btn"
                onClick={() => setShowTemplates(!showTemplates)}
                title="Templates"
              >
                <FileText size={20} />
              </button>
              <button
                className="composer-btn"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                title="Quick replies"
              >
                <Smile size={20} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
            />

            <div className="composer-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>

            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="no-conversation-selected">
          <div className="empty-state">
            <Edit3 size={64} />
            <h3>No Conversation Selected</h3>
            <p>Select a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
