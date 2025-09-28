import { SnowflakeRAGService, RAGContext } from './snowflakeRAGService';

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export class GeminiService {
  private baseUrl = 'https://yiahfvqgeljmqljsaqqg.supabase.co/functions/v1/gemini-chat';
  private ragService = new SnowflakeRAGService();

  constructor() {
  }

  async generateExplanation(
    code: string, 
    lineNumber?: number, 
    filePath?: string,
    useRAG: boolean = true
  ): Promise<{
    what: string;
    how: string;
    ragContext?: RAGContext;
  }> {
    let prompt = '';
    let ragContext: RAGContext | undefined;

    if (useRAG && filePath) {
      try {
        ragContext = await this.ragService.buildRAGContext(code, filePath);
        prompt = this.ragService.generateGeminiContextPrompt(ragContext);
      } catch (error) {
        console.warn('Failed to build RAG context, falling back to basic explanation:', error);
        prompt = this.generateBasicPrompt(code, lineNumber);
      }
    } else {
      prompt = this.generateBasicPrompt(code, lineNumber);
    }

    const response = await this.callGemini(prompt);
    const explanation = this.parseExplanationResponse(response);
    
    return {
      ...explanation,
      ragContext
    };
  }

  private generateBasicPrompt(code: string, lineNumber?: number): string {
    return lineNumber 
      ? `Analyze this code segment at line ${lineNumber}. Provide:
1. WHAT: A clear explanation of what this specific code does
2. HOW: Technical details of how it works

Code:
${code}`
      : `Analyze this code segment. Provide:
1. WHAT: A clear explanation of what this code does  
2. HOW: Technical details of how it works

Code:
${code}`;
  }

  async answerFollowUpQuestion(question: string, code: string, previousContext?: string): Promise<string> {
    const prompt = `Given this code context${previousContext ? ` and previous explanation: ${previousContext}` : ''}:

Code:
${code}

Question: ${question}

Provide a clear, specific answer about the code.`;

    return await this.callGemini(prompt);
  }

  private async callGemini(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.result;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  private parseExplanationResponse(response: string): { what: string; how: string } {
    const whatMatch = response.match(/(?:1\.\s*WHAT:|WHAT:)(.*?)(?:2\.\s*HOW:|HOW:|$)/s);
    const howMatch = response.match(/(?:2\.\s*HOW:|HOW:)(.*?)$/s);

    return {
      what: whatMatch?.[1]?.trim() || response.split('\n')[0] || response,
      how: howMatch?.[1]?.trim() || "Technical implementation details are being analyzed..."
    };
  }
}