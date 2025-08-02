/**
 * Title Agency Transactions Page
 * Core page for managing real estate transactions
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';

interface Transaction {
  id: string;
  propertyAddress: string;
  buyerName: string;
  sellerName: string;
  closingDate: string;
  status: 'upcoming' | 'in_progress' | 'closed' | 'cancelled';
  documentsCount: number;
  homeownerActivated: boolean;
  transactionType: 'purchase' | 'refinance' | 'sale';
  loanAmount?: string;
  purchasePrice?: string;
  agentName?: string;
  lenderName?: string;
  createdAt: string;
}

const TransactionsPage: React.FC = () => {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('closingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data for POC
  const transactions: Transaction[] = [
    {
      id: '1',
      propertyAddress: '123 Main St, Dallas, TX 75201',
      buyerName: 'John & Jane Smith',
      sellerName: 'Robert Johnson',
      closingDate: '2024-01-15',
      status: 'closed',
      documentsCount: 12,
      homeownerActivated: true,
      transactionType: 'purchase',
      purchasePrice: '$425,000',
      agentName: 'Sarah Williams',
      lenderName: 'First National Bank',
      createdAt: '2024-01-02'
    },
    {
      id: '2',
      propertyAddress: '456 Oak Ave, Plano, TX 75023',
      buyerName: 'Michael Johnson',
      sellerName: 'Emily Davis',
      closingDate: '2024-01-20',
      status: 'in_progress',
      documentsCount: 8,
      homeownerActivated: false,
      transactionType: 'purchase',
      purchasePrice: '$380,000',
      agentName: 'Tom Anderson',
      lenderName: 'Wells Fargo',
      createdAt: '2024-01-05'
    },
    {
      id: '3',
      propertyAddress: '789 Elm Dr, Frisco, TX 75034',
      buyerName: 'Sarah Williams',
      sellerName: 'James Brown',
      closingDate: '2024-01-25',
      status: 'upcoming',
      documentsCount: 3,
      homeownerActivated: false,
      transactionType: 'refinance',
      loanAmount: '$290,000',
      agentName: 'Lisa Martinez',
      lenderName: 'Chase Bank',
      createdAt: '2024-01-08'
    },
    {
      id: '4',
      propertyAddress: '321 Pine St, McKinney, TX 75070',
      buyerName: 'David & Maria Garcia',
      sellerName: 'Jennifer White',
      closingDate: '2024-01-13',
      status: 'closed',
      documentsCount: 15,
      homeownerActivated: true,
      transactionType: 'purchase',
      purchasePrice: '$520,000',
      agentName: 'Mark Thompson',
      lenderName: 'Bank of America',
      createdAt: '2023-12-28'
    }
  ];

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (searchQuery && !t.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.sellerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: any = a[sortBy as keyof Transaction];
      let bVal: any = b[sortBy as keyof Transaction];
      
      if (sortBy === 'closingDate' || sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-info-100 text-info-700';
      case 'in_progress':
        return 'bg-warning-100 text-warning-700';
      case 'closed':
        return 'bg-success-100 text-success-700';
      case 'cancelled':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'in_progress':
        return 'In Progress';
      case 'closed':
        return 'Closed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <>
      <Head>
        <title>Transactions - ROI Systems</title>
        <meta name="description" content="Manage real estate transactions" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Transactions
                </h1>
                <p className="text-text-secondary">
                  Manage your real estate transactions and document uploads
                </p>
              </div>
              
              <Link href="/agency/transactions/new" className="mt-4 sm:mt-0 btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Transaction
              </Link>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by address, buyer, or seller..."
                    className="input pl-10"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input"
                >
                  <option value="closingDate">Closing Date</option>
                  <option value="createdAt">Date Created</option>
                  <option value="propertyAddress">Property Address</option>
                  <option value="buyerName">Buyer Name</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-border-primary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{transactions.length}</p>
                  <p className="text-sm text-text-tertiary">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-info-600">{transactions.filter(t => t.status === 'upcoming').length}</p>
                  <p className="text-sm text-text-tertiary">Upcoming</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning-600">{transactions.filter(t => t.status === 'in_progress').length}</p>
                  <p className="text-sm text-text-tertiary">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success-600">{transactions.filter(t => t.status === 'closed').length}</p>
                  <p className="text-sm text-text-tertiary">Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Property</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary hidden md:table-cell">Parties</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Closing</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary hidden lg:table-cell">Documents</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border-primary hover:bg-background-secondary transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-text-primary">{transaction.propertyAddress}</p>
                          <p className="text-sm text-text-tertiary capitalize">{transaction.transactionType}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div>
                          <p className="text-sm text-text-primary">Buyer: {transaction.buyerName}</p>
                          <p className="text-sm text-text-secondary">Seller: {transaction.sellerName}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-text-primary">{new Date(transaction.closingDate).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="flex items-center space-x-3">
                          <span className="text-text-primary">{transaction.documentsCount}</span>
                          {transaction.homeownerActivated && (
                            <span className="text-success-600 text-xs">✓ Activated</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/agency/transactions/${transaction.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            View
                          </Link>
                          {transaction.status !== 'closed' && (
                            <>
                              <span className="text-text-tertiary">•</span>
                              <button
                                onClick={() => router.push(`/agency/upload?transaction=${transaction.id}`)}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                Upload
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-text-secondary">No transactions found</p>
                <Link href="/agency/transactions/new" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create your first transaction
                </Link>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default TransactionsPage;