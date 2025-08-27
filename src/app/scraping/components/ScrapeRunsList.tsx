'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  Calendar,
  ExternalLink,
  RefreshCw,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ScrapeRun {
  id: string
  source: 'apollo' | 'loxo'
  run_type: string
  search_query: string
  filters: any
  max_results: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  total_found: number
  total_processed: number
  total_new: number
  total_updated: number
  total_duplicates: number
  started_at: string
  completed_at?: string
  duration_seconds?: number
  error_message?: string
  actor_run_id?: string
  created_at: string
}

interface ScrapeRunsListProps {
  refreshTrigger?: number
}

export function ScrapeRunsList({ refreshTrigger }: ScrapeRunsListProps) {
  const [runs, setRuns] = useState<ScrapeRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const fetchRuns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: '20',
        page: '1'
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter)
      }

      const response = await fetch(`/api/scrape/runs?${params}`)
      const result = await response.json()

      if (result.success) {
        setRuns(result.data.runs)
      } else {
        setError(result.error || 'Failed to fetch scrape runs')
      }
    } catch (err) {
      console.error('Error fetching scrape runs:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [statusFilter, sourceFilter, refreshTrigger])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const calculateProgress = (run: ScrapeRun) => {
    if (run.status === 'completed') return 100
    if (run.status === 'failed') return 0
    if (run.max_results && run.total_processed) {
      return Math.min((run.total_processed / run.max_results) * 100, 100)
    }
    return run.status === 'running' ? 25 : 0
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Scrape Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Scrape Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRuns} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Scrape Runs</CardTitle>
            <CardDescription>
              Monitor the status and progress of your scraping operations
            </CardDescription>
          </div>
          <Button onClick={fetchRuns} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="apollo">Apollo</SelectItem>
              <SelectItem value="loxo">Loxo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scrape runs found</h3>
            <p className="text-muted-foreground">
              Start your first Apollo scrape to see results here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <div key={run.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <div>
                      <h4 className="font-medium">
                        {run.source.charAt(0).toUpperCase() + run.source.slice(1)} Scrape
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(run.status)}>
                    {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{run.total_processed || 0} / {run.max_results || 0}</span>
                  </div>
                  <Progress value={calculateProgress(run)} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">New:</span>
                    <span className="ml-1 font-medium text-green-600">{run.total_new || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="ml-1 font-medium text-blue-600">{run.total_updated || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duplicates:</span>
                    <span className="ml-1 font-medium text-orange-600">{run.total_duplicates || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-1 font-medium">{formatDuration(run.duration_seconds)}</span>
                  </div>
                </div>

                {/* Error Message */}
                {run.error_message && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {run.error_message}
                  </div>
                )}

                {/* Search Query Preview */}
                {run.search_query && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium">Query:</span> {run.search_query.substring(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
