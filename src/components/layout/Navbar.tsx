"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
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
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();
  const pathname = usePathname();

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
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link href="/" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${pathname === '/' ? 'bg-muted' : 'hover:bg-muted'}`}>
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/candidates" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${pathname.startsWith('/candidates') ? 'bg-muted' : 'hover:bg-muted'}`}>
              <Users className="h-4 w-4" />
              Candidates
            </Link>
            <Link href="/chat" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${pathname.startsWith('/chat') ? 'bg-muted' : 'hover:bg-muted'}`}>
              <MessageSquare className="h-4 w-4" />
              AI Search
            </Link>
            <Link href="/scraping" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${pathname.startsWith('/scraping') ? 'bg-muted' : 'hover:bg-muted'}`}>
              <Database className="h-4 w-4" />
              Apollo Scraping
            </Link>
            <Link href="/sync" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${pathname.startsWith('/sync') ? 'bg-muted' : 'hover:bg-muted'}`}>
              <RefreshCw className="h-4 w-4" />
              Loxo Sync
            </Link>
            <Link href="/candidates/upload" className={`text-sm font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${pathname.startsWith('/candidates/upload') ? 'bg-muted' : 'hover:bg-muted'}`}>
              <Upload className="h-4 w-4" />
              Upload CVs
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Button size="sm" asChild className="hover:bg-muted">
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center space-x-2">
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
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === '/' ? 'bg-muted' : 'hover:bg-muted'}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Home className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/candidates"
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/candidates') ? 'bg-muted' : 'hover:bg-muted'}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Users className="h-4 w-4" />
                          <span>Candidates</span>
                        </Link>
                        <Link
                          href="/chat"
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/chat') ? 'bg-muted' : 'hover:bg-muted'}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>AI Search</span>
                        </Link>
                        <Link
                          href="/scraping"
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/scraping') ? 'bg-muted' : 'hover:bg-muted'}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Database className="h-4 w-4" />
                          <span>Apollo Scraping</span>
                        </Link>
                        <Link
                          href="/sync"
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/sync') ? 'bg-muted' : 'hover:bg-muted'}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Loxo Sync</span>
                        </Link>
                        <Link
                          href="/candidates/upload"
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/candidates/upload') ? 'bg-muted' : 'hover:bg-muted'}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload CVs</span>
                        </Link>
                      </div>
                    </div>

                    {/* Quick Actions section removed to avoid duplicates; merged into Main Menu */}

                    {/* Account Section */}
                    {isAuthenticated && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Account
                        </h3>
                        <div className="space-y-1">
                          <Link
                            href="/profile"
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/profile') ? 'bg-muted' : 'hover:bg-muted'}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            <span>Profiel</span>
                          </Link>
                          <Link
                            href="/settings"
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/settings') ? 'bg-muted' : 'hover:bg-muted'}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Instellingen</span>
                          </Link>
                          <button
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors w-full text-left text-red-600"
                            onClick={() => {
                              setIsOpen(false);
                              signOut();
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Uitloggen</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!isAuthenticated && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Account
                        </h3>
                        <div className="space-y-1">
                          <Link
                            href="/login"
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/login') ? 'bg-muted' : 'hover:bg-muted'}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            <span>Inloggen</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer removed per request */}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}