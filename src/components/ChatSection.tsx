import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/ui/icons';

export function ChatSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Chat</CardTitle>
        <CardDescription>Real-time communication with your team</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-4">
            {/* Chat messages will go here */}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4">
          <Input placeholder="Type your message..." />
          <Button>
            <Icons.send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 