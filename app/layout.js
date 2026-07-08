import { Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Sora({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600'],
  variable: '--font-display',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'Mirror',
  description: 'Smart mirror dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-display bg-black text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
