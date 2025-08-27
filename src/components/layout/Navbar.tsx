"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MenuIcon, 
  LogOut,
  User,
  Home,
  Users,
  MessageSquare,
  Upload,
  Search,
  BarChart3,
  Settings,
  Brain,
  Database,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl font-bold">Newroadz Recruitment</h1>
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              AI-Powered
            </Badge>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/candidates" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Users className="h-4 w-4" />
              Candidates
            </Link>
            <Link href="/chat" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              AI Search
            </Link>
            <Link href="/scraping" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Database className="h-4 w-4" />
              Apollo Scraping
            </Link>
            <Link href="/sync" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Loxo Sync
            </Link>
            <Link href="/candidates/upload" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Upload CVs
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 p-0 h-[100dvh] flex flex-col">
                <SheetHeader className="p-6 pb-4 flex-shrink-0">
                  <SheetTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>Newroadz Recruitment</span>
                  </SheetTitle>
                </SheetHeader>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-6">
                    {/* Main Navigation */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Main Menu
                      </h3>
                      <div className="space-y-1">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Home className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/candidates"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Users className="h-4 w-4" />
                          <span>Candidates</span>
                        </Link>
                        <Link
                          href="/chat"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>AI Search</span>
                        </Link>
                        <Link
                          href="/scraping"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Database className="h-4 w-4" />
                          <span>Apollo Scraping</span>
                        </Link>
                        <Link
                          href="/sync"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Loxo Sync</span>
                        </Link>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Quick Actions
                      </h3>
                      <div className="space-y-1">
                        <Link
                          href="/candidates/upload"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Upload className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Upload CVs</div>
                            <div className="text-xs text-muted-foreground">Add candidates via CV upload</div>
                          </div>
                        </Link>
                        <Link
                          href="/sync"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Loxo Sync</div>
                            <div className="text-xs text-muted-foreground">Import from Loxo database</div>
                          </div>
                        </Link>
                        <Link
                          href="/scraping"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Database className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Apollo Scraper</div>
                            <div className="text-xs text-muted-foreground">Scrape candidates from Apollo</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-6 pt-4 border-t bg-background">
                  <div className="text-xs text-muted-foreground text-center">
                    Powered by AI • Built with ❤️
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}