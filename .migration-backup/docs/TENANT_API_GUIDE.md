# Tenant Operations API Guide

Complete guide for implementing multi-tenant features in LifeOS frontend.

---

## Authentication

All endpoints require authentication via JWT token in Authorization header:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

---

## Endpoints

### 1. List Tenants

Get all tenants where user is a member.

**Request:**
```http
GET /tenant-operations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tenants": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Magaya Family",
      "slug": "magaya-family",
      "plan": "pro",
      "role": "owner",
      "member_count": 4,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Work Workspace",
      "slug": "work-workspace",
      "plan": "free",
      "role": "member",
      "member_count": 12,
      "created_at": "2024-02-01T00:00:00Z",
      "updated_at": "2024-02-01T00:00:00Z"
    }
  ]
}
```

**Use Cases:**
- Workspace selector dropdown
- Initial tenant selection after login
- Switching between workspaces

---

### 2. Create Tenant

Create a new workspace. User becomes owner.

**Request:**
```http
POST /tenant-operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My New Workspace",
  "slug": "my-new-workspace"  // optional
}
```

**Response:**
```json
{
  "tenant": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "My New Workspace",
    "slug": "my-new-workspace",
    "plan": "free",
    "role": "owner",
    "member_count": 1,
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-01T00:00:00Z"
  }
}
```

**Validation:**
- `name`: Required, 1-100 characters
- `slug`: Optional, auto-generated from name if omitted
  - Format: lowercase, numbers, hyphens only
  - 3-50 characters
  - Must be globally unique

**Use Cases:**
- "Create Workspace" button
- Onboarding flow
- Team/family setup

---

### 3. Get Tenant Details

Get details of a specific tenant.

