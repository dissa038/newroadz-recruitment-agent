"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Building, 
  MapPin, 
  Mail, 
  Phone,
  ExternalLink,
  FileText,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  Star,
  Edit,
  Download,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from '@/components/ui/skeleton'

type Candidate = {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  linkedin_url?: string
  headline?: string
  current_title?: string
  current_company?: string
  seniority_level?: string
  city?: string
  state?: string
  country?: string
  photo_url?: string
  summary?: string
  skills: string[]
  tags: string[]
  experience_years?: number
  education: any[]
  work_history: any[]
  source: string
  contact_status: string
  cv_file_url?: string
  cv_file_name?: string
  cv_uploaded_at?: string
  created_at: string
  last_updated: string
  raw_data?: any
}

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string
  
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (candidateId) {
      loadCandidate()
    }
  }, [candidateId])

  const loadCandidate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/candidates/${candidateId}`)
      const result = await response.json()

      if (result.success) {
        setCandidate(result.data)
      } else {
        setError(result.error || 'Failed to load candidate')
      }
    } catch (error) {
      setError('Failed to load candidate')
      console.error('Failed to load candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'secondary'
      case 'contacted': return 'default'
      case 'responded': return 'default'
      case 'interested': return 'default'
      case 'not_interested': return 'destructive'
      case 'nurturing': return 'default'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-32" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex space-x-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Candidate not found</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href="/candidates">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Candidates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" asChild className="sm:order-1 order-2 w-full sm:w-auto justify-center">
          <Link href="/candidates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2 order-1 sm:order-2 w-full sm:w-auto justify-start sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {candidate.cv_file_url && (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href={candidate.cv_file_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download CV
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={candidate.photo_url} />
              <AvatarFallback className="text-2xl">
                {candidate.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('') || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{candidate.full_name}</h1>
              {candidate.headline && (
                <p className="text-xl text-muted-foreground mb-3">{candidate.headline}</p>
              )}
              {candidate.current_title && (
                <p className="text-lg mb-2">{candidate.current_title}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                {candidate.current_company && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {candidate.current_company}
                  </div>
                )}
                {(candidate.city || candidate.state || candidate.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[candidate.city, candidate.state, candidate.country]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {candidate.experience_years && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {candidate.experience_years} years experience
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                {candidate.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${candidate.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {candidate.email}
                    </a>
                  </Button>
                )}
                {candidate.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${candidate.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {candidate.phone}
                    </a>
                  </Button>
                )}
                {candidate.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{candidate.source}</Badge>
                <Badge variant={getContactStatusColor(candidate.contact_status)}>
                  {candidate.contact_status.replace('_', ' ')}
                </Badge>
                {candidate.seniority_level && (
                  <Badge variant="outline">{candidate.seniority_level}</Badge>
                )}
                {candidate.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          {candidate.cv_file_url && (
            <TabsTrigger value="cv">CV Document</TabsTrigger>
          )}
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.summary ? (
                  <p className="text-sm leading-relaxed">{candidate.summary}</p>
                ) : (
                  <p className="text-muted-foreground italic">No summary available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium">Added to system</div>
                  <div className="text-muted-foreground">{formatDate(candidate.created_at)}</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Last updated</div>
                  <div className="text-muted-foreground">{formatDate(candidate.last_updated)}</div>
                </div>
                {candidate.cv_uploaded_at && (
                  <div className="text-sm">
                    <div className="font-medium">CV uploaded</div>
                    <div className="text-muted-foreground">{formatDate(candidate.cv_uploaded_at)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.work_history?.length > 0 ? (
                <div className="space-y-6">
                  {candidate.work_history.map((job, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{job.title || 'Unknown Title'}</h3>
                        <Badge variant="outline" className="text-xs">
                          {job.start_date} - {job.end_date || 'Present'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{job.company}</p>
                      {job.description && (
                        <p className="text-sm leading-relaxed">{job.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No work experience data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.education?.length > 0 ? (
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{edu.degree || 'Unknown Degree'}</h3>
                        <Badge variant="outline" className="text-xs">
                          {edu.start_year} - {edu.end_year || 'Present'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-1">{edu.school}</p>
                      {edu.field_of_study && (
                        <p className="text-sm">{edu.field_of_study}</p>
                      )}
                      {edu.description && (
                        <p className="text-sm leading-relaxed mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No education data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Skills & Technologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No skills data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {candidate.cv_file_url && (
          <TabsContent value="cv">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CV Document
                </CardTitle>
                <CardDescription>
                  {candidate.cv_file_name} • Uploaded {candidate.cv_uploaded_at && formatDate(candidate.cv_uploaded_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] border rounded-lg overflow-hidden">
                  <iframe 
                    src={candidate.cv_file_url}
                    className="w-full h-full"
                    title="CV Document"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>
                Original data from {candidate.source}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(candidate.raw_data || candidate, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}