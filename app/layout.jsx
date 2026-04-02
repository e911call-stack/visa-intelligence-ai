import './globals.css';

export const metadata = {
  title: 'Visa Intelligence AI — Know Your Approval Odds',
  description: 'AI-powered visa approval probability analysis. Get a detailed assessment of your visa application strength in minutes.',
  keywords: 'visa approval, visa probability, immigration AI, visa assessment',
  openGraph: {
    title: 'Visa Intelligence AI',
    description: 'Know your visa approval odds before you apply.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy-900 text-slate-text antialiased">
        {children}
      </body>
    </html>
  );
}
