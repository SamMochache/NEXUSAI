import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Key, Bell, Shield, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAuthStore } from '@/src/store'

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    username: user?.username || '',
    email: user?.email || '',
    notifications: true,
    emailAlerts: false,
    twoFactor: false,
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success('Settings saved successfully')
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card className="border-slate-700/30 bg-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Profile</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                value={settings.username}
                onChange={(e) =>
                  setSettings({ ...settings, username: e.target.value })
                }
                className="border-slate-700/30 bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                className="border-slate-700/30 bg-background text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-slate-700/30 bg-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Notifications</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications in the browser
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>
            <Separator className="bg-slate-700/30" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Email Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailAlerts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="border-slate-700/30 bg-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Security</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={settings.twoFactor}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, twoFactor: checked })
                }
              />
            </div>
            <Separator className="bg-slate-700/30" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Change Password</Label>
                <p className="text-xs text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700/30 text-foreground hover:bg-slate-800/50"
              >
                <Key className="mr-2 h-4 w-4" />
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card className="border-slate-700/30 bg-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">API Keys</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Manage your API access tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-700/30 bg-background p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Production API Key</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    sk-********************************************
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
