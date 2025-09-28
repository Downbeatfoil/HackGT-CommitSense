import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useGemini } from '@/hooks/useGemini';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function RAGStatus() {
  const [ragInitialized, setRagInitialized] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { initializeRAG } = useGemini();

  useEffect(() => {
    checkRAGStatus();
  }, []);

  const checkRAGStatus = async () => {
    try {
      setRagInitialized(false);
    } catch (error) {
      setRagInitialized(false);
    }
  };

  const handleInitializeRAG = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeRAG();
      setRagInitialized(success);
    } catch (error) {
      console.error('Failed to initialize RAG:', error);
      setRagInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusIcon = () => {
    if (isInitializing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (ragInitialized === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (ragInitialized === false) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Database className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isInitializing) return 'Initializing...';
    if (ragInitialized === true) return 'RAG Active';
    if (ragInitialized === false) return 'RAG Not Initialized';
    return 'Checking Status...';
  };

  const getStatusVariant = () => {
    if (ragInitialized === true) return 'default';
    if (ragInitialized === false) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getStatusVariant()}>
          {getStatusText()}
        </Badge>
      </div>
      
      {ragInitialized === false && !isInitializing && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>RAG system requires initialization for enhanced explanations</span>
            <Button 
              onClick={handleInitializeRAG}
              size="sm"
              disabled={isInitializing}
            >
              Initialize RAG
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {ragInitialized === true && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            RAG system active. Code explanations will include similar code patterns, 
            commit history, and relevant documentation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}