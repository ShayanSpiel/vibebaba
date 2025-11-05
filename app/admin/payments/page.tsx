'use client';

/**
 * ADMIN PAYMENT MANAGEMENT & ANALYTICS
 *
 * Comprehensive payment tracking, analytics, and refund management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Users, Package, RefreshCw, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  email?: string;
  type: string;
  amount: number;
  tokens: number;
  currency: string;
  packageId: string | null;
  status: string;
  createdAt: number;
}

interface Analytics {
  overview: {
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    cancelledTransactions: number;
    refundedTransactions: number;
  };
  revenue: {
    totalRevenue: number;
    revenueByMonth: Record<string, number>;
    revenueByPackage: Record<string, number>;
  };
  tokens: {
    totalTokensSold: number;
    tokensByPackage: Record<string, number>;
  };
  users: {
    uniquePayingUsers: number;
    subscriptionUsers: number;
    oneTimePurchaseUsers: number;
  };
  currency: {
    usdTransactions: number;
    irtTransactions: number;
  };
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [removeTokens, setRemoveTokens] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load both transactions and analytics
      const [txRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/payments/analytics'),
      ]);

      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function processRefund(transactionId: string, removeTokens: boolean) {
    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, removeTokens }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Refund processed successfully. Amount: $${data.refundedAmount}`);
        loadData();
        setShowRefundModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('Failed to process refund');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalRevenue: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => {
        const amount = t.currency === 'IRT' ? t.amount / 70000 : t.amount;
        return sum + amount;
      }, 0),
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className="text-text-secondary">Comprehensive payment tracking and analytics</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Transactions</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-3xl text-success">{stats.completed}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-3xl text-warning">{stats.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue (USD)</CardDescription>
                <CardTitle className="text-3xl">${stats.totalRevenue.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 10 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{tx.email || tx.userId.slice(0, 8)}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>
                        {tx.currency === 'IRT'
                          ? `${tx.amount.toLocaleString()} Toman`
                          : `$${tx.amount.toFixed(2)}`
                        }
                      </TableCell>
                      <TableCell>{tx.tokens.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === 'completed' ? 'default' :
                            tx.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setShowRefundModal(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{tx.email || tx.userId.slice(0, 8)}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>
                        {tx.currency === 'IRT'
                          ? `${tx.amount.toLocaleString()} Toman`
                          : `$${tx.amount.toFixed(2)}`
                        }
                      </TableCell>
                      <TableCell>{tx.tokens.toLocaleString()}</TableCell>
                      <TableCell>{tx.packageId || 'Custom'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === 'completed' ? 'default' :
                            tx.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setShowRefundModal(true);
                            }}
                          >
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-text-secondary" />
                      <CardDescription>Unique Paying Users</CardDescription>
                    </div>
                    <CardTitle className="text-3xl">{analytics.users.uniquePayingUsers}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-text-secondary" />
                      <CardDescription>Total Tokens Sold</CardDescription>
                    </div>
                    <CardTitle className="text-3xl">{analytics.tokens.totalTokensSold.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-text-secondary" />
                      <CardDescription>Total Revenue (USD)</CardDescription>
                    </div>
                    <CardTitle className="text-3xl">${analytics.revenue.totalRevenue.toFixed(2)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Transaction Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Completed</div>
                      <div className="text-2xl font-bold text-success">{analytics.overview.completedTransactions}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Pending</div>
                      <div className="text-2xl font-bold text-warning">{analytics.overview.pendingTransactions}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Failed</div>
                      <div className="text-2xl font-bold text-error">{analytics.overview.failedTransactions}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Cancelled</div>
                      <div className="text-2xl font-bold text-text-secondary">{analytics.overview.cancelledTransactions}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Refunded</div>
                      <div className="text-2xl font-bold text-info">{analytics.overview.refundedTransactions}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Package */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Package</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.revenue.revenueByPackage).map(([pkg, revenue]) => (
                      <div key={pkg} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-text-secondary" />
                          <span className="font-medium capitalize">{pkg}</span>
                        </div>
                        <span className="text-lg font-bold">${revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Month */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.revenue.revenueByMonth)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, revenue]) => (
                        <div key={month} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium">{month}</span>
                          <span className="text-lg font-bold">${revenue.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>User Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Subscription Users</div>
                      <div className="text-2xl font-bold">{analytics.users.subscriptionUsers}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">One-time Purchases</div>
                      <div className="text-2xl font-bold">{analytics.users.oneTimePurchaseUsers}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Currency Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Currency Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">USD Transactions</div>
                      <div className="text-2xl font-bold">{analytics.currency.usdTransactions}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">IRT Transactions</div>
                      <div className="text-2xl font-bold">{analytics.currency.irtTransactions}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund transaction for <strong>{selectedTransaction?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Amount:</span>
                  <span className="font-medium">
                    {selectedTransaction?.currency === 'IRT'
                      ? `${selectedTransaction.amount.toLocaleString()} Toman`
                      : `$${selectedTransaction?.amount.toFixed(2)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tokens:</span>
                  <span className="font-medium">{selectedTransaction?.tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Package:</span>
                  <span className="font-medium">{selectedTransaction?.packageId || 'Custom'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border-light rounded-lg bg-warning/10">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <div className="font-medium mb-1">Remove tokens from user?</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeTokens}
                    onChange={(e) => setRemoveTokens(e.target.checked)}
                    className="rounded"
                  />
                  <span>Remove {selectedTransaction?.tokens.toLocaleString()} tokens from user's account</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedTransaction && confirm('Are you sure you want to process this refund?')) {
                    processRefund(selectedTransaction.id, removeTokens);
                  }
                }}
              >
                Process Refund
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
