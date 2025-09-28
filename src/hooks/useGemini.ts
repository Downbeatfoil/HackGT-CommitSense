import { useState, useCallback } from 'react';
import { GeminiService } from '@/services/geminiService';
import { SnowflakeRAGService } from '@/services/snowflakeRAGService';

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragService] = useState(() => new SnowflakeRAGService());

  const generateExplanation = useCallback(async (
    code: string, 
    lineNumber?: number, 
    filePath?: string,
    useRAG: boolean = true
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const geminiService = new GeminiService();
      const result = await geminiService.generateExplanation(code, lineNumber, filePath, useRAG);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate explanation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeRAG = useCallback(async () => {
    try {
      await ragService.initializeRAGSystem();
      return true;
    } catch (err) {
      console.warn('Failed to initialize RAG system:', err);
      return false;
    }
  }, [ragService]);

  const embedCode = useCallback(async (
    codeContent: string,
    filePath: string,
    lineStart: number,
    lineEnd: number
  ) => {
    try {
      return await ragService.embedCodeChunk(codeContent, filePath, lineStart, lineEnd);
    } catch (err) {
      console.error('Failed to embed code:', err);
      throw err;
    }
  }, [ragService]);

  const answerFollowUp = useCallback(async (question: string, code: string, previousContext?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const geminiService = new GeminiService();
      const result = await geminiService.answerFollowUpQuestion(question, code, previousContext);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to answer question';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateExplanation,
    answerFollowUp,
    initializeRAG,
    embedCode,
    isLoading,
    error,
    hasApiKey: true // Always true since using Supabase secret
  };
}