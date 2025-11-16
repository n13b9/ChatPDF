"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
  role: "assistant" | "user";
  content?: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const chatRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    const userMessage: IMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    const res = await fetch(`http://localhost:8000/chat?message=${message}`);
    const data = await res.json();

    const assistantMessage: IMessage = {
      role: "assistant",
      content: data?.message,
      documents: data?.docs,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  return (
    <div className="flex flex-col h-full">

      {/* MESSAGE SCROLL AREA */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto pr-2 space-y-4"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] p-3 rounded-xl text-sm whitespace-pre-wrap 
              ${
                msg.role === "user"
                  ? "ml-auto bg-gray-900 text-white"
                  : "mr-auto bg-gray-100 text-gray-900 border border-gray-300"
              }
            `}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* INPUT BAR */}
      <div className="mt-4 flex items-center gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="rounded-xl"
        />
        <Button onClick={handleSendChatMessage} disabled={!message.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatComponent;
