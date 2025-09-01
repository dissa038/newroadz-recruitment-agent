# COMPLETE N8N RECRUITMENT SYSTEM BUILD GUIDE

## 🎯 CORE PRINCIPLE: ONE WORKFLOW = ONE COMPLETE PROCESS

```
INPUT → N8N WORKFLOW → VECTORIZED OUTPUT IN DATABASE
```

**NO COMPLEX BATCHING, NO SEPARATE JOBS, NO MULTIPLE PROCESSES**

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │  N8N WORKFLOWS  │    │  Supabase DB    │
│   (Triggers)    │◄──►│  (ALL LOGIC)    │◄──►│  (Vectors)      │
│                 │    │                 │    │                 │
│ - Trigger Sync  │    │ - Loxo→Vector   │    │ - candidates    │
│ - Trigger Scrape│    │ - Apollo→Vector │    │ - embeddings    │
│ - Upload Files  │    │ - File→Vector   │    │ - chat_history  │
│ - Chat with RAG │    │ - RAG Agent     │    │ - search_logs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 LOXO API COMPLETE INTEGRATION GUIDE

### LOXO API ENDPOINTS (WORKING IMPLEMENTATION)

```javascript
// Base Configuration
const LOXO_BASE_URL = 'https://api.loxo.co/v1'
const LOXO_HEADERS = {
  'Authorization': `Bearer ${LOXO_API_KEY}`,
  'Content-Type': 'application/json'
}

// 1. GET CONTACTS (Paginated)
GET /v1/contacts
Query Parameters:
- limit: 100 (max per request)
- offset: 0 (pagination)
- updated_after: ISO date (incremental sync)

Response Structure:
{
  "data": [
    {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@company.com",
      "phone": "+31612345678",
      "title": "Senior Developer",
      "company": {
        "id": 987654,
        "name": "Tech Corp"
      },
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "headline": "Full Stack Developer",
      "city": "Amsterdam",
      "state": "North Holland",
      "country": "Netherlands",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    }
  ],
  "meta": {
    "total": 15000,
    "limit": 100,
    "offset": 0
  }
}

// 2. GET PERSON DETAILS (Enhanced Data)
GET /v1/people/{person_id}

Response Structure:
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@company.com",
  "phone": "+31612345678",
  "title": "Senior Developer",
  "company": {
    "id": 987654,
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "industry": "Software Development"
  },
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "headline": "Full Stack Developer with 8+ years experience",
  "description": "Experienced developer specializing in React, Node.js, and cloud architecture. Led multiple teams and delivered 20+ projects.",
  "city": "Amsterdam",
  "state": "North Holland",
  "country": "Netherlands",
  "employment_history": [
    {
      "company": "Tech Corp",
      "title": "Senior Developer",
      "start_date": "2022-01-01",
      "end_date": null,
      "description": "Leading frontend development team, architecting scalable solutions"
    },
    {
      "company": "StartupXYZ",
      "title": "Full Stack Developer",
      "start_date": "2019-06-01",
      "end_date": "2021-12-31",
      "description": "Built entire platform from scratch using React and Node.js"
    }
  ],
  "education_history": [
    {
      "school": "University of Amsterdam",
      "degree": "Master of Science",
      "field": "Computer Science",
      "start_date": "2015-09-01",
      "end_date": "2017-07-01"
    }
  ],
  "skills": [
    "JavaScript", "React", "Node.js", "Python", "AWS", "Docker", "Kubernetes"
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

### LOXO RATE LIMITS & BEST PRACTICES

```javascript
// Rate Limits (from working implementation)
- 1000 requests per hour
- 10 requests per second burst
- 429 error = back off exponentially

// Pagination Strategy
- Start with offset=0, limit=100
- Continue until data.length < limit
- Track total from meta.total

// Error Handling
- 401: Invalid API key
- 403: Insufficient permissions
- 404: Person not found
- 429: Rate limit exceeded
- 500: Server error

