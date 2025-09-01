import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const loxoId = searchParams.get('loxoId') || '214106602' // Use from logs
  
  const results = {
    loxoId,
    tests: [] as any[]
  }

  try {
    // Test 1: Check if person exists
    const personUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people/${loxoId}`
    const personResponse = await fetch(personUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    results.tests.push({
      test: 'Person Exists',
      url: personUrl,
      status: personResponse.status,
      success: personResponse.ok,
      headers: Object.fromEntries(personResponse.headers.entries())
    })

    if (personResponse.ok) {
      const personData = await personResponse.json()
      results.tests.push({
        test: 'Person Data',
        hasResumes: !!personData.resumes,
        resumeCount: personData.resumes?.length || 0,
        resumeIds: personData.resumes?.map((r: any) => r.id) || []
      })
    }

    // Test 2: Try resumes list endpoint
    const resumesUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people/${loxoId}/resumes`
    const resumesResponse = await fetch(resumesUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    results.tests.push({
      test: 'Resumes List Endpoint',
      url: resumesUrl,
      status: resumesResponse.status,
      success: resumesResponse.ok,
      headers: Object.fromEntries(resumesResponse.headers.entries())
    })

    if (resumesResponse.ok) {
      const resumesData = await resumesResponse.json()
      results.tests.push({
        test: 'Resumes Data',
        data: resumesData
      })
    } else {
      const errorText = await resumesResponse.text()
      results.tests.push({
        test: 'Resumes Error',
        error: errorText
      })
    }

    // Test 3: Try alternative endpoints
    const alternativeEndpoints = [
      `/people/${loxoId}/documents`,
      `/people/${loxoId}/files`,
      `/people/${loxoId}/attachments`
    ]

    for (const endpoint of alternativeEndpoints) {
      const url = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      results.tests.push({
        test: `Alternative Endpoint: ${endpoint}`,
        url,
        status: response.status,
        success: response.ok
      })
    }

    // Test 4: Check API key permissions
    const permissionsUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/me`
    const permissionsResponse = await fetch(permissionsUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    results.tests.push({
      test: 'API Key Permissions',
      url: permissionsUrl,
      status: permissionsResponse.status,
      success: permissionsResponse.ok
    })

    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json()
      results.tests.push({
        test: 'User Permissions Data',
        data: permissionsData
      })
    }

  } catch (error) {
    results.tests.push({
      test: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return Response.json(results, { status: 200 })
}
