import { DashboardStats } from "@/app/dashboard/components/DashboardStats";
import { QuickActions } from "@/app/dashboard/components/QuickActions";
import { RecentActivity } from "@/app/dashboard/components/RecentActivity";
import { CandidateOverview } from "@/app/dashboard/components/CandidateOverview";
import { Sparkles, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-500/20 dark:to-blue-500/20" />
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-75 animate-pulse" />
                <div className="relative bg-white dark:bg-slate-900 rounded-lg p-4">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Newroads Recruitment Agent
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered candidate sourcing and management platform that revolutionizes your recruitment process
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 pb-12">
        {/* Stats Section */}
        <div className="mb-8">
          <DashboardStats />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Actions & Activity */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <QuickActions />
              <RecentActivity />
            </div>
            
            <CandidateOverview />
          </div>
          
          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* AI Insights Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI Insights</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Processing Queue</span>
                    <span className="font-medium">12 pending</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Match Accuracy</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Auto-tags Generated</span>
                    <span className="font-medium">2,847</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">This Week</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Candidates Added</span>
                    <span className="font-medium text-green-600">+127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Successful Matches</span>
                    <span className="font-medium text-green-600">+34</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Response Rate</span>
                    <span className="font-medium text-green-600">68%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">💡 Pro Tips</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Try semantic search: "Find senior React developers in Amsterdam with startup experience"
                  </p>
                  <p>
                    Upload CVs in bulk to auto-detect skills and experience levels
                  </p>
                  <p>
                    Use tags to organize candidates by project requirements
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}