import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Search, Users, Settings, FileText, Zap, Sparkles } from "lucide-react"
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
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and operations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <div key={index} className="group">
                <Link href={action.href}>
                  <div className={`relative p-4 rounded-xl bg-gradient-to-br ${action.bgGradient} dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group-hover:border-gray-300`}>
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={`p-3 rounded-full bg-gradient-to-r ${action.gradient} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                      </div>
                    </div>
                    
                    {/* Decorative gradient */}
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${action.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </CardContent>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full -translate-y-16 translate-x-16" />
    </Card>
  )
}