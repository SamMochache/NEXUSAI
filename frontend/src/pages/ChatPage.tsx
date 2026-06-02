import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Virtuoso } from 'react-virtuoso'
import {
  Send,
  Paperclip,
  Bot,
  User,
  Copy,
  Check,
  Wrench,
  FileText,
  ChevronRight,
  Settings,
  BookOpen,
  Zap,
  ArrowDown,
  Loader2,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAgentStore, useUIStore, type Message } from '@/src/store'
import { useAgent, useChatHistory, useSendMessage } from '@/src/hooks/useApi'
import { NexusLogo } from '@/src/components/ui/NexusLogo'

// Code block component with copy button
const CodeBlock = memo(function CodeBlock({
  language,
  children,
}: {
  language: string
  children: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-3">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-7 w-7 bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          borderRadius: '0.5rem',
          background: '#0f172a',
          border: '1px solid rgba(51, 65, 85, 0.3)',
          fontSize: '0.875rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
})

// Message bubble component
const MessageBubble = memo(function MessageBubble({
  message,
  isLast,
}: {
  message: Message
  isLast: boolean
}) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center py-2"
      >
        <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs text-amber-500">
          <Wrench className="h-3 w-3" />
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex w-full gap-3 py-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={cn('flex max-w-3xl flex-col', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'rounded-tr-sm bg-primary/20 text-foreground'
              : 'rounded-tl-sm border-l-2 border-primary/30 bg-slate-800/50 text-foreground'
          )}
        >
          <div className="prose-nexus text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code
                        className="rounded bg-slate-700/50 px-1.5 py-0.5 font-mono text-sm text-primary"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <CodeBlock language={match[1]}>
                      {String(children).replace(/\n$/, '')}
                    </CodeBlock>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                ul({ children }) {
                  return <ul className="mb-2 list-disc pl-4">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="mb-2 list-decimal pl-4">{children}</ol>
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      {children}
                    </a>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Citations */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/30 bg-slate-800 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/30"
                >
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground">{source.title}</span>
                  <span className="text-muted-foreground">
                    {Math.round(source.similarity * 100)}% match
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools used */}
        {!isUser && message.tools_used && message.tools_used.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.tools_used.map((tool, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400"
              >
                <Zap className="mr-1 h-3 w-3" />
                {tool}
              </Badge>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </p>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700/50">
          <User className="h-4 w-4 text-slate-400" />
        </div>
      )}
    </motion.div>
  )
})

// Typing indicator
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 py-2"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border-l-2 border-primary/30 bg-slate-800/50 px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce-dot rounded-full bg-primary" />
          <span className="h-2 w-2 animate-bounce-dot rounded-full bg-primary" />
          <span className="h-2 w-2 animate-bounce-dot rounded-full bg-primary" />
        </div>
      </div>
    </motion.div>
  )
}

// Empty state
function EmptyState({ agentName, onSuggestionClick }: { agentName: string; onSuggestionClick: (text: string) => void }) {
  const suggestions = [
    'How do I reset my password?',
    'What is your shipping policy?',
    'I need to return an item',
    'Tell me about your products',
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <NexusLogo className="h-10 w-10" />
        </div>
        <h2 className="text-lg font-medium text-foreground">{agentName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a conversation. The AI is ready to help.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border border-slate-700/30 bg-slate-800/50 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-slate-800"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// Right panel
function RightPanel({ agent, lastSources }: { agent: any; lastSources?: Array<{ title: string; similarity: number }> }) {
  return (
    <div className="flex h-full flex-col border-l border-slate-700/30 bg-surface">
      <Tabs defaultValue="config" className="flex h-full flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Model</p>
              <p className="mt-1 font-mono text-sm text-foreground">{agent?.model_name || 'gpt-4o-mini'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Temperature</p>
              <p className="mt-1 text-sm text-foreground">{agent?.temperature?.toFixed(1) || '0.7'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Max Tokens</p>
              <p className="mt-1 text-sm text-foreground">{agent?.max_tokens || 2048}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tools</p>
              <p className="mt-1 text-sm text-foreground">
                {agent?.enable_tools ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="flex-1 overflow-auto p-4">
          {lastSources && lastSources.length > 0 ? (
            <div className="space-y-2">
              {lastSources.map((source, index) => (
                <Card key={index} className="border-slate-700/30 bg-slate-800/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{source.title}</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        {Math.round(source.similarity * 100)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sources from last query</p>
          )}
        </TabsContent>

        <TabsContent value="tools" className="flex-1 overflow-auto p-4">
          <p className="text-sm text-muted-foreground">No tool calls logged</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const virtuosoRef = useRef<any>(null)

  const { setCurrentAgent, currentAgent } = useAgentStore()
  const { rightPanelOpen, toggleRightPanel } = useUIStore()
  const { data: agent, isLoading: agentLoading } = useAgent(id || '')
  const { data: history, isLoading: historyLoading } = useChatHistory(id || '')
  const sendMessage = useSendMessage(id || '')

  // Set current agent when loaded
  useEffect(() => {
    if (agent) {
      setCurrentAgent(agent)
    }
  }, [agent, setCurrentAgent])

  // Initialize messages from history
  useEffect(() => {
    if (history) {
      setMessages(history)
    }
  }, [history])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const scrollToBottom = useCallback(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
      })
    }
    setShowScrollButton(false)
  }, [messages.length])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Scroll to bottom after adding user message
    setTimeout(() => scrollToBottom(), 100)

    try {
      const response = await sendMessage.mutateAsync(input.trim())

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        intent: response.intent,
        tools_used: response.tools_used,
        sources: response.sources,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    // Focus the textarea
    textareaRef.current?.focus()
  }

  const lastSources = messages
    .filter((m) => m.role === 'assistant' && m.sources)
    .pop()?.sources

  if (!id) {
    navigate('/agents')
    return null
  }

  if (agentLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col bg-background">
          {/* Messages */}
          <div className="relative flex-1 overflow-hidden">
            {messages.length === 0 && !historyLoading ? (
              <EmptyState
                agentName={agent?.name || 'AI Assistant'}
                onSuggestionClick={handleSuggestionClick}
              />
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                className="h-full px-4"
                followOutput="smooth"
                atBottomStateChange={(atBottom) => setShowScrollButton(!atBottom)}
                itemContent={(index, message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLast={index === messages.length - 1}
                  />
                )}
                components={{
                  Footer: () => (
                    <AnimatePresence>
                      {isTyping && <TypingIndicator />}
                    </AnimatePresence>
                  ),
                }}
              />
            )}

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollButton && messages.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg"
                >
                  <ArrowDown className="mr-1.5 inline h-4 w-4" />
                  New messages
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700/30 bg-surface/80 p-4 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-end gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      className="h-10 w-10 text-muted-foreground"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>

                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your documents..."
                    rows={1}
                    className="min-h-[44px] resize-none border-slate-700/30 bg-background pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleRightPanel}
                      className="hidden h-10 w-10 text-muted-foreground lg:flex"
                    >
                      {rightPanelOpen ? (
                        <PanelRightClose className="h-5 w-5" />
                      ) : (
                        <PanelRightOpen className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {rightPanelOpen ? 'Hide panel' : 'Show panel'}
                  </TooltipContent>
                </Tooltip>
              </div>

              <p className="mt-2 text-center text-xs text-muted-foreground">
                Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block"
            >
              <RightPanel agent={agent} lastSources={lastSources} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
