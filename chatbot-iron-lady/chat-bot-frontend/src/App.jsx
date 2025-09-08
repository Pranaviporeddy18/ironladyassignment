import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Crown, ArrowUp, Sparkles, Zap, MessageCircle, Shield, Star } from 'lucide-react';

const IronLadyChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      type: 'bot',
      content: "Welcome to Iron Lady Leadership! I'm here to help you with our transformational leadership programs. Ask me about Crucibles of Leadership, Powerful Requests, or how we can help you reach the TOP! 👑",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (messageText) => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const simulateTyping = useCallback(async (duration = 1500) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsTyping(false);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    console.log('📤 Sending message:', input.trim());
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      await simulateTyping();
      const response = await sendMessage(input.trim());
      
      const botMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: `error_${Date.now()}`,
        type: 'bot',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, simulateTyping]);

  const formatMessage = useCallback((content) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'message-break' : ''}>
        {line.includes('**') ? (
          <span dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="message-highlight">$1</strong>')
          }} />
        ) : (
          line
        )}
      </div>
    ));
  }, []);

  const quickPrompts = [
    "Tell me about your leadership programs",
    "What are Powerful Requests?", 
    "How do you help with career advancement?",
    "What makes Iron Lady different?"
  ];

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0a0a0f 100%);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.05) 0%, transparent 50%);
          pointer-events: none;
          animation: backgroundPulse 8s ease-in-out infinite;
        }

        @keyframes backgroundPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .chatbot-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          z-index: 1;
        }

        .chat-window {
          width: 100%;
          max-width: 1400px;
          height: 90vh;
          background: rgba(13, 15, 23, 0.95);
          backdrop-filter: blur(30px);
          border-radius: 28px;
          border: 1px solid rgba(120, 119, 198, 0.2);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.7), 
            0 0 0 1px rgba(255, 255, 255, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          animation: windowAppear 0.6s ease-out;
        }

        @keyframes windowAppear {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chat-window::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #7877c6, #ff77c6, #77dbff, transparent);
          animation: borderFlow 6s linear infinite;
        }

        @keyframes borderFlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .chat-header {
          background: linear-gradient(135deg, #7877c6 0%, #ff77c6 50%, #77dbff 100%);
          padding: 40px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .chat-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.12) 50%, transparent 70%),
            url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
          animation: headerShine 6s ease-in-out infinite;
        }

        @keyframes headerShine {
          0%, 100% { transform: translateX(-100%) translateY(-100%); }
          50% { transform: translateX(100%) translateY(100%); }
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(15px);
          border: 2px solid rgba(255, 255, 255, 0.1);
          animation: iconFloat 3s ease-in-out infinite;
          position: relative;
        }

        .header-icon::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #7877c6, #ff77c6, #77dbff, #7877c6);
          border-radius: 22px;
          z-index: -1;
          animation: iconBorder 3s linear infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes iconBorder {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .header-text h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 6px;
          letter-spacing: -0.8px;
          background: linear-gradient(45deg, #ffffff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-text p {
          font-size: 17px;
          opacity: 0.92;
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(16, 185, 129, 0.15);
          padding: 12px 20px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(15px);
          border: 2px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          animation: statusPulse 2s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        @keyframes statusPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        .trust-indicators {
          display: flex;
          gap: 16px;
          align-items: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          scroll-behavior: smooth;
          background: 
            linear-gradient(to bottom, transparent, rgba(13, 15, 23, 0.1)),
            url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%237877c6' fill-opacity='0.015'%3E%3Cpath d='m20 20 20-20v40z'/%3E%3C/g%3E%3C/svg%3E");
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(13, 15, 23, 0.6);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(120, 119, 198, 0.3);
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(120, 119, 198, 0.5);
        }

        .message-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          max-width: 85%;
          opacity: 0;
          animation: messageSlideIn 0.5s ease-out forwards;
          position: relative;
        }

        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(25px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .message-avatar {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .message-avatar.bot {
          background: linear-gradient(135deg, #6366f1, #7877c6);
          animation: botGlow 4s ease-in-out infinite;
        }

        .message-avatar.user {
          background: linear-gradient(135deg, #7877c6, #ff77c6);
          animation: userGlow 4s ease-in-out infinite;
        }

        @keyframes botGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(120, 119, 198, 0.3); }
          50% { box-shadow: 0 0 30px rgba(120, 119, 198, 0.5), 0 0 40px rgba(120, 119, 198, 0.2); }
        }

        @keyframes userGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 119, 198, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 119, 198, 0.5), 0 0 40px rgba(255, 119, 198, 0.2); }
        }

        .message-bubble {
          border-radius: 24px;
          padding: 20px 28px;
          position: relative;
          word-wrap: break-word;
          backdrop-filter: blur(15px);
          transition: all 0.4s ease;
          max-width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .message-bubble:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
        }

        .message-bubble.bot {
          background: rgba(30, 41, 59, 0.85);
          color: #f8fafc;
          border-left: 4px solid rgba(120, 119, 198, 0.6);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .message-bubble.user {
          background: linear-gradient(135deg, rgba(120, 119, 198, 0.9), rgba(255, 119, 198, 0.9));
          color: white;
          box-shadow: 0 8px 25px rgba(120, 119, 198, 0.3);
        }

        .message-content {
          font-size: 16px;
          line-height: 1.7;
          font-weight: 400;
          letter-spacing: 0.2px;
        }

        .message-break {
          height: 10px;
        }

        .message-highlight {
          color: #c4b5fd;
          font-weight: 700;
          background: rgba(196, 181, 253, 0.1);
          padding: 2px 6px;
          border-radius: 6px;
        }

        .message-time {
          position: absolute;
          bottom: -20px;
          right: 0;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.6);
          font-weight: 500;
        }

        .message-wrapper.user .message-time {
          right: auto;
          left: 0;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 18px;
          max-width: 85%;
          opacity: 0;
          animation: typingIn 0.4s ease-out forwards;
        }

        @keyframes typingIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .typing-bubble {
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 24px;
          padding: 20px 28px;
          display: flex;
          gap: 10px;
          align-items: center;
          backdrop-filter: blur(15px);
          border-left: 4px solid rgba(120, 119, 198, 0.6);
        }

        .typing-dot {
          width: 10px;
          height: 10px;
          background: linear-gradient(45deg, #c4b5fd, #7877c6);
          border-radius: 50%;
          animation: typingBounce 1.4s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(196, 181, 253, 0.3);
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-12px);
          }
        }

        .quick-prompts {
          padding: 0 40px 32px;
        }

        .prompts-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 15px;
          margin-bottom: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .prompts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .prompt-button {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(120, 119, 198, 0.2);
          border-radius: 16px;
          padding: 20px 24px;
          color: #e2e8f0;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          transition: all 0.4s ease;
          font-weight: 500;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          letter-spacing: 0.2px;
        }

        .prompt-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(120, 119, 198, 0.15), transparent);
          transition: left 0.6s ease;
        }

        .prompt-button:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(120, 119, 198, 0.5);
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(120, 119, 198, 0.2);
          color: #f1f5f9;
        }

        .prompt-button:hover::before {
          left: 100%;
        }

        .chat-input {
          padding: 40px;
          border-top: 1px solid rgba(51, 65, 85, 0.3);
          background: rgba(13, 15, 23, 0.8);
          backdrop-filter: blur(20px);
          position: relative;
        }

        .chat-input::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(120, 119, 198, 0.4), transparent);
        }

        .input-container {
          display: flex;
          gap: 20px;
          align-items: flex-end;
        }

        .input-wrapper {
          flex: 1;
          position: relative;
        }

        .input-field {
          width: 100%;
          background: rgba(30, 41, 59, 0.9);
          color: white;
          border: 2px solid rgba(120, 119, 198, 0.2);
          border-radius: 20px;
          padding: 20px 64px 20px 24px;
          font-size: 16px;
          font-weight: 500;
          outline: none;
          transition: all 0.4s ease;
          resize: none;
          font-family: inherit;
          backdrop-filter: blur(15px);
          letter-spacing: 0.2px;
          line-height: 1.5;
        }

        .input-field:focus {
          border-color: rgba(120, 119, 198, 0.7);
          box-shadow: 
            0 0 0 4px rgba(120, 119, 198, 0.1), 
            0 8px 25px rgba(120, 119, 198, 0.2);
          background: rgba(30, 41, 59, 0.95);
          transform: translateY(-2px);
        }

        .input-field::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .input-icon {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
          transition: all 0.4s ease;
        }

        .input-field:focus + .input-icon {
          color: #7877c6;
          transform: translateY(-50%) scale(1.1);
        }

        .send-button {
          background: linear-gradient(135deg, #7877c6, #ff77c6);
          border: none;
          border-radius: 20px;
          padding: 20px 28px;
          color: white;
          cursor: pointer;
          transition: all 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
          font-weight: 700;
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .send-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transition: left 0.8s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 30px rgba(120, 119, 198, 0.4);
          filter: brightness(1.1);
        }

        .send-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .send-button:active:not(:disabled) {
          transform: translateY(-1px) scale(1.02);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .input-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.5px;
        }

        .footer-icon {
          animation: footerPulse 2s ease-in-out infinite;
        }

        @keyframes footerPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @media (max-width: 1024px) {
          .chat-window {
            max-width: 100%;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .trust-indicators {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .chatbot-container {
            padding: 16px;
          }

          .chat-window {
            height: 95vh;
            border-radius: 20px;
          }

          .chat-header {
            padding: 24px;
          }

          .header-icon {
            width: 56px;
            height: 56px;
          }

          .header-text h1 {
            font-size: 26px;
          }

          .messages-container {
            padding: 24px;
            gap: 20px;
          }

          .message-wrapper {
            max-width: 90%;
          }

          .quick-prompts {
            padding: 0 24px 24px;
          }

          .prompts-grid {
            grid-template-columns: 1fr;
          }

          .chat-input {
            padding: 24px;
          }

          .input-container {
            flex-direction: column;
            gap: 16px;
          }

          .send-button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .header-text h1 {
            font-size: 22px;
          }

          .header-text p {
            font-size: 15px;
          }

          .message-bubble {
            padding: 16px 20px;
          }

          .input-field {
            padding: 16px 56px 16px 20px;
          }

          .send-button {
            padding: 16px 24px;
          }
        }
      `}</style>

      <div className="chatbot-container">
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-content">
              <div className="header-left">
                <div className="header-icon">
                  <Crown size={28} />
                </div>
                <div className="header-text">
                  <h1>Iron Lady Leadership</h1>
                  <p>Enabling a Million Women to reach the TOP!</p>
                </div>
              </div>
              <div className="header-right">
                <div className="status-badge">
                  <div className="status-dot"></div>
                  <span>Online</span>
                </div>
                <div className="trust-indicators">
                  <div className="trust-item">
                    <Shield size={12} />
                    <span>Secure</span>
                  </div>
                  <div className="trust-item">
                    <Star size={12} />
                    <span>Trusted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="messages-container">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`message-wrapper ${message.type}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`message-avatar ${message.type}`}>
                  {message.type === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className={`message-bubble ${message.type}`}>
                  <div className="message-content">
                    {formatMessage(message.content)}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {(isLoading || isTyping) && (
              <div className="typing-indicator">
                <div className="message-avatar bot">
                  <Bot size={20} />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="quick-prompts">
              <div className="prompts-header">
                <Sparkles size={18} />
                Quick questions to get started:
              </div>
              <div className="prompts-grid">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="prompt-button"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={isLoading}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-input">
            <form onSubmit={handleSubmit} className="input-container">
              <div className="input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about leadership programs, career advancement, or personal growth..."
                  className="input-field"
                  disabled={isLoading}
                />
                <ArrowUp size={22} className="input-icon" />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="send-button"
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <Send size={22} />
                )}
              </button>
            </form>
            <div className="input-footer">
              <Zap size={14} className="footer-icon" />
              Powered by Iron Lady's Leadership Methodology
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IronLadyChatbot;