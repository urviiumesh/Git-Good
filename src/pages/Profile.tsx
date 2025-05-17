import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/AuthProvider';

// Profile form schema
const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Security settings schema
const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SecurityFormData = z.infer<typeof securitySchema>;

export const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      bio: '',
      location: '',
      company: '',
      role: '',
      website: '',
      twitter: '',
      linkedin: '',
      github: '',
    },
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: '30',
    lastActivity: new Date().toISOString(),
    passwordLastChanged: 'Never',
  });

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailDigest: true,
    marketingEmails: false,
    securityAlerts: true,
    productUpdates: true,
    communityUpdates: false,
    mentionNotifications: true,
    commentReplies: true,
    directMessages: true,
    newFollowers: false,
    deliveryMethod: 'email',
    frequency: 'daily',
    lastUpdated: new Date().toISOString(),
  });

  // Load security settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('securitySettings');
    if (storedSettings) {
      setSecuritySettings(prev => ({
        ...prev,
        ...JSON.parse(storedSettings)
      }));
    }
  }, []);

  // Save security settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  // Load notification preferences from localStorage on mount
  useEffect(() => {
    const storedPreferences = localStorage.getItem('notificationPreferences');
    if (storedPreferences) {
      setNotificationPreferences(prev => ({
        ...prev,
        ...JSON.parse(storedPreferences)
      }));
    }
  }, []);

  // Save notification preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
  }, [notificationPreferences]);

  // Security form
  const {
    register: registerSecurity,
    handleSubmit: handleSubmitSecurity,
    formState: { errors: securityErrors },
    reset: resetSecurity,
  } = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
  });

  // Update form with user data when available
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.name || '',
        email: user.email || '',
        bio: '', // Can be extended if we store additional user data
        location: '',
        company: '',
        role: '',
        website: '',
        twitter: '',
        linkedin: '',
        github: '',
      });
    }
  }, [user, reset]);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate file upload
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        clearInterval(interval);
        setUploadProgress(100);
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been successfully updated.",
        });
      };
      reader.readAsDataURL(file);
    }, 2000);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual profile update logic
      console.log('Profile data:', data);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySettingChange = (setting: string, value: boolean | string) => {
    setSecuritySettings((prev) => {
      const updated = {
        ...prev,
        [setting]: value,
      };
      
      // If this is the 2FA toggle, show appropriate message
      if (setting === 'twoFactorEnabled') {
        if (value) {
          toast({
            title: "Two-factor authentication enabled",
            description: "Your account is now more secure with 2FA enabled.",
          });
        } else {
          toast({
            title: "Two-factor authentication disabled",
            description: "2FA has been turned off. Your account is less secure.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Security settings updated",
          description: "Your security preferences have been saved.",
        });
      }
      
      return updated;
    });
  };

  const handleChangePassword = async (data: SecurityFormData) => {
    setIsPasswordChanging(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update password last changed date
      setSecuritySettings(prev => ({
        ...prev,
        passwordLastChanged: new Date().toLocaleDateString()
      }));
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      
      // Close the form and reset
      setPasswordFormOpen(false);
      resetSecurity();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  // Format the ISO date to a readable format
  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return isoDate;
    }
  };

  const handleNotificationPreferenceChange = (preference: string, value: boolean | string) => {
    setNotificationPreferences((prev) => {
      const updated = {
        ...prev,
        [preference]: value,
        lastUpdated: new Date().toISOString(),
      };
      
      // Show appropriate notification
      const readablePreference = preference
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/([a-z])([A-Z])/g, '$1 $2');
      
      if (typeof value === 'boolean') {
        toast({
          title: `${value ? 'Enabled' : 'Disabled'}: ${readablePreference}`,
          description: `You will ${value ? 'now' : 'no longer'} receive these notifications.`,
        });
      } else {
        toast({
          title: "Notification preferences updated",
          description: `${readablePreference} set to "${value}".`,
        });
      }
      
      return updated;
    });
  };

  // Show a loading state if user data is not yet available
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            <Icons.arrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how others see you on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileImage || undefined} />
                        <AvatarFallback className="text-2xl">
                          {watch('fullName') ? getInitials(watch('fullName')) : user?.name ? getInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0">
                        <Label
                          htmlFor="profile-image"
                          className="cursor-pointer rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
                        >
                          <Icons.camera className="h-4 w-4" />
                        </Label>
                        <input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageUpload}
                        />
                      </div>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full max-w-xs">
                        <Progress value={uploadProgress} className="mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        {...register('fullName')}
                        disabled={isLoading}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          disabled={true} // Google auth email should not be editable
                        />
                        {user?.authProvider === 'google' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Badge variant="outline" className="h-6 gap-1 px-2 text-xs bg-primary/5">
                              <Icons.google className="h-3 w-3" />
                              <span>Google</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                      {user?.authProvider === 'google' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Email is managed by your Google account
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        {...register('location')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        {...register('company')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        {...register('role')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      disabled={isLoading}
                      className="min-h-[100px]"
                    />
                    {errors.bio && (
                      <p className="text-sm text-destructive">{errors.bio.message}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          {...register('website')}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          {...register('twitter')}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          {...register('linkedin')}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          {...register('github')}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {user?.authProvider === 'google' ? (
                  <div className="rounded-md bg-primary/5 p-4">
                    <div className="flex items-start">
                      <Icons.google className="mt-1 h-5 w-5 text-primary" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium">Google Authentication</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your account is secured through Google's authentication. 
                          For additional security settings, visit your Google account.
                        </p>
                        <Button className="mt-3" variant="outline" size="sm" asChild>
                          <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                            <Icons.externalLink className="mr-2 h-4 w-4" />
                            Google Security Settings
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {securitySettings.twoFactorEnabled && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Icons.check className="mr-1 h-3 w-3" />
                            Enabled
                          </Badge>
                        )}
                        <Switch
                          checked={securitySettings.twoFactorEnabled}
                          onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
                        />
                      </div>
                    </div>

                    {securitySettings.twoFactorEnabled && (
                      <div className="ml-6 mt-2 p-3 rounded-md bg-muted/50">
                        <div className="flex items-center">
                          <div className="h-10 w-10 text-primary/70 mr-3 flex items-center justify-center">
                            <Icons.smartphone className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-medium">Authenticator app</h4>
                            <p className="text-sm text-muted-foreground">
                              Authentication codes from your authenticator app are used for verification
                            </p>
                            <div className="mt-2">
                              <Button variant="outline" size="sm">
                                <Icons.refreshCw className="mr-2 h-3 w-3" />
                                Reconfigure
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Security Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get alerts about important security events
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          handleSecuritySettingChange('emailNotifications', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Login Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone logs into your account
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.loginAlerts}
                        onCheckedChange={(checked) =>
                          handleSecuritySettingChange('loginAlerts', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Session Timeout</Label>
                      <Select
                        value={securitySettings.sessionTimeout}
                        onValueChange={(value) =>
                          handleSecuritySettingChange('sessionTimeout', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after period of inactivity
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        {securitySettings.passwordLastChanged !== 'Never' && (
                          <Badge variant="outline" className="text-xs">
                            <Icons.calendar className="mr-1 h-3 w-3" />
                            Last changed: {securitySettings.passwordLastChanged}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {securitySettings.passwordLastChanged === 'Never' ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => setPasswordFormOpen(true)}
                          >
                            <Icons.shieldAlert className="mr-2 h-4 w-4" />
                            Set First Password
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPasswordFormOpen(true)}
                          >
                            <Icons.lock className="mr-2 h-4 w-4" />
                            Change Password
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Active Sessions</Label>
                      <div className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                              <Icons.laptop className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Current device</p>
                              <p className="text-xs text-muted-foreground">Last active: Just now</p>
                            </div>
                          </div>
                          <Badge>Current</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Password Change Dialog */}
            {passwordFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitSecurity(handleChangePassword)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...registerSecurity("currentPassword")}
                          disabled={isPasswordChanging}
                        />
                        {securityErrors.currentPassword && (
                          <p className="text-sm text-destructive">{securityErrors.currentPassword.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...registerSecurity("newPassword")}
                          disabled={isPasswordChanging}
                        />
                        {securityErrors.newPassword && (
                          <p className="text-sm text-destructive">{securityErrors.newPassword.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...registerSecurity("confirmPassword")}
                          disabled={isPasswordChanging}
                        />
                        {securityErrors.confirmPassword && (
                          <p className="text-sm text-destructive">{securityErrors.confirmPassword.message}</p>
                        )}
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setPasswordFormOpen(false)} disabled={isPasswordChanging}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitSecurity(handleChangePassword)} disabled={isPasswordChanging}>
                      {isPasswordChanging && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you'd like to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-md mb-6">
                  <h3 className="font-medium mb-2">Delivery Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred Method</Label>
                      <Select 
                        value={notificationPreferences.deliveryMethod}
                        onValueChange={(value) =>
                          handleNotificationPreferenceChange('deliveryMethod', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="push">Push Notifications</SelectItem>
                          <SelectItem value="both">Email & Push</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select 
                        value={notificationPreferences.frequency}
                        onValueChange={(value) =>
                          handleNotificationPreferenceChange('frequency', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    <Icons.calendar className="inline-block h-3 w-3 mr-1" />
                    Last updated: {formatDate(notificationPreferences.lastUpdated)}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium mb-2">System Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about security-related events
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notificationPreferences.securityAlerts && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-100">
                          <Icons.check className="mr-1 h-3 w-3" />
                          On
                        </Badge>
                      )}
                      <Switch
                        checked={notificationPreferences.securityAlerts}
                        onCheckedChange={(checked) =>
                          handleNotificationPreferenceChange('securityAlerts', checked)
                        }
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Product Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Stay informed about new features and improvements
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.productUpdates}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('productUpdates', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a summary of your activity
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.emailDigest}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('emailDigest', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.marketingEmails}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('marketingEmails', checked)
                      }
                    />
                  </div>
                  <Separator className="my-6" />
                  <h3 className="font-medium mb-2">Social Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you receive a direct message
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.directMessages}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('directMessages', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mentions</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone mentions you
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.mentionNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('mentionNotifications', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Comment Replies</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone replies to your comment
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.commentReplies}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('commentReplies', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Followers</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone follows you
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.newFollowers}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('newFollowers', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Community Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about community events and discussions
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.communityUpdates}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferenceChange('communityUpdates', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto"
                  onClick={() => {
                    setNotificationPreferences({
                      emailDigest: true,
                      marketingEmails: false,
                      securityAlerts: true,
                      productUpdates: true,
                      communityUpdates: false,
                      mentionNotifications: true,
                      commentReplies: true,
                      directMessages: true,
                      newFollowers: false,
                      deliveryMethod: 'email',
                      frequency: 'daily',
                      lastUpdated: new Date().toISOString(),
                    });
                    
                    toast({
                      title: "Notification preferences reset",
                      description: "Your notification settings have been reset to defaults.",
                    });
                  }}
                >
                  <Icons.refreshCw className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          
        </Tabs>
      </div>
    </div>
  );
}; 