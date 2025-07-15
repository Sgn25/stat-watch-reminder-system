
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDairyUnits } from '@/hooks/useDairyUnits';

export const AuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedDairyUnit, setSelectedDairyUnit] = useState('');
  const { toast } = useToast();
  const { dairyUnits, isLoading: unitsLoading } = useDairyUnits();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDairyUnit) {
      toast({
        title: "Error",
        description: "Please select a dairy unit",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUUID(selectedDairyUnit)) {
      toast({
        title: "Error",
        description: "Invalid dairy unit selected. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            dairy_unit_id: selectedDairyUnit,
          },
          emailRedirectTo: `${window.location.origin}/email-verified`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      // Show the full error object if available
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error),
        variant: "destructive",
      });
      // Optionally log error for debugging
      // console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/auth-bg.jpg)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Stat Monitor</h1>
          <p className="text-gray-200">Monitor your Licenses/Permits/Contracts</p>
        </div>

        {/* Glassmorphism Vista-style Card */}
        <div className="glass-card-vista shadow-2xl">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-tabs-vista">
              <TabsTrigger value="signin" className="glass-tab-trigger-vista">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="glass-tab-trigger-vista">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle className="text-white">Welcome back</CardTitle>
                <CardDescription className="text-gray-200">
                  Sign in to your stat monitor account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-gray-200">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="glass-input-vista"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-gray-200">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="glass-input-vista"
                      required
                    />
                  </div>
                  <div className="flex justify-end mt-1 mb-2">
                    <a
                      href="/forgot-password"
                      className="text-blue-400 hover:text-blue-600 text-sm font-medium transition-colors underline"
                      style={{ textDecorationThickness: 2 }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <Button type="submit" className="w-full glass-btn-vista" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle className="text-white">Create account</CardTitle>
                <CardDescription className="text-gray-200">
                  Join your dairy unit management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="text-gray-200">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="glass-input-vista"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="text-gray-200">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="glass-input-vista"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-gray-200">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="glass-input-vista"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-dairy" className="text-gray-200">Dairy Unit</Label>
                    <Select value={selectedDairyUnit} onValueChange={setSelectedDairyUnit}>
                      <SelectTrigger className="glass-input-vista">
                        <SelectValue placeholder="Select dairy unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitsLoading ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : (
                          dairyUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full glass-btn-vista" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
