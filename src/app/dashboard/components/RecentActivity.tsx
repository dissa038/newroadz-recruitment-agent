import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, UserPlus, FileText, Zap, Activity } from "lucide-react"

export function RecentActivity() {
  // This would be fetched from the database in a real implementation
  const activities = [
    {
      type: "candidate_added",
      title: "New candidate added",
      description: "Via CV upload",
      time: "2 minutes ago",
      icon: UserPlus,
      status: "success",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      type: "embedding_completed",
      title: "AI embedding completed",
      description: "Profile indexed for search",
      time: "5 minutes ago",
      icon: Zap,
      status: "info",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      type: "document_processed",
      title: "CV processed",
      description: "Text extracted and chunked",
      time: "10 minutes ago",
      icon: FileText,
      status: "success",
      gradient: "from-purple-500 to-violet-500"
    },
    {
      type: "sync_completed",
      title: "Apollo sync completed",
      description: "127 new candidates imported",
      time: "1 hour ago",
      icon: Activity,
      status: "info",
      gradient: "from-orange-500 to-amber-500"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and operations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium">No recent activity</p>
            <p className="text-xs mt-1">Activity will appear here once you start using the system</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="group">
                  <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200">
                    <div className="relative">
                      <div className={`p-2.5 rounded-full bg-gradient-to-r ${activity.gradient} shadow-sm`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {index < activities.length - 1 && (
                        <div className="absolute top-10 left-1/2 w-px h-6 bg-border transform -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <Badge className={`text-xs ${getStatusBadge(activity.status)}`}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground font-medium">{activity.time}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-full -translate-y-16 translate-x-16" />
    </Card>
  )
}