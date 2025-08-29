'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'

export default function UploadCVPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const onSubmit = async () => {
    if (!file) {
      toast({ title: 'Geen bestand', description: 'Selecteer eerst een PDF of Word document.', variant: 'destructive' })
      return
    }

    try {
      setIsUploading(true)
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/upload/cv', {
        method: 'POST',
        body: form,
      })
      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Upload mislukt')
      }

      toast({ title: 'CV geüpload', description: 'Het CV is succesvol verwerkt.' })
      setFile(null)
    } catch (err: any) {
      toast({ title: 'Fout bij uploaden', description: err.message || 'Probeer het opnieuw.', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <Link href="/candidates">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Candidates
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Upload CVs
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload een CV</CardTitle>
          <CardDescription>Ondersteund: PDF, DOC, DOCX (max 10MB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            selectedFile={file || undefined}
            onFileSelect={(f) => setFile(f)}
            onFileRemove={() => setFile(null)}
            isUploading={isUploading}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setFile(null)} disabled={isUploading}>
              Wis
            </Button>
            <Button onClick={onSubmit} disabled={isUploading || !file}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uploaden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


