import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Over Ons | Next.js Template',
    description: 'Leer meer over ons team en onze missie om geweldige web applicaties te bouwen.',
};

// Simulate async data fetching
async function getAboutData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        title: 'Over Ons',
        subtitle: 'Wij bouwen de toekomst van web applicaties',
        description: 'Ons team bestaat uit gepassioneerde developers die moderne, schaalbare en gebruiksvriendelijke applicaties bouwen met de nieuwste technologieën.',
        features: [
            {
                title: 'Modern Tech Stack',
                description: 'We gebruiken Next.js, React, TypeScript en andere cutting-edge technologieën.',
            },
            {
                title: 'AI Integration',
                description: 'Onze applicaties maken gebruik van de nieuwste AI technologieën zoals Google Gemini.',
            },
            {
                title: 'Scalable Architecture',
                description: 'We bouwen applicaties die meegroeien met je business behoeften.',
            },
        ],
        stats: [
            { label: 'Projecten Voltooid', value: '50+' },
            { label: 'Tevreden Klanten', value: '100+' },
            { label: 'Jaren Ervaring', value: '5+' },
        ],
    };
}

export default async function AboutPage() {
    const data = await getAboutData();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-bold tracking-tight">{data.title}</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {data.subtitle}
                </p>
            </div>

            {/* Description */}
            <div className="max-w-3xl mx-auto mb-12">
                <p className="text-lg leading-relaxed text-center">
                    {data.description}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {data.stats.map((stat, index) => (
                    <Card key={index} className="text-center">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-primary">
                                {stat.value}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {stat.label}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Features */}
            <div className="space-y-8 mb-12">
                <h2 className="text-3xl font-bold text-center">Wat Wij Doen</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.features.map((feature, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="text-center space-y-4">
                <h3 className="text-2xl font-semibold">Klaar om te beginnen?</h3>
                <p className="text-muted-foreground">
                    Neem contact met ons op en laten we samen iets geweldigs bouwen.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button asChild>
                        <Link href="/contact">Contact Opnemen</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/">Terug naar Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}