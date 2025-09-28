import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SnowflakeConfig {
  account: string
  username: string
  password: string
  warehouse: string
  database: string
  schema: string
}

interface EmbedCodeRequest {
  codeContent: string
  filePath: string
  lineStart: number
  lineEnd: number
}

interface SimilaritySearchRequest {
  queryCode: string
  topK?: number
}

interface CommitContextRequest {
  filePath: string
  maxCommits?: number
}

interface RAGContextRequest {
  highlightedCode: string
  filePath: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Snowflake RAG request received')
    const { action, ...params } = await req.json()
    console.log('Action:', action)

    const snowflakeConfig = getSnowflakeConfig()
    if (!snowflakeConfig) {
      throw new Error('Snowflake configuration not available')
    }

    const processor = new SnowflakeRAGProcessor(snowflakeConfig)

    let result
    switch (action) {
      case 'embed_code':
        result = await processor.embedCodeChunk(
          params.codeContent,
          params.filePath,
          params.lineStart,
          params.lineEnd
        )
        break
      case 'similarity_search':
        result = await processor.similaritySearchCodeContext(
          params.queryCode,
          params.topK || 5
        )
        break
      case 'get_commit_context':
        result = await processor.getCommitContext(
          params.filePath,
          params.maxCommits || 10
        )
        break
      case 'search_documentation':
        result = await processor.searchDocumentationContext(params.codeSnippet)
        break
      case 'build_rag_context':
        result = await processor.buildRAGContext(
          params.highlightedCode,
          params.filePath
        )
        break
      case 'initialize':
        result = await processor.initialize()
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Snowflake RAG error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function getSnowflakeConfig(): SnowflakeConfig | null {
  const account = Deno.env.get('SNOWFLAKE_ACCOUNT')
  const username = Deno.env.get('SNOWFLAKE_USERNAME')
  const password = Deno.env.get('SNOWFLAKE_PASSWORD')
  const warehouse = Deno.env.get('SNOWFLAKE_WAREHOUSE')
  const database = Deno.env.get('SNOWFLAKE_DATABASE')
  const schema = Deno.env.get('SNOWFLAKE_SCHEMA')

  if (!account || !username || !password || !warehouse || !database || !schema) {
    console.error('Missing Snowflake configuration')
    return null
  }

  return { account, username, password, warehouse, database, schema }
}

class SnowflakeRAGProcessor {
  private config: SnowflakeConfig

  constructor(config: SnowflakeConfig) {
    this.config = config
  }

  async initialize(): Promise<string> {
    // Initialize RAG tables and search optimization
    const setupQueries = [
      `CREATE TABLE IF NOT EXISTS ${this.config.database}.${this.config.schema}.CODE_EMBEDDINGS (
        id STRING,
        file_path STRING,
        code_content STRING,
        line_start INTEGER,
        line_end INTEGER,
        embedding VECTOR(FLOAT, 1536),
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )`,
      `CREATE TABLE IF NOT EXISTS ${this.config.database}.${this.config.schema}.COMMIT_METADATA (
        commit_hash STRING,
        file_path STRING,
        author STRING,
        message STRING,
        timestamp TIMESTAMP_NTZ,
        changes_summary STRING
      )`,
      `CREATE TABLE IF NOT EXISTS ${this.config.database}.${this.config.schema}.DOCUMENTATION_VECTORS (
        id STRING,
        content STRING,
        doc_type STRING,
        embedding VECTOR(FLOAT, 1536),
        metadata VARIANT
      )`
    ]

    for (const query of setupQueries) {
      await this.executeQuery(query)
    }

    return 'RAG system initialized successfully'
  }

  async embedCodeChunk(
    codeContent: string,
    filePath: string,
    lineStart: number,
    lineEnd: number
  ): Promise<string> {
    const chunkId = `${filePath}_${lineStart}_${lineEnd}_${Date.now()}`
    
    // Generate embedding using Snowflake Cortex
    const embeddingQuery = `
      SELECT SNOWFLAKE.CORTEX.EMBED_TEXT_1536('e5-base-v2', ?) as embedding
    `
    
    const embeddingResult = await this.executeQuery(embeddingQuery, [codeContent])
    const embedding = embeddingResult[0]?.EMBEDDING

    // Store the embedding
    const insertQuery = `
      INSERT INTO ${this.config.database}.${this.config.schema}.CODE_EMBEDDINGS 
      (id, file_path, code_content, line_start, line_end, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    
    await this.executeQuery(insertQuery, [
      chunkId,
      filePath,
      codeContent,
      lineStart,
      lineEnd,
      embedding
    ])

    return chunkId
  }

  async similaritySearchCodeContext(queryCode: string, topK: number = 5): Promise<any[]> {
    const searchQuery = `
      SELECT 
        file_path,
        code_content,
        line_start,
        line_end,
        VECTOR_COSINE_SIMILARITY(
          embedding,
          SNOWFLAKE.CORTEX.EMBED_TEXT_1536('e5-base-v2', ?)
        ) as similarity_score
      FROM ${this.config.database}.${this.config.schema}.CODE_EMBEDDINGS
      ORDER BY similarity_score DESC
      LIMIT ?
    `
    
    return await this.executeQuery(searchQuery, [queryCode, topK])
  }

  async getCommitContext(filePath: string, maxCommits: number = 10): Promise<any[]> {
    const commitQuery = `
      SELECT 
        commit_hash,
        author,
        message,
        timestamp,
        changes_summary
      FROM ${this.config.database}.${this.config.schema}.COMMIT_METADATA
      WHERE file_path = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `
    
    return await this.executeQuery(commitQuery, [filePath, maxCommits])
  }

  async searchDocumentationContext(codeSnippet: string): Promise<any[]> {
    const docQuery = `
      SELECT 
        content,
        doc_type,
        metadata,
        VECTOR_COSINE_SIMILARITY(
          embedding,
          SNOWFLAKE.CORTEX.EMBED_TEXT_1536('e5-base-v2', ?)
        ) as similarity_score
      FROM ${this.config.database}.${this.config.schema}.DOCUMENTATION_VECTORS
      WHERE similarity_score > 0.7
      ORDER BY similarity_score DESC
      LIMIT 5
    `
    
    return await this.executeQuery(docQuery, [codeSnippet])
  }

  async buildRAGContext(highlightedCode: string, filePath: string): Promise<any> {
    const [similarCode, commitHistory, documentation] = await Promise.all([
      this.similaritySearchCodeContext(highlightedCode),
      this.getCommitContext(filePath),
      this.searchDocumentationContext(highlightedCode)
    ])

    return {
      similar_code: similarCode,
      commit_history: commitHistory,
      documentation: documentation,
      query_code: highlightedCode,
      file_path: filePath
    }
  }

  private async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    // Note: In a real implementation, you would use the Snowflake SDK
    // For now, this is a placeholder that would need actual Snowflake connection
    console.log('Executing query:', query, 'with params:', params)
    
    // This would be replaced with actual Snowflake API calls
    // using the connection parameters from this.config
    
    // Placeholder return for development
    return []
  }
}