
import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { CartHeader } from '@/components/CartHeader';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chivent - Chicago Events',
  description: 'Discover and book events in Chicago',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            <CartHeader />
            <main className="max-w-7xl mx-auto p-6">
              {children}
            </main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}