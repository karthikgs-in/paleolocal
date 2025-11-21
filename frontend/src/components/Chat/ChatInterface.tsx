import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatResponse } from '../../types';
import { chatService } from '../../services/chatService';
import './ChatInterface.css';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
  siteName?: string;
  userId: string;
  position?: { x: number; y: number } | null;
  isMapMode?: boolean;
  isDocked?: boolean;
  isMovable?: boolean;
  isResizable?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  siteId,
  siteName,
  userId,
  position = null,
  isMapMode = false,
  isDocked = false,
  isMovable = false,
  isResizable = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Movable and resizable state
  const [chatPosition, setChatPosition] = useState(position || { x: 50, y: 50 });
  const [chatSize, setChatSize] = useState({ width: 400, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>({
    startX: 0, startY: 0, startPosX: 0, startPosY: 0
  });
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number }>({
    startX: 0, startY: 0, startWidth: 0, startHeight: 0
  });

  // Update position when prop changes
  useEffect(() => {
    if (position && !isDragging) {
      setChatPosition(position);
    }
  }, [position, isDragging]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isMovable || isDocked) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: chatPosition.x,
      startPosY: chatPosition.y
    };
  }, [isMovable, isDocked, chatPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isMovable || isDocked) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setChatPosition({
      x: Math.max(0, Math.min(window.innerWidth - chatSize.width, dragRef.current.startPosX + deltaX)),
      y: Math.max(0, Math.min(window.innerHeight - chatSize.height, dragRef.current.startPosY + deltaY))
    });
  }, [isDragging, isMovable, isDocked, chatSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizingChat(false);
  }, []);

  // Resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isResizable || isDocked) return;
    e.stopPropagation();
    setIsResizingChat(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: chatSize.width,
      startHeight: chatSize.height
    };
  }, [isResizable, isDocked, chatSize]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingChat || !isResizable || isDocked) return;
    
    const deltaX = e.clientX - resizeRef.current.startX;
    const deltaY = e.clientY - resizeRef.current.startY;
    
    setChatSize({
      width: Math.max(300, Math.min(800, resizeRef.current.startWidth + deltaX)),
      height: Math.max(200, Math.min(600, resizeRef.current.startHeight + deltaY))
    });
  }, [isResizingChat, isResizable, isDocked]);

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizingChat) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingChat, handleResizeMouseMove, handleMouseUp]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load chat history when site changes
  useEffect(() => {
    if (isOpen && siteId) {
      loadChatHistory();
    }
  }, [isOpen, siteId]);

  const loadChatHistory = async () => {
    if (!siteId) return;
    
    try {
      const history = await chatService.getChatHistory(userId, siteId);
      setMessages(history.messages);
      setSessionId(history.sessionId);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      siteId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response: ChatResponse = await chatService.sendMessage({
        message: userMessage.content,
        userId,
        siteId,
        sessionId
      });

      const assistantMessage: ChatMessage = {
        id: response.messageId,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        siteId
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.sessionId);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    if (!siteId) return;
    
    try {
      await chatService.clearChatHistory(userId, siteId);
      setMessages([]);
      setSessionId(undefined);
    } catch (err) {
      console.error('Failed to clear chat:', err);
      setError('Failed to clear chat');
    }
  };

  if (!isOpen) return null;

  const chatStyle = isDocked 
    ? {} // No positioning for docked mode
    : isMapMode || isMovable
      ? {
          position: 'fixed' as const,
          left: `${chatPosition.x}px`,
          top: `${chatPosition.y}px`,
          width: `${chatSize.width}px`,
          height: `${chatSize.height}px`,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : (isMovable ? 'grab' : 'default')
        }
      : {};

  const overlayClass = isDocked 
    ? '' 
    : isMapMode 
      ? 'chat-interface-overlay-map' 
      : 'chat-interface-overlay';

  const interfaceClass = isDocked
    ? 'chat-interface chat-interface-docked'
    : isMapMode || isMovable
      ? 'chat-interface-map' 
      : 'chat-interface';

  return (
    <div className={overlayClass} style={isMapMode ? { position: 'fixed', pointerEvents: 'none' } : {}}>
      <div 
        className={interfaceClass} 
        style={{ 
          ...chatStyle,
          pointerEvents: 'auto'
        }}
      >
        {/* Drag handle for floating mode */}
        {(isMovable && !isDocked) && (
          <div 
            className="chat-drag-handle"
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40px',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 1001
            }}
          />
        )}

        {/* Resize handle for floating mode */}
        {(isResizable && !isDocked) && (
          <div 
            className="chat-resize-handle"
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '15px',
              height: '15px',
              cursor: 'se-resize',
              background: '#ccc',
              opacity: 0.7,
              zIndex: 1001
            }}
          />
        )}

        {/* Header - simplified for docked mode */}
        <div className="chat-header">
          <div className="chat-title">
            <h3>Chat{siteName ? ` - ${siteName}` : ''}</h3>
            {siteId && (
              <span className="chat-site-id">Site ID: {siteId}</span>
            )}
          </div>
          <div className="chat-actions">
            <button
              onClick={clearChat}
              className="chat-clear-btn"
              disabled={messages.length === 0}
              title="Clear chat history"
            >
              🗑️
            </button>
            {!isDocked && (
              <button
                onClick={onClose}
                className="chat-close-btn"
                title="Close chat"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <p>👋 Welcome! Ask me anything about this paleontological site.</p>
              <p>I can help with geological formations, fossils, accessibility, and more!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message chat-message-${message.role}`}
            >
              <div className="chat-message-content">
                {message.content}
              </div>
              <div className="chat-message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="chat-message chat-message-assistant">
              <div className="chat-message-content chat-loading">
                <span>🤔 Thinking...</span>
                <div className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about this site..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="chat-send-btn"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
          <div className="chat-input-hint">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatInterface);