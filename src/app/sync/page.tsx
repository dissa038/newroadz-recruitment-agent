'use client'

import { useState, useEffect } from 'react'
import { LoxoSyncForm } from './components/LoxoSyncForm'
import { LoxoSyncRunsList } from './components/LoxoSyncRunsList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  Zap, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Info,
  Database,
  Building,
  Clock,
  Activity
} from 'lucide-react'

export default function SyncPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastSyncDate, setLastSyncDate] = useState<string>()
  const [syncStats, setSyncStats] = useState<any>(null)

  const handleSyncStarted = (runId: string) => {
    // Trigger refresh of the runs list
    setRefreshTrigger(prev => prev + 1)
  }

  // Fetch sync stats and info
  useEffect(() => {
    const fetchSyncInfo = async () => {
      try {
        // Get sync statistics
        const statsResponse = await fetch('/api/sync/stats')
        const statsResult = await statsResponse.json()

        if (statsResult.success) {
          setSyncStats(statsResult.data)
          if (statsResult.data.lastSync) {
            setLastSyncDate(statsResult.data.lastSync.completedAt)
          }
        }
      } catch (error) {
        console.error('Error fetching sync info:', error)
      }
    }

    fetchSyncInfo()
  }, [refreshTrigger])

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-600" />
            Loxo Database Sync
          </h1>
          <p className="text-muted-foreground mt-2">
            Synchronize candidate and company data from your Loxo recruitment database. 
            All data is automatically processed, deduplicated, and indexed for AI search.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          AI-Powered
        </Badge>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Connect to your Loxo database to automatically sync candidate profiles, 
          company data, and job positions. Choose between full sync for initial setup or incremental sync for regular updates.
        </AlertDescription>
      </Alert>

      {/* Last Sync Info */}
      {lastSyncDate && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Last successful sync:</strong> {new Date(lastSyncDate).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="sync" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Start Sync
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sync History
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Help & Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sync Form */}
            <div className="lg:col-span-2">
              <LoxoSyncForm 
                onSyncStarted={handleSyncStarted} 
                lastSyncDate={lastSyncDate}
              />
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Sync Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Loxo Candidates</span>
                    </div>
                    {syncStats?.overview?.totalLoxoCandidates ? (
                      <Badge variant="outline">
                        {syncStats.overview.totalLoxoCandidates.toLocaleString()}
                      </Badge>
                    ) : (
                      <Skeleton className="h-5 w-16" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Companies</span>
                    </div>
                    {syncStats?.overview?.totalLoxoCompanies ? (
                      <Badge variant="outline">
                        {syncStats.overview.totalLoxoCompanies.toLocaleString()}
                      </Badge>
                    ) : (
                      <Skeleton className="h-5 w-16" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Last 7 Days</span>
                    </div>
                    {syncStats?.recentActivity?.totalProcessed ? (
                      <Badge variant="outline">
                        {syncStats.recentActivity.totalProcessed.toLocaleString()}
                      </Badge>
                    ) : (
                      <Skeleton className="h-5 w-16" />
                    )}
                  </div>
                  {syncStats?.overview?.runningSyncs > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                        <span className="text-sm">Running Syncs</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-600">
                        {syncStats.overview.runningSyncs}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Sync Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Incremental & full sync modes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Automatic deduplication
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      AI-powered embedding
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Real-time progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Configurable batch processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Error handling & retry logic
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <LoxoSyncRunsList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Configure API Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Loxo Settings → Integrations → API and generate your API key
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Set Environment Variables</h4>
                  <p className="text-sm text-muted-foreground">
                    Add your LOXO_API_KEY and LOXO_API_URL to your environment configuration
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">3. Run Initial Full Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Start with a full sync to import all your existing data
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">4. Schedule Regular Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Use incremental sync for daily or weekly updates to keep data current
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Sync Strategy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use full sync only for initial setup</li>
                    <li>• Run incremental sync daily or weekly</li>
                    <li>• Monitor sync performance and adjust batch sizes</li>
                    <li>• Schedule syncs during off-peak hours</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance Optimization</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Start with smaller batch sizes (100-500)</li>
                    <li>• Increase batch size if performance is good</li>
                    <li>• Monitor API rate limits</li>
                    <li>• Use incremental sync to reduce load</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data Quality</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Review sync results regularly</li>
                    <li>• Check for duplicate candidates</li>
                    <li>• Validate contact information</li>
                    <li>• Use AI search to verify data quality</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2 text-blue-600">Required Environment Variables</h4>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      <div>LOXO_API_KEY=your_api_key</div>
                      <div>LOXO_API_URL=https://api.loxo.co/v1</div>
                      <div>LOXO_AGENCY_SLUG=your_agency</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Getting Your API Key</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Log into your Loxo account</li>
                      <li>Go to Settings → Integrations</li>
                      <li>Click on "API" section</li>
                      <li>Generate a new API key</li>
                      <li>Copy the key to your environment</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
