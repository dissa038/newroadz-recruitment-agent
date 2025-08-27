"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Filter,
  Upload,
  Download,
  UserPlus,
  Building,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  Loader2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CandidateSearchParams } from '@/types/database'

type Candidate = {
  id: string
  full_name: string
  email?: string
  phone?: string
  current_title?: string
  current_company?: string
  city?: string
  state?: string
  country?: string
  photo_url?: string
  source: string
  contact_status?: string
  skills?: string[]
  tags?: string[]
  similarity?: number
}

type SearchResults = {
  candidates: Candidate[]
  total: number
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [semanticQuery, setSemanticQuery] = useState('')
  const [filters, setFilters] = useState<Partial<CandidateSearchParams>>({
    limit: 20,
    offset: 0
  })

  // Load initial candidates
  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async (newFilters?: Partial<CandidateSearchParams>) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      const searchParams = { ...filters, ...newFilters }
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','))
          } else {
            params.set(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/candidates?${params}`)
      const result = await response.json()

      if (result.success) {
        setCandidates(result.data.candidates)
        setTotal(result.data.total)
      }
    } catch (error) {
      console.error('Failed to load candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCandidates({ ...filters, query: undefined, offset: 0 })
      return
    }

    setSearchLoading(true)
    try {
      await loadCandidates({ 
        ...filters, 
        query: searchQuery, 
        offset: 0 
      })
      setPage(0)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) return

    setSemanticLoading(true)
    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: semanticQuery,
          includeActions: true,
          filters: {
            skills: filters.skills,
            location: filters.location,
            seniority_level: filters.seniority_level,
            company: filters.company
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setCandidates(result.data.candidates)
        setTotal(result.data.candidates.length)
        setPage(0)
      }
    } catch (error) {
      console.error('Semantic search failed:', error)
    } finally {
      setSemanticLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value, offset: 0 }
    setFilters(newFilters)
    loadCandidates(newFilters)
    setPage(0)
  }

  const handlePageChange = (newPage: number) => {
    const offset = newPage * (filters.limit || 20)
    const newFilters = { ...filters, offset }
    setFilters(newFilters)
    loadCandidates(newFilters)
    setPage(newPage)
  }

  const totalPages = Math.ceil(total / (filters.limit || 20))

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">
            Manage and search through your candidate database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/candidates/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload CVs
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/candidates/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Traditional Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, company, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* AI Semantic Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="AI Search: 'Senior React developers in Amsterdam with 5+ years experience'"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <Button 
              onClick={handleSemanticSearch} 
              disabled={semanticLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {semanticLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator />

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Source</label>
              <Select 
                value={filters.source || 'all'} 
                onValueChange={(value) => handleFilterChange('source', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="apollo">Apollo</SelectItem>
                  <SelectItem value="loxo">Loxo</SelectItem>
                  <SelectItem value="cv_upload">CV Upload</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Seniority</label>
              <Select 
                value={filters.seniority_level || 'all'} 
                onValueChange={(value) => handleFilterChange('seniority_level', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="associate">Associate</SelectItem>
                  <SelectItem value="mid">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                  <SelectItem value="vp">VP</SelectItem>
                  <SelectItem value="c_level">C-Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contact Status</label>
              <Select 
                value={filters.contact_status || 'all'} 
                onValueChange={(value) => handleFilterChange('contact_status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="not_contacted">Not Contacted</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="nurturing">Nurturing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                placeholder="City, state, or country"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${total} candidates found`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-18 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or upload some CVs to get started
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/candidates/upload">Upload CVs</Link>
                </Button>
                <Button asChild>
                  <Link href="/scraping">Import from Apollo</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div 
                  key={candidate.id} 
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.photo_url} />
                        <AvatarFallback>
                          {candidate.full_name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('') || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{candidate.full_name}</h3>
                          {candidate.similarity && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(candidate.similarity * 100)}% match
                            </Badge>
                          )}
                        </div>
                        {candidate.current_title && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {candidate.current_title}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          {candidate.current_company && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {candidate.current_company}
                            </div>
                          )}
                          {(candidate.city || candidate.state || candidate.country) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[candidate.city, candidate.state, candidate.country]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                          {candidate.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {candidate.email}
                            </div>
                          )}
                          {candidate.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {candidate.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {candidate.source || 'Unknown'}
                          </Badge>
                          <Badge 
                            variant={candidate.contact_status === 'not_contacted' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {candidate.contact_status?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                          {candidate.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills && candidate.skills.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{candidate.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/candidates/${candidate.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}