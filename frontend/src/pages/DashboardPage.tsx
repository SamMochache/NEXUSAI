import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bot,
  MessageSquare,
  FileText,
  Plus,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore, useAgentStore, type Agent } from '@/src/store'
import { useAgents, useAgentStats } from '@/src/hooks/useApi'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const roleColors: Record<string, { bg: string; text: string; gradient: string }> = {
  support: { bg: 'bg-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-600' },
  sales: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', gradient: 'from-emerald-500 to-emerald-600' },
  technical: { bg: 'bg-amber-500/20', text: 'text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  general: { bg: 'bg-slate-500/20', text: 'text-slate-400', gradient: 'from-slate-500 to-slate-600' },
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  loading,
}: {
  title: string
  value: number | string
  subtitle: string
  trend?: { value: number; positive: boolean }
  icon: React.ElementType
  loading?: boolean
}) {
  return (
    <Card className="border-slate-700/30 bg-surface">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {value}
              </p>
            )}
            <div className="flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'flex items-center text-xs font-medium',
                    trend.positive ? 'text-emerald-500' : 'text-rose-500'
                  )}
                >
                  {trend.positive ? (
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-0.5 h-3 w-3" />
                  )}
                  {trend.value}%
                </span>
              )}
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
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
    <motion.div variants={itemVariants}>
      <Card className="group relative border-slate-700/30 bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Agent Icon */}
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br',
                colors.gradient
              )}
            >
              <Bot className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Name and badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {agent.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded-full text-xs capitalize',
                    colors.bg,
                    colors.text
                  )}
                >
                  {agent.role}
                </Badge>
              </div>

              {/* Model badge */}
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-slate-700/50 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                  {agent.model_name}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      agent.is_active ? 'bg-emerald-500' : 'bg-slate-500'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Temperature indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Temp:</span>
                <div className="h-1.5 flex-1 max-w-20 rounded-full bg-slate-700/50">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(agent.temperature / 2) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {agent.temperature.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="flex-1 text-slate-400 hover:text-foreground"
            >
              Edit
            </Button>
            <Button
              size="sm"
              onClick={handleChat}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Chat
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EmptyState() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/30 bg-surface/50 py-16"
    >
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Bot className="h-12 w-12 text-primary/50" />
      </div>
      <h3 className="text-xl font-medium text-foreground">No agents yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first AI agent to get started
      </p>
      <Button
        onClick={() => navigate('/agents/new')}
        className="mt-6 bg-primary hover:bg-primary/90"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Agent
      </Button>
    </motion.div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: agents, isLoading: agentsLoading } = useAgents()
  const { data: stats, isLoading: statsLoading } = useAgentStats()

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.username || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Manage your AI agents and conversations
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <StatCard
            title="Total Agents"
            value={stats?.total_agents ?? agents?.length ?? 0}
            subtitle="Active now"
            trend={{ value: 12, positive: true }}
            icon={Bot}
            loading={statsLoading && agentsLoading}
          />
          <StatCard
            title="Models Used"
            value={stats?.models_used?.length ?? 0}
            subtitle="Distinct models in your agents"
            trend={{ value: 3, positive: true }}
            icon={MessageSquare}
            loading={statsLoading}
          />
          <StatCard
            title="Active Agents"
            value={stats?.active_agents ?? 0}
            subtitle="Currently enabled"
            icon={FileText}
            loading={statsLoading}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate('/agents/new')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/agents')}
            className="border-slate-700/30 text-foreground hover:bg-slate-800/50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/analytics')}
            className="text-slate-400 hover:text-foreground"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </motion.div>

        {/* Recent Agents */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Agents
            </h2>
            {agents && agents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agents')}
                className="text-primary hover:text-primary/80"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>

          {agentsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-slate-700/30 bg-surface">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-full bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32 bg-slate-800" />
                        <Skeleton className="h-4 w-24 bg-slate-800" />
                        <Skeleton className="h-2 w-full bg-slate-800" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : agents && agents.length > 0 ? (
            <motion.div
              variants={containerVariants}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {agents.slice(0, 6).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </motion.div>

        {/* Pro tip */}
        <motion.div variants={itemVariants}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/20 p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Pro tip</p>
                <p className="text-sm text-muted-foreground">
                  Upload documents to your agents to give them knowledge about your
                  business and products.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
