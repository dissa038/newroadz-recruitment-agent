"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Key, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading, supabase } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Wachtwoorden komen niet overeen",
        description: "Het nieuwe wachtwoord en bevestiging moeten hetzelfde zijn.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Wachtwoord te kort",
        description: "Het nieuwe wachtwoord moet minimaal 6 karakters lang zijn.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast({
          title: "Wachtwoord wijzigen mislukt",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Wachtwoord gewijzigd",
          description: "Je wachtwoord is succesvol gewijzigd.",
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast({
        title: "Er is een fout opgetreden",
        description: "Probeer het later opnieuw.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      });

      if (error) {
        toast({
          title: "Wachtwoord reset mislukt",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Wachtwoord reset verzonden",
          description: "Check je email voor instructies om je wachtwoord te resetten.",
        });
      }
    } catch (error) {
      toast({
        title: "Er is een fout opgetreden",
        description: "Probeer het later opnieuw.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Instellingen</h1>
          <p className="text-muted-foreground">
            Beheer je account instellingen en beveiliging.
          </p>
        </div>

        <Separator />

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Account Informatie</span>
            </CardTitle>
            <CardDescription>
              Je basis account gegevens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email adres</Label>
              <Input value={user?.email || ''} disabled />
              <p className="text-sm text-muted-foreground">
                Je email adres kan momenteel niet worden gewijzigd.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Account aangemaakt</Label>
              <Input 
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : ''} 
                disabled 
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Wachtwoord Wijzigen</span>
            </CardTitle>
            <CardDescription>
              Wijzig je wachtwoord voor betere beveiliging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nieuw wachtwoord"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Bevestig nieuw wachtwoord"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Wachtwoord Wijzigen
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Reset */}
        <Card>
          <CardHeader>
            <CardTitle>Wachtwoord Reset</CardTitle>
            <CardDescription>
              Stuur een wachtwoord reset link naar je email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Je ontvangt een email met instructies om je wachtwoord te resetten.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" onClick={handlePasswordReset} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verstuur Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Gevaarlijke Zone</span>
            </CardTitle>
            <CardDescription>
              Permanente acties die niet ongedaan gemaakt kunnen worden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Account verwijdering is momenteel niet beschikbaar. Neem contact op met support als je je account wilt verwijderen.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
