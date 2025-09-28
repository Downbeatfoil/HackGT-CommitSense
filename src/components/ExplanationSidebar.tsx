import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, MessageSquare, Sparkles, Key, AlertCircle } from "lucide-react";
import { CommitTimeline } from "./CommitTimeline";
import { CommitDetailView } from "./CommitDetailView";
import { useGemini } from "@/hooks/useGemini";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExplanationData {
  what: string;
  why: string;
  source: string;
  how?: string;
  lineNumber?: number;
  code?: string;
}

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  ticket: string;
}

interface ExplanationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: ExplanationData | null;
}

function TypingText({ text, speed = 50 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={isTyping ? "typing-animation" : ""}>
      {displayedText}
      {isTyping && <span className="animate-pulse">|</span>}
    </span>
  );
}

export function ExplanationSidebar({ isOpen, onClose, explanation }: ExplanationSidebarProps) {
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [showFollowUpAnswer, setShowFollowUpAnswer] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [enhancedExplanation, setEnhancedExplanation] = useState<{ what: string; how: string } | null>(null);
  const { 
    generateExplanation, 
    answerFollowUp, 
    isLoading, 
    error, 
    hasApiKey 
  } = useGemini();

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !hasApiKey || !explanation?.code) return;
    
    try {
      const answer = await answerFollowUp(
        followUpQuestion, 
        explanation.code,
        enhancedExplanation ? `Previous explanation: ${enhancedExplanation.what}` : undefined
      );
      setFollowUpAnswer(answer);
      setShowFollowUpAnswer(true);
      setFollowUpQuestion("");
    } catch (error) {
      console.error('Failed to get follow-up answer:', error);
    }
  };

  const enhanceWithGemini = async () => {
    if (!hasApiKey || !explanation?.code) return;
    
    try {
      const result = await generateExplanation(explanation.code, explanation.lineNumber);
      setEnhancedExplanation(result);
    } catch (error) {
      console.error('Failed to enhance explanation:', error);
    }
  };

  useEffect(() => {
    if (hasApiKey && explanation && !enhancedExplanation) {
      enhanceWithGemini();
    }
  }, [hasApiKey, explanation]);

  useEffect(() => {
    setEnhancedExplanation(null);
    setShowFollowUpAnswer(false);
    setFollowUpAnswer("");
  }, [explanation]);

  const handleCommitSelect = (commit: Commit) => {
    setSelectedCommit(commit);
    setCommits([
      { id: "1", hash: "a7f3d92", message: "Add exponential backoff retry logic", author: "Eric Martinez", date: "Jan 15, 2024", ticket: "PAY-503" },
      { id: "2", hash: "b82c4e1", message: "Fix integer overflow in timeout calculation", author: "Eric Martinez", date: "Jan 10, 2024", ticket: "PAY-487" },
      { id: "3", hash: "c91f5a3", message: "Optimize retry performance during peak traffic", author: "Sarah Chen", date: "Jan 5, 2024", ticket: "PAY-456" },
      { id: "4", hash: "d7e8b94", message: "Refactor error handling to avoid permanent retries", author: "Michael Rodriguez", date: "Dec 28, 2023", ticket: "PAY-432" }
    ]);
  };

  const handleBackToTimeline = () => {
    setSelectedCommit(null);
  };

  const handleCommitChange = (commit: Commit) => {
    setSelectedCommit(commit);
    if (commits.length === 0) {
      setCommits([
        { id: "1", hash: "a7f3d92", message: "Add exponential backoff retry logic", author: "Eric Martinez", date: "Jan 15, 2024", ticket: "PAY-503" },
        { id: "2", hash: "b82c4e1", message: "Fix integer overflow in timeout calculation", author: "Eric Martinez", date: "Jan 10, 2024", ticket: "PAY-487" },
        { id: "3", hash: "c91f5a3", message: "Optimize retry performance during peak traffic", author: "Sarah Chen", date: "Jan 5, 2024", ticket: "PAY-456" },
        { id: "4", hash: "d7e8b94", message: "Refactor error handling to avoid permanent retries", author: "Michael Rodriguez", date: "Dec 28, 2023", ticket: "PAY-432" }
      ]);
    }
  };

  if (!isOpen || !explanation) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg slide-in-right z-50">
      <Card className="h-full rounded-none border-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">AI Explanation</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {selectedCommit ? (
            <CommitDetailView 
              commit={selectedCommit}
              commits={commits}
              onBack={handleBackToTimeline}
              onCommitChange={handleCommitChange}
            />
          ) : (
            <div className="space-y-4">

              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="what" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="what">What it does</TabsTrigger>
                  <TabsTrigger value="how">How it works</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-4">
                  <TabsContent value="what" className="mt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">Code Explanation</h3>
                        {hasApiKey && !enhancedExplanation && !isLoading && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={enhanceWithGemini}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Enhance
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isLoading ? (
                          <span className="animate-pulse">Generating explanation...</span>
                        ) : (
                          <TypingText text={enhancedExplanation?.what || explanation.what} />
                        )}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="how" className="mt-0">
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground">Implementation Details</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isLoading ? (
                          <span className="animate-pulse">Generating explanation...</span>
                        ) : (
                          <TypingText text={enhancedExplanation?.how || explanation.how || "This code works by leveraging established design patterns and best practices."} />
                        )}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-0">
                    <CommitTimeline 
                      lineNumber={explanation.lineNumber || 1}
                      onCommitSelect={handleCommitSelect}
                    />
                  </TabsContent>

                  {hasApiKey && (
                    <div className="pt-4 border-t border-border">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Ask follow-up question</h4>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ask anything about this code..."
                            value={followUpQuestion}
                            onChange={(e) => setFollowUpQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                            className="flex-1"
                          />
                          <Button 
                            size="sm" 
                            onClick={handleFollowUp} 
                            disabled={!followUpQuestion.trim() || isLoading}
                          >
                            {isLoading ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        {showFollowUpAnswer && followUpAnswer && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <TypingText 
                                text={followUpAnswer}
                                speed={30}
                              />
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
                    <span>{hasApiKey ? 'Powered by Gemini AI' : 'Connect Gemini for AI explanations'}</span>
                  </div>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}