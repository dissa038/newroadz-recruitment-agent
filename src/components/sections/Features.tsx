"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { CustomSwiperPagination } from "@/components/ui/custom-swiper-pagination";
import { useSwiperPosition } from "@/hooks/useSwiperPosition";
import { useSwiperAutoHeight } from "@/hooks/useSwiperAutoHeight";
import {
  Code2,
  Database,
  Palette,
  Shield,
  Zap,
  Smartphone,
  ArrowRight
} from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export function Features() {
  const swiperRef = useRef<SwiperType | null>(null);

  // Use position hook to remember slide position
  const {
    activeIndex,
    handleSlideChange: handlePositionChange,
    initializeSwiper
  } = useSwiperPosition('features-mobile');

  // Use auto-height hook to ensure consistent slide heights
  const {
    handleSlideChangeWithAutoHeight,
    handleInitWithAutoHeight
  } = useSwiperAutoHeight({ debug: false });

  const features = [
    {
      icon: Code2,
      title: "TypeScript First",
      description: "Type-safe ontwikkeling met volledige TypeScript ondersteuning en configuratie.",
      category: "Development"
    },
    {
      icon: Palette,
      title: "Design System",
      description: "Complete UI library met ShadCN componenten en Tailwind CSS styling.",
      category: "Design"
    },
    {
      icon: Database,
      title: "Supabase Ready",
      description: "PostgreSQL database met authenticatie en real-time functionaliteiten.",
      category: "Backend"
    },
    {
      icon: Shield,
      title: "Form Validation",
      description: "Robuuste validatie met Zod en React Hook Form voor betrouwbare forms.",
      category: "Security"
    },
    {
      icon: Zap,
      title: "Performance",
      description: "Geoptimaliseerd voor snelheid met Next.js 15 en moderne build tools.",
      category: "Speed"
    },
    {
      icon: Smartphone,
      title: "Responsive",
      description: "Mobile-first design dat perfect werkt op alle apparaten en schermen.",
      category: "Mobile"
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
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Een complete toolkit voor moderne web development
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                    {feature.category}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swiper */}
        <div className="md:hidden">
          <Swiper
            modules={[Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            onSlideChange={handleSlideChange}
            onSwiper={handleSwiperInit}
            initialSlide={activeIndex}
            className="features-swiper"
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <SwiperSlide key={index}>
                  <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                        {feature.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom Pagination */}
          <CustomSwiperPagination
            total={features.length}
            current={activeIndex}
            onSlideChange={handlePaginationClick}
            className="mt-8"
          />
        </div>
      </div>
    </section>
  );
}