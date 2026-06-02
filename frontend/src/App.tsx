import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/src/store'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { LoginPage } from '@/src/pages/LoginPage'
import { DashboardPage } from '@/src/pages/DashboardPage'
import { AgentsPage } from '@/src/pages/AgentsPage'
import { AgentBuilderPage } from '@/src/pages/AgentBuilderPage'
import { ChatPage } from '@/src/pages/ChatPage'
import { DocumentsPage } from '@/src/pages/DocumentsPage'
import { AnalyticsPage } from '@/src/pages/AnalyticsPage'
import { SettingsPage } from '@/src/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/agents" element={<AgentsPage />} />
                  <Route path="/agents/new" element={<AgentBuilderPage />} />
                  <Route path="/agents/:id/edit" element={<AgentBuilderPage />} />
                  <Route path="/agents/:id/chat" element={<ChatPage />} />
                  <Route path="/agents/:id/documents" element={<DocumentsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            color: '#f8fafc',
          },
        }}
      />
    </>
  )
}
