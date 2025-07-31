"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomSwiperPagination } from "@/components/ui/custom-swiper-pagination";
import { 
  CodeIcon, 
  DatabaseIcon, 
  PaletteIcon, 
  ShieldIcon, 
  ZapIcon, 
  SmartphoneIcon 
} from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export function Features() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: <CodeIcon className="h-8 w-8" />,
      title: "TypeScript First",
      description: "Volledig type-safe ontwikkeling met TypeScript configuratie out-of-the-box.",
      badge: "Developer Experience"
    },
    {
      icon: <PaletteIcon className="h-8 w-8" />,
      title: "Design System",
      description: "Complete UI component library met ShadCN UI en Tailwind CSS styling.",
      badge: "UI/UX"
    },
    {
      icon: <DatabaseIcon className="h-8 w-8" />,
      title: "Supabase Backend",
      description: "PostgreSQL database met authenticatie en real-time functionaliteiten.",
      badge: "Backend"
    },
    {
      icon: <ShieldIcon className="h-8 w-8" />,
      title: "Form Validatie",
      description: "Robuuste formulier validatie met Zod en React Hook Form integratie.",
      badge: "Validatie"
    },
    {
      icon: <ZapIcon className="h-8 w-8" />,
      title: "Performance",
      description: "Geoptimaliseerd voor snelheid met Next.js 15 en moderne build tools.",
      badge: "Optimalisatie"
    },
    {
      icon: <SmartphoneIcon className="h-8 w-8" />,
      title: "Responsive Design",
      description: "Mobile-first ontwerp dat perfect werkt op alle apparaten en schermformaten.",
      badge: "Responsive"
    }
  ];

  const handleSlideChange = (swiper: any) => {
    setCurrentSlide(swiper.activeIndex);
  };

  const handlePaginationClick = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="mb-4">
            ✨ Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Alles wat je nodig hebt
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Een complete set van moderne tools en componenten om snel en efficiënt te ontwikkelen.
          </p>
        </div>

        {/* Desktop Grid - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Swiper - Visible only on mobile */}
        <div className="md:hidden">
          <Swiper
            modules={[Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            onSlideChange={handleSlideChange}
            initialSlide={currentSlide}
            className="features-swiper overflow-visible"
            style={{ overflow: 'visible' }}
          >
            {features.map((feature, index) => (
              <SwiperSlide key={index}>
                <Card className="relative group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {feature.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Pagination */}
          <CustomSwiperPagination
            total={features.length}
            current={currentSlide}
            onSlideChange={handlePaginationClick}
            className="mt-8"
          />
        </div>
      </div>
    </section>
  );
}