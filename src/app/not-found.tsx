import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <Card>
          <CardHeader>
            <div className="text-6xl font-bold text-muted-foreground mb-4">
              404
            </div>
            <CardTitle className="text-2xl">Pagina Niet Gevonden</CardTitle>
            <CardDescription className="text-base">
              De pagina die je zoekt bestaat niet of is verplaatst.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/">Terug naar Home</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/about">Over Ons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}