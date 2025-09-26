'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Search,
  Download,
  Plus,
  Users,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import axios from 'axios';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchQuery, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await axios.get(`/api/customers?${params}`);
      return response.data;
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put('/api/customers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update customer',
        variant: 'destructive',
      });
    },
  });

  const handleExportCSV = () => {
    if (!customersData?.customers) return;

    const csvData = customersData.customers.map((customer: any) => ({
      Name: customer.name,
      Phone: customer.phone_number,
      Email: customer.email || '',
      'Total Visits': customer.total_visits,
      'Last Visit': customer.last_visit
        ? format(new Date(customer.last_visit), 'yyyy-MM-dd')
        : '',
      'Total Spent': customer.total_spent ? `$${customer.total_spent}` : '$0',
      'Member Since': format(new Date(customer.created_at), 'yyyy-MM-dd'),
      Notes: customer.notes || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditCustomer = async (customer: any) => {
    await updateCustomerMutation.mutateAsync(customer);
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  // Calculate statistics
  const totalCustomers = customersData?.totalCount || 0;
  const activeCustomers = customersData?.customers?.filter(
    (c: any) => c.total_visits > 0
  ).length || 0;
  const totalRevenue = customersData?.customers?.reduce(
    (sum: number, c: any) => sum + (c.total_spent || 0),
    0
  ) || 0;
  const avgVisitsPerCustomer = totalCustomers > 0
    ? (customersData?.customers?.reduce(
        (sum: number, c: any) => sum + c.total_visits,
        0
      ) || 0) / totalCustomers
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database and track their history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={!customersData?.customers?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Customers</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} active customers
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Avg Visits</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {avgVisitsPerCustomer.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">per customer</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Revenue</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">from all customers</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">New This Month</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {customersData?.customers?.filter((c: any) => {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                return (
                  createdDate.getMonth() === now.getMonth() &&
                  createdDate.getFullYear() === now.getFullYear()
                );
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">new customers</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0); // Reset to first page on search
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={customersData?.customers || []}
        totalCount={customersData?.totalCount || 0}
        limit={limit}
        offset={offset}
        onEdit={handleEditCustomer}
        onPageChange={handlePageChange}
        loading={isLoading}
      />
    </div>
  );
}