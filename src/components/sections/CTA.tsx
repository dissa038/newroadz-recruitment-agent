import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, GithubIcon } from "lucide-react";

export function CTA() {
    return (
        <section className="py-24 bg-muted/50">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
                    <CardContent className="relative p-12 text-center">
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Klaar om te beginnen?
                            </h2>
                            <p className="text-xl text-muted-foreground">
                                Download deze template en start direct met het bouwen van je volgende project.
                                Alle tools en componenten zijn al voor je geconfigureerd.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button size="lg" className="gap-2">
                                    <GithubIcon className="h-5 w-5" />
                                    Download Template
                                </Button>
                                <Button variant="outline" size="lg" className="gap-2">
                                    Bekijk Documentatie
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}