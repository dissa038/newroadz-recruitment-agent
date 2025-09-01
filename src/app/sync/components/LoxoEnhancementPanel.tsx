'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Zap, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Download,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react'

interface EnhancementStats {
  overview: {
    totalLoxoCandidates: number
    enhancedCandidates: number
    needingEnhancement: number
    enhancementProgress: number
  }
  coverage: {
    bioDescription: { count: number; percentage: number }
    detailedJobHistory: { count: number; percentage: number }
    educationHistory: { count: number; percentage: number }
    cvFiles: { count: number; percentage: number }
    availableDocuments: { count: number; percentage: number }
  }
  recentRuns: Array<{
    id: string
    status: string
    started_at: string
    completed_at?: string
    total_found: number
    total_processed: number
    total_new: number
    duration_seconds?: number
  }>
}

interface LoxoEnhancementPanelProps {
  stats: EnhancementStats | null
  onRefresh: () => void
}

export function LoxoEnhancementPanel({ stats, onRefresh }: LoxoEnhancementPanelProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isAutoEnhancing, setIsAutoEnhancing] = useState(false)
  const [enhancementResult, setEnhancementResult] = useState<any>(null)
  const [autoProgress, setAutoProgress] = useState({ current: 0, total: 0 })

  const startEnhancement = async () => {
    setIsEnhancing(true)
    setEnhancementResult(null)

    try {
      const response = await fetch('/api/sync/loxo/enhance/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: 100,  // OPTIMIZED: Larger batches
          downloadCVs: true
        })
      })

      const result = await response.json()

      if (result.success) {
        setEnhancementResult(result.data)
        onRefresh() // Refresh stats
      } else {
        setEnhancementResult({ error: result.error })
      }
    } catch (error) {
      setEnhancementResult({ error: 'Failed to start enhancement' })
    } finally {
      setIsEnhancing(false)
    }
  }

  const startAutoEnhanceAll = async () => {
    if (!stats?.overview?.needingEnhancement) return

    setIsAutoEnhancing(true)
    setEnhancementResult(null)

    const totalNeeded = stats.overview.needingEnhancement
    const batchSize = 100
    const totalBatches = Math.ceil(totalNeeded / batchSize)

    setAutoProgress({ current: 0, total: totalBatches })

    try {
      for (let i = 0; i < totalBatches; i++) {
        const response = await fetch('/api/sync/loxo/enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchSize: 100,
            concurrency: 15,
            onlyMissing: true,
            downloadCVs: true
          })
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Enhancement failed')
        }

        setAutoProgress({ current: i + 1, total: totalBatches })

        // Refresh stats every few batches
        if ((i + 1) % 3 === 0) {
          onRefresh()
        }

        // Small delay between batches to prevent overwhelming
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setEnhancementResult({
        message: `Successfully enhanced all ${totalNeeded} candidates!`,
        autoComplete: true
      })
      onRefresh() // Final refresh

    } catch (error) {
      setEnhancementResult({
        error: `Auto-enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsAutoEnhancing(false)
      setAutoProgress({ current: 0, total: 0 })
    }
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Loxo Data Enhancement
          </CardTitle>
          <CardDescription>
            Enhance candidate profiles with detailed data from Loxo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const { overview, coverage } = stats

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Loxo Data Enhancement
        </CardTitle>
        <CardDescription>
          Enhance candidate profiles with detailed data from Loxo API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{overview.totalLoxoCandidates}</div>
            <div className="text-sm text-muted-foreground">Total Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{overview.enhancedCandidates}</div>
            <div className="text-sm text-muted-foreground">Enhanced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{overview.needingEnhancement}</div>
            <div className="text-sm text-muted-foreground">Need Enhancement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{overview.enhancementProgress}%</div>
            <div className="text-sm text-muted-foreground">Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enhancement Progress</span>
            <span>{overview.enhancementProgress}%</span>
          </div>
          <Progress value={overview.enhancementProgress} className="h-2" />
        </div>

        {/* Coverage Details */}
        <div className="space-y-4">
          <h4 className="font-medium">Data Coverage</h4>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Bio Descriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coverage.bioDescription.percentage > 50 ? "default" : "secondary"}>
                  {coverage.bioDescription.count} ({coverage.bioDescription.percentage}%)
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-green-500" />
                <span className="text-sm">Detailed Job History</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coverage.detailedJobHistory.percentage > 50 ? "default" : "secondary"}>
                  {coverage.detailedJobHistory.count} ({coverage.detailedJobHistory.percentage}%)
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Education History</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coverage.educationHistory.percentage > 30 ? "default" : "secondary"}>
                  {coverage.educationHistory.count} ({coverage.educationHistory.percentage}%)
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-orange-500" />
                <span className="text-sm">CV Files</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coverage.cvFiles.percentage > 30 ? "default" : "secondary"}>
                  {coverage.cvFiles.count} ({coverage.cvFiles.percentage}%)
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhancement Actions */}
        <div className="space-y-3">
          {/* Auto-Enhance All Button (Primary) */}
          <Button
            onClick={startAutoEnhanceAll}
            disabled={isAutoEnhancing || isEnhancing || overview.needingEnhancement === 0}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            size="lg"
          >
            {isAutoEnhancing ? (
              <>
                <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                Auto-Enhancing All... ({autoProgress.current}/{autoProgress.total})
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                🚀 Auto-Enhance ALL {overview.needingEnhancement} Candidates
              </>
            )}
          </Button>

          {/* Single Batch Button (Secondary) */}
          <Button
            onClick={startEnhancement}
            disabled={isEnhancing || isAutoEnhancing || overview.needingEnhancement === 0}
            variant="outline"
            className="w-full"
          >
            {isEnhancing ? (
              <>
                <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                Enhancing Batch...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Enhance Single Batch (100 candidates)
              </>
            )}
          </Button>

          {/* Auto-Enhancement Progress */}
          {isAutoEnhancing && autoProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Auto-Enhancement Progress</span>
                <span>{autoProgress.current}/{autoProgress.total} batches</span>
              </div>
              <Progress
                value={(autoProgress.current / autoProgress.total) * 100}
                className="h-3"
              />
              <div className="text-xs text-muted-foreground text-center">
                Processing ~{autoProgress.current * 100} of {overview.needingEnhancement} candidates
              </div>
            </div>
          )}

          {overview.needingEnhancement === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All candidates have been enhanced with available data!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Enhancement Result */}
        {enhancementResult && (
          <Alert variant={enhancementResult.error ? "destructive" : "default"}>
            {enhancementResult.error ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>
              {enhancementResult.error || 
               `Enhancement started! Processing ${enhancementResult.total || 0} candidates.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Enhancement Runs */}
        {stats.recentRuns && stats.recentRuns.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Recent Enhancement Runs</h4>
            <div className="space-y-2">
              {stats.recentRuns.slice(0, 3).map((run) => (
                <div key={run.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      run.status === 'completed' ? 'default' : 
                      run.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }>
                      {run.status}
                    </Badge>
                    <span>{run.total_processed} processed</span>
                    <span>{run.total_new} enhanced</span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(run.started_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
