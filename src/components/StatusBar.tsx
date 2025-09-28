import { Badge } from "@/components/ui/badge";
import { CheckCircle, Database, Sparkles } from "lucide-react";
import { RAGStatus } from './RAGStatus';

export function StatusBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="status-badge success">
            <Sparkles className="w-3 h-3 mr-1" />
            Gemini Demo Active
          </Badge>
          
          <RAGStatus />
          
          <Badge variant="secondary" className="status-badge warning">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sample Data Only
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          Legacy Lens v1.0 | Hackathon Demo
        </div>
      </div>
    </div>
  );
}