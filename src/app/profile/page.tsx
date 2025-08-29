"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Save, User, Mail, Phone, MapPin, Building, Briefcase, Globe, Linkedin, Twitter, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type UserProfile } from "@/types/database";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function ProfilePage() {
  const { user, profile, updateProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        location: profile.location || '',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        twitter_url: profile.twitter_url || '',
        github_url: profile.github_url || '',
      });
    }
  }, [profile, isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateProfile(formData);
    
    if (!result.error) {
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profiel is succesvol bijgewerkt.",
      });
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (authLoading && !isAuthenticated) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayName = profile?.full_name || profile?.first_name || user?.email?.split('@')[0] || 'User';
  const initials = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            {profile?.job_title && profile?.company && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{profile.job_title} at {profile.company}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Persoonlijke Informatie</span>
              </CardTitle>
              <CardDescription>
                Beheer je persoonlijke gegevens en contactinformatie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Voornaam</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Voornaam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Achternaam</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Achternaam"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+31 6 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Vertel iets over jezelf..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Professionele Informatie</span>
              </CardTitle>
              <CardDescription>
                Je werk en professionele achtergrond.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Functietitel</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title || ''}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Senior Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Bedrijf</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Newroadz"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Locatie</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Amsterdam, Nederland"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Social Links</span>
              </CardTitle>
              <CardDescription>
                Je online aanwezigheid en sociale media profielen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://jouwwebsite.nl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url || ''}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/jouwprofiel"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter_url">Twitter</Label>
                  <Input
                    id="twitter_url"
                    value={formData.twitter_url || ''}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/jouwhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub</Label>
                  <Input
                    id="github_url"
                    value={formData.github_url || ''}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                    placeholder="https://github.com/jouwusername"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Profiel Opslaan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
