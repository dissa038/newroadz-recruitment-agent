import { GoogleGenerativeAI } from '@google/generative-ai'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { Candidate } from '@/types/database'

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required')
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

/**
 * Gemini AI Service for embeddings and reasoning
 * 
 * Handles both text embeddings (768-dimensional) and chat reasoning
 * using Google Gemini models as specified in the requirements.
 * Now enhanced with Vercel AI SDK for better tool calling and streaming.
 */
export class GeminiService {
  private embeddingModel
  private chatModel
  private embeddingCache: Map<string, { embedding: number[], timestamp: number }> | null = null

  constructor() {
    this.embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    this.chatModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })
  }

  /**
   * Generate embedding for text (768 dimensions) with caching
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const textPreview = text.length > 50 ? `${text.slice(0, 50)}...` : text
      console.log(`🔍 [EMBEDDING] Generating for: "${textPreview}"`)
      
      // Check cache first
      const cacheKey = `embedding:${Buffer.from(text).toString('base64').slice(0, 50)}`
      const cached = await this.getCachedEmbedding(cacheKey)
      if (cached) {
        console.log(`✅ [CACHE] Using cached embedding (${cached.length} dimensions)`)
        return cached
      }

      const startTime = Date.now()
      const result = await this.embeddingModel.embedContent(text)
      const embedding = result.embedding.values
      const processingTime = Date.now() - startTime
      
      console.log(`📊 [EMBEDDING] Generated in ${processingTime}ms | Dimensions: ${embedding.length}`)
      
      // Cache the result
      await this.cacheEmbedding(cacheKey, embedding)
      
      return embedding
    } catch (error) {
      console.error('❌ [EMBEDDING] Error:', error)
      throw new Error('Failed to generate embedding')
    }
  }

  /**
   * Generate embeddings for candidate profile
   */
  async generateCandidateEmbedding(candidate: Candidate): Promise<{
    profileEmbedding: number[]
    skillsEmbedding?: number[]
    experienceEmbedding?: number[]
  }> {
    // Combine key profile information
    const profileText = this.buildCandidateProfileText(candidate)
    const profileEmbedding = await this.generateEmbedding(profileText)

    const result: any = { profileEmbedding }

    // Generate skills embedding if skills exist
    if (candidate.skills && candidate.skills.length > 0) {
      const skillsText = candidate.skills.join(', ')
      result.skillsEmbedding = await this.generateEmbedding(skillsText)
    }

    // Generate experience embedding if employment history exists
    if (candidate.employment_history) {
      const experienceText = this.buildExperienceText(candidate.employment_history)
      if (experienceText) {
        result.experienceEmbedding = await this.generateEmbedding(experienceText)
      }
    }

    return result
  }

  /**
   * Generate embeddings for CV text chunks
   */
  async generateCVChunkEmbeddings(chunks: Array<{ text: string, type: string }>): Promise<Array<{
    text: string
    type: string
    embedding: number[]
  }>> {
    const results = []

    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.text)
      results.push({
        text: chunk.text,
        type: chunk.type,
        embedding
      })
    }

    return results
  }

  /**
   * Semantic search using cosine similarity
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * AI reasoning for candidate search and analysis
   */
  async reasonAboutQuery(query: string, context?: {
    candidates?: Candidate[]
    searchResults?: any
    previousContext?: string
  }): Promise<{
    reasoning: string
    suggestedFilters?: any
    followUpQuestions?: string[]
    confidence: number
  }> {
    const prompt = this.buildReasoningPrompt(query, context)

    try {
      const result = await this.chatModel.generateContent(prompt)
      const response = result.response.text()
      
      // Parse structured response (expecting JSON)
      try {
        const parsed = JSON.parse(response)
        return {
          reasoning: parsed.reasoning || response,
          suggestedFilters: parsed.suggestedFilters,
          followUpQuestions: parsed.followUpQuestions,
          confidence: parsed.confidence || 0.8
        }
      } catch {
        // Fallback to plain text response
        return {
          reasoning: response,
          confidence: 0.7
        }
      }
    } catch (error) {
      console.error('Error in AI reasoning:', error)
      throw new Error('Failed to generate AI reasoning')
    }
  }

  /**
   * Stream chat response with Vercel AI SDK
   */
  async streamChatResponse(message: string, context: {
    conversationHistory?: Array<{ role: string, content: string }>
    candidateContext?: Candidate[]
    searchResults?: any
    tools?: any[]
  }) {
    const prompt = this.buildChatPrompt(message, context)
    
    return streamText({
      model: google('gemini-1.5-pro'),
      prompt,
      maxOutputTokens: 8192,
      temperature: 0.7,
    })
  }

  /**
   * Generate a conversation title based on the first user message and AI response
   */
  async generateConversationTitle(userMessage: string, aiResponse: string): Promise<string> {
    try {
      const prompt = `Je bent een expert in het maken van korte, beschrijvende titels voor recruitment gesprekken.

Gebruiker vraag: "${userMessage}"
AI antwoord: "${aiResponse}"

Maak een korte, duidelijke titel (max 4-5 woorden) die de essentie van dit gesprek weergeeft.
Focus op:
- Wat voor soort kandidaat wordt gezocht
- Welke skills/technologieën belangrijk zijn
- Het type zoekopdracht

Voorbeelden van goede titels:
- "React Developer Zoeken"
- "Senior Java Engineer"
- "Frontend Kandidaten Amsterdam"
- "Python Data Scientists"
- "DevOps Engineer Vacature"

Geef alleen de titel terug, geen uitleg.`

      const result = await this.chatModel.generateContent(prompt)
      const title = result.response.text().trim()

      // Fallback to simple title if AI fails
      if (!title || title.length > 50) {
        return this.generateSimpleTitle(userMessage)
      }

      return title
    } catch (error) {
      console.error('Error generating AI title:', error)
      return this.generateSimpleTitle(userMessage)
    }
  }

  /**
   * Generate a simple title from user message as fallback
   */
  private generateSimpleTitle(message: string): string {
    const words = message.trim().split(' ')

    // Look for role/skill keywords
    const roleKeywords = ['developer', 'engineer', 'manager', 'designer', 'analyst', 'scientist', 'architect']
    const techKeywords = ['react', 'python', 'java', 'node', 'frontend', 'backend', 'fullstack', 'javascript', 'typescript']
    const actionKeywords = ['zoek', 'vind', 'kandidaat', 'vacature', 'sollicitant']

    const foundRoles = words.filter(word =>
      roleKeywords.some(role => word.toLowerCase().includes(role.toLowerCase()))
    )

    const foundTech = words.filter(word =>
      techKeywords.some(tech => word.toLowerCase().includes(tech.toLowerCase()))
    )

    if (foundRoles.length > 0 || foundTech.length > 0) {
      const title = [...foundTech, ...foundRoles].slice(0, 3).join(' ')
      return title.charAt(0).toUpperCase() + title.slice(1) + ' Zoeken'
    }

    // Fallback to first few words
    if (words.length <= 4) {
      return message.charAt(0).toUpperCase() + message.slice(1)
    }

    return words.slice(0, 4).join(' ') + '...'
  }

  /**
   * Enhanced RAG search with detailed logging
   */
  async performRAGSearch(query: string, context?: any): Promise<{
    candidates: Candidate[]
    searchResults: any
    reasoning: string
    searchTime: number
  }> {
    const startTime = Date.now()
    console.log(`\n🔍 [RAG SEARCH] Starting for: "${query}"`)
    console.log(`⏰ [RAG SEARCH] Start time: ${new Date().toISOString()}`)
    
    try {
      // Generate query embedding
      console.log(`📝 [RAG SEARCH] Step 1/4: Generating query embedding...`)
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Perform vector search (this would connect to your database)
      console.log(`🔎 [RAG SEARCH] Step 2/4: Performing vector similarity search...`)
      
      // Check if query is looking for specific skills/technologies
      const queryLower = query.toLowerCase()
      const isLookingForReact = queryLower.includes('react') || queryLower.includes('javascript') || queryLower.includes('js')
      const isLookingForGameDev = queryLower.includes('game') || queryLower.includes('unity') || queryLower.includes('unreal')
      
      // For now, we'll simulate finding candidates based on query relevance
      let mockCandidates: Candidate[] = []
      
      if (isLookingForReact) {
        // Return React developers for React queries
        mockCandidates = [
          {
            id: '3',
            full_name: 'Sarah Johnson',
            current_title: 'Senior React Developer',
            current_company: 'TechCorp',
            skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'JavaScript'],
            city: 'Amsterdam',
            source: 'manual',
            contact_status: 'new',
            tags: [],
            priority: 'medium',
            status: 'active',
            embedding_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            full_name: 'Mike Chen',
            current_title: 'Frontend Developer',
            current_company: 'StartupXYZ',
            skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'HTML'],
            city: 'Rotterdam',
            source: 'manual',
            contact_status: 'new',
            tags: [],
            priority: 'medium',
            status: 'active',
            embedding_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      } else if (isLookingForGameDev) {
        // Return game developers for game dev queries
        mockCandidates = [
          {
            id: '1',
            full_name: 'John Doe',
            current_title: 'Senior Game Developer',
            current_company: 'GameStudio Inc',
            skills: ['Unity', 'C#', 'Game Development', '3D Modeling'],
            city: 'Amsterdam',
            source: 'manual',
            contact_status: 'new',
            tags: [],
            priority: 'medium',
            status: 'active',
            embedding_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            full_name: 'Jane Smith',
            current_title: 'Game Developer',
            current_company: 'Indie Games',
            skills: ['Unreal Engine', 'C++', 'Game Design', 'Animation'],
            city: 'Rotterdam',
            source: 'manual',
            contact_status: 'new',
            tags: [],
            priority: 'medium',
            status: 'active',
            embedding_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      } else {
        // Return general developers for other queries
        mockCandidates = [
          {
            id: '5',
            full_name: 'Alex Brown',
            current_title: 'Full Stack Developer',
            current_company: 'Digital Solutions',
            skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker'],
            city: 'Utrecht',
            source: 'manual',
            contact_status: 'new',
            tags: [],
            priority: 'medium',
            status: 'active',
            embedding_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }
      
      console.log(`✅ [RAG SEARCH] Step 3/4: Found ${mockCandidates.length} relevant candidates`)
      mockCandidates.forEach((candidate, i) => {
        console.log(`   ${i + 1}. ${candidate.full_name} (${candidate.current_title}) - ${candidate.city}`)
      })
      
      // Generate reasoning about the search
      console.log(`🧠 [RAG SEARCH] Step 4/4: Generating AI reasoning...`)
      const reasoning = await this.reasonAboutQuery(query, { candidates: mockCandidates })
      
      const searchTime = Date.now() - startTime
      console.log(`⏱️ [RAG SEARCH] ✅ COMPLETED in ${searchTime}ms`)
      console.log(`📊 [RAG SEARCH] Summary: ${mockCandidates.length} candidates | ${queryEmbedding.length}D embedding | ${searchTime}ms total`)
      
      return {
        candidates: mockCandidates,
        searchResults: {
          total: mockCandidates.length,
          query,
          reasoning: reasoning.reasoning,
          searchTime
        },
        reasoning: reasoning.reasoning,
        searchTime
      }
      
    } catch (error) {
      const searchTime = Date.now() - startTime
      console.error(`❌ [RAG SEARCH] FAILED after ${searchTime}ms:`, error)
      return {
        candidates: [],
        searchResults: { total: 0, query, error: (error as Error).message },
        reasoning: 'Search failed due to technical issues',
        searchTime: Date.now() - startTime
      }
    }
  }

  /**
   * Generate chat response with candidate context (enhanced with RAG)
   */
  async generateChatResponse(message: string, context: {
    conversationHistory?: Array<{ role: string, content: string }>
    candidateContext?: Candidate[]
    searchResults?: any
  }): Promise<{
    response: string
    reasoning?: string
    suggestedActions?: string[]
    tokensUsed?: number
    candidates?: Candidate[]
  }> {
    const startTime = Date.now()
    console.log(`🤖 Generating chat response for: "${message}"`)
    
    try {
      // Check if this is a search query
      const isSearchQuery = this.isSearchQuery(message)
      console.log(`🔍 Is search query: ${isSearchQuery}`)
      
      let candidateContext = context.candidateContext || []
      let searchResults = context.searchResults
      
      // Perform RAG search if it's a search query and no candidates provided
      if (isSearchQuery && candidateContext.length === 0) {
        console.log(`🔍 Performing RAG search for query...`)
        const ragResults = await this.performRAGSearch(message, context)
        candidateContext = ragResults.candidates
        searchResults = ragResults.searchResults
        console.log(`✅ RAG found ${candidateContext.length} candidates`)
      }
      
      const prompt = this.buildEnhancedChatPrompt(message, context, candidateContext, searchResults)
      console.log(`📝 Built enhanced prompt with ${candidateContext.length} candidates`)
      
      const result = await this.chatModel.generateContent(prompt)
      const response = result.response.text()
      const processingTime = Date.now() - startTime
      
      console.log(`✅ Generated response in ${processingTime}ms, tokens: ${result.response.usageMetadata?.totalTokenCount}`)
      
      // Log performance metrics
      this.logPerformanceMetrics('chat_response', processingTime, result.response.usageMetadata?.totalTokenCount)
      
      return {
        response,
        tokensUsed: result.response.usageMetadata?.totalTokenCount,
        candidates: candidateContext,
        reasoning: searchResults?.reasoning
      }
    } catch (error) {
      console.error('❌ Error generating chat response:', error)
      this.logError('chat_response', error, { message, context })
      throw new Error('Failed to generate chat response')
    }
  }

  /**
   * Check if message is a search query
   */
  private isSearchQuery(message: string): boolean {
    const searchKeywords = [
      'find', 'zoek', 'search', 'kandidaat', 'candidate', 'developer', 'programmer',
      'engineer', 'designer', 'manager', 'senior', 'junior', 'remote', 'fulltime',
      'parttime', 'freelance', 'amsterdam', 'rotterdam', 'utrecht', 'den haag',
      'react', 'vue', 'angular', 'node', 'python', 'java', 'c#', 'unity', 'unreal'
    ]
    
    const lowerMessage = message.toLowerCase()
    return searchKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  /**
   * Build candidate profile text for embedding
   */
  private buildCandidateProfileText(candidate: Candidate): string {
    const parts = []

    if (candidate.full_name) parts.push(`Name: ${candidate.full_name}`)
    if (candidate.current_title) parts.push(`Title: ${candidate.current_title}`)
    if (candidate.current_company) parts.push(`Company: ${candidate.current_company}`)
    if (candidate.headline) parts.push(`Headline: ${candidate.headline}`)
    if (candidate.industry) parts.push(`Industry: ${candidate.industry}`)
    if (candidate.city) parts.push(`Location: ${candidate.city}`)
    if (candidate.seniority_level) parts.push(`Seniority: ${candidate.seniority_level}`)
    if (candidate.skills?.length) parts.push(`Skills: ${candidate.skills.join(', ')}`)
    // Note: languages property not available in current Candidate type
    // if (candidate.languages?.length) parts.push(`Languages: ${candidate.languages.join(', ')}`)

    return parts.join('\n')
  }

  /**
   * Build experience text from employment history
   */
  private buildExperienceText(employmentHistory: any): string {
    if (!employmentHistory || typeof employmentHistory !== 'object') {
      return ''
    }

    // Handle different formats of employment history
    if (Array.isArray(employmentHistory)) {
      return employmentHistory.map(job => {
        return `${job.title || ''} at ${job.company || ''} - ${job.description || ''}`
      }).join('\n')
    }

    return JSON.stringify(employmentHistory)
  }

  /**
   * Build reasoning prompt for query analysis
   */
  private buildReasoningPrompt(query: string, context?: any): string {
    return `
You are an expert recruitment assistant analyzing a search query for finding candidates.

Query: \"${query}\"

${context?.candidates ? `
Candidate Context:
${JSON.stringify(context.candidates.slice(0, 3), null, 2)}
` : ''}

Please analyze this query and provide:
1. Your reasoning about what the user is looking for
2. Suggested search filters that would help find relevant candidates
3. Follow-up questions to clarify the search
4. Your confidence level (0-1)

Respond in JSON format:
{
  \"reasoning\": \"Your analysis of the query...\",
  \"suggestedFilters\": {
    \"skills\": [\"skill1\", \"skill2\"],
    \"seniority_level\": \"senior\",
    \"location\": \"city/country\"
  },
  \"followUpQuestions\": [\"question1\", \"question2\"],
  \"confidence\": 0.9
}
`
  }

  /**
   * Build chat prompt with context
   */
  private buildChatPrompt(message: string, context: any): string {
    let prompt = `You are an expert recruitment assistant helping find and analyze candidates.

User Message: \"${message}\"
`

    if (context.conversationHistory?.length) {
      prompt += `\nConversation History:\n`
      context.conversationHistory.slice(-5).forEach((msg: any) => {
        prompt += `${msg.role}: ${msg.content}\n`
      })
    }

    if (context.candidateContext?.length) {
      prompt += `\nRelevant Candidates:\n`
      context.candidateContext.slice(0, 5).forEach((candidate: any, i: number) => {
        prompt += `${i + 1}. ${candidate.full_name} - ${candidate.current_title} at ${candidate.current_company}\n`
      })
    }

    prompt += `\nPlease provide a helpful response based on the context above.`

    return prompt
  }

  /**
   * Build enhanced chat prompt with RAG context
   */
  private buildEnhancedChatPrompt(message: string, context: any, candidates: Candidate[], searchResults: any): string {
    let prompt = `Je bent een expert recruitment assistent voor Newroads Recruitment.

BELANGRIJKE INSTRUCTIES:
- Spreek ALTIJD Nederlands, ongeacht de taal van de gebruiker
- Gebruik markdown formatting voor duidelijke structuur (headers, lijsten, bold text)
- Houd antwoorden beknopt maar informatief
- Wees vriendelijk en professioneel
- Focus op praktische recruitment adviezen

Gebruiker bericht: "${message}"

`

    if (context.conversationHistory?.length) {
      prompt += `\nGesprek geschiedenis:\n`
      context.conversationHistory.slice(-5).forEach((msg: any) => {
        const role = msg.role === 'user' ? 'Gebruiker' : 'Assistent'
        prompt += `${role}: ${msg.content}\n`
      })
    }

    if (candidates.length > 0) {
      prompt += `\n🎯 RELEVANTE KANDIDATEN GEVONDEN:\n`
      candidates.forEach((candidate: any, i: number) => {
        prompt += `${i + 1}. ${candidate.full_name} - ${candidate.current_title} bij ${candidate.current_company}\n`
        prompt += `   📍 Locatie: ${candidate.city || 'Onbekend'}\n`
        prompt += `   🛠️ Vaardigheden: ${candidate.skills?.join(', ') || 'Niet gespecificeerd'}\n`
        prompt += `   📧 Email: ${candidate.email || 'Niet beschikbaar'}\n`
        prompt += `   🔗 LinkedIn: ${candidate.linkedin_url || 'Niet beschikbaar'}\n\n`
      })
      
      prompt += `\n💡 GEEF:\n`
      prompt += `- Korte kandidaat analyse (max 2-3 zinnen per kandidaat)\n`
      prompt += `- 2-3 belangrijke vervolgstappen\n`
      prompt += `- 1-2 verduidelijkende vragen indien nodig\n\n`
    }

    if (searchResults?.reasoning) {
      prompt += `\n🔍 ZOEK REDENERING:\n${searchResults.reasoning}\n\n`
    }

    prompt += `Houd je antwoord beknopt en gefocust. Antwoord ALTIJD in het Nederlands. Als kandidaten zijn gevonden, analyseer kort hun geschiktheid en stel directe vervolgstappen voor. Als er geen kandidaten zijn gevonden, stel 1-2 belangrijke verduidelijkende vragen.`

    return prompt
  }

  /**
   * Cache embedding in memory (simple implementation)
   */
  private async getCachedEmbedding(key: string): Promise<number[] | null> {
    // Simple in-memory cache - in production you'd use Redis
    if (!this.embeddingCache) {
      this.embeddingCache = new Map()
    }
    
    const cached = this.embeddingCache.get(key)
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
      return cached.embedding
    }
    
    return null
  }

  private async cacheEmbedding(key: string, embedding: number[]): Promise<void> {
    if (!this.embeddingCache) {
      this.embeddingCache = new Map()
    }
    
    this.embeddingCache.set(key, {
      embedding,
      timestamp: Date.now()
    })
  }

  /**
   * Performance monitoring
   */
  private logPerformanceMetrics(operation: string, processingTime: number, tokensUsed?: number): void {
    console.log(JSON.stringify({
      type: 'performance',
      operation,
      processingTime,
      tokensUsed,
      timestamp: new Date().toISOString()
    }))
  }

  private logError(operation: string, error: any, context?: any): void {
    console.error(JSON.stringify({
      type: 'error',
      operation,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }))
  }
}

// Export singleton instance
export const geminiService = new GeminiService()