import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  email: string
}

export interface Agent {
  id: string
  name: string
  description: string
  role: 'support' | 'sales' | 'technical' | 'general'
  model_name: string
  system_prompt: string
  temperature: number
  max_tokens: number
  is_active: boolean
  enable_tools?: boolean
  require_citations?: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  intent?: string
  tools_used?: string[]
  sources?: Array<{
    title: string
    similarity: number
    content?: string
  }>
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

interface AgentState {
  currentAgent: Agent | null
  setCurrentAgent: (agent: Agent | null) => void
}

interface UIState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  toggleSidebar: () => void
  toggleRightPanel: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, accessToken: token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'nexus-auth',
    }
  )
)

export const useAgentStore = create<AgentState>((set) => ({
  currentAgent: null,
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
}))

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
