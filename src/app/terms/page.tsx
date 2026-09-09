import React from 'react';
import Link from 'next/link';
import { Lucide } from '@/components/icons';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 sm:p-12 font-sans selection:bg-primary/30">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-bold text-sm">
          <Lucide.ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Terms & Conditions</h1>
          <p className="text-muted-foreground text-lg font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <section className="tile p-8 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Lucide.Shield size={20} /> 1. Privacy First & Local Data
          </h2>
          <p className="text-foreground/80 leading-relaxed font-medium">
            Shadow-Tracker is designed as a privacy-first, local-only Progressive Web App (PWA). All of your data—including tasks, habits, daily logs, and journal reflections—is stored securely in your browser's local IndexedDB. We do not collect, harvest, or transmit your data to any third-party servers. You own your data.
          </p>

          <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-3 pt-4">
            <Lucide.Cloud size={20} /> 2. Cloud Sync via GitHub
          </h2>
          <p className="text-foreground/80 leading-relaxed font-medium">
            The optional Cloud Sync feature utilizes your personal GitHub account via a Personal Access Token (PAT). By using this feature, you agree that your encrypted backups will be stored as private GitHub Gists under your own GitHub account. We are not responsible for the security of your GitHub account or the exposure of your PAT.
          </p>

          <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-3 pt-4">
            <Lucide.AlertTriangle size={20} /> 3. Data Loss & Responsibilities
          </h2>
          <p className="text-foreground/80 leading-relaxed font-medium">
            Because Shadow-Tracker operates locally, clearing your browser cache or site data without first exporting a backup will result in permanent data loss. You are solely responsible for maintaining regular manual exports or utilizing the Cloud Sync feature to safeguard your data.
          </p>

          <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-3 pt-4">
            <Lucide.Code size={20} /> 4. "As Is" Warranty
          </h2>
          <p className="text-foreground/80 leading-relaxed font-medium">
            Shadow-Tracker is provided "as is", without warranty of any kind, express or implied. In no event shall the developers be liable for any claim, damages, or other liability arising from, out of, or in connection with the software or the use or other dealings in the software.
          </p>
        </section>

        <footer className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">Shadow-Tracker</span>
          <span className="text-sm text-foreground/60 font-medium">Made for productivity. Designed for privacy.</span>
        </footer>
      </div>
    </div>
  );
}
