'use client'

import { useState } from 'react'
import { ApolloScrapeForm } from './components/ApolloScrapeForm'
import { ScrapeRunsList } from './components/ScrapeRunsList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  Zap, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react'

export default function ScrapingPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleScrapeStarted = (runId: string) => {
    // Trigger refresh of the runs list
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-purple-600" />
            Apollo Scraping
          </h1>
          <p className="text-muted-foreground mt-2">
            Import candidates from Apollo.io using automated scraping. All results are automatically processed, deduplicated, and indexed.
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
          <strong>How it works:</strong> Enter an Apollo.io search URL and we'll automatically scrape the results using Apify. 
          All candidates are processed through our deduplication engine and embedded for AI search.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="scrape" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scrape" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Start Scrape
          </TabsTrigger>
          <TabsTrigger value="runs" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Scrape History
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Help & Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scrape" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Scrape Form */}
            <div className="lg:col-span-2">
              <ApolloScrapeForm onScrapeStarted={handleScrapeStarted} />
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Total Candidates</span>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Apollo Sources</span>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">This Week</span>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
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
                      Real-time processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Webhook notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Progress tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="space-y-6">
          <ScrapeRunsList refreshTrigger={refreshTrigger} />
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
                  <h4 className="font-medium mb-2">1. Prepare Your Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Apollo.io and create a search with your desired filters (location, title, company, etc.)
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Copy the URL</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy the complete URL from your browser's address bar after applying all filters
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">3. Start Scraping</h4>
                  <p className="text-sm text-muted-foreground">
                    Paste the URL in the form, set your preferences, and start the scrape
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">4. Monitor Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    Track the progress in the "Scrape History" tab and receive notifications when complete
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
                  <h4 className="font-medium mb-2">Optimize Your Searches</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use specific location filters</li>
                    <li>• Target relevant job titles</li>
                    <li>• Filter by company size if needed</li>
                    <li>• Consider seniority levels</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Manage Volume</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Start with smaller batches (500-1000)</li>
                    <li>• Monitor processing times</li>
                    <li>• Allow time between large scrapes</li>
                    <li>• Check for duplicates regularly</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Quality Control</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Review results after each scrape</li>
                    <li>• Use AI search to validate quality</li>
                    <li>• Tag candidates appropriately</li>
                    <li>• Clean up duplicates if needed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Common Issues</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Invalid Apollo URL format</li>
                      <li>• Network timeouts during scraping</li>
                      <li>• Rate limiting from Apollo</li>
                      <li>• Webhook delivery failures</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Solutions</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ensure URL includes search parameters</li>
                      <li>• Reduce batch size and retry</li>
                      <li>• Wait between scrape attempts</li>
                      <li>• Check webhook endpoint status</li>
                    </ul>
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
