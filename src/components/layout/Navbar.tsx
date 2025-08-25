"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MegaMenu } from "@/components/ui/mega-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MenuIcon, 
  Github,
  CodeIcon,
  DatabaseIcon,
  PaletteIcon,
  HomeIcon,
  SparklesIcon,
  MailIcon,
  ShieldIcon,
  ZapIcon,
  SmartphoneIcon,
  BookOpenIcon,
  GraduationCapIcon,
  RocketIcon,
  SettingsIcon,
  UsersIcon,
  TrendingUpIcon,
  LogOut,
  User
} from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();

  const componentsMenuData = {
    trigger: "Components",
    tabs: [
      {
        id: "ui",
        label: "UI Components",
        content: {
          title: "User Interface",
          description: "Beautiful and accessible UI components built with ShadCN",
          items: [
            {
              icon: <PaletteIcon className="h-4 w-4 text-primary" />,
              title: "Design System",
              description: "Complete set of design tokens and components",
              badge: "50+ Components"
            },
            {
              icon: <SmartphoneIcon className="h-4 w-4 text-primary" />,
              title: "Responsive",
              description: "Mobile-first responsive design patterns",
            },
            {
              icon: <ZapIcon className="h-4 w-4 text-primary" />,
              title: "Performance",
              description: "Optimized for speed and accessibility",
            },
            {
              icon: <ShieldIcon className="h-4 w-4 text-primary" />,
              title: "Type Safe",
              description: "Full TypeScript support with strict types",
            }
          ]
        }
      },
      {
        id: "forms",
        label: "Forms & Data",
        content: {
          title: "Forms & Validation",
          description: "Powerful form handling with validation and type safety",
          items: [
            {
              icon: <CodeIcon className="h-4 w-4 text-primary" />,
              title: "React Hook Form",
              description: "Performant forms with easy validation",
              badge: "Popular"
            },
            {
              icon: <ShieldIcon className="h-4 w-4 text-primary" />,
              title: "Zod Validation",
              description: "Schema validation with TypeScript inference",
            },
            {
              icon: <DatabaseIcon className="h-4 w-4 text-primary" />,
              title: "Data Fetching",
              description: "Optimized data fetching patterns",
            },
            {
              icon: <SettingsIcon className="h-4 w-4 text-primary" />,
              title: "State Management",
              description: "Modern state management solutions",
            }
          ]
        }
      },
      {
        id: "backend",
        label: "Backend & Auth",
        content: {
          title: "Backend Integration",
          description: "Full-stack capabilities with Supabase integration",
          items: [
            {
              icon: <DatabaseIcon className="h-4 w-4 text-primary" />,
              title: "Supabase",
              description: "PostgreSQL database with real-time features",
              badge: "Recommended"
            },
            {
              icon: <ShieldIcon className="h-4 w-4 text-primary" />,
              title: "Authentication",
              description: "Secure user authentication and authorization",
            },
            {
              icon: <UsersIcon className="h-4 w-4 text-primary" />,
              title: "User Management",
              description: "Complete user management system",
            },
            {
              icon: <ZapIcon className="h-4 w-4 text-primary" />,
              title: "Real-time",
              description: "Live updates and real-time subscriptions",
            }
          ]
        }
      }
    ]
  };

  const resourcesMenuData = {
    trigger: "Resources",
    tabs: [
      {
        id: "docs",
        label: "Documentation",
        content: {
          title: "Documentation & Guides",
          description: "Everything you need to get started and build amazing apps",
          items: [
            {
              icon: <BookOpenIcon className="h-4 w-4 text-primary" />,
              title: "Getting Started",
              description: "Quick start guide and installation instructions",
              badge: "Start Here"
            },
            {
              icon: <CodeIcon className="h-4 w-4 text-primary" />,
              title: "API Reference",
              description: "Complete API documentation and examples",
            },
            {
              icon: <PaletteIcon className="h-4 w-4 text-primary" />,
              title: "Component Library",
              description: "Interactive component documentation",
            },
            {
              icon: <RocketIcon className="h-4 w-4 text-primary" />,
              title: "Deployment",
              description: "Deploy your app to production platforms",
            }
          ]
        }
      },
      {
        id: "learning",
        label: "Learning",
        content: {
          title: "Learn & Improve",
          description: "Tutorials, examples and best practices for modern development",
          items: [
            {
              icon: <GraduationCapIcon className="h-4 w-4 text-primary" />,
              title: "Tutorials",
              description: "Step-by-step tutorials for common use cases",
              badge: "New"
            },
            {
              icon: <CodeIcon className="h-4 w-4 text-primary" />,
              title: "Code Examples",
              description: "Real-world examples and code snippets",
            },
            {
              icon: <TrendingUpIcon className="h-4 w-4 text-primary" />,
              title: "Best Practices",
              description: "Industry best practices and patterns",
            },
            {
              icon: <UsersIcon className="h-4 w-4 text-primary" />,
              title: "Community",
              description: "Join our community and get help",
            }
          ]
        }
      },
      {
        id: "tools",
        label: "Tools & Utils",
        content: {
          title: "Developer Tools",
          description: "Helpful tools and utilities to boost your productivity",
          items: [
            {
              icon: <SettingsIcon className="h-4 w-4 text-primary" />,
              title: "CLI Tools",
              description: "Command line tools for faster development",
            },
            {
              icon: <ZapIcon className="h-4 w-4 text-primary" />,
              title: "Build Tools",
              description: "Modern build tools and optimization",
            },
            {
              icon: <ShieldIcon className="h-4 w-4 text-primary" />,
              title: "Testing Utils",
              description: "Testing utilities and best practices",
            },
            {
              icon: <RocketIcon className="h-4 w-4 text-primary" />,
              title: "Performance",
              description: "Performance monitoring and optimization",
            }
          ]
        }
      }
    ]
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Next.js Template</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              v1.0
            </Badge>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            
            {/* Mega Menus */}
            <MegaMenu {...componentsMenuData} />
            <MegaMenu {...resourcesMenuData} />

            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </a>
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
                  Uitloggen
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  Inloggen
                </Link>
              </Button>
            )}
            <Button size="sm" className="gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </Button>
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
                    <span>Next.js Template</span>
                    <Badge variant="outline">v1.0</Badge>
                  </SheetTitle>
                </SheetHeader>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-6">
                    {/* Navigation */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Navigation
                      </h3>
                      <div className="space-y-1">
                        <a
                          href="#"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <HomeIcon className="h-4 w-4" />
                          <span>Home</span>
                        </a>
                        <a
                          href="#features"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <SparklesIcon className="h-4 w-4" />
                          <span>Features</span>
                        </a>
                        <a
                          href="#contact"
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <MailIcon className="h-4 w-4" />
                          <span>Contact</span>
                        </a>
                      </div>
                    </div>

                    <Separator />

                    {/* Components */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Components
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
                          <PaletteIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">UI Components</div>
                            <div className="text-xs text-muted-foreground">ShadCN UI Library</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
                          <CodeIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Forms</div>
                            <div className="text-xs text-muted-foreground">Zod + React Hook Form</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
                          <DatabaseIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Database</div>
                            <div className="text-xs text-muted-foreground">Supabase Integration</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed GitHub Button */}
                <div className="flex-shrink-0 p-6 pt-4 border-t bg-background">
                  <Button className="w-full gap-2" onClick={() => setIsOpen(false)}>
                    <Github className="h-4 w-4" />
                    View on GitHub
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}