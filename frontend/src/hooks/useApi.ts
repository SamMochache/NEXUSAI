import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/src/lib/api'
import { useAuthStore, type Agent } from '@/src/store'
import { toast } from 'sonner'

// ================= AUTH =================
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async ({ username, password }: any) => {
      return api.login(username, password)
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh)
      toast.success('Login successful')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

// ================= AGENTS =================
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.getAgent(id),
    enabled: !!id,
  })
}

export function useAgentStats() {
  return useQuery({
    queryKey: ['agent-stats'],
    queryFn: api.getAgentStats,
  })
}

// ================= MUTATIONS =================
export function useCreateAgent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateAgent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, agent }: any) => api.updateAgent(id, agent),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      qc.invalidateQueries({ queryKey: ['agent', vars.id] })
      toast.success('Agent updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteAgent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: api.deleteAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ================= CHAT =================
export function useChatHistory(agentId: string) {
  return useQuery({
    queryKey: ['chat-history', agentId],
    queryFn: () => api.getChatHistory(agentId),
    enabled: !!agentId,
  })
}

export function useSendMessage(agentId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (query: string) => api.sendMessage(agentId, query),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-history', agentId] })
    },

    onError: (e: Error) => toast.error(e.message),
  })
}

// ================= DOCS =================
export function useSearchDocuments(agentId: string) {
  return useMutation({
    mutationFn: (query: string) =>
      api.searchDocuments(agentId, query),
  })
}