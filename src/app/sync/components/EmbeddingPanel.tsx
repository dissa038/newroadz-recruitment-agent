'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Zap, Brain, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface EmbeddingStats {
  total_candidates: number
  pending_embeddings: number
  completed_embeddings: number
  failed_embeddings: number
  in_progress_embeddings: number
  pending_jobs: number
  processing_jobs: number
  source_breakdown: {
    loxo: number
    apollo: number
    cv_upload: number
    manual: number
  }
}

export function EmbeddingPanel() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null)
  const [isQueueing, setIsQueueing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/embed/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch embedding stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const queueEmbeddings = async () => {
    setIsQueueing(true)
    setResult(null)

    try {
      const response = await fetch('/api/embed/queue/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: ['loxo', 'apollo', 'cv_upload', 'manual'],
          onlyWithContent: true,
          batchSize: 300,
          priority: 100
        })
      })

      const data = await response.json()
      setResult(data)
      fetchStats()
    } catch (error) {
      setResult({ success: false, error: 'Failed to queue embeddings' })
    } finally {
      setIsQueueing(false)
    }
  }

  const processEmbeddings = async () => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/embed/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 10, maxJobs: 100 })  // NEW API: Simpler processing
      })

      const data = await response.json()
      setResult(data)
      fetchStats()
    } catch (error) {
      setResult({ success: false, error: 'Failed to process embeddings' })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Embeddings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completionRate = stats.total_candidates > 0 
    ? (stats.completed_embeddings / stats.total_candidates) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Embeddings & Vector Search
        </CardTitle>
        <CardDescription>
          Generate AI embeddings for semantic candidate search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_candidates}</div>
            <div className="text-sm text-muted-foreground">Total Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed_embeddings}</div>
            <div className="text-sm text-muted-foreground">Embedded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending_embeddings}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completionRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>

        {/* Source Breakdown */}
        {stats.source_breakdown && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Data Sources</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="outline" className="justify-center">
                🔵 Loxo: {stats.source_breakdown.loxo}
              </Badge>
              <Badge variant="outline" className="justify-center">
                🟠 Apollo: {stats.source_breakdown.apollo}
              </Badge>
              <Badge variant="outline" className="justify-center">
                🟢 CV Upload: {stats.source_breakdown.cv_upload}
              </Badge>
              <Badge variant="outline" className="justify-center">
                🟡 Manual: {stats.source_breakdown.manual}
              </Badge>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Embedding Progress</span>
            <span>{completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={completionRate} className="h-3" />
        </div>

        {/* Job Queue Status */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {stats.pending_jobs} Queued
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {stats.processing_jobs} Processing
          </Badge>
          {stats.failed_embeddings > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {stats.failed_embeddings} Failed
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={queueEmbeddings} 
            disabled={isQueueing || stats.pending_embeddings === 0}
            className="w-full"
            size="lg"
          >
            {isQueueing ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-spin" />
                Queueing Embeddings...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                🧠 Queue {stats.pending_embeddings} Universal Embeddings
              </>
            )}
          </Button>

          <Button 
            onClick={processEmbeddings} 
            disabled={isProcessing || stats.pending_jobs === 0}
            variant="outline"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-spin" />
                Processing Jobs...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                ⚡ Process {stats.pending_jobs} Jobs
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {result.success ? result.message : result.error}
            </AlertDescription>
          </Alert>
        )}

        {stats.completed_embeddings === 0 && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              No embeddings generated yet. Queue embeddings for enhanced candidates to enable semantic search!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
