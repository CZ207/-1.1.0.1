import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendHorizontal, Sparkles, Trash2, AlertCircle, GraduationCap, BookOpen, BrainCircuit, ListTodo } from 'lucide-react';
import { Message, Role } from './types';
import { sendMessageStream } from './services/api';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';

// System Prompt: Defines the persona of XiaoZhi 1.0
const SYSTEM_PROMPT: Message = {
  id: 'system-1',
  role: Role.System,
  content: `你是由陈真同学开发的全知全能的“小智1.0”。
  
  你的核心设定：
  1. 开发者：陈真同学。
  2. 定位：专门为期末周复习准备的AI助手，全知全能，永久免费。
  3. 性格：专业、耐心、鼓励性强，像一位学霸学长/学姐。
  4. 目标：帮助用户高效复习，解答学术难题，缓解考试焦虑，制定复习计划。
  
  在回答时，请保持条理清晰，重点突出，适合备考复习。如果用户问你是谁，请自豪地介绍自己是陈真同学开发的小智1.0。`
};

// Initial greeting
const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: Role.Assistant,
  content: "同学你好！👋 我是由**陈真同学**开发的全知全能的**小智1.0**。\n\n期末周到了，别慌！无论是知识点梳理、重点预测，还是复习计划制定，我都免费为你服务。我们从哪一科开始复习？"
};

// Quick suggestion chips - storing Component reference instead of Element
const SUGGESTIONS = [
  { Icon: ListTodo, text: "帮我制定三天复习计划" },
  { Icon: BrainCircuit, text: "解释一下这个概念..." },
  { Icon: BookOpen, text: "帮我总结本章考点" },
  { Icon: Sparkles, text: "我好焦虑，求安慰" },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleClearChat = () => {
    if (window.confirm('确定要清空当前的复习对话吗？')) {
      setMessages([INITIAL_MESSAGE]);
      setError(null);
    }
  };

  const handleSendMessage = useCallback(async (content?: string) => {
    const textToSend = content || inputValue.trim();
    if (!textToSend || isLoading) return;

    setInputValue('');
    setError(null);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.User,
      content: textToSend,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Create a placeholder for the AI response
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: Role.Assistant, content: '' }
    ]);

    try {
      let accumulatedContent = '';

      // We prepend the SYSTEM_PROMPT to the messages sent to the API, 
      // but we do NOT add it to the 'messages' state so it remains hidden in the UI.
      const messagesForApi = [SYSTEM_PROMPT, ...updatedMessages];

      await sendMessageStream(messagesForApi, (chunk) => {
        accumulatedContent += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, content: accumulatedContent } 
              : msg
          )
        );
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || '连接服务器失败，请稍后重试。');
      // Remove the empty/partial assistant message if it failed completely with no content
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.id === assistantMessageId && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-md">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">小智 1.0</h1>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200 uppercase">Pro</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">陈真同学开发 · 期末复习神器</p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group relative"
          title="清空对话"
        >
          <Trash2 size={20} />
          <span className="absolute hidden group-hover:block right-0 top-full mt-1 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">清空记录</span>
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && messages[messages.length - 1].role !== Role.Assistant && (
             <div className="flex w-full mb-6 justify-start animate-fade-in">
               <div className="flex max-w-[75%] gap-3 flex-row">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-600 text-white shadow-sm">
                   <Sparkles size={16} />
                 </div>
                 <div className="flex items-center bg-white border border-slate-100 rounded-2xl rounded-bl-none shadow-sm px-4 py-3">
                   <TypingIndicator />
                 </div>
               </div>
             </div>
          )}

          {error && (
            <div className="mx-auto my-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 max-w-lg shadow-sm">
              <AlertCircle size={20} />
              <div>
                <p className="text-sm font-bold">出错了</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          
          {/* Suggestion Chips */}
          {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(s.text)}
                  className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full text-xs font-medium transition-colors duration-200"
                >
                  <s.Icon size={14} />
                  {s.text}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all p-2 shadow-sm">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="问问小智关于期末复习的问题..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-slate-800 placeholder-slate-400 no-scrollbar"
              rows={1}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className={`mb-1 p-2 rounded-xl flex-shrink-0 transition-all duration-200 ${
                inputValue.trim() && !isLoading
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <SendHorizontal size={20} />
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 px-2">
            <span>🚀 免费使用 | 全知全能</span>
            <span>Made with ❤️ by 陈真同学</span>
          </div>
        </div>
      </footer>
    </div>
  );
}