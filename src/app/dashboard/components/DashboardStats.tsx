'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Activity, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardStatsData {
  totalCandidates: number
  newThisWeek: number
  activeScrapes: number
  embeddingCompletionRate: number
  trends: {
    weeklyGrowth: number
    completedScrapesThisWeek: number
    pendingEmbeddings: number
    activeConversations: number
  }
  sourceDistribution: {
    apollo: number
    loxo: number
    cv_upload: number
    manual: number
  }
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || 'Failed to load stats')
      }
    } catch (err) {
      setError('Failed to load dashboard statistics')
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading dashboard statistics: {error}</p>
            <button 
              onClick={fetchStats}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const formatTrend = (value: number, type: 'percentage' | 'count' = 'percentage') => {
    if (type === 'percentage') {
      return value > 0 ? `+${value}% from last week` : `${value}% from last week`
    }
    return `${value} this week`
  }

  const statCards = [
    {
      title: "Total Candidates",
      value: stats.totalCandidates.toLocaleString(),
      description: "Active profiles in database",
      icon: Users,
      trend: `Apollo: ${stats.sourceDistribution.apollo}, Loxo: ${stats.sourceDistribution.loxo}, CV: ${stats.sourceDistribution.cv_upload}`,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "New This Week",
      value: stats.newThisWeek.toString(),
      description: "Recently added candidates",
      icon: UserPlus,
      trend: formatTrend(stats.trends.weeklyGrowth),
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "Active Processes",
      value: stats.activeScrapes.toString(),
      description: "Ongoing scrapes and syncs",
      icon: Activity,
      trend: formatTrend(stats.trends.completedScrapesThisWeek, 'count'),
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
      borderColor: "border-orange-200 dark:border-orange-800"
    },
    {
      title: "AI Processing",
      value: `${stats.embeddingCompletionRate}%`,
      description: "Candidates with embeddings",
      icon: TrendingUp,
      trend: `${stats.trends.pendingEmbeddings} pending jobs`,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} ${stat.borderColor} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} bg-opacity-10`}>
                <Icon className={`h-4 w-4 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {stat.description}
              </p>
              <div className="flex items-center text-xs">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.gradient} mr-2`} />
                <span className="text-muted-foreground">{stat.trend}</span>
              </div>
            </CardContent>
            
            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full -translate-y-16 translate-x-16`} />
          </Card>
        )
      })}
    </div>
  )
}