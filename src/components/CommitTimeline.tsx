import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, GitCommit, User } from "lucide-react";

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  ticket: string;
}

interface CommitTimelineProps {
  lineNumber: number;
  onCommitSelect: (commit: Commit) => void;
}

function generateCommitHistory(lineNumber: number): Commit[] {
  const developers = [
    "Sarah Chen", "Marcus Johnson", "Eric Martinez", "Priya Patel", 
    "David Kim", "Lisa Rodriguez", "James Wilson", "Anna Kowalski"
  ];
  
  const commits: Commit[] = [];
  const today = new Date();
  
  commits.push({
    id: `commit-${lineNumber}-1`,
    hash: "a7f3d92",
    message: "Initial implementation of payment retry logic",
    author: developers[Math.floor(Math.random() * developers.length)],
    date: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ticket: "LEGACY-247"
  });
  
  commits.push({
    id: `commit-${lineNumber}-2`,
    hash: "b82c4e1",
    message: "Fix edge case in retry timeout calculation",
    author: developers[Math.floor(Math.random() * developers.length)],
    date: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ticket: "LEGACY-312"
  });
  
  commits.push({
    id: `commit-${lineNumber}-3`,
    hash: "c91f5a3",
    message: "Optimize retry backoff strategy for better performance",
    author: developers[Math.floor(Math.random() * developers.length)],
    date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ticket: "LEGACY-456"
  });
  
  commits.push({
    id: `commit-${lineNumber}-4`,
    hash: "d7e8b94",
    message: "Refactor retry mechanism for better error handling",
    author: developers[Math.floor(Math.random() * developers.length)],
    date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ticket: "LEGACY-523"
  });
  
  return commits.reverse();
}

export function CommitTimeline({ lineNumber, onCommitSelect }: CommitTimelineProps) {
  const commits = generateCommitHistory(lineNumber);
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-foreground">Commit Timeline</h3>
      <p className="text-sm text-muted-foreground">
        All commits that have modified line {lineNumber}
      </p>
      
      <div className="space-y-3">
        {commits.map((commit, index) => (
          <Card key={commit.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onCommitSelect(commit)}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <GitCommit className="w-4 h-4 text-primary" />
                {index < commits.length - 1 && (
                  <div className="w-0.5 h-8 bg-border mt-2" />
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {commit.hash}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {commit.ticket}
                  </Badge>
                </div>
                
                <p className="text-sm font-medium text-foreground">
                  {commit.message}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {commit.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {commit.date}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}