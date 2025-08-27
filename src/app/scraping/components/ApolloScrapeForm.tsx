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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

const scrapeFormSchema = z.object({
  searchUrl: z.string().url('Please enter a valid Apollo.io search URL'),
  maxResults: z.number().min(1).max(5000).default(1000),
  location: z.string().optional(),
  title: z.string().optional(),
  seniority: z.array(z.string()).optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional()
})

type ScrapeFormData = z.infer<typeof scrapeFormSchema>

interface ApolloScrapeFormProps {
  onScrapeStarted?: (runId: string) => void
}

export function ApolloScrapeForm({ onScrapeStarted }: ApolloScrapeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; runId?: string } | null>(null)
  const { toast } = useToast()

  const form = useForm<ScrapeFormData>({
    resolver: zodResolver(scrapeFormSchema),
    defaultValues: {
      maxResults: 1000,
      seniority: []
    }
  })

  const onSubmit = async (data: ScrapeFormData) => {
    setIsSubmitting(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/scrape/apollo/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchUrl: data.searchUrl,
          maxResults: data.maxResults,
          filters: {
            location: data.location,
            title: data.title,
            seniority: data.seniority,
            company: data.company,
            industry: data.industry
          },
          notes: data.notes
        })
      })

      const result = await response.json()

      if (result.success) {
        setLastResult({
          success: true,
          message: result.data.message,
          runId: result.data.scrapeRunId
        })
        
        toast({
          title: "Scrape Started Successfully",
          description: "Apollo scraping has been initiated. You'll receive results via webhook.",
        })

        // Reset form
        form.reset()
        
        // Notify parent component
        if (onScrapeStarted && result.data.scrapeRunId) {
          onScrapeStarted(result.data.scrapeRunId)
        }
      } else {
        setLastResult({
          success: false,
          message: result.error || 'Failed to start scraping'
        })
        
        toast({
          title: "Scrape Failed",
          description: result.error || 'Failed to start scraping',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Scrape submission error:', error)
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
          <Play className="h-5 w-5" />
          Start Apollo Scrape
        </CardTitle>
        <CardDescription>
          Enter an Apollo.io search URL to scrape candidate profiles. The system will automatically process and deduplicate results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Search URL */}
            <FormField
              control={form.control}
              name="searchUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apollo Search URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://app.apollo.io/#/people?..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Copy the URL from your Apollo.io search results page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max Results */}
            <FormField
              control={form.control}
              name="maxResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Results</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min={1}
                      max={5000}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of candidates to scrape (1-5000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Filter</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Netherlands, Amsterdam" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title Filter</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer, Developer" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Filter</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Google, Microsoft" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Filter</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Finance" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes about this scrape run..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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
                      <Badge variant="outline">Run ID: {lastResult.runId}</Badge>
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
                  Starting Scrape...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Apollo Scrape
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            How to get Apollo Search URL
          </h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to Apollo.io and perform your search</li>
            <li>Apply all desired filters (location, title, company, etc.)</li>
            <li>Copy the URL from your browser's address bar</li>
            <li>Paste it in the field above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
