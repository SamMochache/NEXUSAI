import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/src/lib/api'
import { useAuthStore, type Agent } from '@/src/store'
import { toast } from 'sonner'

// Auth hooks
export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string
      password: string
    }) => {
      return api.login(username, password)
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh)
      toast.success('Welcome back!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid credentials')
    },
  })
}

// Agent hooks
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => api.getAgent(id),
    enabled: !!id,
  })
}

export function useAgentStats() {
  return useQuery({
    queryKey: ['agents', 'stats'],
    queryFn: () => api.getAgentStats(),
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agent: Partial<Agent>) => api.createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create agent')
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: Partial<Agent> }) =>
      api.updateAgent(id, agent),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agents', id] })
      toast.success('Agent updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update agent')
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete agent')
    },
  })
}

// Chat hooks
export function useChatHistory(agentId: string) {
  return useQuery({
    queryKey: ['chat', agentId, 'history'],
    queryFn: () => api.getChatHistory(agentId),
    enabled: !!agentId,
  })
}

export function useSendMessage(agentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (query: string) => api.sendMessage(agentId, query),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', agentId, 'history'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message')
    },
  })
}

// Document hooks
export function useSearchDocuments(agentId: string) {
  return useMutation({
    mutationFn: (query: string) => api.searchDocuments(agentId, query),
  })
}
