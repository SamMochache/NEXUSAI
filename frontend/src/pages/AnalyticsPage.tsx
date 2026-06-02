import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle, XCircle } from 'lucide-react'

// Mock data for charts
const messagesPerDay = [
  { day: 'Mon', messages: 45 },
  { day: 'Tue', messages: 62 },
  { day: 'Wed', messages: 38 },
  { day: 'Thu', messages: 71 },
  { day: 'Fri', messages: 89 },
  { day: 'Sat', messages: 34 },
  { day: 'Sun', messages: 28 },
]

const topQueries = [
  { query: 'Password reset', count: 156 },
  { query: 'Shipping status', count: 134 },
  { query: 'Return policy', count: 98 },
  { query: 'Product availability', count: 87 },
  { query: 'Price inquiry', count: 65 },
]

const intentDistribution = [
  { name: 'Question', value: 45, color: '#6366f1' },
  { name: 'Action', value: 25, color: '#10b981' },
  { name: 'Complaint', value: 18, color: '#f59e0b' },
  { name: 'Escalation', value: 12, color: '#f43f5e' },
]

const recentToolCalls = [
  { id: 1, tool: 'create_ticket', status: 'success', timestamp: '2 min ago' },
  { id: 2, tool: 'search_docs', status: 'success', timestamp: '5 min ago' },
  { id: 3, tool: 'send_email', status: 'failed', timestamp: '12 min ago' },
  { id: 4, tool: 'create_ticket', status: 'success', timestamp: '18 min ago' },
  { id: 5, tool: 'search_docs', status: 'success', timestamp: '25 min ago' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700/30 bg-elevated p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-primary">
          {payload[0].value} messages
        </p>
      </div>
    )
  }
  return null
}

export function AnalyticsPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Insights and metrics for your AI agents
          </p>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Messages per Day */}
          <Card className="border-slate-700/30 bg-surface">
            <CardHeader>
              <CardTitle className="text-foreground">Messages per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={messagesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                    <XAxis
                      dataKey="day"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#6366f1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Queries */}
          <Card className="border-slate-700/30 bg-surface">
            <CardHeader>
              <CardTitle className="text-foreground">Top Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topQueries} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="query"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(51, 65, 85, 0.3)',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Intent Distribution */}
          <Card className="border-slate-700/30 bg-surface">
            <CardHeader>
              <CardTitle className="text-foreground">Intent Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={intentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {intentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(51, 65, 85, 0.3)',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-sm text-slate-400">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tool Calls */}
          <Card className="border-slate-700/30 bg-surface">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Tool Calls</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/30 hover:bg-transparent">
                    <TableHead className="text-slate-400">Tool</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentToolCalls.map((call) => (
                    <TableRow key={call.id} className="border-slate-700/30 hover:bg-slate-800/30">
                      <TableCell className="font-mono text-sm text-foreground">
                        {call.tool}
                      </TableCell>
                      <TableCell>
                        {call.status === 'success' ? (
                          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-rose-500/20 text-rose-400">
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {call.timestamp}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
