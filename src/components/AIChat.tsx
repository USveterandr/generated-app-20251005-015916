import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
interface Message {
  sender: 'user' | 'ai';
  text: string;
}
export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I'm your financial assistant. Ask me anything about your spending." },
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const aiMutation = useMutation<{ response: string }, Error, { query: string }>({
    mutationFn: (newQuery) => api('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(newQuery),
    }),
    onSuccess: (data) => {
      const aiMessage: Message = { sender: 'ai', text: data.response };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: () => {
      toast.error('AI assistant is currently unavailable.');
      const errorMessage: Message = { sender: 'ai', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    aiMutation.mutate({ query: input });
    setInput('');
  };
  return (
    <Card className="col-span-1 lg:col-span-2 flex flex-col h-[500px]">
      <CardHeader>
        <CardTitle>AI Financial Assistant</CardTitle>
        <CardDescription>Ask questions about your finances.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={cn('flex items-start gap-3', msg.sender === 'user' && 'justify-end')}>
                {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                <div className={cn('p-3 rounded-lg max-w-xs md:max-w-md', msg.sender === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.sender === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
            {aiMutation.isPending && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., How much did I spend on food?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={aiMutation.isPending}
          />
          <Button onClick={handleSend} disabled={aiMutation.isPending}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}