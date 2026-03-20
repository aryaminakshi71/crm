"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie_consent";
const CONSENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

export interface CookieConsent {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: number;
}

function isConsentExpired(consent: CookieConsent): boolean {
  const now = Date.now();
  const expiryDate = consent.timestamp + CONSENT_DURATION_MS;
  return now > expiryDate;
}

function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return null;

  try {
    const consent = JSON.parse(stored) as CookieConsent;
    if (isConsentExpired(consent)) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    return consent;
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

export function hasConsent(): boolean {
  return getStoredConsent() !== null;
}

export function useCookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    setShowBanner(!stored);
  }, []);

  const acceptAll = () => {
    const newConsent: CookieConsent = {
      analytics: true,
      functional: true,
      marketing: true,
      timestamp: Date.now(),
    };
    setCookieConsent(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
  };

  const rejectAll = () => {
    const newConsent: CookieConsent = {
      analytics: false,
      functional: true,
      marketing: false,
      timestamp: Date.now(),
    };
    setCookieConsent(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
  };

  const savePreferences = (preferences: Omit<CookieConsent, "timestamp">) => {
    const newConsent: CookieConsent = {
      ...preferences,
      timestamp: Date.now(),
    };
    setCookieConsent(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
  };

  const dismissBanner = () => {
    setShowBanner(false);
  };

  return {
    showBanner,
    consent,
    acceptAll,
    rejectAll,
    savePreferences,
    dismissBanner,
    hasAnalyticsConsent: consent?.analytics ?? false,
    hasFunctionalConsent: consent?.functional ?? true,
    hasMarketingConsent: consent?.marketing ?? false,
  };
}

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: Omit<CookieConsent, "timestamp">) => void;
  initialPreferences: Omit<CookieConsent, "timestamp">;
}

function PreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: PreferencesModalProps) {
  const [preferences, setPreferences] =
    useState<Omit<CookieConsent, "timestamp">>(initialPreferences);

  useEffect(() => {
    if (isOpen) {
      setPreferences(initialPreferences);
    }
  }, [isOpen, initialPreferences]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "90%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          animation: "scaleIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Cookie Preferences
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: "20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflow: "auto" }}>
          <p
            style={{
              margin: "0 0 20px",
              color: "#4b5563",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            We use cookies to enhance your browsing experience, serve
            personalized content, and analyze our traffic. By clicking
            "Accept All" or "Reject All", you consent to our use of cookies.
          </p>

          {/* Functional Cookies */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Functional Cookies
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Required for authentication and session management
                </p>
              </div>
              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      functional: e.target.checked,
                    })
                  }
                  disabled
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "not-allowed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: preferences.functional
                      ? "#2563eb"
                      : "#d1d5db",
                    borderRadius: "24px",
                    transition: "0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: preferences.functional ? "23px" : "3px",
                      bottom: "3px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.2s",
                    }}
                  />
                </span>
              </label>
            </div>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "11px",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              Required - cannot be disabled
            </p>
          </div>

          {/* Analytics Cookies */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Analytics Cookies
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Help us understand how visitors interact with our website
                </p>
              </div>
              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      analytics: e.target.checked,
                    })
                  }
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: preferences.analytics
                      ? "#2563eb"
                      : "#d1d5db",
                    borderRadius: "24px",
                    transition: "0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: preferences.analytics ? "23px" : "3px",
                      bottom: "3px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.2s",
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Marketing Cookies
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Used to deliver personalized advertisements
                </p>
              </div>
              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      marketing: e.target.checked,
                    })
                  }
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: preferences.marketing
                      ? "#2563eb"
                      : "#d1d5db",
                    borderRadius: "24px",
                    transition: "0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: preferences.marketing ? "23px" : "3px",
                      bottom: "3px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.2s",
                    }}
                  />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "white",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              color: "white",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

interface CookieConsentBannerProps {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onManagePreferences?: () => void;
}

export function CookieConsentBanner({
  onAcceptAll,
  onRejectAll,
  onManagePreferences,
}: CookieConsentBannerProps) {
  const [showPreferences, setShowPreferences] = useState(false);

  const handleAcceptAll = () => {
    const consent: CookieConsent = {
      analytics: true,
      functional: true,
      marketing: true,
      timestamp: Date.now(),
    };
    setCookieConsent(consent);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    const consent: CookieConsent = {
      analytics: false,
      functional: true,
      marketing: false,
      timestamp: Date.now(),
    };
    setCookieConsent(consent);
    onRejectAll?.();
  };

  const handleSavePreferences = (preferences: Omit<CookieConsent, "timestamp">) => {
    const consent: CookieConsent = {
      ...preferences,
      timestamp: Date.now(),
    };
    setCookieConsent(consent);
    onManagePreferences?.();
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Top row - Icon and text */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                flexShrink: 0,
              }}
            >
              <Cookie className="h-5 w-5 text-blue-600" />
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                We value your privacy
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#4b5563",
                  lineHeight: 1.5,
                }}
              >
                We use cookies to enhance your browsing experience, serve
                personalized content, and analyze our traffic. By clicking
                "Accept All" or "Reject All", you consent to our use of cookies.
                You can manage your preferences at any time.
              </p>
            </div>
          </div>

          {/* Bottom row - Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setShowPreferences(true)}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#9ca3af";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              Manage Preferences
            </button>
            <button
              onClick={handleRejectAll}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#9ca3af";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              Reject All
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "white",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#1d4ed8";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
        initialPreferences={{
          analytics: false,
          functional: true,
          marketing: false,
        }}
      />

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
