import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { CartHeader } from '@/components/CartHeader';
import { ClientThemeProvider } from '@/components/theme'; 
import '@/styles/styles.scss';

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
        <ClientThemeProvider>
          <CartProvider>
            <CartHeader />
            <main className="main-container">
              {children}
            </main>
          </CartProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}