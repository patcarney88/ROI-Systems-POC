/**
 * Transaction Detail Page
 * View and manage individual transaction
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  uploadedBy: string;
  category: string;
}

const TransactionDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Mock transaction data
  const transaction = {
    id: '1',
    propertyAddress: '123 Main St, Dallas, TX 75201',
    buyerName: 'John & Jane Smith',
    sellerName: 'Robert Johnson',
    closingDate: '2024-01-15',
    status: 'closed',
    transactionType: 'purchase',
    purchasePrice: '$425,000',
    loanAmount: '$340,000',
    agentName: 'Sarah Williams',
    agentEmail: 'sarah@realestate.com',
    lenderName: 'First National Bank',
    lenderContact: 'Mike Thompson',
    createdAt: '2024-01-02',
    buyerEmail: 'john.smith@email.com',
    buyerPhone: '(555) 123-4567',
    sellerEmail: 'rjohnson@email.com',
    homeownerActivated: true,
    activationDate: '2024-01-20',
    lastActivity: '2024-01-25'
  };

  // Mock documents
  const documents: Document[] = [
    {
      id: '1',
      name: 'Purchase Agreement.pdf',
      type: 'pdf',
      size: '2.3 MB',
      uploadedDate: '2024-01-03',
      uploadedBy: 'Sarah Williams',
      category: 'Contract'
    },
    {
      id: '2',
      name: 'Title Report.pdf',
      type: 'pdf',
      size: '5.1 MB',
      uploadedDate: '2024-01-05',
      uploadedBy: 'Title Officer',
      category: 'Title'
    },
    {
      id: '3',
      name: 'Closing Disclosure.pdf',
      type: 'pdf',
      size: '1.8 MB',
      uploadedDate: '2024-01-14',
      uploadedBy: 'Lender',
      category: 'Closing'
    },
    {
      id: '4',
      name: 'Deed of Trust.pdf',
      type: 'pdf',
      size: '956 KB',
      uploadedDate: '2024-01-15',
      uploadedBy: 'Title Officer',
      category: 'Legal'
    },
    {
      id: '5',
      name: 'HUD-1 Settlement.pdf',
      type: 'pdf',
      size: '1.2 MB',
      uploadedDate: '2024-01-15',
      uploadedBy: 'Title Officer',
      category: 'Closing'
    }
  ];

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
        <title>Transaction Details - ROI Systems</title>
        <meta name="description" content="View transaction details and documents" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/agency/transactions" className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Transactions
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {transaction.propertyAddress}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                  <span className={`inline-block px-2 py-1 rounded-full ${getStatusBadge(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </span>
                  <span>Transaction #{transaction.id}</span>
                  <span>•</span>
                  <span>Closing: {new Date(transaction.closingDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Documents
                </button>
                
                <button className="btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send to Homeowner
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border-primary mb-6">
            <nav className="flex space-x-8">
              {['overview', 'documents', 'activity', 'marketing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Property Details */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">Property Details</h2>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-text-tertiary">Address</dt>
                      <dd className="mt-1 text-text-primary font-medium">{transaction.propertyAddress}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-text-tertiary">Transaction Type</dt>
                      <dd className="mt-1 text-text-primary font-medium capitalize">{transaction.transactionType}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-text-tertiary">Purchase Price</dt>
                      <dd className="mt-1 text-text-primary font-medium">{transaction.purchasePrice}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-text-tertiary">Loan Amount</dt>
                      <dd className="mt-1 text-text-primary font-medium">{transaction.loanAmount}</dd>
                    </div>
                  </dl>
                </div>

                {/* Parties */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">Parties</h2>
                  
                  <div className="space-y-4">
                    {/* Buyer */}
                    <div className="pb-4 border-b border-border-primary">
                      <h3 className="text-sm font-medium text-text-tertiary mb-2">Buyer</h3>
                      <p className="text-text-primary font-medium">{transaction.buyerName}</p>
                      <p className="text-sm text-text-secondary">{transaction.buyerEmail}</p>
                      <p className="text-sm text-text-secondary">{transaction.buyerPhone}</p>
                    </div>
                    
                    {/* Seller */}
                    <div className="pb-4 border-b border-border-primary">
                      <h3 className="text-sm font-medium text-text-tertiary mb-2">Seller</h3>
                      <p className="text-text-primary font-medium">{transaction.sellerName}</p>
                      <p className="text-sm text-text-secondary">{transaction.sellerEmail}</p>
                    </div>
                    
                    {/* Agent */}
                    <div className="pb-4 border-b border-border-primary">
                      <h3 className="text-sm font-medium text-text-tertiary mb-2">Real Estate Agent</h3>
                      <p className="text-text-primary font-medium">{transaction.agentName}</p>
                      <p className="text-sm text-text-secondary">{transaction.agentEmail}</p>
                    </div>
                    
                    {/* Lender */}
                    <div>
                      <h3 className="text-sm font-medium text-text-tertiary mb-2">Lender</h3>
                      <p className="text-text-primary font-medium">{transaction.lenderName}</p>
                      <p className="text-sm text-text-secondary">{transaction.lenderContact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Homeowner Status */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Homeowner Portal</h3>
                  
                  {transaction.homeownerActivated ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-success-600 font-medium">Activated</span>
                      </div>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-text-tertiary">Activation Date</dt>
                          <dd className="text-sm text-text-primary">{new Date(transaction.activationDate).toLocaleDateString()}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-text-tertiary">Last Activity</dt>
                          <dd className="text-sm text-text-primary">{new Date(transaction.lastActivity).toLocaleDateString()}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-warning-600 font-medium">Pending Activation</span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        Homeowner has not yet activated their portal access.
                      </p>
                      <button className="btn-primary w-full text-sm">
                        Send Activation Email
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Documents</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Total Documents</span>
                      <span className="font-medium text-text-primary">{documents.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Total Size</span>
                      <span className="font-medium text-text-primary">11.5 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Last Upload</span>
                      <span className="font-medium text-text-primary">Jan 15, 2024</span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/agency/upload?transaction=${transaction.id}`}
                    className="mt-4 btn-outline w-full text-sm justify-center"
                  >
                    Upload More Documents
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Documents</h2>
                <button
                  onClick={() => router.push(`/agency/upload?transaction=${transaction.id}`)}
                  className="btn-primary"
                >
                  Upload Documents
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-3 px-4 font-medium text-text-primary">Document</th>
                      <th className="text-left py-3 px-4 font-medium text-text-primary">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-text-primary">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-text-primary">Uploaded</th>
                      <th className="text-left py-3 px-4 font-medium text-text-primary">Uploaded By</th>
                      <th className="text-left py-3 px-4 font-medium text-text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-border-primary hover:bg-background-secondary transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium text-text-primary">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-text-secondary">{doc.category}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-text-secondary">{doc.size}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-text-secondary">{new Date(doc.uploadedDate).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-text-secondary">{doc.uploadedBy}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <button className="text-primary-600 hover:text-primary-700">
                              View
                            </button>
                            <button className="text-primary-600 hover:text-primary-700">
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-6">Activity Log</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-text-primary">Transaction closed</p>
                    <p className="text-sm text-text-tertiary">January 15, 2024 at 3:45 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-text-primary">HUD-1 Settlement uploaded by Title Officer</p>
                    <p className="text-sm text-text-tertiary">January 15, 2024 at 2:30 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-text-primary">Closing Disclosure uploaded by Lender</p>
                    <p className="text-sm text-text-tertiary">January 14, 2024 at 11:15 AM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-text-primary">Title Report uploaded by Title Officer</p>
                    <p className="text-sm text-text-tertiary">January 5, 2024 at 9:45 AM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-text-primary">Purchase Agreement uploaded by Sarah Williams</p>
                    <p className="text-sm text-text-tertiary">January 3, 2024 at 4:20 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-text-primary">Transaction created</p>
                    <p className="text-sm text-text-tertiary">January 2, 2024 at 10:30 AM</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-6">Marketing Campaigns</h2>
              
              <div className="bg-info-50 border border-info-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-info-800 font-medium">Forever Marketing Active</p>
                    <p className="text-info-700 text-sm mt-1">
                      This homeowner is enrolled in automated email campaigns. Next email scheduled for February 15, 2024.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border border-border-primary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">Welcome Series</h3>
                    <span className="text-sm text-success-600">Sent</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    Introduction to their homeowner portal and document access
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-text-tertiary">
                    <span>Sent: Jan 20, 2024</span>
                    <span>•</span>
                    <span>Opened: Yes</span>
                    <span>•</span>
                    <span>Clicked: Yes</span>
                  </div>
                </div>
                
                <div className="border border-border-primary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">Monthly Home Tips</h3>
                    <span className="text-sm text-info-600">Scheduled</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    February home maintenance tips and reminders
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-text-tertiary">
                    <span>Scheduled: Feb 15, 2024</span>
                  </div>
                </div>
              </div>
              
              <button className="mt-6 btn-outline">
                Configure Marketing Preferences
              </button>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default TransactionDetailPage;