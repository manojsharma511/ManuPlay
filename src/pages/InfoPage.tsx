import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Mail, Globe, Lock, CheckCircle2 } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const InfoPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const path = location.pathname;

  if (path === '/about') {
    const breadcrumbs = [{ label: 'About Us' }];
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <SEO
          title={`About ${SITE_CONFIG.name} — Web Gaming Platform`}
          description={`Learn about ${SITE_CONFIG.name}, the high-performance instant HTML5 browser gaming platform.`}
          path="/about"
          breadcrumbs={breadcrumbs}
        />
        <Breadcrumbs items={breadcrumbs} />

        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">About {SITE_CONFIG.name}</h1>
              <p className="text-xs sm:text-sm text-cyan-400 font-semibold">{SITE_CONFIG.tagline}</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {SITE_CONFIG.name} is a state-of-the-art web gaming platform created to deliver zero-friction, instant mobile and desktop gaming experiences. We build and curate high quality HTML5 games that run smoothly in any modern web browser without requiring app downloads, software plugins, or account registration.
          </p>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h2 className="text-base font-extrabold text-white">Our Platform Mission</h2>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Instant Accessibility:</strong> Play games in seconds with minimal bandwidth and battery consumption.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Mobile-First Design:</strong> Designed for responsive touch input, portrait/landscape viewports, and PWA integration.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Privacy & Safety:</strong> No mandatory personal account requirements or invasive tracking scripts.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (path === '/contact') {
    const breadcrumbs = [{ label: 'Contact Us' }];
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <SEO
          title={`Contact ${SITE_CONFIG.name} Support`}
          description={`Contact the ${SITE_CONFIG.name} team for support, feedback, and publishing inquiries.`}
          path="/contact"
          breadcrumbs={breadcrumbs}
        />
        <Breadcrumbs items={breadcrumbs} />

        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Contact & Support</h1>
              <p className="text-xs sm:text-sm text-slate-400">We'd love to hear your feedback or assist with game support.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" /> Player Support
              </h2>
              <p className="text-xs text-slate-300">Found a bug or have feedback about a game?</p>
              <a href="mailto:support@manuplay.com" className="text-xs font-bold text-cyan-400 hover:underline inline-block">
                support@manuplay.com
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" /> Publisher Inquiries
              </h2>
              <p className="text-xs text-slate-300">Are you an HTML5 game developer looking to publish on ManuPlay?</p>
              <a href="mailto:partners@manuplay.com" className="text-xs font-bold text-purple-400 hover:underline inline-block">
                partners@manuplay.com
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (path === '/privacy') {
    const breadcrumbs = [{ label: 'Privacy Policy' }];
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <SEO
          title={`Privacy Policy — ${SITE_CONFIG.name}`}
          description={`Privacy policy and data protection information for users of ${SITE_CONFIG.name}.`}
          path="/privacy"
          breadcrumbs={breadcrumbs}
        />
        <Breadcrumbs items={breadcrumbs} />

        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Privacy Policy</h1>
              <p className="text-slate-400">Last updated: September 2026</p>
            </div>
          </div>

          <p>
            {SITE_CONFIG.name} values your privacy. We store game scores, player coins, favorites, and streak data locally inside your browser using Standard Web LocalStorage and IndexedDB APIs.
          </p>

          <h2 className="text-sm font-bold text-white pt-2">Data We Do Not Collect</h2>
          <p>
            We do not collect personal identify information, real names, passwords, home addresses, or payment card details.
          </p>

          <h2 className="text-sm font-bold text-white pt-2">Cookies & Local Storage</h2>
          <p>
            Local storage is used strictly to preserve game save state and user settings on your device across sessions.
          </p>
        </div>
      </div>
    );
  }

  // Terms page default
  const breadcrumbs = [{ label: 'Terms of Service' }];
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEO
        title={`Terms of Service — ${SITE_CONFIG.name}`}
        description={`Terms of service and acceptable usage guidelines for ${SITE_CONFIG.name}.`}
        path="/terms"
        breadcrumbs={breadcrumbs}
      />
      <Breadcrumbs items={breadcrumbs} />

      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Terms of Service</h1>
            <p className="text-slate-400">Last updated: September 2026</p>
          </div>
        </div>

        <p>
          By accessing and playing games on {SITE_CONFIG.name}, you agree to comply with these terms of service.
        </p>

        <h2 className="text-sm font-bold text-white pt-2">Permitted Use</h2>
        <p>
          All games published on {SITE_CONFIG.name} are provided for personal, non-commercial entertainment. You may not attempt to reverse engineer game assets, cheat, or overload platform servers.
        </p>

        <h2 className="text-sm font-bold text-white pt-2">Intellectual Property</h2>
        <p>
          Game titles, logos, and custom code are protected property of {SITE_CONFIG.legalName} and their respective authors.
        </p>
      </div>
    </div>
  );
};
