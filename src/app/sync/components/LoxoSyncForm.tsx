'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Database, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

const syncFormSchema = z.object({
  syncType: z.enum(['full', 'incremental']).default('incremental'),
  batchSize: z.number().min(50).max(2000).default(500),
  lastSyncTimestamp: z.string().optional(),
  includeInactive: z.boolean().default(false),
  syncContacts: z.boolean().default(true),
  syncCompanies: z.boolean().default(true),
  syncJobs: z.boolean().default(false)
})

type SyncFormData = z.infer<typeof syncFormSchema>

interface LoxoSyncFormProps {
  onSyncStarted?: (runId: string) => void
  lastSyncDate?: string
}

export function LoxoSyncForm({ onSyncStarted, lastSyncDate }: LoxoSyncFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; runId?: string } | null>(null)
  const { toast } = useToast()

  const form = useForm<SyncFormData>({
    resolver: zodResolver(syncFormSchema),
    defaultValues: {
      syncType: 'incremental',
      batchSize: 500,
      lastSyncTimestamp: lastSyncDate,
      includeInactive: false,
      syncContacts: true,
      syncCompanies: true,
      syncJobs: false
    }
  })

  const syncType = form.watch('syncType')

  const onSubmit = async (data: SyncFormData) => {
    setIsSubmitting(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/sync/loxo/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          syncType: data.syncType,
          batchSize: data.batchSize,
          lastSyncTimestamp: data.syncType === 'incremental' ? data.lastSyncTimestamp : undefined,
          options: {
            includeInactive: data.includeInactive,
            syncContacts: data.syncContacts,
            syncCompanies: data.syncCompanies,
            syncJobs: data.syncJobs
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setLastResult({
          success: true,
          message: result.data.message,
          runId: result.data.syncRunId
        })
        
        toast({
          title: "Loxo Sync Started",
          description: "Database synchronization has been initiated successfully.",
        })

        // Reset form for incremental syncs
        if (data.syncType === 'incremental') {
          form.reset()
        }
        
        // Notify parent component
        if (onSyncStarted && result.data.syncRunId) {
          onSyncStarted(result.data.syncRunId)
        }
      } else {
        setLastResult({
          success: false,
          message: result.error || 'Failed to start sync'
        })
        
        toast({
          title: "Sync Failed",
          description: result.error || 'Failed to start Loxo synchronization',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Sync submission error:', error)
      setLastResult({
        success: false,
        message: 'Network error occurred'
      })
      
      toast({
        title: "Network Error",
        description: "Failed to connect to the server",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Start Loxo Sync
        </CardTitle>
        <CardDescription>
          Synchronize candidate data from your Loxo database. Choose between full sync or incremental updates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sync Type */}
            <FormField
              control={form.control}
              name="syncType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sync Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sync type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="incremental">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Incremental Sync</div>
                            <div className="text-xs text-muted-foreground">Only sync recent changes</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="full">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Full Sync</div>
                            <div className="text-xs text-muted-foreground">Sync all data (slower)</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {syncType === 'incremental' 
                      ? 'Recommended for regular updates. Only syncs data modified since last sync.'
                      : 'Complete data synchronization. Use for initial setup or data recovery.'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Sync Timestamp (for incremental) */}
            {syncType === 'incremental' && (
              <FormField
                control={form.control}
                name="lastSyncTimestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Sync Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local"
                        {...field}
                        placeholder="Leave empty to use last successful sync"
                      />
                    </FormControl>
                    <FormDescription>
                      Override the automatic last sync detection. Format: YYYY-MM-DDTHH:MM
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Batch Size */}
            <FormField
              control={form.control}
              name="batchSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Size</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min={50}
                      max={2000}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 500)}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of records to process per batch (50-2000). Lower values are more stable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sync Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Sync Options</Label>
              
              <FormField
                control={form.control}
                name="syncContacts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sync Contacts</FormLabel>
                      <FormDescription>
                        Import candidate profiles and contact information
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="syncCompanies"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sync Companies</FormLabel>
                      <FormDescription>
                        Import company data and organization details
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="syncJobs"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sync Job Positions</FormLabel>
                      <FormDescription>
                        Import job postings and position requirements
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeInactive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Inactive Records</FormLabel>
                      <FormDescription>
                        Sync archived or inactive candidates and companies
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Result Alert */}
            {lastResult && (
              <Alert className={lastResult.success ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
                {lastResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={lastResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
                  {lastResult.message}
                  {lastResult.runId && (
                    <div className="mt-2">
                      <Badge variant="outline">Sync ID: {lastResult.runId}</Badge>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Sync...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Loxo Sync
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sync Information
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Incremental sync is recommended for daily operations</li>
            <li>Full sync should be used for initial setup or data recovery</li>
            <li>All data is automatically deduplicated and embedded for AI search</li>
            <li>Sync progress can be monitored in real-time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