// Retry Logic
- Exponential backoff: 1s, 2s, 4s, 8s
- Max 3 retries per request
- Skip 404s (person deleted)
- Retry 429s and 5xx errors
```

## 🔥 N8N WORKFLOWS: ONE-SHOT COMPLETE PROCESSES

### 1. LOXO COMPLETE VECTORIZATION WORKFLOW

**Webhook:** `POST /webhook/loxo-complete`
**Input:** `{ maxCandidates: 5000, incrementalSync: true }`
**Output:** `COMPLETE VECTORIZED CANDIDATES IN DATABASE`

**PROCESS:** `Loxo API → Enhanced Data → Vector Embedding → Database → DONE`

```json
{
  "name": "LOXO COMPLETE VECTORIZATION",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "loxo-complete",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Initialize Pagination",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return [{\n  offset: 0,\n  limit: 100,\n  maxCandidates: $json.maxCandidates || 5000,\n  processed: 0,\n  total: 0,\n  incrementalSync: $json.incrementalSync || false,\n  lastSyncDate: $json.incrementalSync ? new Date(Date.now() - 24*60*60*1000).toISOString() : null\n}];"
      }
    },
    {
      "name": "Get Loxo Contacts Page",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.loxo.co/v1/contacts",
        "method": "GET",
        "authentication": "headerAuth",
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.LOXO_API_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "qs": {
          "limit": "={{$json.limit}}",
          "offset": "={{$json.offset}}",
          "updated_after": "={{$json.lastSyncDate}}"
        },
        "options": {
          "timeout": 30000,
          "retry": {
            "enabled": true,
            "maxTries": 3
          }
        }
      }
    },
    {
      "name": "Process Each Contact",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 5,
        "options": {
          "destinationKey": "contact"
        }
      }
    },
    {
      "name": "Rate Limit Delay",
      "type": "n8n-nodes-base.wait",
      "parameters": {
        "time": 200,
        "unit": "ms"
      }
    },
    {
      "name": "Get Enhanced Person Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.loxo.co/v1/people/{{$json.contact.id}}",
        "method": "GET",
        "authentication": "headerAuth",
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.LOXO_API_KEY}}"
            }
          ]
        },
        "options": {
          "timeout": 30000,
          "retry": {
            "enabled": true,
            "maxTries": 3
          },
          "ignoreHttpStatusErrors": true
        }
      }
    },
    {
      "name": "Handle API Errors",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.$response.statusCode}}",
              "operation": "equal",
              "value2": 200
            }
          ]
        }
      }
    },
    {
      "name": "Transform to Candidate Schema",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const person = $json;\nconst skills = Array.isArray(person.skills) ? person.skills : [];\nconst employment = Array.isArray(person.employment_history) ? person.employment_history : [];\nconst education = Array.isArray(person.education_history) ? person.education_history : [];\n\n// Create comprehensive profile content for embedding\nconst profileContent = [\n  `${person.first_name} ${person.last_name}`,\n  person.headline || '',\n  person.description || '',\n  person.title || '',\n  person.company?.name || '',\n  `Location: ${[person.city, person.state, person.country].filter(Boolean).join(', ')}`,\n  `Skills: ${skills.join(', ')}`,\n  employment.map(job => \n    `${job.title} at ${job.company} (${job.start_date} - ${job.end_date || 'Present'}): ${job.description || ''}`\n  ).join('\\n'),\n  education.map(edu => \n    `${edu.degree} in ${edu.field} from ${edu.school} (${edu.start_date} - ${edu.end_date})`\n  ).join('\\n')\n].filter(Boolean).join('\\n\\n');\n\nreturn [{\n  // Database fields\n  source: 'loxo',\n  loxo_id: person.id.toString(),\n  first_name: person.first_name,\n  last_name: person.last_name,\n  email: person.email,\n  phone: person.phone,\n  linkedin_url: person.linkedin_url,\n  current_title: person.title,\n  current_company: person.company?.name,\n  headline: person.headline,\n  city: person.city,\n  state: person.state,\n  country: person.country,\n  bio_description: person.description,\n  detailed_job_history: JSON.stringify(employment),\n  education_history: JSON.stringify(education),\n  skills: skills,\n  loxo_raw_data: person,\n  embedding_status: 'pending',\n  \n  // For embedding generation\n  profile_content: profileContent\n}];"
      }
    },
    {
      "name": "Upsert Candidate",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "upsert",
        "table": "candidates",
        "onConflict": "loxo_id",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "source",
              "fieldValue": "={{$json.source}}"
            },
            {
              "fieldId": "loxo_id",
              "fieldValue": "={{$json.loxo_id}}"
            },
            {
              "fieldId": "first_name",
              "fieldValue": "={{$json.first_name}}"
            },
            {
              "fieldId": "last_name",
              "fieldValue": "={{$json.last_name}}"
            },
            {
              "fieldId": "email",
              "fieldValue": "={{$json.email}}"
            },
            {
              "fieldId": "phone",
              "fieldValue": "={{$json.phone}}"
            },
            {
              "fieldId": "linkedin_url",
              "fieldValue": "={{$json.linkedin_url}}"
            },
            {
              "fieldId": "current_title",
              "fieldValue": "={{$json.current_title}}"
            },
            {
              "fieldId": "current_company",
              "fieldValue": "={{$json.current_company}}"
            },
            {
              "fieldId": "headline",
              "fieldValue": "={{$json.headline}}"
            },
            {
              "fieldId": "city",
              "fieldValue": "={{$json.city}}"
            },
            {
              "fieldId": "state",
              "fieldValue": "={{$json.state}}"
            },
            {
              "fieldId": "country",
              "fieldValue": "={{$json.country}}"
            },
            {
              "fieldId": "bio_description",
              "fieldValue": "={{$json.bio_description}}"
            },
            {
              "fieldId": "detailed_job_history",
              "fieldValue": "={{$json.detailed_job_history}}"
            },
            {
              "fieldId": "education_history",
              "fieldValue": "={{$json.education_history}}"
            },
            {
              "fieldId": "skills",
              "fieldValue": "={{$json.skills}}"
            },
            {
              "fieldId": "loxo_raw_data",
              "fieldValue": "={{$json.loxo_raw_data}}"
            },
            {
              "fieldId": "embedding_status",
              "fieldValue": "pending"
            }
          ]
        }
      }
    },
    {
      "name": "Generate Vector Embedding",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "embedding",
        "model": "text-embedding-3-small",
        "input": "={{$json.profile_content}}",
        "options": {
          "timeout": 30000
        }
      }
    },
    {
      "name": "Store Vector Embedding",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "upsert",
        "table": "candidate_embeddings",
        "onConflict": "candidate_id,embedding_type",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "candidate_id",
              "fieldValue": "={{$json.id}}"
            },
            {
              "fieldId": "embedding_type",
              "fieldValue": "profile"
            },
            {
              "fieldId": "embedding",
              "fieldValue": "={{$json.data[0].embedding}}"
            },
            {
              "fieldId": "content_hash",
              "fieldValue": "={{$crypto.createHash('md5').update($json.profile_content).digest('hex')}}"
            }
          ]
        }
      }
    },
    {
      "name": "Mark Embedding Complete",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "candidates",
        "filterType": "manual",
        "conditions": {
          "conditions": [
            {
              "keyName": "id",
              "condition": "equals",
              "keyValue": "={{$json.candidate_id}}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "embedding_status",
              "fieldValue": "completed"
            }
          ]
        }
      }
    },
    {
      "name": "Check Continue Pagination",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.hasMore && $json.processed < $json.maxCandidates}}",
              "operation": "equal",
              "value2": true
            }
          ]
        }
      }
    },
    {
      "name": "Next Page",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return [{\n  offset: $json.offset + $json.limit,\n  limit: $json.limit,\n  maxCandidates: $json.maxCandidates,\n  processed: $json.processed + $json.currentBatch,\n  total: $json.total\n}];"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [["Initialize Pagination"]]
    },
    "Initialize Pagination": {
      "main": [["Get Loxo Contacts Page"]]
    },
    "Get Loxo Contacts Page": {
      "main": [["Process Each Contact"]]
    },
    "Process Each Contact": {
      "main": [["Rate Limit Delay"]]
    },
    "Rate Limit Delay": {
      "main": [["Get Enhanced Person Data"]]
    },
    "Get Enhanced Person Data": {
      "main": [["Handle API Errors"]]
    },
    "Handle API Errors": {
      "main": [
        ["Transform to Candidate Schema"],
        []
      ]
    },
    "Transform to Candidate Schema": {
      "main": [["Upsert Candidate"]]
    },
    "Upsert Candidate": {
      "main": [["Generate Vector Embedding"]]
    },
    "Generate Vector Embedding": {
      "main": [["Store Vector Embedding"]]
    },
    "Store Vector Embedding": {
      "main": [["Mark Embedding Complete"]]
    },
    "Mark Embedding Complete": {
      "main": [["Check Continue Pagination"]]
    },
    "Check Continue Pagination": {
      "main": [
        ["Next Page"],
        []
      ]
    },
    "Next Page": {
      "main": [["Get Loxo Contacts Page"]]
    }
  }
}
```

### 2. APOLLO COMPLETE VECTORIZATION WORKFLOW

**Webhook:** `POST /webhook/apollo-complete`
**Input:** `{ searchUrl: string, maxResults: 1000, scrollPages: 10 }`
**Output:** `COMPLETE VECTORIZED APOLLO CANDIDATES IN DATABASE`

**PROCESS:** `Apollo Scrape → Parse Data → Vector Embedding → Database → DONE`

```json
{
  "name": "APOLLO COMPLETE VECTORIZATION",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "apollo-complete",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Initialize Scraping",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return [{\n  searchUrl: $json.searchUrl,\n  maxResults: $json.maxResults || 1000,\n  scrollPages: $json.scrollPages || 10,\n  currentPage: 1,\n  processed: 0,\n  candidates: []\n}];"
      }
    },
    {
      "name": "Scrape Apollo Page",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$json.searchUrl}}&page={{$json.currentPage}}",
        "method": "GET",
        "authentication": "headerAuth",
        "headerParametersUi": {
          "parameter": [
            {
              "name": "User-Agent",
              "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
              "name": "Accept",
              "value": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
          ]
        },
        "options": {
          "timeout": 30000,
          "followRedirect": true
        }
      }
    },
    {
      "name": "Extract Candidate Data",
      "type": "n8n-nodes-base.html",
      "parameters": {
        "operation": "extractHtmlContent",
        "extractionValues": {
          "values": [
            {
              "key": "candidates",
              "cssSelector": "[data-cy='person-item'], .person-item, .contact-card",
              "returnArray": true,
              "attributeKey": "outerHTML"
            }
          ]
        }
      }
    },
    {
      "name": "Parse Each Candidate",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const candidates = [];\nconst htmlItems = $json.candidates || [];\n\nfor (const htmlItem of htmlItems) {\n  try {\n    // Extract data using regex patterns (Apollo-specific)\n    const nameMatch = htmlItem.match(/data-name=\"([^\"]+)\"/i) || htmlItem.match(/>([^<]+)</i);\n    const emailMatch = htmlItem.match(/mailto:([^\"\\s]+)/i);\n    const titleMatch = htmlItem.match(/data-title=\"([^\"]+)\"/i) || htmlItem.match(/title[^>]*>([^<]+)</i);\n    const companyMatch = htmlItem.match(/data-company=\"([^\"]+)\"/i) || htmlItem.match(/company[^>]*>([^<]+)</i);\n    const linkedinMatch = htmlItem.match(/linkedin\\.com\\/in\\/([^\\/\"\\s]+)/i);\n    const locationMatch = htmlItem.match(/data-location=\"([^\"]+)\"/i);\n    \n    const fullName = nameMatch ? nameMatch[1].trim() : '';\n    const nameParts = fullName.split(' ');\n    const firstName = nameParts[0] || '';\n    const lastName = nameParts.slice(1).join(' ') || '';\n    \n    const email = emailMatch ? emailMatch[1] : '';\n    const title = titleMatch ? titleMatch[1].trim() : '';\n    const company = companyMatch ? companyMatch[1].trim() : '';\n    const linkedinUrl = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '';\n    const location = locationMatch ? locationMatch[1] : '';\n    \n    // Create profile content for embedding\n    const profileContent = [\n      fullName,\n      title,\n      company,\n      `Location: ${location}`,\n      `Email: ${email}`,\n      `LinkedIn: ${linkedinUrl}`\n    ].filter(Boolean).join('\\n');\n    \n    if (firstName && (email || linkedinUrl)) {\n      candidates.push({\n        source: 'apollo',\n        first_name: firstName,\n        last_name: lastName,\n        email: email,\n        current_title: title,\n        current_company: company,\n        linkedin_url: linkedinUrl,\n        city: location.split(',')[0]?.trim() || '',\n        state: location.split(',')[1]?.trim() || '',\n        country: location.split(',')[2]?.trim() || 'Netherlands',\n        headline: `${title} at ${company}`,\n        apollo_raw_data: { html: htmlItem, extracted: { fullName, email, title, company, linkedinUrl, location } },\n        embedding_status: 'pending',\n        profile_content: profileContent\n      });\n    }\n  } catch (error) {\n    console.log('Error parsing candidate:', error);\n  }\n}\n\nreturn candidates;"
      }
    },
    {
      "name": "Process Each Candidate",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 10
      }
    },
    {
      "name": "Upsert Apollo Candidate",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "upsert",
        "table": "candidates",
        "onConflict": "email,source",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "source",
              "fieldValue": "apollo"
            },
            {
              "fieldId": "first_name",
              "fieldValue": "={{$json.first_name}}"
            },
            {
              "fieldId": "last_name",
              "fieldValue": "={{$json.last_name}}"
            },
            {
              "fieldId": "email",
              "fieldValue": "={{$json.email}}"
            },
            {
              "fieldId": "current_title",
              "fieldValue": "={{$json.current_title}}"
            },
            {
              "fieldId": "current_company",
              "fieldValue": "={{$json.current_company}}"
            },
            {
              "fieldId": "linkedin_url",
              "fieldValue": "={{$json.linkedin_url}}"
            },
            {
              "fieldId": "city",
              "fieldValue": "={{$json.city}}"
            },
            {
              "fieldId": "state",
              "fieldValue": "={{$json.state}}"
            },
            {
              "fieldId": "country",
              "fieldValue": "={{$json.country}}"
            },
            {
              "fieldId": "headline",
              "fieldValue": "={{$json.headline}}"
            },
            {
              "fieldId": "apollo_raw_data",
              "fieldValue": "={{$json.apollo_raw_data}}"
            },
            {
              "fieldId": "embedding_status",
              "fieldValue": "pending"
            }
          ]
        }
      }
    },
    {
      "name": "Generate Apollo Embedding",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "embedding",
        "model": "text-embedding-3-small",
        "input": "={{$json.profile_content}}"
      }
    },
    {
      "name": "Store Apollo Embedding",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "upsert",
        "table": "candidate_embeddings",
        "onConflict": "candidate_id,embedding_type",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "candidate_id",
              "fieldValue": "={{$json.id}}"
            },
            {
              "fieldId": "embedding_type",
              "fieldValue": "profile"
            },
            {
              "fieldId": "embedding",
              "fieldValue": "={{$json.data[0].embedding}}"
            }
          ]
        }
      }
    },
    {
      "name": "Mark Apollo Complete",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "candidates",
        "filterType": "manual",
        "conditions": {
          "conditions": [
            {
              "keyName": "id",
              "condition": "equals",
              "keyValue": "={{$json.candidate_id}}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "embedding_status",
              "fieldValue": "completed"
            }
          ]
        }
      }
    },
    {
      "name": "Check Next Page",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.currentPage < $json.scrollPages && $json.processed < $json.maxResults}}",
              "operation": "equal",
              "value2": true
            }
          ]
        }
      }
    },
    {
      "name": "Next Page",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return [{\n  searchUrl: $json.searchUrl,\n  maxResults: $json.maxResults,\n  scrollPages: $json.scrollPages,\n  currentPage: $json.currentPage + 1,\n  processed: $json.processed + $json.currentBatch\n}];"
      }
    },
    {
      "name": "Scraping Delay",
      "type": "n8n-nodes-base.wait",
      "parameters": {
        "time": 2000,
        "unit": "ms"
      }
    }
  ]
}
```

### 3. FILE UPLOAD COMPLETE VECTORIZATION WORKFLOW

**Webhook:** `POST /webhook/file-complete`
**Input:** `{ fileUrl: string, fileName: string, fileType: 'pdf'|'docx'|'txt' }`
**Output:** `COMPLETE VECTORIZED FILE CANDIDATE IN DATABASE`

**PROCESS:** `File Download → Text Extract → AI Parse → Vector Embedding → Database → DONE`

### 4. RAG AGENT COMPLETE WORKFLOW

**Webhook:** `POST /webhook/rag-agent`
**Input:** `{ query: string, conversationId?: string, filters?: object }`
**Output:** `INTELLIGENT SEARCH RESULTS + AI INSIGHTS + CONVERSATION HISTORY`

**PROCESS:** `Query → Vector Search → Context Retrieval → AI Analysis → Response + History → DONE`

```json
{
  "name": "RAG AGENT COMPLETE",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "rag-agent",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Initialize Conversation",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const conversationId = $json.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\nconst query = $json.query;\nconst filters = $json.filters || {};\nconst maxResults = $json.maxResults || 20;\n\nreturn [{\n  conversationId,\n  query,\n  filters,\n  maxResults,\n  timestamp: new Date().toISOString()\n}];"
      }
    },
    {
      "name": "Generate Query Embedding",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "embedding",
        "model": "text-embedding-3-small",
        "input": "={{$json.query}}",
        "options": {
          "timeout": 30000
        }
      }
    },
    {
      "name": "Vector Similarity Search",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "rpc",
        "function": "match_candidates",
        "parameters": {
          "query_embedding": "={{$json.data[0].embedding}}",
          "match_threshold": 0.75,
          "match_count": "={{$json.maxResults}}"
        }
      }
    },
    {
      "name": "Apply Advanced Filters",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const filters = $input.first().json.filters || {};\nlet candidates = $input.all()[1].json || [];\n\n// Apply source filter\nif (filters.source && filters.source !== 'all') {\n  candidates = candidates.filter(c => c.source === filters.source);\n}\n\n// Apply location filter\nif (filters.location) {\n  const location = filters.location.toLowerCase();\n  candidates = candidates.filter(c => \n    (c.city && c.city.toLowerCase().includes(location)) ||\n    (c.state && c.state.toLowerCase().includes(location)) ||\n    (c.country && c.country.toLowerCase().includes(location))\n  );\n}\n\n// Apply title/role filter\nif (filters.title) {\n  const title = filters.title.toLowerCase();\n  candidates = candidates.filter(c => \n    (c.current_title && c.current_title.toLowerCase().includes(title)) ||\n    (c.headline && c.headline.toLowerCase().includes(title))\n  );\n}\n\n// Apply company filter\nif (filters.company) {\n  const company = filters.company.toLowerCase();\n  candidates = candidates.filter(c => \n    c.current_company && c.current_company.toLowerCase().includes(company)\n  );\n}\n\n// Apply skills filter\nif (filters.skills && Array.isArray(filters.skills)) {\n  candidates = candidates.filter(c => {\n    if (!c.skills || !Array.isArray(c.skills)) return false;\n    return filters.skills.some(skill => \n      c.skills.some(candidateSkill => \n        candidateSkill.toLowerCase().includes(skill.toLowerCase())\n      )\n    );\n  });\n}\n\n// Apply experience level filter\nif (filters.experienceLevel) {\n  // This would require parsing job history for years of experience\n  // Implementation depends on how experience is stored\n}\n\nreturn candidates;"
      }
    },
    {
      "name": "Get Conversation History",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "select",
        "table": "chat_history",
        "filterType": "manual",
        "conditions": {
          "conditions": [
            {
              "keyName": "conversation_id",
              "condition": "equals",
              "keyValue": "={{$json.conversationId}}"
            }
          ]
        },
        "sort": {
          "field": "created_at",
          "direction": "asc"
        },
        "limit": 10
      }
    },
    {
      "name": "Build Context for AI",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const query = $input.first().json.query;\nconst candidates = $input.all()[1].json || [];\nconst history = $input.last().json || [];\n\n// Build conversation context\nconst conversationContext = history.map(h => \n  `Human: ${h.user_message}\\nAssistant: ${h.assistant_message}`\n).join('\\n\\n');\n\n// Build candidate context (top 10 for AI analysis)\nconst topCandidates = candidates.slice(0, 10);\nconst candidateContext = topCandidates.map(c => \n  `${c.full_name} - ${c.current_title} at ${c.current_company} (${c.city}, ${c.country}) - Similarity: ${(c.similarity * 100).toFixed(1)}%`\n).join('\\n');\n\n// Build comprehensive context\nconst context = {\n  query,\n  totalCandidates: candidates.length,\n  topCandidates: candidateContext,\n  conversationHistory: conversationContext,\n  searchStats: {\n    totalFound: candidates.length,\n    avgSimilarity: candidates.length > 0 ? (candidates.reduce((sum, c) => sum + c.similarity, 0) / candidates.length * 100).toFixed(1) : 0,\n    sources: [...new Set(candidates.map(c => c.source))],\n    locations: [...new Set(candidates.map(c => `${c.city}, ${c.country}`).filter(Boolean))].slice(0, 5),\n    companies: [...new Set(candidates.map(c => c.current_company).filter(Boolean))].slice(0, 10)\n  }\n};\n\nreturn [context];"
      }
    },
    {
      "name": "Generate AI Response",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "chat",
        "model": "gpt-4",
        "messages": [
          {
            "role": "system",
            "content": "You are an expert recruitment AI assistant. Analyze candidate search results and provide intelligent insights. Focus on:\\n\\n1. CANDIDATE ANALYSIS: Highlight the best matches and why\\n2. MARKET INSIGHTS: Patterns in skills, experience, locations\\n3. RECRUITMENT STRATEGY: Actionable recommendations\\n4. FOLLOW-UP QUESTIONS: Suggest refinements to the search\\n\\nBe concise but comprehensive. Use bullet points for clarity. Always reference specific candidates when relevant."
          },
          {
            "role": "user",
            "content": "SEARCH QUERY: {{$json.query}}\\n\\nSEARCH RESULTS:\\n- Total candidates found: {{$json.totalCandidates}}\\n- Average similarity: {{$json.searchStats.avgSimilarity}}%\\n- Sources: {{$json.searchStats.sources.join(', ')}}\\n- Top locations: {{$json.searchStats.locations.join(', ')}}\\n- Top companies: {{$json.searchStats.companies.join(', ')}}\\n\\nTOP CANDIDATES:\\n{{$json.topCandidates}}\\n\\nCONVERSATION HISTORY:\\n{{$json.conversationHistory}}"
          }
        ],
        "options": {
          "temperature": 0.7,
          "maxTokens": 1000
        }
      }
    },
    {
      "name": "Save to Chat History",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "chat_history",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "conversation_id",
              "fieldValue": "={{$json.conversationId}}"
            },
            {
              "fieldId": "user_message",
              "fieldValue": "={{$json.query}}"
            },
            {
              "fieldId": "assistant_message",
              "fieldValue": "={{$json.choices[0].message.content}}"
            },
            {
              "fieldId": "search_results_count",
              "fieldValue": "={{$json.totalCandidates}}"
            },
            {
              "fieldId": "search_metadata",
              "fieldValue": "={{JSON.stringify($json.searchStats)}}"
            }
          ]
        }
      }
    },
    {
      "name": "Format Final Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const query = $input.first().json.query;\nconst candidates = $input.all()[1].json || [];\nconst aiResponse = $input.all()[2].json.choices[0].message.content;\nconst conversationId = $input.first().json.conversationId;\n\nreturn [{\n  success: true,\n  conversationId,\n  query,\n  response: {\n    message: aiResponse,\n    candidates: candidates.slice(0, 20), // Return top 20 candidates\n    totalFound: candidates.length,\n    searchStats: {\n      avgSimilarity: candidates.length > 0 ? (candidates.reduce((sum, c) => sum + c.similarity, 0) / candidates.length * 100).toFixed(1) : 0,\n      sources: [...new Set(candidates.map(c => c.source))],\n      locations: [...new Set(candidates.map(c => `${c.city}, ${c.country}`).filter(Boolean))],\n      companies: [...new Set(candidates.map(c => c.current_company).filter(Boolean))]\n    }\n  },\n  timestamp: new Date().toISOString()\n}];"
      }
    }
  ]
}
```

### 5. FILE UPLOAD COMPLETE VECTORIZATION

```json
{
  "name": "FILE UPLOAD COMPLETE VECTORIZATION",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "file-complete",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Download File",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$json.fileUrl}}",
        "method": "GET",
        "responseFormat": "file"
      }
    },
    {
      "name": "Extract Text Content",
      "type": "n8n-nodes-base.extractFromFile",
      "parameters": {
        "operation": "extractText"
      }
    },
    {
      "name": "AI Parse Candidate Data",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "chat",
        "model": "gpt-4",
        "messages": [
          {
            "role": "system",
            "content": "Extract structured candidate data from CV/resume text. Return ONLY valid JSON with these exact fields:\\n{\\n  \\\"first_name\\\": \\\"string\\\",\\n  \\\"last_name\\\": \\\"string\\\",\\n  \\\"email\\\": \\\"string\\\",\\n  \\\"phone\\\": \\\"string\\\",\\n  \\\"current_title\\\": \\\"string\\\",\\n  \\\"current_company\\\": \\\"string\\\",\\n  \\\"linkedin_url\\\": \\\"string\\\",\\n  \\\"city\\\": \\\"string\\\",\\n  \\\"country\\\": \\\"string\\\",\\n  \\\"headline\\\": \\\"string\\\",\\n  \\\"bio_description\\\": \\\"string\\\",\\n  \\\"skills\\\": [\\\"array\\\", \\\"of\\\", \\\"strings\\\"],\\n  \\\"experience\\\": [{\\\"company\\\": \\\"string\\\", \\\"title\\\": \\\"string\\\", \\\"start_date\\\": \\\"YYYY-MM\\\", \\\"end_date\\\": \\\"YYYY-MM\\\", \\\"description\\\": \\\"string\\\"}],\\n  \\\"education\\\": [{\\\"school\\\": \\\"string\\\", \\\"degree\\\": \\\"string\\\", \\\"field\\\": \\\"string\\\", \\\"start_date\\\": \\\"YYYY-MM\\\", \\\"end_date\\\": \\\"YYYY-MM\\\"}]\\n}"
          },
          {
            "role": "user",
            "content": "Extract candidate data from this CV text:\\n\\n{{$json.text}}"
          }
        ]
      }
    },
    {
      "name": "Parse JSON Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "try {\n  const parsed = JSON.parse($json.choices[0].message.content);\n  \n  // Create profile content for embedding\n  const profileContent = [\n    `${parsed.first_name} ${parsed.last_name}`,\n    parsed.headline || '',\n    parsed.bio_description || '',\n    parsed.current_title || '',\n    parsed.current_company || '',\n    `Location: ${parsed.city}, ${parsed.country}`,\n    `Skills: ${(parsed.skills || []).join(', ')}`,\n    (parsed.experience || []).map(exp => \n      `${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date}): ${exp.description}`\n    ).join('\\n'),\n    (parsed.education || []).map(edu => \n      `${edu.degree} in ${edu.field} from ${edu.school} (${edu.start_date} - ${edu.end_date})`\n    ).join('\\n')\n  ].filter(Boolean).join('\\n\\n');\n  \n  return [{\n    source: 'cv_upload',\n    first_name: parsed.first_name,\n    last_name: parsed.last_name,\n    email: parsed.email,\n    phone: parsed.phone,\n    current_title: parsed.current_title,\n    current_company: parsed.current_company,\n    linkedin_url: parsed.linkedin_url,\n    city: parsed.city,\n    country: parsed.country || 'Netherlands',\n    headline: parsed.headline,\n    bio_description: parsed.bio_description,\n    skills: parsed.skills || [],\n    detailed_job_history: JSON.stringify(parsed.experience || []),\n    education_history: JSON.stringify(parsed.education || []),\n    cv_parsed_text: $input.first().json.text,\n    embedding_status: 'pending',\n    profile_content: profileContent,\n    file_name: $input.first().json.fileName\n  }];\n} catch (error) {\n  throw new Error('Failed to parse AI response as JSON: ' + error.message);\n}"
      }
    },
    {
      "name": "Insert CV Candidate",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "candidates"
      }
    },
    {
      "name": "Generate CV Embedding",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "embedding",
        "model": "text-embedding-3-small",
        "input": "={{$json.profile_content}}"
      }
    },
    {
      "name": "Store CV Embedding",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "candidate_embeddings",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "candidate_id",
              "fieldValue": "={{$json.id}}"
            },
            {
              "fieldId": "embedding_type",
              "fieldValue": "profile"
            },
            {
              "fieldId": "embedding",
              "fieldValue": "={{$json.data[0].embedding}}"
            }
          ]
        }
      }
    },
    {
      "name": "Mark CV Complete",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "candidates",
        "filterType": "manual",
        "conditions": {
          "conditions": [
            {
              "keyName": "id",
              "condition": "equals",
              "keyValue": "={{$json.candidate_id}}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "embedding_status",
              "fieldValue": "completed"
            }
          ]
        }
      }
    }
  ]
}
```

## 🎨 NEXT.JS ULTRA-SIMPLE APPLICATION

**PRINCIPLE: NEXT.JS = PURE UI + WEBHOOK TRIGGERS + DIRECT DB READS**

### 🏠 Dashboard Page (`pages/dashboard.tsx`)

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    loxoCandidates: 0,
    apolloCandidates: 0,
    cvCandidates: 0,
    embeddedCandidates: 0,
    recentActivity: []
  })

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    // Direct Supabase queries - NO API ROUTES
    const { data: candidates } = await supabase
      .from('candidates')
      .select('source, embedding_status, created_at')

    const { data: recentActivity } = await supabase
      .from('candidates')
      .select('full_name, source, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    setStats({
      totalCandidates: candidates?.length || 0,
      loxoCandidates: candidates?.filter(c => c.source === 'loxo').length || 0,
      apolloCandidates: candidates?.filter(c => c.source === 'apollo').length || 0,
      cvCandidates: candidates?.filter(c => c.source === 'cv_upload').length || 0,
      embeddedCandidates: candidates?.filter(c => c.embedding_status === 'completed').length || 0,
      recentActivity: recentActivity || []
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Recruitment Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total Candidates" value={stats.totalCandidates} />
        <StatsCard title="Loxo Synced" value={stats.loxoCandidates} />
        <StatsCard title="Apollo Scraped" value={stats.apolloCandidates} />
        <StatsCard title="CV Uploaded" value={stats.cvCandidates} />
        <StatsCard title="AI Embedded" value={stats.embeddedCandidates} />
      </div>

      <RecentActivity activities={stats.recentActivity} />
    </div>
  )
}
```

