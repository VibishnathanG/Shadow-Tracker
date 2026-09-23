import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSplashGate } from "@/components/AppSplashGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shadow Tracker",
  description: "Gamified Habit, Task & Focus Telemetry Matrix",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} min-h-full antialiased`}
      data-theme="onedark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('shadow_tracker_state');
                if (saved) {
                  var parsed = JSON.parse(saved);
                  var theme = parsed?.state?.settings?.theme;
                  if (theme) {
                    var norm = (theme === 'light' || theme === 'white') ? 'white' : (theme === 'midnight' || theme === 'pine' || theme === 'purple') ? 'purple' : theme;
                    document.documentElement.setAttribute('data-theme', norm);
                    if (norm === 'white') {
                      document.documentElement.classList.add('theme-light', 'theme-white', 'light');
                    } else if (norm === 'purple') {
                      document.documentElement.classList.add('theme-midnight', 'theme-pine', 'theme-purple', 'light');
                    } else {
                      document.documentElement.classList.add('theme-' + norm, 'dark');
                    }
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div
          id="raw-critical-splash"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            backgroundColor: '#030603',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            userSelect: 'none',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(129,140,248,0.2), rgba(192,132,252,0.2))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 25px 50px -12px rgba(34,211,238,0.1)' }}>
              <svg style={{ width: '48px', height: '48px' }} viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="85" fill="#22d3ee" opacity="0.15" />
                <ellipse cx="100" cy="100" rx="75" ry="32" stroke="#22d3ee" strokeWidth="12" transform="rotate(-30, 100, 100)" />
                <ellipse cx="100" cy="100" rx="75" ry="32" stroke="#818cf8" strokeWidth="12" transform="rotate(30, 100, 100)" />
                <ellipse cx="100" cy="100" rx="75" ry="32" stroke="#c084fc" strokeWidth="12" transform="rotate(90, 100, 100)" />
                <circle cx="158" cy="68" r="10" fill="#22d3ee" />
                <circle cx="42" cy="132" r="10" fill="#818cf8" />
                <circle cx="100" cy="25" r="10" fill="#c084fc" />
                <circle cx="100" cy="100" r="18" fill="#22d3ee" />
                <circle cx="100" cy="100" r="8" fill="#ffffff" />
              </svg>
            </div>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', margin: 0 }}>
            Shadow Tracker
          </h1>
        </div>
        <AppSplashGate>
          {children}
        </AppSplashGate>
      </body>
    </html>
  );
}
