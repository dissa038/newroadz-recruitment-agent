import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Next.js Template</h3>
            <p className="text-sm text-muted-foreground">
              Een complete template met alle moderne tools en componenten voor je volgende project.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Componenten</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>ShadCN UI</li>
              <li>Tailwind CSS</li>
              <li>Framer Motion</li>
              <li>React Icons</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Backend</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Supabase</li>
              <li>PostgreSQL</li>
              <li>Authentication</li>
              <li>Row Level Security</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>TypeScript</li>
              <li>Zod Validatie</li>
              <li>React Hook Form</li>
              <li>Next.js 15</li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 Next.js Template. Alle rechten voorbehouden.
          </p>
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Voorwaarden</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}