import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Bot,
  Plus,
  Search,
  Pencil,
  MessageSquare,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { useAgentStore, type Agent } from '@/src/store'
import { useAgents, useDeleteAgent } from '@/src/hooks/useApi'

const roleColors: Record<string, { bg: string; text: string }> = {
  support: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  sales: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  technical: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  general: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
}

function AgentRow({ agent, onDelete }: { agent: Agent; onDelete: (agent: Agent) => void }) {
  const navigate = useNavigate()
  const setCurrentAgent = useAgentStore((state) => state.setCurrentAgent)
  const colors = roleColors[agent.role] || roleColors.general

  const handleChat = () => {
    setCurrentAgent(agent)
    navigate(`/agents/${agent.id}/chat`)
  }

  const handleEdit = () => {
    setCurrentAgent(agent)
    navigate(`/agents/${agent.id}/edit`)
  }

  return (
    <TableRow className="border-slate-700/30 hover:bg-slate-800/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{agent.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
              {agent.description || 'No description'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn('capitalize', colors.bg, colors.text)}
        >
          {agent.role}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded bg-slate-700/50 px-2 py-0.5 font-mono text-xs text-slate-400">
          {agent.model_name}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              agent.is_active ? 'bg-emerald-500' : 'bg-slate-500'
            )}
          />
          <span className="text-sm text-muted-foreground">
            {agent.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8 text-slate-400 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleChat}
            className="h-8 w-8 text-slate-400 hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-slate-700/30 bg-surface"
            >
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleChat} className="cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700/30" />
              <DropdownMenuItem
                onClick={() => onDelete(agent)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function AgentMobileCard({ agent, onDelete }: { agent: Agent; onDelete: (agent: Agent) => void }) {
  const navigate = useNavigate()
  const setCurrentAgent = useAgentStore((state) => state.setCurrentAgent)
  const colors = roleColors[agent.role] || roleColors.general

  const handleChat = () => {
    setCurrentAgent(agent)
    navigate(`/agents/${agent.id}/chat`)
  }

  const handleEdit = () => {
    setCurrentAgent(agent)
    navigate(`/agents/${agent.id}/edit`)
  }

  return (
    <Card className="border-slate-700/30 bg-surface">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{agent.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn('capitalize text-xs', colors.bg, colors.text)}
                >
                  {agent.role}
                </Badge>
                <span className="inline-flex items-center rounded bg-slate-700/50 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                  {agent.model_name}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-slate-700/30 bg-surface"
            >
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleChat} className="cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700/30" />
              <DropdownMenuItem
                onClick={() => onDelete(agent)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                agent.is_active ? 'bg-emerald-500' : 'bg-slate-500'
              )}
            />
            <span className="text-xs text-muted-foreground">
              {agent.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleChat}
            className="bg-primary hover:bg-primary/90"
          >
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AgentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null)
  const { data: agents, isLoading } = useAgents()
  const deleteMutation = useDeleteAgent()

  const filteredAgents = agents?.filter((agent) =>
    agent.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = () => {
    if (deleteAgent) {
      deleteMutation.mutate(deleteAgent.id, {
        onSuccess: () => setDeleteAgent(null),
      })
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Agents
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your AI agents and their configurations
            </p>
          </div>
          <Button
            onClick={() => navigate('/agents/new')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700/30 bg-surface pl-10 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Table (Desktop) */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-slate-700/30 bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/30 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Model</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-700/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full bg-slate-800" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32 bg-slate-800" />
                            <Skeleton className="h-3 w-24 bg-slate-800" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 bg-slate-800" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 bg-slate-800" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 bg-slate-800" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 bg-slate-800" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24 bg-slate-800 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAgents && filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <AgentRow
                      key={agent.id}
                      agent={agent}
                      onDelete={setDeleteAgent}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <p className="text-muted-foreground">
                        {search ? 'No agents found' : 'No agents yet'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Card List (Mobile) */}
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-slate-700/30 bg-surface">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32 bg-slate-800" />
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAgents && filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <AgentMobileCard
                key={agent.id}
                agent={agent}
                onDelete={setDeleteAgent}
              />
            ))
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-700/30">
              <p className="text-muted-foreground">
                {search ? 'No agents found' : 'No agents yet'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAgent} onOpenChange={() => setDeleteAgent(null)}>
        <AlertDialogContent className="border-slate-700/30 bg-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete{' '}
              <span className="font-medium text-destructive">
                {deleteAgent?.name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700/30 bg-transparent text-foreground hover:bg-slate-800/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