**Request:**
```http
GET /tenant-operations?tenant_id=<tenant_id>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Magaya Family",
    "slug": "magaya-family",
    "plan": "pro",
    "role": "owner",
    "member_count": 4,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `403`: User not a member of this tenant

**Use Cases:**
- Workspace settings page
- Displaying current workspace info
- Permission checks

---

### 4. Update Tenant

Update tenant details. Requires owner or admin role.

**Request:**
```http
PATCH /tenant-operations?tenant_id=<tenant_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Workspace Name"
}
```

**Response:**
```json
{
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Workspace Name",
    "slug": "magaya-family",
    "plan": "pro",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

**Validation:**
- `name`: Optional, 1-100 characters if provided

**Permissions:**
- Owner: Can update
- Admin: Can update
- Member: Cannot update
- Viewer: Cannot update

**Use Cases:**
- Workspace settings
- Renaming workspace

---

### 5. Delete Tenant

Delete tenant and all its data. Owner only.

**Request:**
```http
DELETE /tenant-operations?tenant_id=<tenant_id>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Tenant deleted successfully"
}
```

**⚠️ Warning:** This permanently deletes:
- Tenant record
- All memberships
- All user data (metrics, logs, projects, habits, calendar)
- Cannot be undone

**Permissions:**
- Owner: Can delete
- Admin: Cannot delete
- Member: Cannot delete
- Viewer: Cannot delete

**Use Cases:**
- Workspace settings > Delete workspace
- Account closure flow

---

### 6. List Members

List all members of a tenant.

**Request:**
```http
GET /tenant-operations/members?tenant_id=<tenant_id>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "members": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "user_id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "status": "active",
      "joined_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "user_id": "bb0e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "status": "active",
      "joined_at": "2024-01-15T00:00:00Z"
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "user_id": null,
      "name": null,
      "email": "pending@example.com",
      "role": "member",
      "status": "pending",
      "joined_at": "2024-03-10T00:00:00Z"
    }
  ]
}
```

**Member Status:**
- `active`: User has accepted invitation
- `pending`: User invited but not yet accepted
- `revoked`: User removed from workspace

**Permissions:**
- All members can view member list

**Use Cases:**
- Members page
- Team directory
- Permission management UI

---

### 7. Invite Member

Invite a new member to the tenant. Owner/admin only.

**Request:**
```http
POST /tenant-operations/members?tenant_id=<tenant_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response:**
```json
{
  "membership": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "user_id": null,
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "member",
    "status": "pending",
    "invited_email": "newmember@example.com",
    "invited_by": "990e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-03-15T10:30:00Z",
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

**Validation:**
- `email`: Required, valid email format
- `role`: Required, one of: `admin`, `member`, `viewer`

**Behavior:**
- If user exists: Status = `active`, user_id populated
- If user doesn't exist: Status = `pending`, invitation email sent

**Permissions:**
- Owner: Can invite with any role
- Admin: Can invite with roles: member, viewer (not admin)
- Member: Cannot invite
- Viewer: Cannot invite

**Errors:**
- `400`: Invalid email
- `409`: User already member of tenant
- `403`: Insufficient permissions

**Use Cases:**
- Invite team member button
- Bulk member import
- Sharing workspace

---

### 8. Update Member Role

Change a member's role. Owner/admin only.

**Request:**
```http
PATCH /tenant-operations/members?tenant_id=<tenant_id>&member_id=<member_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Response:**
```json
{
  "membership": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "user_id": "bb0e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "admin",
    "status": "active",
    "created_at": "2024-01-15T00:00:00Z",
    "updated_at": "2024-03-15T10:45:00Z"
  }
}
```

**Validation:**
- `role`: Required, one of: `owner`, `admin`, `member`, `viewer`

**Business Rules:**
- Cannot change owner role (must use transfer ownership)
- Only owner can assign owner role
- Admin can change: member ↔ viewer
- Admin cannot promote to admin or owner

**Permissions:**
- Owner: Can change any role (except owner)
- Admin: Can change member/viewer roles only
- Member: Cannot change roles
- Viewer: Cannot change roles

**Errors:**
- `400`: Member not found
- `403`: Insufficient permissions
- `403`: Cannot change owner role

**Use Cases:**
- Member management page
- Promote/demote members
- Role-based access control

---

### 9. Remove Member

Remove a member from the tenant. Owner/admin only.

**Request:**
```http
DELETE /tenant-operations/members?tenant_id=<tenant_id>&member_id=<member_id>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

**Business Rules:**
- Cannot remove owner (must transfer ownership first)
- User loses access to all tenant data immediately
- User's data remains but becomes inaccessible

**Permissions:**
- Owner: Can remove admin/member/viewer
- Admin: Can remove member/viewer (not other admins)
- Member: Cannot remove
- Viewer: Cannot remove

**Errors:**
- `400`: Member not found
- `403`: Insufficient permissions
- `403`: Cannot remove owner

**Use Cases:**
- Member management page
- Revoke access
- Clean up inactive members

---

## Error Handling

All endpoints return standard error format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `429 Too Many Requests`: Rate limited
- `500 Internal Server Error`: Server error

**Example Error Response:**
```json
{
  "error": "Only owners and admins can invite members"
}
```

---

## Frontend Integration

### React Hook Example

```typescript
// hooks/useTenants.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  member_count: number;
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  async function fetchTenants() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-operations`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch tenants');
      
      const { tenants } = await response.json();
      setTenants(tenants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    fetchTenants();
  }, []);
  
  return { tenants, loading, error, refetch: fetchTenants };
}
```

### Create Tenant Example

```typescript
// hooks/useCreateTenant.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCreateTenant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function createTenant(name: string, slug?: string) {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-operations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, slug }),
        }
      );
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      
      const { tenant } = await response.json();
      return tenant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }
  
  return { createTenant, loading, error };
}
```

### Invite Member Example

```typescript
// hooks/useInviteMember.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInviteMember(tenantId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function inviteMember(email: string, role: 'admin' | 'member' | 'viewer') {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-operations/members?tenant_id=${tenantId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, role }),
        }
      );
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      
      const { membership } = await response.json();
      return membership;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
      throw err;
    } finally {
      setLoading(false);
    }
  }
  
  return { inviteMember, loading, error };
}
```

---

## Best Practices

### 1. Tenant Context

Store current tenant in React context:

```typescript
const TenantContext = createContext<{
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
}>({ currentTenant: null, setCurrentTenant: () => {} });
```

### 2. Tenant Switching

Clear cached data when switching tenants:

```typescript
function switchTenant(newTenant: Tenant) {
  setCurrentTenant(newTenant);
  queryClient.invalidateQueries(); // Clear React Query cache
  localStorage.setItem('lastTenantId', newTenant.id);
}
```

### 3. Permission Checks

Check permissions before rendering UI:

```typescript
const canManageMembers = ['owner', 'admin'].includes(currentTenant.role);

{canManageMembers && (
  <Button onClick={openInviteDialog}>Invite Member</Button>
)}
```

### 4. Error Handling

Display user-friendly errors:

```typescript
if (error) {
  toast.error(error);
}
```

### 5. Loading States

Show loading indicators:

```typescript
if (loading) return <Spinner />;
```

---

## Security Notes

1. **Never trust client-side role checks** - Always enforce via RLS
2. **Always include tenant_id** in API calls
3. **Validate tenant membership** server-side
4. **Log sensitive operations** (invite, role change, delete)
5. **Rate limit** invitation endpoints

---

## Rate Limits

- Tenant operations: 20 requests/minute
- Member invitations: 10 requests/hour
- Member updates: 30 requests/minute

Exceeded limits return `429 Too Many Requests` with `X-RateLimit-Reset` header.