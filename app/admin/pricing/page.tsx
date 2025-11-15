'use client';

/**
 * ADMIN PRICING MANAGEMENT
 * Comprehensive pricing configuration interface
 */

import {
  CheckCircle2,
  Copy,
  DollarSign,
  Globe,
  Info,
  Package,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PricingPackage {
  id: string;
  name: string;
  monthlyTokens: number;
  dailyTokens: number;
  prices: {
    USD: number;
    IRT: number;
  };
  displayOrder: number;
  isPopular?: boolean;
}

interface PricingConfig {
  packages: Record<string, PricingPackage>;
  currency: {
    exchangeRates: {
      USD_TO_IRT: number;
      USD_TO_RIALS: number;
    };
    default: string;
    symbols: {
      USD: string;
      IRT: string;
    };
  };
  customCredits: {
    pricePerUnit: {
      USD: number;
      IRT: number;
    };
    unitSize: number;
  };
  version: string;
  lastUpdated: string;
}

export default function PricingManagementPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [envVariable, setEnvVariable] = useState('');
  const [copied, setCopied] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);

  // Edit states
  const [editingPackages, setEditingPackages] = useState<Record<string, PricingPackage>>({});
  const [exchangeRates, setExchangeRates] = useState({
    USD_TO_IRT: 0,
    USD_TO_RIALS: 0,
  });
  const [customPricing, setCustomPricing] = useState({
    priceUSD: 0,
    priceIRT: 0,
    unitSize: 100000,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.currentConfig);
        setEditingPackages(data.currentConfig.packages);
        setExchangeRates(data.currentConfig.currency.exchangeRates);
        setCustomPricing({
          priceUSD: data.currentConfig.customCredits.pricePerUnit.USD,
          priceIRT: data.currentConfig.customCredits.pricePerUnit.IRT,
          unitSize: data.currentConfig.customCredits.unitSize,
        });
      }
    } catch (error) {
      console.error('Failed to load pricing config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePackage(packageId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/packages/${packageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPackages[packageId]),
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        setSavedMessage(
          `❌ Error: Server returned non-JSON response (status ${res.status}). Check server logs.`
        );
        setTimeout(() => setSavedMessage(''), 5000);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setSavedMessage(`✅ Package ${packageId} saved successfully!`);
        setEnvVariable(data.envVariable);
        setTimeout(() => setSavedMessage(''), 3000);
        await loadConfig();
      } else {
        setSavedMessage(
          `❌ Error: ${data.error || 'Failed to save'} ${data.details ? `- ${data.details}` : ''}`
        );
        console.error('Failed to save package:', data);
        setTimeout(() => setSavedMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to save package:', error);
      setSavedMessage(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`);
      setTimeout(() => setSavedMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function saveExchangeRates() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing/exchange-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exchangeRates),
      });

      const data = await res.json();

      if (res.ok) {
        setSavedMessage('✅ Exchange rates saved successfully!');
        setEnvVariable(data.envVariable);
        setTimeout(() => setSavedMessage(''), 3000);
        await loadConfig();
      } else {
        setSavedMessage(
          `❌ Error: ${data.error || 'Failed to save'} ${data.details ? `- ${data.details}` : ''}`
        );
        console.error('Failed to save exchange rates:', data);
        setTimeout(() => setSavedMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to save exchange rates:', error);
      setSavedMessage(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`);
      setTimeout(() => setSavedMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function saveCustomPricing() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing/custom-credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customPricing),
      });

      const data = await res.json();

      if (res.ok) {
        setSavedMessage('✅ Custom pricing saved successfully!');
        setEnvVariable(data.envVariable);
        setTimeout(() => setSavedMessage(''), 3000);
        await loadConfig();
      } else {
        setSavedMessage(
          `❌ Error: ${data.error || 'Failed to save'} ${data.details ? `- ${data.details}` : ''}`
        );
        console.error('Failed to save custom pricing:', data);
        setTimeout(() => setSavedMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to save custom pricing:', error);
      setSavedMessage(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`);
      setTimeout(() => setSavedMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  }

  function copyEnvVariable() {
    if (envVariable) {
      navigator.clipboard.writeText(`PRICING_CONFIG_JSON='${envVariable}'`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function createSettingsCollection() {
    setCreatingCollection(true);
    try {
      const res = await fetch('/api/admin/setup/create-settings-collection', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        if (data.alreadyExists) {
          setSavedMessage('✅ Settings collection already exists!');
        } else {
          setSavedMessage(
            '✅ Settings collection created successfully! You can now save pricing changes.'
          );
        }
        setTimeout(() => setSavedMessage(''), 5000);
      } else {
        setSavedMessage(
          `❌ Error: ${data.error || 'Failed to create collection'} ${data.details ? `- ${data.details}` : ''}`
        );
        console.error('Failed to create settings collection:', data);
        setTimeout(() => setSavedMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to create settings collection:', error);
      setSavedMessage(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`);
      setTimeout(() => setSavedMessage(''), 5000);
    } finally {
      setCreatingCollection(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading pricing configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive">Failed to load pricing configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pricing Management</h1>
          <p className="text-text-secondary">
            Configure packages, exchange rates, and per-token pricing
          </p>
        </div>
        <Button
          onClick={createSettingsCollection}
          disabled={creatingCollection}
          variant="outline"
          size="sm"
        >
          {creatingCollection ? 'Creating...' : '🔧 Setup Settings Collection'}
        </Button>
      </div>

      {savedMessage && (
        <div
          className={`p-4 rounded-md border flex items-center gap-3 ${savedMessage.includes('❌') ? 'bg-error/10 border-error' : 'bg-success/10 border-success'}`}
        >
          <CheckCircle2
            className={`h-4 w-4 ${savedMessage.includes('❌') ? 'text-error' : 'text-success'}`}
          />
          <p className={savedMessage.includes('❌') ? 'text-error' : 'text-success'}>
            {savedMessage}
          </p>
        </div>
      )}

      {envVariable && (
        <div className="p-4 bg-muted border rounded-md">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 mt-1" />
            <div className="space-y-2 flex-1">
              <p className="font-semibold">
                To activate changes, add this to your environment variables:
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-background-subtle p-2 rounded text-xs overflow-x-auto">
                  PRICING_CONFIG_JSON='{envVariable.substring(0, 100)}...'
                </code>
                <Button size="sm" variant="outline" onClick={copyEnvVariable}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-text-secondary">
                Then restart your server or deploy to production
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packages">
            <Package className="h-4 w-4 mr-2" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="exchange">
            <Globe className="h-4 w-4 mr-2" />
            Exchange Rates
          </TabsTrigger>
          <TabsTrigger value="custom">
            <DollarSign className="h-4 w-4 mr-2" />
            Per-Token Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Packages</CardTitle>
              <CardDescription>
                Configure monthly subscription packages with token allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(editingPackages).map(([id, pkg]) => (
                  <Card key={id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {pkg.isPopular && <Badge variant="default">Most Popular</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Monthly Tokens</Label>
                          <Input
                            type="number"
                            value={pkg.monthlyTokens}
                            onChange={(e) =>
                              setEditingPackages({
                                ...editingPackages,
                                [id]: {
                                  ...pkg,
                                  monthlyTokens: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Daily Bonus</Label>
                          <Input
                            type="number"
                            value={pkg.dailyTokens}
                            onChange={(e) =>
                              setEditingPackages({
                                ...editingPackages,
                                [id]: {
                                  ...pkg,
                                  dailyTokens: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Price (USD)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pkg.prices.USD}
                            onChange={(e) =>
                              setEditingPackages({
                                ...editingPackages,
                                [id]: {
                                  ...pkg,
                                  prices: {
                                    ...pkg.prices,
                                    USD: Number(e.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Price (Toman)</Label>
                          <Input
                            type="number"
                            value={pkg.prices.IRT}
                            onChange={(e) =>
                              setEditingPackages({
                                ...editingPackages,
                                [id]: {
                                  ...pkg,
                                  prices: {
                                    ...pkg.prices,
                                    IRT: Number(e.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={() => savePackage(id)} disabled={saving} className="mt-4">
                        <Save className="h-4 w-4 mr-2" />
                        Save {pkg.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchange" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currency Exchange Rates</CardTitle>
              <CardDescription>
                Configure USD to Iranian Rial/Toman conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>1 USD = X Toman</Label>
                    <Input
                      type="number"
                      value={exchangeRates.USD_TO_IRT}
                      onChange={(e) =>
                        setExchangeRates({
                          ...exchangeRates,
                          USD_TO_IRT: Number(e.target.value),
                          USD_TO_RIALS: Number(e.target.value) * 10,
                        })
                      }
                    />
                    <p className="text-sm text-text-tertiary mt-1">
                      Currently: 1 USD = {exchangeRates.USD_TO_IRT.toLocaleString()} Toman
                    </p>
                  </div>
                  <div>
                    <Label>1 USD = X Rials</Label>
                    <Input
                      type="number"
                      value={exchangeRates.USD_TO_RIALS}
                      onChange={(e) =>
                        setExchangeRates({
                          ...exchangeRates,
                          USD_TO_RIALS: Number(e.target.value),
                          USD_TO_IRT: Number(e.target.value) / 10,
                        })
                      }
                    />
                    <p className="text-sm text-text-tertiary mt-1">
                      Currently: 1 USD = {exchangeRates.USD_TO_RIALS.toLocaleString()} Rials
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-muted border rounded-md flex items-start gap-3">
                  <Info className="h-4 w-4 mt-0.5" />
                  <p className="text-sm">
                    Note: 1 Toman = 10 Rials. The system automatically maintains this ratio.
                  </p>
                </div>
                <Button onClick={saveExchangeRates} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Exchange Rates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Credit Pricing (Per Token)</CardTitle>
              <CardDescription>Configure pricing for custom token purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Unit Size (tokens)</Label>
                    <Input
                      type="number"
                      value={customPricing.unitSize}
                      onChange={(e) =>
                        setCustomPricing({
                          ...customPricing,
                          unitSize: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-sm text-text-tertiary mt-1">
                      Default: 100,000 tokens per unit
                    </p>
                  </div>
                  <div>
                    <Label>Price per Unit (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customPricing.priceUSD}
                      onChange={(e) =>
                        setCustomPricing({
                          ...customPricing,
                          priceUSD: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-sm text-text-tertiary mt-1">
                      ${customPricing.priceUSD} per {(customPricing.unitSize / 1000).toFixed(0)}K
                      tokens
                    </p>
                  </div>
                  <div>
                    <Label>Price per Unit (Toman)</Label>
                    <Input
                      type="number"
                      value={customPricing.priceIRT}
                      onChange={(e) =>
                        setCustomPricing({
                          ...customPricing,
                          priceIRT: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-sm text-text-tertiary mt-1">
                      {customPricing.priceIRT.toLocaleString()} Toman per{' '}
                      {(customPricing.unitSize / 1000).toFixed(0)}K tokens
                    </p>
                  </div>
                </div>
                <div className="bg-background-subtle p-4 rounded">
                  <p className="font-semibold mb-2">Pricing Preview:</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tokens</TableHead>
                        <TableHead>USD</TableHead>
                        <TableHead>Toman</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[100000, 500000, 1000000, 5000000].map((tokens) => {
                        const units = Math.ceil(tokens / customPricing.unitSize);
                        return (
                          <TableRow key={tokens}>
                            <TableCell>{(tokens / 1000).toFixed(0)}K</TableCell>
                            <TableCell>${(units * customPricing.priceUSD).toFixed(2)}</TableCell>
                            <TableCell>
                              {(units * customPricing.priceIRT).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={saveCustomPricing} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Custom Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>View the active pricing configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-background-subtle p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(config, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
