import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isInstalled || isDismissed) return null;

  if (isInstallable) {
    return (
      <div className="bg-[var(--m3-surface-container)] border-b border-[var(--m3-outline-variant)] py-2 px-4 text-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--m3-on-surface)] font-medium">
            <Download className="w-4 h-4 text-[var(--m3-primary)] shrink-0" />
            <span>Installiere die App auf deinem Startbildschirm für schnellen Direktzugriff.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={install}
              className="m3-btn-filled px-3.5 py-1 text-xs font-black"
            >
              Installieren
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-full text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)] transition"
              aria-label="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <div className="bg-[var(--m3-surface-container)] border-b border-[var(--m3-outline-variant)] py-2 px-4 text-xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--m3-on-surface)] font-medium">
              <Share className="w-4 h-4 text-[var(--m3-primary)] shrink-0" />
              <span>Als App auf iOS nutzen: Tippe auf Teilen &gt; Zum Home-Bildschirm.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowIOSGuide(true)}
                className="m3-btn-tonal px-3 py-1 text-xs font-black"
              >
                Anleitung
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-full text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)] transition"
                aria-label="Schließen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-[var(--m3-surface-container-high)] p-6 shadow-2xl border border-[var(--m3-outline-variant)]">
              <h3 className="text-base font-black text-[var(--m3-on-surface)] mb-2">
                Auf iPhone / iPad installieren
              </h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)] space-y-2 mb-5 leading-relaxed">
                1. Tippe in der Safari-Menüleiste unten auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil nach oben).<br />
                2. Scrolle etwas nach unten und wähle <strong>"Zum Home-Bildschirm"</strong>.<br />
                3. Bestätige oben rechts mit <strong>"Hinzufügen"</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="m3-btn-filled w-full py-2.5 text-xs font-black"
              >
                Verstanden
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
