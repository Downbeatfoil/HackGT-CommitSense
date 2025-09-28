import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import commitSenseLogo from "@/assets/commit-sense-logo.png";
import { 
  User, 
  LogIn, 
  FolderOpen, 
  GitCommit, 
  MessageSquare, 
  Clock, 
  Users, 
  Tag,
  FileText,
  Calendar,
  Star,
  GitBranch
} from "lucide-react";

interface Developer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'current' | 'previous';
  role: string;
  joinDate: string;
  commitCount: number;
  lastActivity: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  summary: string;
  status: 'active' | 'completed' | 'archived';
  startDate: string;
  lastUpdated: string;
  developersCount: number;
  commitsCount: number;
}

interface Commit {
  id: string;
  hash: string;
  message: string;
  developer: Developer;
  timestamp: string;
  ticketId: string;
  files: string[];
  jellyfishNotes: string[];
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const mockDevelopers: Developer[] = [
  {
    id: '1',
    name: 'Eric Martinez',
    email: 'eric.martinez@company.com',
    avatar: '/api/placeholder/40/40',
    status: 'current',
    role: 'Senior Backend Engineer',
    joinDate: '2023-01-15',
    commitCount: 247,
    lastActivity: '2 hours ago'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    avatar: '/api/placeholder/40/40',
    status: 'current',
    role: 'Frontend Lead',
    joinDate: '2022-08-20',
    commitCount: 189,
    lastActivity: '1 day ago'
  },
  {
    id: '3',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    avatar: '/api/placeholder/40/40',
    status: 'previous',
    role: 'Full Stack Developer',
    joinDate: '2021-03-10',
    commitCount: 156,
    lastActivity: '2 months ago'
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Payment Processing System',
    description: 'Core payment processing infrastructure with retry logic and gateway integration',
    summary: 'A robust payment system handling millions of transactions daily with automatic retry mechanisms, fraud detection, and multiple payment gateway support. Built to handle peak loads during sales events.',
    status: 'active',
    startDate: '2023-01-01',
    lastUpdated: '2 hours ago',
    developersCount: 5,
    commitsCount: 1247
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics and reporting dashboard for business metrics',
    summary: 'Comprehensive analytics platform providing real-time insights into user behavior, revenue metrics, and system performance. Features interactive charts, custom reports, and automated alerts.',
    status: 'active',
    startDate: '2023-06-15',
    lastUpdated: '1 day ago',
    developersCount: 3,
    commitsCount: 523
  }
];

const mockCommits: Commit[] = [
  {
    id: '1',
    hash: 'abc123ef',
    message: 'Add exponential backoff retry logic to payment processor',
    developer: mockDevelopers[0],
    timestamp: '2024-01-15T10:30:00Z',
    ticketId: 'PAY-503',
    files: ['services/payments_v2.py', 'tests/test_payments.py'],
    jellyfishNotes: [
      'Implemented retry decorator with configurable backoff multiplier',
      'Added comprehensive error logging for debugging payment failures',
      'Updated unit tests to cover retry scenarios'
    ],
    comments: [
      {
        id: '1',
        author: 'Sarah Chen',
        content: 'Great implementation! The exponential backoff should help with the gateway timeout issues we were seeing.',
        timestamp: '2024-01-15T11:15:00Z'
      },
      {
        id: '2',
        author: 'Eric Martinez',
        content: 'Thanks! I also added extra logging so we can monitor retry patterns in production.',
        timestamp: '2024-01-15T11:30:00Z'
      }
    ]
  },
  {
    id: '2',
    hash: 'def456gh',
    message: 'Refactor PaymentProcessor class after queue migration',
    developer: mockDevelopers[0],
    timestamp: '2024-01-10T14:22:00Z',
    ticketId: 'PAY-457',
    files: ['services/payments_v2.py', 'config/payment_config.py'],
    jellyfishNotes: [
      'Centralized payment logic to prevent distributed failures',
      'Improved error handling and transaction state management',
      'Added configuration validation on startup'
    ],
    comments: [
      {
        id: '3',
        author: 'Michael Rodriguez',
        content: 'This fixes the issues we had after the queue system changes. Much cleaner architecture now.',
        timestamp: '2024-01-10T15:45:00Z'
      }
    ]
  }
];

export default function DeveloperDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-lg p-8">
          <div className="text-center mb-4">
            <div className="mb-2">
              <img 
                src={commitSenseLogo} 
                alt="Commit Sense Logo" 
                className="w-64 h-auto mx-auto"
              />
            </div>
            <h1 className="text-2xl font-bold">Developer Portal</h1>
            <p className="text-muted-foreground">Sign in to access your projects</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setSelectedProject(null)}>
                ← Back to Projects
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-semibold">{selectedProject.name}</h1>
                <p className="text-xs text-muted-foreground">Project Details</p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-3">
              <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                {selectedProject.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Summary
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {selectedProject.summary}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Project Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Developers</span>
                  <span className="font-medium">{selectedProject.developersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Commits</span>
                  <span className="font-medium">{selectedProject.commitsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{selectedProject.lastUpdated}</span>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="code-files" className="space-y-4">
            <TabsList>
              <TabsTrigger value="code-files">Code Files</TabsTrigger>
              <TabsTrigger value="developers">Developers</TabsTrigger>
              <TabsTrigger value="commits">Commits</TabsTrigger>
            </TabsList>

            <TabsContent value="code-files" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/code'}>
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">services/payments_v2.py</h3>
                      <p className="text-sm text-muted-foreground">Main payment processing logic</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lines of code:</span>
                      <span className="font-medium">247</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last modified:</span>
                      <span className="font-medium">2 hours ago</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modified by:</span>
                      <span className="font-medium">Eric Martinez</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow opacity-60">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-muted-foreground">tests/test_payments.py</h3>
                      <p className="text-sm text-muted-foreground">Unit tests for payment system</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lines of code:</span>
                      <span className="font-medium text-muted-foreground">156</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last modified:</span>
                      <span className="font-medium text-muted-foreground">1 day ago</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modified by:</span>
                      <span className="font-medium text-muted-foreground">Sarah Chen</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow opacity-60">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-muted-foreground">config/payment_config.py</h3>
                      <p className="text-sm text-muted-foreground">Payment configuration settings</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lines of code:</span>
                      <span className="font-medium text-muted-foreground">89</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last modified:</span>
                      <span className="font-medium text-muted-foreground">3 days ago</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modified by:</span>
                      <span className="font-medium text-muted-foreground">Michael Rodriguez</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="developers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockDevelopers.map((developer) => (
                  <Card key={developer.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={developer.avatar} />
                        <AvatarFallback>{developer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{developer.name}</h3>
                          <Badge variant={developer.status === 'current' ? 'default' : 'secondary'}>
                            <Tag className="w-3 h-3 mr-1" />
                            {developer.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{developer.role}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <GitCommit className="w-3 h-3" />
                            {developer.commitCount} commits
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {developer.lastActivity}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {developer.id === '1' 
                          ? 'Leading backend infrastructure development, focusing on payment systems scalability and reliability improvements.'
                          : developer.id === '2'
                          ? 'Architecting user interfaces and frontend performance optimizations. Expertise in React and modern web technologies.'
                          : 'Former team member who established the foundational architecture and development patterns still used today.'
                        }
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="commits" className="space-y-4">
              {mockCommits.map((commit) => (
                <Card key={commit.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={commit.developer.avatar} />
                      <AvatarFallback>{commit.developer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{commit.message}</h3>
                          <Badge variant="outline">{commit.ticketId}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{commit.developer.name}</span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {commit.hash}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(commit.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Files Modified:</h4>
                        <div className="flex flex-wrap gap-2">
                          {commit.files.map((file, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Jellyfish Notes:
                        </h4>
                        <ul className="space-y-1">
                          {commit.jellyfishNotes.map((note, index) => (
                            <li key={index} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/20">
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {commit.comments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Comments:
                          </h4>
                          <div className="space-y-2">
                            {commit.comments.map((comment) => (
                              <div key={comment.id} className="bg-muted p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{comment.author}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Developer Portal</h1>
              <p className="text-xs text-muted-foreground">Manage your projects and teams</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Welcome back, Developer</span>
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Your Projects</h2>
          <p className="text-muted-foreground">Click on any project to view detailed information about developers, commits, and collaboration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <Card key={project.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProjectSelect(project)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{project.name}</h3>
                </div>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.developersCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3" />
                    {project.commitsCount}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {project.lastUpdated}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}