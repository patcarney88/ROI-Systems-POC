/**
 * Dashboard Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Main dashboard for ROI Systems
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  
  return (
    <>
      <Head>
        <title>Dashboard - ROI Systems</title>
        <meta name="description" content="ROI Systems Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Welcome to ROI Systems Dashboard
            </h1>
            <p className="text-text-secondary">
              Your digital document management system is getting ready.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Total Documents</p>
                  <p className="text-2xl font-bold text-text-primary">0</p>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Processing Queue</p>
                  <p className="text-2xl font-bold text-text-primary">0</p>
                </div>
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Storage Used</p>
                  <p className="text-2xl font-bold text-text-primary">0 MB</p>
                </div>
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Active Users</p>
                  <p className="text-2xl font-bold text-text-primary">1</p>
                </div>
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* System Status */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  System Status
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                      <span className="font-medium text-text-primary">Frontend Application</span>
                    </div>
                    <span className="text-success-600 text-sm font-medium">Operational</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-text-primary">AWS Lambda Services</span>
                    </div>
                    <span className="text-warning-600 text-sm font-medium">Deploying</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-text-primary">Aurora Serverless Database</span>
                    </div>
                    <span className="text-warning-600 text-sm font-medium">Provisioning</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-text-primary">AI Processing Services</span>
                    </div>
                    <span className="text-warning-600 text-sm font-medium">Configuring</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-start space-x-3">
                    <LoadingSpinner size="sm" />
                    <div>
                      <p className="text-primary-800 font-medium">
                        Infrastructure Deployment in Progress
                      </p>
                      <p className="text-primary-600 text-sm mt-1">
                        AWS serverless infrastructure is being deployed via Terraform. 
                        All services will be available shortly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Quick Actions
                </h2>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      console.log('Upload button clicked');
                      router.push('/upload');
                    }}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Upload Document</p>
                        <p className="text-sm text-text-tertiary">Add new files for processing</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => {
                      console.log('Search button clicked');
                      router.push('/search');
                    }}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Search Documents</p>
                        <p className="text-sm text-text-tertiary">Find files quickly</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/analytics')}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">View Analytics</p>
                        <p className="text-sm text-text-tertiary">Review system metrics</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/documents')}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Manage Documents</p>
                        <p className="text-sm text-text-tertiary">View and organize files</p>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="mt-6 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-primary-800 text-sm">
                    <strong>Tip:</strong> Upload your first document to start experiencing AI-powered document processing with Claude.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default DashboardPage;