import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, Mail, Shield, Calendar } from 'lucide-react';
import { useHighestRole } from '@/hooks/useUserRole';

export default function Profile() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useHighestRole();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
      setFullName(profileData.full_name || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setEditing(false);
      loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    const roleColors = {
      owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      member: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      guest: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    };

    const roleClass = role ? roleColors[role] : roleColors.guest;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleClass}`}>
        {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Loading...'}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              {editing ? (
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <p className="text-sm font-medium mt-1">{profile?.full_name || 'Not set'}</p>
              )}
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Role</Label>
              <div className="mt-2">
                {getRoleBadge()}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              {editing ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFullName(profile?.full_name || '');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} variant="outline" className="w-full">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Details
            </CardTitle>
            <CardDescription>Your account information and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">User ID</Label>
              <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                {user.id}
              </p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Account Created</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Last Sign In</Label>
              <p className="text-sm mt-1">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Email Verified</Label>
              <p className="text-sm mt-1">
                {user.email_confirmed_at ? (
                  <span className="text-success">✓ Verified</span>
                ) : (
                  <span className="text-warning">Pending verification</span>
                )}
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/security')}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}