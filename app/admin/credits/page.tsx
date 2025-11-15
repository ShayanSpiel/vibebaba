'use client';

/**
 * ADMIN CREDIT MANAGEMENT DASHBOARD
 *
 * Comprehensive credit management with all admin features
 */

import { Mail, Minus, Package, Plus, RotateCcw, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface UserCredit {
  id: string;
  userId: string;
  email: string;
  name: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  availableTokens: number;
  packageId: string | null;
  packageExpiry: number | null;
}

export default function CreditsPage() {
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);

  // PHASE 1: Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showAddByEmailModal, setShowAddByEmailModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAssignPackageModal, setShowAssignPackageModal] = useState(false);

  // Form states
  const [tokenAmount, setTokenAmount] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkTokens, setBulkTokens] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  async function loadUsers(page: number = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`/api/admin/credits?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setCurrentPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreUsers() {
    if (currentPage >= totalPages || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`/api/admin/credits?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers([...users, ...(data.users || [])]);
        setCurrentPage(data.page || nextPage);
      }
    } catch (error) {
      console.error('Failed to load more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function addTokens(userId: string, tokens: number) {
    try {
      const res = await fetch('/api/admin/credits/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tokens, action: 'add' }),
      });

      if (res.ok) {
        alert('Tokens added successfully');
        loadUsers();
        setShowAddModal(false);
        setTokenAmount('');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to add tokens:', error);
      alert('Failed to add tokens');
    }
  }

  async function removeTokens(userId: string, tokens: number) {
    try {
      const res = await fetch('/api/admin/credits/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tokens, action: 'remove' }),
      });

      if (res.ok) {
        alert('Tokens removed successfully');
        loadUsers();
        setShowRemoveModal(false);
        setTokenAmount('');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to remove tokens:', error);
      alert('Failed to remove tokens');
    }
  }

  async function addTokensByEmail() {
    try {
      const tokens = parseInt(tokenAmount);
      if (!emailInput || tokens <= 0) {
        alert('Please enter valid email and token amount');
        return;
      }

      const res = await fetch('/api/admin/credits/add-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, tokens }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadUsers();
        setShowAddByEmailModal(false);
        setEmailInput('');
        setTokenAmount('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to add tokens by email:', error);
      alert('Failed to add tokens');
    }
  }

  async function resetUserCredits(resetType: string) {
    if (!selectedUser) return;

    const confirmMsg = {
      all: 'This will reset ALL credits and remove package. Continue?',
      used: 'This will reset used tokens to 0. Continue?',
      package: "This will remove the user's package subscription. Continue?",
    }[resetType];

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/credits/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.userId, resetType }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadUsers();
        setShowResetModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to reset credits:', error);
      alert('Failed to reset credits');
    }
  }

  async function bulkOperation(action: 'add' | 'remove') {
    try {
      const emails = bulkEmails
        .split('\n')
        .map((e) => e.trim())
        .filter((e) => e);
      const tokens = parseInt(bulkTokens);

      if (emails.length === 0 || tokens <= 0) {
        alert('Please enter valid emails and token amount');
        return;
      }

      const res = await fetch('/api/admin/credits/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, tokens, action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (data.results.failed.length > 0) {
          console.log('Failed emails:', data.results.failed);
        }
        loadUsers();
        setShowBulkModal(false);
        setBulkEmails('');
        setBulkTokens('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to process bulk operation:', error);
      alert('Failed to process bulk operation');
    }
  }

  async function assignPackage() {
    if (!selectedUser || !selectedPackage) {
      alert('Please select a package');
      return;
    }

    try {
      const res = await fetch('/api/admin/packages/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.userId, packageId: selectedPackage }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadUsers();
        setShowAssignPackageModal(false);
        setSelectedPackage('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to assign package:', error);
      alert('Failed to assign package');
    }
  }

  // PHASE 1: Search is now done server-side for better performance
  // filteredUsers is just users since filtering happens on backend
  const filteredUsers = users;

  const totalStats = {
    totalUsers: totalUsers, // Use total from API, not just current page
    totalTokens: users.reduce((sum, u) => sum + u.totalTokens, 0),
    totalUsed: users.reduce((sum, u) => sum + u.usedTokens, 0),
    totalAvailable: users.reduce((sum, u) => sum + u.availableTokens, 0),
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading credits...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Credit Management</h1>
        <p className="text-text-secondary">Comprehensive credit and package management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens Purchased</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalTokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens Used</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalUsed.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens Available</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalAvailable.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setShowAddByEmailModal(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Add Credits by Email
        </Button>
        <Button variant="outline" onClick={() => setShowBulkModal(true)}>
          <Users className="h-4 w-4 mr-2" />
          Bulk Operations
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Credits</CardTitle>
          <CardDescription>All users and their credit balances</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Total Tokens</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Daily</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.totalTokens.toLocaleString()}</TableCell>
                  <TableCell>{user.usedTokens.toLocaleString()}</TableCell>
                  <TableCell>{user.dailyTokens.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">
                    {user.availableTokens.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {user.packageId ? (
                      <Badge variant="outline">{user.packageId}</Badge>
                    ) : (
                      <span className="text-text-secondary">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAddModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRemoveModal(true);
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignPackageModal(true);
                        }}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetModal(true);
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-text-secondary py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* PHASE 1: Pagination Info and Load More */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-text-secondary">
              Showing {users.length} of {totalUsers} users
              {currentPage < totalPages && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            {currentPage < totalPages && (
              <Button onClick={loadMoreUsers} disabled={loadingMore} variant="outline">
                {loadingMore
                  ? 'Loading...'
                  : `Load More (${totalPages - currentPage} pages remaining)`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Tokens Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tokens</DialogTitle>
            <DialogDescription>
              Add tokens to <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token Amount</label>
              <Input
                type="number"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const tokens = parseInt(tokenAmount);
                  if (tokens > 0 && selectedUser) {
                    addTokens(selectedUser.userId, tokens);
                  } else {
                    alert('Please enter a valid token amount');
                  }
                }}
              >
                Add Tokens
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Tokens Modal */}
      <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tokens</DialogTitle>
            <DialogDescription>
              Remove tokens from <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token Amount</label>
              <Input
                type="number"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRemoveModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const tokens = parseInt(tokenAmount);
                  if (tokens > 0 && selectedUser) {
                    removeTokens(selectedUser.userId, tokens);
                  } else {
                    alert('Please enter a valid token amount');
                  }
                }}
              >
                Remove Tokens
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add by Email Modal */}
      <Dialog open={showAddByEmailModal} onOpenChange={setShowAddByEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits by Email</DialogTitle>
            <DialogDescription>Add credits to a user by their email address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Token Amount</label>
              <Input
                type="number"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowAddByEmailModal(false)}>
                Cancel
              </Button>
              <Button onClick={addTokensByEmail}>Add Credits</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Credits</DialogTitle>
            <DialogDescription>
              Reset credits for <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => resetUserCredits('used')}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Used Tokens Only
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => resetUserCredits('package')}
              >
                <Package className="h-4 w-4 mr-2" />
                Remove Package Subscription
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => resetUserCredits('all')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Credits & Package
              </Button>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Credit Operations</DialogTitle>
            <DialogDescription>Add or remove credits for multiple users at once</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Addresses (one per line)
              </label>
              <Textarea
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Token Amount</label>
              <Input
                type="number"
                placeholder="Enter token amount"
                value={bulkTokens}
                onChange={(e) => setBulkTokens(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => bulkOperation('add')}>Add to All</Button>
              <Button variant="destructive" onClick={() => bulkOperation('remove')}>
                Remove from All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Package Modal */}
      <Dialog open={showAssignPackageModal} onOpenChange={setShowAssignPackageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Package</DialogTitle>
            <DialogDescription>
              Assign a package subscription to <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Package</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
              >
                <option value="">Select a package</option>
                <option value="starter">Starter - 500K tokens/month + 5K daily</option>
                <option value="pro">Pro - 2M tokens/month + 20K daily</option>
                <option value="unlimited">Unlimited - 10M tokens/month + 50K daily</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowAssignPackageModal(false)}>
                Cancel
              </Button>
              <Button onClick={assignPackage}>Assign Package</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
