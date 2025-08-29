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
      accent: "text-foreground",
      borderColor: "border-border"
    },
    {
      title: "New This Week",
      value: stats.newThisWeek.toString(),
      description: "Recently added candidates",
      icon: UserPlus,
      trend: formatTrend(stats.trends.weeklyGrowth),
      accent: "text-foreground",
      borderColor: "border-border"
    },
    {
      title: "Active Processes",
      value: stats.activeScrapes.toString(),
      description: "Ongoing scrapes and syncs",
      icon: Activity,
      trend: formatTrend(stats.trends.completedScrapesThisWeek, 'count'),
      accent: "text-foreground",
      borderColor: "border-border"
    },
    {
      title: "AI Processing",
      value: `${stats.embeddingCompletionRate}%`,
      description: "Candidates with embeddings",
      icon: TrendingUp,
      trend: `${stats.trends.pendingEmbeddings} pending jobs`,
      accent: "text-foreground",
      borderColor: "border-border"
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className={`relative ${stat.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-md bg-muted">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {stat.description}
              </p>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 rounded-full bg-muted mr-2" />
                <span className="text-muted-foreground">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}