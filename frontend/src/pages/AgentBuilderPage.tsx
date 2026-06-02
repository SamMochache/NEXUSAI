import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bot,
  Save,
  Loader2,
  Send,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useAgentStore, type Agent } from '@/src/store'
import { useAgent, useCreateAgent, useUpdateAgent } from '@/src/hooks/useApi'

const roles = [
  { value: 'support', label: 'Support', description: 'Customer support and help desk' },
  { value: 'sales', label: 'Sales', description: 'Sales and lead qualification' },
  { value: 'technical', label: 'Technical', description: 'Technical assistance and troubleshooting' },
  { value: 'general', label: 'General', description: 'General purpose assistant' },
]

const models = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast and cost-effective' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable, best for complex tasks' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', description: 'Quick and efficient' },
]

interface FormData {
  name: string
  description: string
  role: string
  system_prompt: string
  model_name: string
  temperature: number
  max_tokens: number
  is_active: boolean
  enable_tools: boolean
  require_citations: boolean
}

const defaultFormData: FormData = {
  name: '',
  description: '',
  role: 'general',
  system_prompt: 'You are a helpful AI assistant. Answer questions accurately and concisely.',
  model_name: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2048,
  is_active: true,
  enable_tools: false,
  require_citations: false,
}

export function AgentBuilderPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const setCurrentAgent = useAgentStore((state) => state.setCurrentAgent)
  
  const { data: existingAgent, isLoading: agentLoading } = useAgent(id || '')
  const createMutation = useCreateAgent()
  const updateMutation = useUpdateAgent()
  
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load existing agent data
  useEffect(() => {
    if (existingAgent) {
      setFormData({
        name: existingAgent.name,
        description: existingAgent.description || '',
        role: existingAgent.role,
        system_prompt: existingAgent.system_prompt,
        model_name: existingAgent.model_name,
        temperature: existingAgent.temperature,
        max_tokens: existingAgent.max_tokens,
        is_active: existingAgent.is_active,
        enable_tools: existingAgent.enable_tools,
        require_citations: existingAgent.require_citations,
      })
      setCurrentAgent(existingAgent)
    }
  }, [existingAgent, setCurrentAgent])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.system_prompt.length > 4000) {
      newErrors.system_prompt = 'System prompt is too long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const agentData = {
      ...formData,
      description: formData.description || undefined,
    }

    if (isEditing && id) {
      updateMutation.mutate(
        { id, agent: agentData },
        {
          onSuccess: (data) => {
            setCurrentAgent(data)
            navigate(`/agents/${id}/chat`)
          },
        }
      )
    } else {
      createMutation.mutate(agentData, {
        onSuccess: (data) => {
          setCurrentAgent(data)
          navigate(`/agents/${data.id}/chat`)
        },
      })
    }
  }

  const handleTestMessage = () => {
    if (!testMessage.trim()) return

    setIsTyping(true)
    setTestResponse('')

    // Simulate streaming response
    const response = `Based on my system prompt, I would respond to "${testMessage}" as follows:\n\nI'm configured as a ${formData.role} agent with temperature ${formData.temperature}. This affects how creative and varied my responses are.`
    
    let index = 0
    const interval = setInterval(() => {
      if (index < response.length) {
        setTestResponse((prev) => prev + response[index])
        index++
      } else {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, 20)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isEditing && agentLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-7xl"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? 'Edit Agent' : 'Create Agent'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? 'Update your agent configuration'
                : 'Configure your new AI agent'}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left Column - Configuration */}
            <div className="space-y-6 lg:col-span-3">
              {/* Identity Section */}
              <Card className="border-slate-700/30 bg-surface">
                <CardHeader>
                  <CardTitle className="text-foreground">Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Customer Support Bot"
                      className={cn(
                        'border-slate-700/30 bg-background text-foreground',
                        errors.name && 'border-destructive'
                      )}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Brief description of what this agent does..."
                      rows={3}
                      className="resize-none border-slate-700/30 bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger className="border-slate-700/30 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700/30 bg-surface">
                        {roles.map((role) => (
                          <SelectItem
                            key={role.value}
                            value={role.value}
                            className="text-foreground focus:bg-slate-800"
                          >
                            <div className="flex flex-col">
                              <span>{role.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {role.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* AI Configuration Section */}
              <Card className="border-slate-700/30 bg-surface">
                <CardHeader>
                  <CardTitle className="text-foreground">AI Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system_prompt" className="text-foreground">
                        System Prompt
                      </Label>
                      <span
                        className={cn(
                          'text-xs',
                          formData.system_prompt.length > 3500
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formData.system_prompt.length}/4000
                      </span>
                    </div>
                    <Textarea
                      id="system_prompt"
                      value={formData.system_prompt}
                      onChange={(e) =>
                        setFormData({ ...formData, system_prompt: e.target.value })
                      }
                      placeholder="You are a helpful AI assistant..."
                      rows={6}
                      className={cn(
                        'resize-none border-slate-700/30 bg-background font-mono text-sm text-foreground',
                        errors.system_prompt && 'border-destructive'
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Markdown supported
                    </p>
                    {errors.system_prompt && (
                      <p className="text-sm text-destructive">
                        {errors.system_prompt}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-foreground">Model</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="border-slate-700/30 bg-elevated">
                          Choose the AI model for your agent
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={formData.model_name}
                      onValueChange={(value) =>
                        setFormData({ ...formData, model_name: value })
                      }
                    >
                      <SelectTrigger className="border-slate-700/30 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700/30 bg-surface">
                        {models.map((model) => (
                          <SelectItem
                            key={model.value}
                            value={model.value}
                            className="text-foreground focus:bg-slate-800"
                          >
                            <div className="flex flex-col">
                              <span>{model.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-foreground">Temperature</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="border-slate-700/30 bg-elevated">
                            <p>Lower = more focused</p>
                            <p>Higher = more creative</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-slate-700/50 text-foreground"
                      >
                        {formData.temperature.toFixed(1)}
                      </Badge>
                    </div>
                    <Slider
                      value={[formData.temperature]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, temperature: value })
                      }
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_tokens" className="text-foreground">
                      Max Tokens
                    </Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      min={1}
                      max={4096}
                      value={formData.max_tokens}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_tokens: parseInt(e.target.value) || 2048,
                        })
                      }
                      className="border-slate-700/30 bg-background text-foreground"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Behavior Section */}
              <Card className="border-slate-700/30 bg-surface">
                <CardHeader>
                  <CardTitle className="text-foreground">Behavior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Agent is live and can be used
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Enable Tools</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow agent to use tool calling
                      </p>
                    </div>
                    <Switch
                      checked={formData.enable_tools}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enable_tools: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Require Citations</Label>
                      <p className="text-xs text-muted-foreground">
                        Force display of RAG sources
                      </p>
                    </div>
                    <Switch
                      checked={formData.require_citations}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, require_citations: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <Card className="border-slate-700/30 bg-surface">
                  <CardHeader>
                    <CardTitle className="text-foreground">Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Mini Chat Interface */}
                    <div className="flex h-[400px] flex-col rounded-lg border border-slate-700/30 bg-background mx-4">
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        {/* System prompt preview */}
                        <div className="mb-4 rounded-lg bg-slate-800/30 p-3">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            System Prompt
                          </p>
                          <p className="text-sm text-slate-400 line-clamp-3">
                            {formData.system_prompt || 'No system prompt configured'}
                          </p>
                        </div>

                        {/* Test conversation */}
                        {testMessage && (
                          <div className="mb-3 flex justify-end">
                            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary/20 px-4 py-2">
                              <p className="text-sm text-foreground">{testMessage}</p>
                            </div>
                          </div>
                        )}

                        {(testResponse || isTyping) && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-2xl rounded-tl-sm border-l-2 border-primary/30 bg-slate-800/50 px-4 py-2">
                              {testResponse ? (
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {testResponse}
                                </p>
                              ) : (
                                <div className="flex gap-1 py-1">
                                  <span className="h-2 w-2 animate-bounce-dot rounded-full bg-primary" />
                                  <span className="h-2 w-2 animate-bounce-dot rounded-full bg-primary" />
                                  <span className="h-2 w-2 animate-bounce-dot rounded-full bg-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </ScrollArea>

                      {/* Test Input */}
                      <div className="border-t border-slate-700/30 p-3">
                        <div className="flex gap-2">
                          <Input
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Test your agent..."
                            className="flex-1 border-slate-700/30 bg-surface text-sm text-foreground"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleTestMessage()
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            onClick={handleTestMessage}
                            disabled={!testMessage.trim() || isTyping}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="p-4">
                      <Button
                        onClick={handleSubmit}
                        disabled={isPending || !formData.name.trim()}
                        className="w-full bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {isEditing ? 'Save Changes' : 'Create Agent'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
