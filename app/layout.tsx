import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Blockmark 链上书签',
  description: '把常用的加密货币、交易、行情和链上数据网站收进一个页面。',
  openGraph: {
    title: 'Blockmark 链上书签',
    description: '你的加密世界，一页直达。',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'Blockmark 链上书签' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blockmark 链上书签',
    description: '你的加密世界，一页直达。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
