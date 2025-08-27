import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Newroadz Recruitment Agent</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered recruitment platform for sourcing and managing top talent with advanced search and intelligent matching.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Platform Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>AI-Powered Search</li>
              <li>Candidate Sourcing</li>
              <li>Apollo Integration</li>
              <li>Loxo Sync</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Technology</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Machine Learning</li>
              <li>Natural Language Processing</li>
              <li>Real-time Analytics</li>
              <li>Automated Screening</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Training Resources</li>
              <li>24/7 Support</li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 Newroadz Recruitment Agent. All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}