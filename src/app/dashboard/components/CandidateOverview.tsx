"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Building, ExternalLink, Loader2, Users, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

type Candidate = {
  id: string
  full_name: string
  current_title?: string
  current_company?: string
  city?: string
  state?: string
  country?: string
  photo_url?: string
  source: string
  contact_status: string
  skills: string[]
  created_at: string
}

const getSourceStyle = (source: string) => {
  switch (source) {
    case 'apollo':
      return { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', gradient: 'from-blue-500 to-cyan-500' }
    case 'loxo':
      return { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', gradient: 'from-green-500 to-emerald-500' }
    case 'cv_upload':
      return { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', gradient: 'from-purple-500 to-violet-500' }
    case 'manual':
      return { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', gradient: 'from-orange-500 to-amber-500' }
    default:
      return { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', gradient: 'from-gray-500 to-slate-500' }
  }
}

export function CandidateOverview() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecentCandidates()
  }, [])

  const loadRecentCandidates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/candidates?limit=6&offset=0')
      const result = await response.json()

      if (result.success) {
        setCandidates(result.data.candidates || [])
      } else {
        setError(result.error || 'Failed to load candidates')
      }
    } catch (error) {
      setError('Failed to load candidates')
      console.error('Failed to load candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Recent Candidates</CardTitle>
            <CardDescription>
              Latest candidates added to the system
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="hover:bg-accent">
          <Link href="/candidates">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex space-x-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={loadRecentCandidates}>
              Try Again
            </Button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No candidates yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start building your talent pipeline by uploading CVs, importing from Apollo, or syncing with Loxo
            </p>
            <div className="flex gap-3 justify-center">
              <Button size="sm" asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/candidates/upload">Upload CVs</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/chat">Use AI Search</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((candidate, index) => {
              const sourceStyle = getSourceStyle(candidate.source)
              return (
                <div key={candidate.id} className="group">
                  <div className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700">
                            <AvatarImage src={candidate.photo_url} />
                            <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                              {candidate.full_name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                            </AvatarFallback>
                          </Avatar>
                          {index < 2 && (
                            <div className="absolute -top-1 -right-1 p-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{candidate.full_name}</p>
                          {candidate.current_title && (
                            <p className="text-sm text-muted-foreground truncate">{candidate.current_title}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-xs ${sourceStyle.bg} border-0`}>
                        {candidate.source.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {candidate.current_company && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{candidate.current_company}</span>
                        </div>
                      )}
                      {(candidate.city || candidate.state || candidate.country) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {[candidate.city, candidate.state, candidate.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {candidate.skills?.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs py-0 px-2">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills && candidate.skills.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{candidate.skills.length - 2}</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/candidates/${candidate.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    
                    {/* Decorative gradient */}
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${sourceStyle.gradient} opacity-5 rounded-full -translate-y-10 translate-x-10`} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16" />
    </Card>
  )
}