### 🔄 Sync Triggers Page (`pages/sync.tsx`)

```typescript
import { useState } from 'react'

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

export default function SyncPage() {
  const [loxoStatus, setLoxoStatus] = useState('idle')
  const [apolloStatus, setApolloStatus] = useState('idle')
  const [fileStatus, setFileStatus] = useState('idle')

  const triggerLoxoComplete = async () => {
    setLoxoStatus('running')
    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}/loxo-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxCandidates: 5000,
          incrementalSync: true
        })
      })
      const result = await response.json()
      setLoxoStatus('completed')
      console.log('Loxo sync result:', result)
    } catch (error) {
      setLoxoStatus('failed')
      console.error('Loxo sync failed:', error)
    }
  }

  const triggerApolloComplete = async () => {
    setApolloStatus('running')
    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}/apollo-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchUrl: 'https://app.apollo.io/your-search-url',
          maxResults: 1000,
          scrollPages: 10
        })
      })
      const result = await response.json()
      setApolloStatus('completed')
      console.log('Apollo scrape result:', result)
    } catch (error) {
      setApolloStatus('failed')
      console.error('Apollo scrape failed:', error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Data Synchronization</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SyncCard
          title="🚀 Loxo Complete Sync"
          description="Sync all Loxo candidates with full vectorization"
          status={loxoStatus}
          onTrigger={triggerLoxoComplete}
          estimatedTime="~30 minutes for 5000 candidates"
        />

        <SyncCard
          title="🕷️ Apollo Complete Scrape"
          description="Scrape Apollo candidates with full vectorization"
          status={apolloStatus}
          onTrigger={triggerApolloComplete}
          estimatedTime="~20 minutes for 1000 candidates"
        />

        <SyncCard
          title="📁 File Upload Zone"
          description="Upload CVs for instant AI parsing & vectorization"
          status={fileStatus}
          onTrigger={() => document.getElementById('file-input')?.click()}
          estimatedTime="~30 seconds per file"
        />
      </div>

      <input
        id="file-input"
        type="file"
        accept=".pdf,.docx,.txt"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  )
}
```

