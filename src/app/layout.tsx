import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  display: 'swap',
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'GovWealth Planner — ระบบบริหารความมั่งคั่งและภาษีข้าราชการไทย',
  description: 'ระบบวางแผนการเงิน งบดุล พอร์ตการลงทุน 6 หมวด กระแสเงินสด และภาษี กบข./RMF สำหรับข้าราชการไทย พ.ศ. 2569',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${prompt.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
