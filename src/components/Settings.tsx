
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export const Settings: React.FC = () => {
  const { toast } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    name: 'Admin User',
    email: 'admin@edgegpt.com',
    role: 'Administrator',
    bio: 'System administrator with full access rights to the Vantrix platform.',
  });

  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: true,
    sessionTimeout: '30',
    passwordLastChanged: '2024-04-15',
    receiveAlerts: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
    systemStatus: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareUsageData: true,
    saveSearchHistory: true,
    allowPersonalization: true,
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const handleSecurityUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Security Settings Updated",
      description: "Your security preferences have been successfully updated.",
    });
  };

  const handleToggleChange = (setting: string, value: boolean) => {
    if (setting.startsWith('notification')) {
      setNotificationSettings({
        ...notificationSettings,
        [setting.replace('notification-', '')]: value,
      });
    } else if (setting.startsWith('privacy')) {
      setPrivacySettings({
        ...privacySettings,
        [setting.replace('privacy-', '')]: value,
      });
    } else if (setting === 'twoFactorEnabled') {
      setSecurityForm({
        ...securityForm,
        twoFactorEnabled: value,
      });
    } else if (setting === 'receiveAlerts') {
      setSecurityForm({
        ...securityForm,
        receiveAlerts: value,
      });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSecurityForm({
      ...securityForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt="Profile" />
                    <AvatarFallback className="text-lg">AU</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input 
                      name="role"
                      value={profileForm.role}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Role cannot be changed. Contact system administrator.</p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea 
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit">Update Profile</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecurityUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch 
                      checked={securityForm.twoFactorEnabled}
                      onCheckedChange={(checked) => handleToggleChange('twoFactorEnabled', checked)}
                    />
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Timeout (minutes)</label>
                    <Select 
                      value={securityForm.sessionTimeout}
                      onValueChange={(value) => setSecurityForm({...securityForm, sessionTimeout: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Automatically log out after period of inactivity</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="flex items-center">
                      <div className="text-sm">
                        Last changed: <span className="text-muted-foreground">{securityForm.passwordLastChanged}</span>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        Change Password
                      </Button>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Security Alerts</h3>
                      <p className="text-sm text-muted-foreground">Receive alerts about unusual account activity</p>
                    </div>
                    <Switch 
                      checked={securityForm.receiveAlerts}
                      onCheckedChange={(checked) => handleToggleChange('receiveAlerts', checked)}
                    />
                  </div>

                  <div className="pt-6">
                    <Button type="submit">Save Security Settings</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage your API keys and access tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Primary API Key</h3>
                      <p className="text-sm text-muted-foreground">Created on May 1, 2025</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Reveal</Button>
                      <Button variant="outline" size="sm" className="ml-2">Regenerate</Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Secondary API Key</h3>
                      <p className="text-sm text-muted-foreground">Created on May 10, 2025</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Reveal</Button>
                      <Button variant="outline" size="sm" className="ml-2">Regenerate</Button>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="mt-2">Create New API Key</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive system notifications via email</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleToggleChange('notification-emailNotifications', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get notified about important security events</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={(checked) => handleToggleChange('notification-securityAlerts', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Product Updates</h3>
                    <p className="text-sm text-muted-foreground">Stay informed about new features and improvements</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.productUpdates}
                    onCheckedChange={(checked) => handleToggleChange('notification-productUpdates', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Status</h3>
                    <p className="text-sm text-muted-foreground">Receive alerts about system performance and outages</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.systemStatus}
                    onCheckedChange={(checked) => handleToggleChange('notification-systemStatus', checked)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  toast({
                    title: "Notification Settings Saved",
                    description: "Your notification preferences have been updated.",
                  });
                }}
              >
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control how your data is used and stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Usage Data Collection</h3>
                    <p className="text-sm text-muted-foreground">Allow system to collect anonymized usage data to improve services</p>
                  </div>
                  <Switch 
                    checked={privacySettings.shareUsageData}
                    onCheckedChange={(checked) => handleToggleChange('privacy-shareUsageData', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Search History</h3>
                    <p className="text-sm text-muted-foreground">Save your search history for improved results and suggestions</p>
                  </div>
                  <Switch 
                    checked={privacySettings.saveSearchHistory}
                    onCheckedChange={(checked) => handleToggleChange('privacy-saveSearchHistory', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Personalization</h3>
                    <p className="text-sm text-muted-foreground">Allow system to personalize your experience based on your behavior</p>
                  </div>
                  <Switch 
                    checked={privacySettings.allowPersonalization}
                    onCheckedChange={(checked) => handleToggleChange('privacy-allowPersonalization', checked)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  toast({
                    title: "Privacy Settings Saved",
                    description: "Your privacy preferences have been updated.",
                  });
                }}
              >
                Save Privacy Settings
              </Button>

              <div className="bg-muted/30 p-4 rounded-md mt-6">
                <h3 className="font-medium mb-2">Data Management Options</h3>
                <p className="text-sm text-muted-foreground mb-4">These actions will affect your personal data stored in the system</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Download My Data
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                    Delete Search History
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
