// src/app/dashboard/chat/page.tsx
'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Cpu } from 'lucide-react'; // Using lucide-react icons (auto-installed by shadcn)

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a ref for the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from the AI.');
      }

      const result = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (err: any) {
      setError(err.message);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I ran into an error. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col max-h-screen">
      <div className="mb-4">
        <h1 className="text-3xl font-bold leading-tight text-gray-900">AI Chat Assistant</h1>
        <p className="mt-2 text-lg text-gray-600">Ask questions about your civic issue data.</p>
      </div>

      {/* Chat History */}
      <Card ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 text-center">No messages yet. Ask a question to start!</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar for AI */}
            {msg.role === 'assistant' && (
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-indigo-600 text-white"><Cpu size={20} /></AvatarFallback>
              </Avatar>
            )}
            
            {/* Message Bubble */}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-800 border'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
            </div>

            {/* Avatar for User */}
            {msg.role === 'user' && (
              <Avatar className="h-9 w-9">
                <AvatarFallback><User size={20} /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-indigo-600 text-white"><Cpu size={20} /></AvatarFallback>
            </Avatar>
            <div className="max-w-xs md:max-w-md p-3 rounded-lg shadow-sm bg-white text-gray-800 border">
              <span className="animate-pulse text-sm">AI is thinking...</span>
            </div>
          </div>
        )}
      </Card>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., 'Are there any new high-severity potholes?'"
          className="flex-1 text-base"
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={isLoading}
        >
          Send
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}