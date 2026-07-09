import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Moon, Sun, Download, LogOut, Trash2, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/react";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Get current theme
    const theme = document.documentElement.classList.contains('dark');
    setIsDark(theme);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/sign-in");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const handleExportData = async () => {
    toast({
      title: "Export Started",
      description: "Your data export will begin shortly.",
    });
    // TODO: Implement data export
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{user?.primaryEmailAddress?.emailAddress || "No email"}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">User ID</Label>
              <p className="text-xs font-mono text-muted-foreground">{user?.id || "Loading..."}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/profile')}
            >
              <User className="w-4 h-4 mr-2" />
              Manage Profile
            </Button>
          </CardContent>
        </Card>

        {/* Couples mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Couples Mode
            </CardTitle>
            <CardDescription>Build your financial journey with a partner</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/couples")}>
              Invite Partner
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how LifeOS looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <Label htmlFor="theme-toggle">Dark Mode</Label>
              </div>
              <Switch
                id="theme-toggle"
                checked={isDark}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => {
                toast({
                  title: "Reset System",
                  description: "This feature will be available soon.",
                });
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset System Data
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
