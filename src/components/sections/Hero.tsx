import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "lucide-react";

export function Hero() {
  const features = [
    "Next.js 15 met App Router",
    "TypeScript configuratie", 
    "Tailwind CSS 3.3.3",
    "Alle ShadCN UI componenten",
    "Supabase integratie",
    "Dark/Light mode",
    "Framer Motion animaties",
    "Zod validatie",
    "React Hook Form",
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
        <div className="space-y-16">
          {/* Hero Content */}
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Complete Next.js Template
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                Alles wat je nodig hebt om{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  snel te starten
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Een complete Next.js template met alle moderne tools en componenten. 
                Klaar om direct te gebruiken voor je volgende project.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                Aan de slag
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                Documentatie
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🎨</span>
                </div>
                <CardTitle className="text-xl">UI Componenten</CardTitle>
                <CardDescription className="text-base">
                  Alle ShadCN UI componenten geïnstalleerd en klaar voor gebruik
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Buttons, Forms, Cards, Dialogs, Tables en nog veel meer componenten voor een professionele interface.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🔒</span>
                </div>
                <CardTitle className="text-xl">Supabase Ready</CardTitle>
                <CardDescription className="text-base">
                  Database, Auth en RLS voorbereid voor je backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  PostgreSQL database met authenticatie en row-level security voor veilige data-opslag.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">✨</span>
                </div>
                <CardTitle className="text-xl">Modern Stack</CardTitle>
                <CardDescription className="text-base">
                  TypeScript, Tailwind, Framer Motion en meer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Alle moderne tools voor een professionele ontwikkelervaring en optimale performance.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <Card className="border-0 bg-card/30 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckIcon className="h-6 w-6 text-green-500" />
                <CardTitle className="text-2xl">Wat is er allemaal geïnstalleerd?</CardTitle>
              </div>
              <CardDescription className="text-lg">
                Een overzicht van alle features in deze template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}