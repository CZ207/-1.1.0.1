import React from 'react';
import { Message, Role } from '../types';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.User;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : 'bg-emerald-600'
        } text-white shadow-sm`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
          }`}>
            <div className={`markdown-content ${isUser ? 'prose-invert' : 'prose-stone'}`}>
              <ReactMarkdown 
                 components={{
                  code({node, className, children, ...props}) {
                    return (
                      <code className={`${className} bg-black/10 rounded px-1 py-0.5`} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre({node, children, ...props}) {
                    return (
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-xs" {...props}>
                        {children}
                      </pre>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};