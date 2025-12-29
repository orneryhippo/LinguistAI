
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatLogProps {
  messages: ChatMessage[];
}

const ChatLog: React.FC<ChatLogProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-medium text-slate-300">Live Transcript</h3>
        <span className="text-xs text-slate-500 uppercase tracking-wider">{messages.length} lines</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
            <i className="fas fa-comment-dots text-4xl mb-4"></i>
            <p className="text-sm">Conversation logs will appear here</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-600 mt-1 uppercase">
                {msg.role === 'user' ? 'You' : 'Linguist AI'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatLog;
