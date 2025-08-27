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
  RefreshCw,
  Filter,
  StopCircle,
  Database,
  Building
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface LoxoSyncRun {
  id: string
  source: 'loxo'
  run_type: string
  sync_type: 'full' | 'incremental'
  batch_size: number
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
  last_sync_timestamp?: string
  created_at: string
}

interface LoxoSyncRunsListProps {
  refreshTrigger?: number
}

export function LoxoSyncRunsList({ refreshTrigger }: LoxoSyncRunsListProps) {
  const [runs, setRuns] = useState<LoxoSyncRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchRuns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: '20',
        page: '1',
        source: 'loxo'
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/scrape/runs?${params}`)
      const result = await response.json()

      if (result.success) {
        setRuns(result.data.runs)
      } else {
        setError(result.error || 'Failed to fetch sync runs')
      }
    } catch (err) {
      console.error('Error fetching sync runs:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const cancelSync = async (runId: string) => {
    try {
      setCancelling(runId)
      
      const response = await fetch(`/api/sync/loxo/status?runId=${runId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sync Cancelled",
          description: "The sync operation has been cancelled successfully.",
        })
        fetchRuns() // Refresh the list
      } else {
        toast({
          title: "Cancel Failed",
          description: result.error || 'Failed to cancel sync',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cancelling sync:', error)
      toast({
        title: "Network Error",
        description: "Failed to cancel sync operation",
        variant: "destructive"
      })
    } finally {
      setCancelling(null)
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [statusFilter, refreshTrigger])

  // Auto-refresh running syncs every 10 seconds
  useEffect(() => {
    const hasRunningSyncs = runs.some(run => run.status === 'running' || run.status === 'pending')
    
    if (hasRunningSyncs) {
      const interval = setInterval(fetchRuns, 10000)
      return () => clearInterval(interval)
    }
  }, [runs])

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
      case 'cancelled':
        return <StopCircle className="h-4 w-4" />
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
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const calculateProgress = (run: LoxoSyncRun) => {
    if (run.status === 'completed') return 100
    if (run.status === 'failed' || run.status === 'cancelled') return 0
    if (run.total_found && run.total_processed) {
      return Math.min((run.total_processed / run.total_found) * 100, 100)
    }
    return run.status === 'running' ? 25 : 0
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Loxo Syncs</CardTitle>
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
          <CardTitle>Recent Loxo Syncs</CardTitle>
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
            <CardTitle>Recent Loxo Syncs</CardTitle>
            <CardDescription>
              Monitor the status and progress of your Loxo database synchronizations
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sync runs found</h3>
            <p className="text-muted-foreground">
              Start your first Loxo sync to see results here
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
                      <h4 className="font-medium flex items-center gap-2">
                        Loxo {run.sync_type === 'full' ? 'Full' : 'Incremental'} Sync
                        <Badge variant="outline" className="text-xs">
                          {run.sync_type}
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(run.status)}>
                      {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </Badge>
                    {(run.status === 'running' || run.status === 'pending') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelSync(run.id)}
                        disabled={cancelling === run.id}
                      >
                        {cancelling === run.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <StopCircle className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{run.total_processed || 0} / {run.total_found || 0}</span>
                  </div>
                  <Progress value={calculateProgress(run)} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                    <span className="text-muted-foreground">Batch Size:</span>
                    <span className="ml-1 font-medium">{run.batch_size}</span>
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

                {/* Last Sync Timestamp */}
                {run.last_sync_timestamp && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium">Last Sync:</span> {new Date(run.last_sync_timestamp).toLocaleString()}
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
