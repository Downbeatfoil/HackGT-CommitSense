import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ChevronLeft, ChevronRight, GitCommit, User, Calendar, MessageCircle } from "lucide-react";

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  ticket: string;
}

interface CommitDetailViewProps {
  commit: Commit;
  commits: Commit[];
  onBack: () => void;
  onCommitChange: (commit: Commit) => void;
}

function TypingText({ text, speed = 30 }: { text: string; speed?: number }) {
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

function generateCommitDetails(commit: Commit): {
  jellyfishComments: string[];
  explanation: string;
  context: string;
} {
  const jellyfishCommentsByHash = {
    "a7f3d92": [
      "Had to think through this edge case carefully - payment timeouts were causing user frustration",
      "Discussed with the team about the backoff strategy. Exponential seems best for gateway stability"
    ],
    "b82c4e1": [
      "This integer overflow bug was tricky to catch - only happened with very large transaction amounts",
      "Added comprehensive unit tests to prevent similar edge cases in the future"
    ],
    "c91f5a3": [
      "Performance monitoring revealed retry logic was consuming too many resources during peak hours",
      "Worked with the analytics team to understand traffic patterns before implementing this optimization"
    ],
    "d7e8b94": [
      "Recent production incidents showed we were retrying on permanent failures unnecessarily",
      "This took longer than expected due to integration testing with the legacy payment system"
    ]
  };
  
  const explanations = {
    "a7f3d92": "This commit introduced the foundational retry mechanism after we experienced multiple payment gateway timeouts during Black Friday. The business requirement was to ensure no customer transactions were lost due to temporary gateway issues. I implemented an exponential backoff strategy starting with 1-second delays to balance user experience with system stability.",
    
    "b82c4e1": "After monitoring production logs, we discovered that the initial timeout calculation had an edge case where very large transaction amounts would cause integer overflow in the delay calculation. This fix ensures the retry delays never exceed our maximum threshold of 30 seconds, preventing infinite waiting scenarios that were frustrating users.",
    
    "c91f5a3": "Performance analysis showed that our retry logic was consuming too many resources during peak traffic. This optimization introduced smarter backoff timing and reduced unnecessary retry attempts by 40%. The changes were based on real traffic patterns from our analytics team and improved overall system throughput.",
    
    "d7e8b94": "Recent incidents showed that our error handling wasn't specific enough - we were retrying on permanent failures that would never succeed. This refactor categorizes errors into retryable vs permanent failures, reducing unnecessary load on the payment gateway and providing clearer error messages to users."
  };
  
  const context = "This code is part of the critical payment processing pipeline that handles over $2M in daily transactions. The retry mechanism was essential after experiencing significant revenue loss during payment gateway outages in Q3 2023.";
  
  return {
    jellyfishComments: jellyfishCommentsByHash[commit.hash] || ["This commit includes important changes to improve system reliability and user experience."],
    explanation: explanations[commit.hash] || "This commit addresses a critical business requirement in our payment processing system.",
    context
  };
}

export function CommitDetailView({ commit, commits, onBack, onCommitChange }: CommitDetailViewProps) {
  const currentIndex = commits.findIndex(c => c.id === commit.id);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < commits.length - 1;
  
  const details = generateCommitDetails(commit);
  
  const handlePrevious = () => {
    if (canGoPrevious) {
      onCommitChange(commits[currentIndex - 1]);
    }
  };
  
  const handleNext = () => {
    if (canGoNext) {
      onCommitChange(commits[currentIndex + 1]);
    }
  };
  
  return (
    <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Timeline
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious} disabled={!canGoPrevious}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} disabled={!canGoNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <GitCommit className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {commit.hash}
              </Badge>
              <Badge variant="outline">
                {commit.ticket}
              </Badge>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-foreground">
            {commit.message}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{commit.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {commit.date}
            </div>
          </div>
        </div>
      </Card>
      
      {details.jellyfishComments.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Developer Notes</h4>
            </div>
            {details.jellyfishComments.map((comment, index) => (
              <div key={index} className="pl-6 border-l-2 border-muted">
                <p className="text-sm text-muted-foreground italic">
                  "{comment}"
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="font-medium">Why This Change Was Made</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <TypingText text={details.explanation} />
          </p>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="font-medium">Project Context</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <TypingText text={details.context} />
          </p>
        </div>
      </Card>
    </div>
  );
}