### 🔍 RAG Search Page (`pages/search.tsx`)

```typescript
import { useState } from 'react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string, filters = {}) => {
    setLoading(true)
    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}/rag-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          conversationId,
          filters,
          maxResults: 20
        })
      })
      const data = await response.json()
      setResults(data.response)
      setConversationId(data.conversationId)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">AI Candidate Search</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SearchInterface
            onSearch={handleSearch}
            loading={loading}
            placeholder="Find senior React developers in Amsterdam with 5+ years experience..."
          />

          {results && (
            <div className="mt-6">
              <AIInsights message={results.message} />
              <CandidateResults
                candidates={results.candidates}
                totalFound={results.totalFound}
                searchStats={results.searchStats}
              />
            </div>
          )}
        </div>

        <div>
          <SearchFilters onFiltersChange={handleSearch} />
          <SearchHistory conversationId={conversationId} />
        </div>
      </div>
    </div>
  )
}
```

### 📁 File Upload Handler (`pages/upload.tsx`)

```typescript
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadPage() {
  const [uploadStatus, setUploadStatus] = useState({})

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }))

      try {
        // 1. Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cv-uploads')
          .upload(`${fileId}_${file.name}`, file)

        if (uploadError) throw uploadError

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('cv-uploads')
          .getPublicUrl(uploadData.path)

        // 3. Trigger N8N file processing workflow
        const response = await fetch(`${N8N_WEBHOOK_URL}/file-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: publicUrl,
            fileName: file.name,
            fileType: file.type.includes('pdf') ? 'pdf' : 'docx'
          })
        })

        const result = await response.json()
        setUploadStatus(prev => ({ ...prev, [fileId]: 'completed' }))
        console.log('File processed:', result)

      } catch (error) {
        setUploadStatus(prev => ({ ...prev, [fileId]: 'failed' }))
        console.error('File upload failed:', error)
      }
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">CV Upload & AI Parsing</h1>

      <FileDropZone
        onFilesSelected={handleFileUpload}
        acceptedTypes={['.pdf', '.docx', '.txt']}
        maxFiles={10}
      />

      <UploadProgress statuses={uploadStatus} />
    </div>
  )
}
```

### 🔐 API Routes (MINIMAL - ONLY AUTH)

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'

export default NextAuth({
  providers: [
    // Add your auth providers (Google, GitHub, etc.)
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    session: async ({ session, token }) => {
      session.userId = token.sub
      return session
    }
  }
})

// pages/api/upload-url.ts (ONLY for file upload URLs)
export default async function handler(req: NextRequest) {
  const { fileName } = req.body

  // Generate signed upload URL for Supabase Storage
  const { data, error } = await supabase.storage
    .from('cv-uploads')
    .createSignedUploadUrl(`${Date.now()}_${fileName}`)

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ uploadUrl: data.signedUrl, path: data.path })
}

// NO OTHER API ROUTES - EVERYTHING ELSE IS N8N + DIRECT SUPABASE
```
```

## 🗄️ SUPABASE DATABASE SCHEMA

### Core Tables

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- candidates table (MAIN DATA STORE)
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('loxo', 'apollo', 'cv_upload', 'manual')),

  -- Basic info
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    COALESCE(first_name || ' ' || last_name, first_name, last_name)
  ) STORED,
  email TEXT,
  phone TEXT,

  -- Professional info
  current_title TEXT,
  current_company TEXT,
  headline TEXT,
  linkedin_url TEXT,

  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Netherlands',

  -- Enhanced data (from AI processing)
  bio_description TEXT,
  detailed_job_history JSONB,
  education_history JSONB,
  skills TEXT[],
  cv_parsed_text TEXT,

  -- Source-specific raw data
  loxo_id TEXT,
  loxo_raw_data JSONB,
  apollo_id TEXT,
  apollo_raw_data JSONB,

  -- Processing status
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'completed', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints for data integrity
  UNIQUE(email, source) WHERE email IS NOT NULL,
  UNIQUE(loxo_id) WHERE loxo_id IS NOT NULL,
  UNIQUE(apollo_id) WHERE apollo_id IS NOT NULL
);

-- candidate_embeddings table (VECTOR STORAGE)
CREATE TABLE candidate_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  embedding_type TEXT NOT NULL CHECK (embedding_type IN ('profile', 'experience', 'skills')),
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions
  content_hash TEXT, -- For detecting content changes
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(candidate_id, embedding_type)
);

-- chat_history table (RAG CONVERSATIONS)
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  search_results_count INTEGER DEFAULT 0,
  search_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workflow_logs table (N8N EXECUTION TRACKING)
CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  input_params JSONB,
  output_result JSONB,
  error_message TEXT,
  candidates_processed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Database Functions & Indexes

```sql
-- Vector similarity search function (CORE RAG FUNCTIONALITY)
CREATE OR REPLACE FUNCTION match_candidates(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  current_title TEXT,
  current_company TEXT,
  city TEXT,
  country TEXT,
  source TEXT,
  linkedin_url TEXT,
  headline TEXT,
  bio_description TEXT,
  skills TEXT[],
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    c.id,
    c.full_name,
    c.current_title,
    c.current_company,
    c.city,
    c.country,
    c.source,
    c.linkedin_url,
    c.headline,
    c.bio_description,
    c.skills,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM candidates c
  JOIN candidate_embeddings ce ON c.id = ce.candidate_id
  WHERE ce.embedding_type = 'profile'
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
    AND c.embedding_status = 'completed'
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Performance indexes
CREATE INDEX idx_candidates_source ON candidates(source);
CREATE INDEX idx_candidates_embedding_status ON candidates(embedding_status);
CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX idx_candidates_loxo_id ON candidates(loxo_id) WHERE loxo_id IS NOT NULL;
CREATE INDEX idx_candidates_email_source ON candidates(email, source) WHERE email IS NOT NULL;

-- Vector similarity index (CRITICAL FOR PERFORMANCE)
CREATE INDEX idx_candidate_embeddings_vector ON candidate_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chat history indexes
CREATE INDEX idx_chat_history_conversation ON chat_history(conversation_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);

-- Workflow logs indexes
CREATE INDEX idx_workflow_logs_name_status ON workflow_logs(workflow_name, status);
CREATE INDEX idx_workflow_logs_started_at ON workflow_logs(started_at DESC);
```

## 🔧 DEPLOYMENT & ENVIRONMENT SETUP

### N8N Environment Variables (Railway)

```env
# N8N Core Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_ultra_secure_password_here

# Database Connection (Supabase)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.your-project-ref.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_supabase_db_password

# External API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
LOXO_API_KEY=your-loxo-api-key-here
APOLLO_API_KEY=your-apollo-api-key-here

# Supabase Integration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# N8N Webhook Configuration
WEBHOOK_URL=https://your-n8n-app.railway.app
N8N_PORT=8080
N8N_PROTOCOL=https
N8N_HOST=your-n8n-app.railway.app

# Performance Settings
N8N_PAYLOAD_SIZE_MAX=16777216
N8N_METRICS=true
```

### Next.js Environment Variables (Vercel)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# N8N Webhook Integration
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-app.railway.app/webhook

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,docx,txt
```

### Railway Deployment (N8N)

```dockerfile
# Dockerfile for N8N
FROM n8nio/n8n:latest

# Install additional dependencies if needed
USER root
RUN apk add --no-cache python3 py3-pip

# Switch back to n8n user
USER node

# Copy workflow files
COPY workflows/ /home/node/.n8n/workflows/

# Set environment variables
ENV N8N_PORT=8080
ENV WEBHOOK_URL=https://your-n8n-app.railway.app
ENV N8N_PAYLOAD_SIZE_MAX=16777216

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/healthz || exit 1
```

### Vercel Deployment (Next.js)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_N8N_WEBHOOK_URL": "https://your-n8n-app.railway.app/webhook"
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

## 🚀 IMPLEMENTATION ROADMAP

### PHASE 1: N8N SETUP (Day 1-2)
1. **Deploy N8N to Railway**
   - Create Railway project
   - Configure environment variables
   - Deploy with Dockerfile

2. **Import Workflows**
   - Copy workflow JSON files
   - Test webhook endpoints
   - Verify Supabase connections

3. **Test Individual Workflows**
   - Loxo sync with 10 candidates
   - Apollo scrape with 1 page
   - File upload with 1 CV
   - RAG search with test query

### PHASE 2: DATABASE SETUP (Day 2)
1. **Create Supabase Schema**
   - Run all SQL commands
   - Enable vector extension
   - Create indexes
   - Test vector search function

2. **Verify Connections**
   - N8N → Supabase connection
   - Vector similarity search
   - Data integrity constraints

### PHASE 3: NEXT.JS REBUILD (Day 3-4)
1. **Create New Next.js App**
   - Initialize with TypeScript
   - Install dependencies (Supabase, NextAuth)
   - Configure environment variables

2. **Build Core Pages**
   - Dashboard with stats
   - Sync triggers page
   - RAG search interface
   - File upload zone

3. **Remove All Complex Logic**
   - No API routes except auth
   - Direct Supabase queries only
   - Webhook triggers only

### PHASE 4: TESTING & OPTIMIZATION (Day 5)
1. **End-to-End Testing**
   - Complete Loxo sync (1000 candidates)
   - Complete Apollo scrape (500 candidates)
   - Multiple file uploads
   - RAG conversations

2. **Performance Optimization**
   - Vector search performance
   - N8N workflow optimization
   - Frontend loading states

3. **Production Deployment**
   - Deploy to Vercel
   - Configure custom domain
   - Set up monitoring

## 🎯 SUCCESS METRICS

### TECHNICAL METRICS
- **Loxo Sync**: 5000 candidates in <30 minutes
- **Apollo Scrape**: 1000 candidates in <20 minutes
- **File Processing**: <30 seconds per CV
- **Vector Search**: <500ms response time
- **RAG Queries**: <3 seconds end-to-end

### BUSINESS METRICS
- **Data Coverage**: 15,000+ vectorized candidates
- **Search Accuracy**: >90% relevant results
- **User Experience**: <3 clicks to find candidates
- **System Reliability**: 99.9% uptime
- **Cost Efficiency**: <$100/month total infrastructure

## 🔥 FINAL ARCHITECTURE SUMMARY

```
USER CLICKS BUTTON → NEXT.JS TRIGGERS N8N WEBHOOK → N8N PROCESSES EVERYTHING → VECTORIZED DATA IN SUPABASE → RAG SEARCH READY

NO COMPLEX API ROUTES
NO SEPARATE JOB QUEUES
NO MULTIPLE PROCESSES
NO BATCH MANAGEMENT
NO ENHANCEMENT PIPELINES

JUST: TRIGGER → PROCESS → VECTORIZE → DONE
```

**THIS IS THE ULTIMATE SIMPLE, EFFICIENT, BULLETPROOF RECRUITMENT SYSTEM! 🚀**
```
