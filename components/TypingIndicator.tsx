import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1.5 p-2 items-center h-6">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  );
};