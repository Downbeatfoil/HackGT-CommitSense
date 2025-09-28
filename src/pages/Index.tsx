import { useState } from "react";
import { CodeViewer } from "@/components/CodeViewer";
import { ExplanationSidebar } from "@/components/ExplanationSidebar";
import { StatusBar } from "@/components/StatusBar";

import { Button } from "@/components/ui/button";
import { Code, Folder } from "lucide-react";

interface ExplanationData {
  what: string;
  why: string;
  source: string;
  lineNumber?: number;
}

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<ExplanationData | null>(null);

  const handleLineSelect = (line: any) => {
    const explanationWithLineNumber = {
      ...line.explanation,
      lineNumber: line.number,
      code: line.code || line.explanation?.source || "Code context not available"
    };
    setCurrentExplanation(explanationWithLineNumber);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setCurrentExplanation(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Legacy Lens</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Code Explainer</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Folder className="w-4 h-4 mr-2" />
              services/payments_v2.py
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              Developer Portal
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem-4rem)]">
        <div className="flex-1 p-4">
          <CodeViewer onLineSelect={handleLineSelect} />
        </div>

      </div>

      <ExplanationSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        explanation={currentExplanation}
      />


      <StatusBar />
    </div>
  );
};

export default Index;
