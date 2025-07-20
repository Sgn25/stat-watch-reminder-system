
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Building2, Lock, Save, Bell, BellOff, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useEmailSubscription } from '@/hooks/useEmailSubscription';
import { useWhatsAppSubscription } from '@/hooks/useWhatsAppSubscription';

const Profile = () => {
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSubscribed, unsubscribe, subscribe, isUnsubscribing, isSubscribing } = useEmailSubscription();
  const { 
    isSubscribed: isWhatsAppSubscribed, 
    unsubscribe: unsubscribeWhatsApp, 
    subscribe: subscribeWhatsApp, 
    isUnsubscribing: isWhatsAppUnsubscribing, 
    isSubscribing: isWhatsAppSubscribing 
  } = useWhatsAppSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!user || !fullName.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate WhatsApp number format if provided
    if (whatsappNumber && !/^\+?[1-9]\d{1,14}$/.test(whatsappNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp number (e.g., +1234567890 or 1234567890)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          whatsapp_number: whatsappNumber || null
        })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscription'] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <p className="text-gray-400 mt-1">Manage your personal information and security settings</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email (Read-only)</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="dairyUnit" className="text-gray-300">Dairy Unit (Read-only)</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-600 border border-gray-500 rounded-md">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">{profile?.dairy_unit?.name || 'Not assigned'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Dairy unit assignment cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="whatsappNumber" className="text-gray-300">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="+1234567890 (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your WhatsApp number to receive WhatsApp reminders</p>
              </div>
              <Button 
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={handleUpdatePassword}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-400" />
                Email Notifications
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your email reminder preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {isSubscribed ? (
                    <Bell className="w-5 h-5 text-green-400" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <h3 className="text-white font-medium">Email Reminders</h3>
                    <p className="text-sm text-gray-400">
                      {isSubscribed 
                        ? "You are currently receiving email reminders for user-set reminders and 5-day expiry notifications."
                        : "You are not receiving email reminders. You'll miss important notifications about parameter expirations."
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={isUnsubscribing || isSubscribing}
                  variant={isSubscribed ? "destructive" : "default"}
                  className={isSubscribed 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {isUnsubscribing || isSubscribing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : isSubscribed ? (
                    <BellOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  {isUnsubscribing ? "Unsubscribing..." : 
                   isSubscribing ? "Subscribing..." : 
                   isSubscribed ? "Unsubscribe" : "Subscribe Now"}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• User-set reminders: Custom reminders you create for specific parameters</p>
                <p>• 5-day expiry notifications: Automatic alerts for parameters expiring within 5 days</p>
                <p>• You can change this setting at any time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                WhatsApp Notifications
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your WhatsApp reminder preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!profile?.whatsapp_number ? (
                <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h3 className="text-white font-medium">WhatsApp Number Required</h3>
                      <p className="text-sm text-gray-400">
                        Add your WhatsApp number in the Personal Information section above to enable WhatsApp reminders.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isWhatsAppSubscribed ? (
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-white font-medium">WhatsApp Reminders</h3>
                      <p className="text-sm text-gray-400">
                        {isWhatsAppSubscribed 
                          ? "You are currently receiving WhatsApp reminders for user-set reminders and 5-day expiry notifications."
                          : "You are not receiving WhatsApp reminders. You'll miss important notifications about parameter expirations."
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Number: {profile.whatsapp_number}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={isWhatsAppSubscribed ? unsubscribeWhatsApp : subscribeWhatsApp}
                    disabled={isWhatsAppUnsubscribing || isWhatsAppSubscribing}
                    variant={isWhatsAppSubscribed ? "destructive" : "default"}
                    className={isWhatsAppSubscribed 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-green-600 hover:bg-green-700"
                    }
                  >
                    {isWhatsAppUnsubscribing || isWhatsAppSubscribing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : isWhatsAppSubscribed ? (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    )}
                    {isWhatsAppUnsubscribing ? "Unsubscribing..." : 
                     isWhatsAppSubscribing ? "Subscribing..." : 
                     isWhatsAppSubscribed ? "Unsubscribe" : "Subscribe Now"}
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• User-set reminders: Custom reminders you create for specific parameters</p>
                <p>• 5-day expiry notifications: Automatic alerts for parameters expiring within 5 days</p>
                <p>• You can change this setting at any time</p>
                <p>• WhatsApp number must be provided to receive WhatsApp notifications</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Profile;
