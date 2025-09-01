'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Rocket, Zap, Brain, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react'

interface PipelineProgress {
  stage: 'sync' | 'enhance' | 'embed' | 'complete'
  processed: number
  total: number
  errors: number
  startTime: number
  currentBatch?: number
  totalBatches?: number
}

interface PipelineResult {
  candidates: any[]
  created: number
  updated: number
  enhanced: number
  errors: number
  totalTime: number
  progress: PipelineProgress
}

export function UnifiedPipelinePanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Configuration
  const [maxCandidates, setMaxCandidates] = useState(15000) // INCREASED: Get all Loxo candidates
  const [skipExisting, setSkipExisting] = useState(true)
  const [autoEmbed, setAutoEmbed] = useState(true)
  const [batchSize, setBatchSize] = useState(100)          // INCREASED: More aggressive batching
  const [concurrency, setConcurrency] = useState(3)        // INCREASED: More concurrent

  const startPipeline = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setProgress({
      stage: 'sync',
      processed: 0,
      total: maxCandidates,
      errors: 0,
      startTime: Date.now()
    })

    try {
      const response = await fetch('/api/sync/loxo/full-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxCandidates,
          skipExisting,
          autoEmbed,
          batchSize,
          concurrency
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        setProgress(data.data.progress)
      } else {
        setError(data.error || 'Pipeline failed')
      }
    } catch (err) {
      setError('Failed to start pipeline')
      console.error('Pipeline error:', err)
    } finally {
      setIsRunning(false)
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'sync': return <Zap className="h-4 w-4" />
      case 'enhance': return <Rocket className="h-4 w-4" />
      case 'embed': return <Brain className="h-4 w-4" />
      case 'complete': return <CheckCircle2 className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'sync': return 'Syncing & Enhancing'
      case 'enhance': return 'Processing Enhancement'
      case 'embed': return 'Generating Embeddings'
      case 'complete': return 'Complete'
      default: return 'Preparing'
    }
  }

  const progressPercentage = progress ? Math.round((progress.processed / progress.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          🚀 Unified Loxo Pipeline
        </CardTitle>
        <CardDescription>
          Complete Loxo sync, enhancement, and embedding in ONE CLICK! 
          10x faster than manual process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Configuration */}
        {!isRunning && !result && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxCandidates">Max Candidates</Label>
              <Input
                id="maxCandidates"
                type="number"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(Number(e.target.value))}
                min={100}
                max={14000}
              />
            </div>
            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                min={50}
                max={500}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="skipExisting"
                checked={skipExisting}
                onCheckedChange={setSkipExisting}
              />
              <Label htmlFor="skipExisting">Skip Enhanced</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoEmbed"
                checked={autoEmbed}
                onCheckedChange={setAutoEmbed}
              />
              <Label htmlFor="autoEmbed">Auto Embed</Label>
            </div>
          </div>
        )}

        {/* Progress */}
        {(isRunning || progress) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStageIcon(progress?.stage || 'sync')}
                <span className="font-medium">
                  {getStageLabel(progress?.stage || 'sync')}
                </span>
              </div>
              <Badge variant={progress?.stage === 'complete' ? 'default' : 'secondary'}>
                {progress?.processed || 0} / {progress?.total || 0}
              </Badge>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="text-sm text-muted-foreground">
              {progress?.currentBatch && progress?.totalBatches && (
                <span>Batch {progress.currentBatch} of {progress.totalBatches} • </span>
              )}
              {progressPercentage}% complete
              {progress?.errors > 0 && (
                <span className="text-destructive"> • {progress.errors} errors</span>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Pipeline completed in {Math.round(result.totalTime / 1000)} seconds!
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{result.enhanced}</div>
                <div className="text-sm text-muted-foreground">Enhanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{result.candidates.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={startPipeline}
            disabled={isRunning}
            className="flex-1"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Pipeline...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                🚀 Start Unified Pipeline
              </>
            )}
          </Button>
          
          {result && (
            <Button
              variant="outline"
              onClick={() => {
                setResult(null)
                setProgress(null)
                setError(null)
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Syncs {maxCandidates.toLocaleString()} candidates from Loxo</li>
            <li>Enhances with detailed data (bio, job history, education)</li>
            <li>Queues embedding jobs automatically</li>
            <li>Processes in parallel batches (5x faster)</li>
            <li>Skips already enhanced candidates</li>
          </ul>
          <p className="mt-2">
            <strong>Estimated time:</strong> ~{Math.round(maxCandidates / 50)} minutes
            (vs {Math.round(maxCandidates / 5)} minutes manual)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
