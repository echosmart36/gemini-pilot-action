import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CustomSelect from './CustomSelect';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; parts: { text: string }[], searchChunks?: any[] }[]>([
    {
      role: 'model',
      parts: [{ text: "Hi! I'm your GeminiPilot Assistant. How can I help you configure your Action or debug code today?" }]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-3.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Don't send the initial greeting as part of history if it causes context issues, but it's fine
      const history = messages.slice(1); 
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history,
          model,
          systemInstruction: 'You are GeminiPilot Assistant. You help users understand how to setup their GitHub Action, write code, and configure their repositories. You are helpful, polite, and an expert in GitHub Actions and Node.js.'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, { role: 'model', parts: [{ text: data.text }], searchChunks: data.searchChunks }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', parts: [{ text: `Error: ${data.error}` }] }]);
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: `Error: ${e.message}` }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-transform hover:scale-105 z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">GeminiPilot Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white/10 text-gray-200 rounded-bl-none'
                  }`}
                >
                  <div className="markdown-body text-xs prose prose-invert max-w-none">
                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                  </div>
                  
                  {msg.searchChunks && msg.searchChunks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                        <Search className="w-3 h-3" />
                        <span>Grounded with Google Search</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.searchChunks.map((chunk, i) => {
                           if (chunk.web?.uri) {
                             return (
                               <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-black/30 hover:bg-black/50 px-2 py-1 rounded border border-white/5 text-blue-300 block truncate max-w-[150px]">
                                 {chunk.web.title}
                               </a>
                             )
                           }
                           return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-none p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white/5 border-t border-white/10">
              <div className="mb-2 flex gap-2 w-48">
                <CustomSelect
                  options={[
                    { label: 'Fast (Flash Lite)', value: 'gemini-3.1-flash-lite' },
                    { label: 'General & Search (Flash)', value: 'gemini-3.5-flash' },
                    { label: 'Complex (Pro + High Thinking)', value: 'gemini-3.1-pro-preview' }
                  ]}
                  value={model}
                  onChange={setModel}
                  position="top"
                />
              </div>
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about GeminiPilot..."
                className="w-full bg-black/50 border border-white/10 text-sm text-white rounded-xl pl-4 pr-10 py-3 outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
