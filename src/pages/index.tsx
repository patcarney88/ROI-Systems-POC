/**
 * Home Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Landing page for ROI Systems POC
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>ROI Systems - Transform Real Estate Documents into Forever Clients</title>
        <meta 
          name="description" 
          content="Turn closing documents into lasting client relationships. Secure storage, automated marketing, and instant business alerts for title agencies." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-background-primary">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-border-primary">
          <div className="container-responsive py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ROI</span>
                </div>
                <h1 className="text-xl font-semibold text-text-primary">
                  ROI Systems
                </h1>
              </div>
              
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-text-secondary hover:text-primary-600 transition-colors">
                  Features
                </a>
                <a href="#benefits" className="text-text-secondary hover:text-primary-600 transition-colors">
                  Benefits
                </a>
                <a href="#pricing" className="text-text-secondary hover:text-primary-600 transition-colors">
                  Pricing
                </a>
                <Link href="/agency/login" className="btn-outline">
                  Agency Login
                </Link>
                <Link href="/demo" className="btn-primary">
                  Request Demo
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container-responsive py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                Turn Closing Documents Into
                <span className="block text-primary-600">Forever Clients</span>
              </h1>
              
              <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Transform dormant real estate transactions into active business opportunities. 
                Secure document storage, automated client engagement, and instant referral alerts 
                help title agencies stay connected with homeowners for life.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/demo" className="btn-primary">
                Schedule a Demo
              </Link>
              <Link href="#features" className="btn-outline px-6 py-3 rounded-xl border border-border-primary hover:bg-background-secondary transition-colors">
                Learn More
              </Link>
            </div>

            {/* Success Metrics */}
            <div className="bg-white rounded-2xl shadow-card p-8 max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
                Proven Results for Title Agencies
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">40-60%</div>
                  <p className="text-sm text-text-secondary">Email Open Rates</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">10%</div>
                  <p className="text-sm text-text-secondary">Annual Alert Rate</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">70%+</div>
                  <p className="text-sm text-text-secondary">Homeowner Activation</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">10yr</div>
                  <p className="text-sm text-text-secondary">Document Retention</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-text-secondary mb-4">
                  Join 25+ title agencies already transforming their post-closing client relationships
                </p>
                <Link href="/demo" className="text-primary-600 hover:text-primary-700 font-medium">
                  See how it works →
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="py-16 bg-background-secondary">
          <div className="container-responsive">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-4">
              Everything Title Agencies Need
            </h2>
            <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
              A complete post-closing client retention platform designed specifically for the title insurance industry
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Secure Document Storage */}
              <div className="card">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Secure Document Storage
                </h3>
                <p className="text-text-secondary text-sm">
                  10-year cloud storage for all closing documents. Organized by transaction and property.
                </p>
              </div>
              
              {/* Homeowner Portal */}
              <div className="card">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Mobile Homeowner Portal
                </h3>
                <p className="text-text-secondary text-sm">
                  Mobile-first access for homeowners to view and download their documents anytime.
                </p>
              </div>
              
              {/* Forever Marketing */}
              <div className="card">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Forever Marketing
                </h3>
                <p className="text-text-secondary text-sm">
                  Automated email campaigns with 40-60% open rates. Co-branded with your agency.
                </p>
              </div>
              
              {/* Business Alerts */}
              <div className="card">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Instant Business Alerts
                </h3>
                <p className="text-text-secondary text-sm">
                  Get notified when homeowners show signs of moving or refinancing. 10% annual alert rate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container-responsive">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-text-primary mb-2">Upload Documents</h3>
                <p className="text-text-secondary text-sm">
                  Title agencies upload closing documents organized by transaction
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-text-primary mb-2">Engage Homeowners</h3>
                <p className="text-text-secondary text-sm">
                  Automated emails keep you connected with personalized, co-branded messages
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-text-primary mb-2">Generate Business</h3>
                <p className="text-text-secondary text-sm">
                  Receive alerts when clients show activity indicating new business opportunities
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600">
          <div className="container-responsive text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Post-Closing Process?
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Join forward-thinking title agencies who are turning one-time transactions 
              into lifetime client relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="bg-white text-primary-600 px-8 py-3 rounded-xl font-medium hover:bg-primary-50 transition-colors">
                Schedule Your Demo
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-8 py-3 rounded-xl font-medium hover:bg-white hover:text-primary-600 transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-900">
          <div className="container-responsive">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Company Info */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">ROI</span>
                  </div>
                  <span className="text-white font-semibold">ROI Systems</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Transforming real estate documents into forever client relationships.
                </p>
              </div>
              
              {/* Product */}
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white text-sm">Features</a></li>
                  <li><Link href="/pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
                  <li><Link href="/demo" className="text-gray-400 hover:text-white text-sm">Demo</Link></li>
                </ul>
              </div>
              
              {/* Company */}
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-400 hover:text-white text-sm">About</Link></li>
                  <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
                  <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy</Link></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><Link href="/help" className="text-gray-400 hover:text-white text-sm">Help Center</Link></li>
                  <li><Link href="/agency/login" className="text-gray-400 hover:text-white text-sm">Agency Login</Link></li>
                  <li><Link href="/homeowner" className="text-gray-400 hover:text-white text-sm">Homeowner Access</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm text-center">
                © 2024 ROI Systems. All rights reserved. | 4-Month POC Phase
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;