
"use client";

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Mic, Loader, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { shoppingAssistant } from '@/ai/flows/shopping-assistant';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export default function ShoppingHelperPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if(currentUser) {
        setMessages([
          { id: 'initial', text: "Welcome to your smart shopping assistant! Ask me if you need to buy an item, and I'll check your pantry. For example: 'Do I need milk?'", sender: 'bot' }
        ]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await shoppingAssistant({ query: input, userId: user.uid });
      const botMessage: Message = { id: `${Date.now()}-bot`, text: result.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error with shopping assistant:', error);
      toast({
        variant: 'destructive',
        title: 'Assistant Error',
        description: 'I had trouble checking your inventory. Please try again.',
      });
      const errorMessage: Message = { id: `${Date.now()}-error`, text: "Sorry, I couldn't process that. Please try again.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] gap-8">
      <PageHeader title="Smart Shopping Helper" />
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Shopping Assistant</CardTitle>
          <CardDescription>
            Ask if you need to buy an item before you add it to your cart.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 space-y-4 pr-4" ref={scrollAreaRef}>
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3 my-4 animate-fade-in-slide-up',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'bot' && (
                  <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                  <Avatar className="w-8 h-8">
                     <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3 my-4 justify-start">
                <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <Loader className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-4 border-t">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g., Should I buy eggs?"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send />
            </Button>
            <Button type="button" variant="outline" size="icon" disabled>
              <Mic />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
