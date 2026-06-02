import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Bot,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuthStore, useUIStore, useAgentStore } from '@/src/store'
import { useAgents } from '@/src/hooks/useApi'
import { NexusLogo } from '@/src/components/ui/NexusLogo'

interface AppLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Bot, label: 'Agents', badge: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const currentAgent = useAgentStore((state) => state.currentAgent)
  const { data: agents } = useAgents()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Generate breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname
    if (path.includes('/agents/') && path.includes('/chat')) {
      return currentAgent ? `Agents / ${currentAgent.name}` : 'Agents / Chat'
    }
    if (path.includes('/agents/') && path.includes('/edit')) {
      return currentAgent ? `Agents / Edit ${currentAgent.name}` : 'Agents / Edit'
    }
    if (path === '/agents/new') return 'Agents / New Agent'
    if (path === '/agents') return 'Agents'
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/analytics') return 'Analytics'
    if (path === '/settings') return 'Settings'
    return 'NexusAI'
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full border-r border-slate-700/30 bg-surface transition-all duration-300',
          sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6">
            <NexusLogo className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              NexusAI
            </span>
          </div>

          <Separator className="bg-slate-700/30" />

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {item.badge && agents && agents.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-primary/20 text-primary"
                    >
                      {agents.length}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="border-t border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.username || 'User'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-slate-400 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-[280px] border-r border-slate-700/30 bg-surface md:hidden"
            >
              {/* Same content as desktop sidebar */}
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <NexusLogo className="h-8 w-8" />
                    <span className="text-lg font-semibold tracking-tight text-foreground">
                      NexusAI
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <Separator className="bg-slate-700/30" />

                <ScrollArea className="flex-1 px-3 py-4">
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                          )
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </ScrollArea>

                <div className="border-t border-slate-700/30 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user?.username || 'User'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-slate-400 hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarOpen ? 'md:pl-[280px]' : 'md:pl-0'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700/30 bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentAgent && (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      currentAgent.is_active ? 'bg-emerald-500' : 'bg-slate-500'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {currentAgent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-amber-500/20 text-amber-500"
                >
                  Development
                </Badge>
              </>
            )}
            <Button
              size="sm"
              onClick={() => navigate('/agents/new')}
              className="bg-primary hover:bg-primary/90"
            >
              New Chat
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
