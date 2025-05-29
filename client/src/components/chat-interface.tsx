import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { DesignProject } from "@shared/schema";
import type { ChatMessage } from "@/lib/api";

interface ChatInterfaceProps {
  currentProject: DesignProject | null;
  onGenerateDesign: (prompt: string) => void;
  isGenerating: boolean;
}

export default function ChatInterface({
  currentProject,
  onGenerateDesign,
  isGenerating,
}: ChatInterfaceProps) {
  const [chatInput, setChatInput] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    if (localMessages.length === 0) {
      setLocalMessages([{
        id: "welcome",
        content: "Hello! I'm your AI jewelry design assistant. Upload a base design or describe what you'd like to create, and I'll help you bring your vision to life.",
        isUser: false,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Update local messages when project chat history changes
  useEffect(() => {
    if (currentProject?.chatHistory) {
      setLocalMessages(prev => {
        const welcomeMessage = prev.find(msg => msg.id === "welcome");
        const projectMessages = currentProject.chatHistory || [];
        return welcomeMessage ? [welcomeMessage, ...projectMessages] : projectMessages;
      });
    }
  }, [currentProject?.chatHistory]);

  const chatMutation = useMutation({
    mutationFn: api.chat,
    onSuccess: (response) => {
      setLocalMessages(prev => [...prev, response.response]);
    },
    onError: () => {
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!chatInput.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: chatInput,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setLocalMessages(prev => [...prev, userMessage]);

    chatMutation.mutate({
      message: chatInput,
      projectId: currentProject?.id,
      context: {
        baseDesign: currentProject?.baseDesignId,
        currentDesign: currentProject?.currentDesignData,
      },
    });

    setChatInput("");
  };

  const handleQuickAction = (action: string) => {
    setChatInput(`Please help me ${action.toLowerCase()} for my design`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: "Change Color", icon: "fas fa-palette" },
    { label: "Resize", icon: "fas fa-expand-arrows-alt" },
    { label: "Add Gems", icon: "fas fa-gem" },
    { label: "Add Text", icon: "fas fa-font" },
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Main Chat Interface */}
      <Card>
        <CardContent className="p-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--navy))]">AI Design Assistant</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${chatMutation.isPending ? 'bg-[hsl(var(--ruby))] animate-pulse' : 'bg-[hsl(var(--emerald))]'}`}></div>
              <span className={`text-sm ${chatMutation.isPending ? 'text-[hsl(var(--ruby))]' : 'text-[hsl(var(--emerald))]'}`}>
                {chatMutation.isPending ? "Thinking..." : "Connected"}
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {localMessages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start space-x-3 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isUser 
                    ? 'bg-[hsl(var(--navy))]' 
                    : 'bg-gradient-to-br from-[hsl(var(--luxury-gold))] to-[hsl(var(--amethyst))]'
                }`}>
                  <i className={`${message.isUser ? 'fas fa-user' : 'fas fa-robot'} text-white text-sm`}></i>
                </div>
                <div className="flex-1">
                  <div className={`rounded-lg p-3 max-w-xs ${
                    message.isUser 
                      ? 'bg-[hsl(var(--amethyst))] text-white ml-auto' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className={`text-xs text-muted-foreground mt-1 block ${message.isUser ? 'text-right' : ''}`}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--luxury-gold))] to-[hsl(var(--amethyst))] rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[hsl(var(--amethyst))] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[hsl(var(--amethyst))] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-[hsl(var(--amethyst))] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Describe your design modifications..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none pr-12"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatMutation.isPending || isGenerating}
                size="sm"
                className="absolute bottom-3 right-3 bg-[hsl(var(--amethyst))] hover:bg-[hsl(var(--amethyst))]/90 text-white"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.label)}
                  className="p-2 text-sm border-border hover:border-[hsl(var(--amethyst))] hover:text-[hsl(var(--amethyst))] transition-colors"
                >
                  <i className={`${action.icon} mr-1`}></i>
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Generate Design Button */}
            <Button
              onClick={() => onGenerateDesign(chatInput || "Generate a new design variation")}
              disabled={isGenerating || !currentProject}
              className="w-full bg-[hsl(var(--emerald))] hover:bg-[hsl(var(--emerald))]/90 text-white font-medium"
            >
              <i className="fas fa-magic mr-2"></i>
              {isGenerating ? "Generating..." : "Generate Design from Chat"}
            </Button>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-[hsl(var(--amethyst))] transition-colors cursor-pointer">
              <i className="fas fa-cloud-upload-alt text-2xl text-muted-foreground mb-2"></i>
              <p className="text-sm text-muted-foreground">Drop reference images here or click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[hsl(var(--navy))] mb-4">Recent Projects</h3>
          <div className="space-y-3">
            {currentProject && (
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <img 
                  src={currentProject.currentDesignData?.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                  alt="Project Thumbnail" 
                  className="w-10 h-10 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-[hsl(var(--navy))]">{currentProject.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {currentProject.updatedAt ? formatTimestamp(currentProject.updatedAt.toString()) : "Active"}
                  </p>
                </div>
                <Badge variant="outline">{currentProject.status}</Badge>
              </div>
            )}
            
            {!currentProject && (
              <div className="text-center py-8">
                <i className="fas fa-folder-open text-4xl text-muted-foreground mb-2"></i>
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground">Start by selecting a base design</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
