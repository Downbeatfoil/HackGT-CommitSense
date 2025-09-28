import { supabase } from '@/integrations/supabase/client';

export interface RAGContext {
  similar_code: SimilarCodeResult[];
  commit_history: CommitHistoryResult[];
  documentation: DocumentationResult[];
  query_code: string;
  file_path: string;
}

export interface SimilarCodeResult {
  file_path: string;
  code_content: string;
  line_start: number;
  line_end: number;
  similarity_score: number;
}

export interface CommitHistoryResult {
  commit_hash: string;
  author: string;
  message: string;
  timestamp: string;
  changes_summary: string;
}

export interface DocumentationResult {
  content: string;
  doc_type: string;
  metadata: any;
  similarity_score: number;
}

export class SnowflakeRAGService {
  private baseUrl = `https://yiahfvqgeljmqljsaqqg.supabase.co/functions/v1/snowflake-rag`;

  async initializeRAGSystem(): Promise<void> {
    const response = await supabase.functions.invoke('snowflake-rag', {
      body: { action: 'initialize' }
    });

    if (response.error) {
      throw new Error(`Failed to initialize RAG system: ${response.error}`);
    }
  }

  async embedCodeChunk(
    codeContent: string,
    filePath: string,
    lineStart: number,
    lineEnd: number
  ): Promise<string> {
    const response = await supabase.functions.invoke('snowflake-rag', {
      body: {
        action: 'embed_code',
        codeContent,
        filePath,
        lineStart,
        lineEnd
      }
    });

    if (response.error) {
      throw new Error(`Failed to embed code chunk: ${response.error}`);
    }

    return response.data.result;
  }

  async similaritySearchCodeContext(
    queryCode: string,
    topK: number = 5
  ): Promise<SimilarCodeResult[]> {
    const response = await supabase.functions.invoke('snowflake-rag', {
      body: {
        action: 'similarity_search',
        queryCode,
        topK
      }
    });

    if (response.error) {
      throw new Error(`Failed to search similar code: ${response.error}`);
    }

    return response.data.result;
  }

  async getCommitContext(
    filePath: string,
    maxCommits: number = 10
  ): Promise<CommitHistoryResult[]> {
    const response = await supabase.functions.invoke('snowflake-rag', {
      body: {
        action: 'get_commit_context',
        filePath,
        maxCommits
      }
    });

    if (response.error) {
      throw new Error(`Failed to get commit context: ${response.error}`);
    }

    return response.data.result;
  }

  async searchDocumentationContext(codeSnippet: string): Promise<DocumentationResult[]> {
    const response = await supabase.functions.invoke('snowflake-rag', {
      body: {
        action: 'search_documentation',
        codeSnippet
      }
    });

    if (response.error) {
      throw new Error(`Failed to search documentation: ${response.error}`);
    }

    return response.data.result;
  }

  async buildRAGContext(
    highlightedCode: string,
    filePath: string
  ): Promise<RAGContext> {
    const response = await supabase.functions.invoke('snowflake-rag', {
      body: {
        action: 'build_rag_context',
        highlightedCode,
        filePath
      }
    });

    if (response.error) {
      throw new Error(`Failed to build RAG context: ${response.error}`);
    }

    return response.data.result;
  }

  generateGeminiContextPrompt(ragContext: RAGContext): string {
    let prompt = `Context for code explanation:\n\n`;

    if (ragContext.similar_code && ragContext.similar_code.length > 0) {
      prompt += "SIMILAR CODE PATTERNS:\n";
      ragContext.similar_code.forEach((code, index) => {
        prompt += `${index + 1}. File: ${code.file_path} (Lines ${code.line_start}-${code.line_end})\n`;
        prompt += `   Similarity: ${(code.similarity_score * 100).toFixed(1)}%\n`;
        prompt += `   Code: ${code.code_content.substring(0, 200)}...\n\n`;
      });
    }

    if (ragContext.commit_history && ragContext.commit_history.length > 0) {
      prompt += "RECENT COMMIT HISTORY:\n";
      ragContext.commit_history.slice(0, 5).forEach((commit, index) => {
        prompt += `${index + 1}. ${commit.commit_hash.substring(0, 8)} by ${commit.author}\n`;
        prompt += `   Date: ${commit.timestamp}\n`;
        prompt += `   Message: ${commit.message}\n`;
        if (commit.changes_summary) {
          prompt += `   Changes: ${commit.changes_summary}\n`;
        }
        prompt += `\n`;
      });
    }

    if (ragContext.documentation && ragContext.documentation.length > 0) {
      prompt += "RELEVANT DOCUMENTATION:\n";
      ragContext.documentation.forEach((doc, index) => {
        prompt += `${index + 1}. ${doc.doc_type}\n`;
        prompt += `   Relevance: ${(doc.similarity_score * 100).toFixed(1)}%\n`;
        prompt += `   Content: ${doc.content.substring(0, 300)}...\n\n`;
      });
    }

    prompt += `\nCODE TO EXPLAIN:\nFile: ${ragContext.file_path}\n${ragContext.query_code}\n\n`;
    prompt += `Please provide a comprehensive explanation using the above context. Focus on:
1. WHAT this code does
2. HOW it works technically
3. WHY it might have been implemented this way (based on commit history)
4. Any patterns or similarities with the related code shown above

Format your response as:
WHAT: [explanation of what the code does]

HOW: [technical explanation of how it works]`;

    return prompt;
  }
}