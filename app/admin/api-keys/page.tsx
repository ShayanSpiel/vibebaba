'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiKeysPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Key Management</h1>
        <p className="text-text-secondary">Generate and manage API keys</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">
            API key generation, management, and usage tracking features will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
