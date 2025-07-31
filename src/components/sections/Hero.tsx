"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomSwiperPagination } from "@/components/ui/custom-swiper-pagination";
import { useSwiperPosition } from "@/hooks/useSwiperPosition";
import { useSwiperAutoHeight } from "@/hooks/useSwiperAutoHeight";
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Palette, 
  Database, 
  Code2,
  BookOpen
} from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export function Hero() {
  const swiperRef = useRef<SwiperType | null>(null);
  
  // Use position hook to remember slide position
  const { 
    activeIndex, 
    handleSlideChange: handlePositionChange, 
    initializeSwiper 
  } = useSwiperPosition('hero-highlights');
  
  // Use auto-height hook to ensure consistent slide heights
  const { 
    handleSlideChangeWithAutoHeight, 
    handleInitWithAutoHeight 
  } = useSwiperAutoHeight({ debug: false });

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

  const highlights = [
    {
      icon: Palette,
      title: "UI Componenten",
      description: "Complete ShadCN UI library met moderne componenten",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Database,
      title: "Supabase Ready",
      description: "Database, Auth en RLS volledig geconfigureerd",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Code2,
      title: "Modern Stack",
      description: "TypeScript, Tailwind en alle moderne tools",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  // Combined slide change handler
  const handleSlideChange = (swiper: SwiperType) => {
    handlePositionChange(swiper);
    handleSlideChangeWithAutoHeight(swiper);
  };

  // Combined swiper initialization
  const handleSwiperInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;
    initializeSwiper(swiper);
    handleInitWithAutoHeight(swiper);
  };

  const handlePaginationClick = (index: number) => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(index);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
        <div className="space-y-20">
          {/* Hero Content */}
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Complete Next.js Template
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Alles wat je nodig hebt om{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  snel te starten
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Een complete Next.js template met alle moderne tools en componenten. 
                Klaar om direct te gebruiken voor je volgende project.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="gap-2 px-8 py-3 text-base">
                Aan de slag
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 text-base gap-2">
                <BookOpen className="h-4 w-4" />
                Documentatie
              </Button>
            </div>
          </div>

          {/* Highlight Cards - Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {highlights.map((highlight, index) => {
              const IconComponent = highlight.icon;
              return (
                <div
                  key={index}
                  className="group relative p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${highlight.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {highlight.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Highlight Cards - Mobile Swiper */}
          <div className="md:hidden max-w-sm mx-auto">
            <Swiper
              modules={[Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              onSlideChange={handleSlideChange}
              onSwiper={handleSwiperInit}
              initialSlide={activeIndex}
              className="highlights-swiper"
            >
              {highlights.map((highlight, index) => {
                const IconComponent = highlight.icon;
                return (
                  <SwiperSlide key={index}>
                    <div className="p-6 rounded-2xl bg-card/50 border border-border/50 shadow-sm">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${highlight.gradient} flex items-center justify-center mb-4`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          {highlight.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Custom Pagination */}
            <CustomSwiperPagination
              total={highlights.length}
              current={activeIndex}
              onSlideChange={handlePaginationClick}
              className="mt-6"
            />
          </div>

          {/* Features List */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold">Wat is er allemaal geïnstalleerd?</h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                Een overzicht van alle features in deze template
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-card/30 border border-border/30 hover:bg-card/50 hover:border-border/50 transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="font-medium text-sm md:text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}