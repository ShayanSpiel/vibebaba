'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UsersPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-text-secondary">Manage users and roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">
            User management features including role assignment, account status, and user analytics will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
