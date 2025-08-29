import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Search, Users, Settings, FileText, Zap } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Upload CV",
      description: "Add candidates via CV upload",
      icon: Upload,
      href: "/candidates/upload",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Smart Search",
      description: "AI-powered candidate search",
      icon: Search,
      href: "/search",
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      title: "Browse Candidates",
      description: "View all candidate profiles",
      icon: Users,
      href: "/candidates",
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50"
    },
    {
      title: "Run Embeddings",
      description: "Process pending AI embeddings",
      icon: Zap,
      href: "/admin/embeddings",
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    },
    {
      title: "Import Data",
      description: "Bulk import from external sources",
      icon: FileText,
      href: "/admin/import",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50"
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      href: "/admin/settings",
      gradient: "from-gray-500 to-slate-500",
      bgGradient: "from-gray-50 to-slate-50"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Snelle toegang tot veelgebruikte taken</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href} className="block h-full">
                <div className="h-full p-4 md:p-5 rounded-lg border hover:bg-muted transition-colors">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="p-2 rounded-md bg-muted shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-6">{action.title}</p>
                      <p className="text-xs text-muted-foreground leading-5 line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}