import { DashboardStats } from "@/app/dashboard/components/DashboardStats";
import { QuickActions } from "@/app/dashboard/components/QuickActions";
import { RecentActivity } from "@/app/dashboard/components/RecentActivity";
import { CandidateOverview } from "@/app/dashboard/components/CandidateOverview";
import { Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Newroads Recruitment Agent</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered candidate sourcing and management</p>
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
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Actions & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <QuickActions />
              <RecentActivity />
            </div>
            
            <CandidateOverview />
          </div>
          
          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* AI Insights Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">AI Insights</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Processing Queue</span>
                    <span className="font-medium">12 pending</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Match Accuracy</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Auto-tags Generated</span>
                    <span className="font-medium">2,847</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-muted">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">This Week</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Candidates Added</span>
                    <span className="font-medium">+127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Successful Matches</span>
                    <span className="font-medium">+34</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Response Rate</span>
                    <span className="font-medium">68%</span>
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