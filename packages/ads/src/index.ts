/**
 * Ads Package
 *
 * Ad network integrations with adapter pattern.
 * Currently supports Google Ads, extensible for Microsoft Ads, Facebook, etc.
 */

// Core types and interfaces
export interface UTMData {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

export interface ClickData {
  gclid?: string | null; // Google Click ID
  msclkid?: string | null; // Microsoft Click ID
  fbclid?: string | null; // Facebook Click ID
}

export interface AdConversion {
  id?: string;
  organizationId: string;
  leadId?: string | null;
  contactId?: string | null;
  adNetwork: "google_ads" | "microsoft_ads" | "facebook_ads";
  conversionId?: string | null;
  campaignId?: string | null;
  adGroupId?: string | null;
  utmData: UTMData;
  clickData: ClickData;
  conversionType: "form_submission" | "page_view" | "purchase" | "signup";
  conversionValue?: number | null;
  conversionTimestamp: Date;
  syncedToAdNetwork?: boolean;
  syncedAt?: Date | null;
  syncError?: string | null;
}

export interface ConversionResult {
  success: boolean;
  externalConversionId?: string;
  error?: string;
}

export interface CampaignStats {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  roas: number;
}

export interface AdAccountConnection {
  accountId: string;
  accountName: string;
  customerId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  accountName?: string;
  customerId?: string;
  lastSyncedAt?: Date;
  error?: string;
}

// Base adapter interface
export interface AdNetworkAdapter {
  // Connection management
  connect(authCode: string, orgId: string): Promise<AdAccountConnection>;
  disconnect(orgId: string): Promise<void>;
  getConnectionStatus(orgId: string): Promise<ConnectionStatus>;

  // Conversion tracking
  trackConversion(conversion: AdConversion): Promise<ConversionResult>;
  getConversions(orgId: string, dateRange?: DateRange): Promise<AdConversion[]>;

  // Campaign data
  getCampaigns(orgId: string): Promise<CampaignStats[]>;
  getCampaignStats(orgId: string, campaignId: string, dateRange?: DateRange): Promise<CampaignStats>;

  // Lead sync (enhanced conversions)
  syncLead(conversion: AdConversion): Promise<ConversionResult>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Factory function type
export type AdNetworkType = "google_ads" | "microsoft_ads" | "facebook_ads";

export function createAdNetworkAdapter(
  network: AdNetworkType,
  config: Record<string, string>
): AdNetworkAdapter {
  switch (network) {
    case "google_ads":
      return createGoogleAdsAdapter(config);
    default:
      throw new Error(`Unsupported ad network: ${network}`);
  }
}

// Lazy imports for adapters
let googleAdsAdapter: AdNetworkAdapter | null = null;

function createGoogleAdsAdapter(config: Record<string, string>): AdNetworkAdapter {
  if (!googleAdsAdapter) {
    // This will be initialized with the actual implementation
    googleAdsAdapter = new GoogleAdsAdapterStub(config);
  }
  return googleAdsAdapter;
}

// Stub implementation - will be replaced with real Google Ads adapter
class GoogleAdsAdapterStub implements AdNetworkAdapter {
  constructor(private config: Record<string, string>) {}

  async connect(authCode: string, orgId: string): Promise<AdAccountConnection> {
    throw new Error("Google Ads adapter not yet initialized");
  }

  async disconnect(orgId: string): Promise<void> {
    throw new Error("Google Ads adapter not yet initialized");
  }

  async getConnectionStatus(orgId: string): Promise<ConnectionStatus> {
    return { connected: false };
  }

  async trackConversion(conversion: AdConversion): Promise<ConversionResult> {
    throw new Error("Google Ads adapter not yet initialized");
  }

  async getConversions(orgId: string, dateRange?: DateRange): Promise<AdConversion[]> {
    return [];
  }

  async getCampaigns(orgId: string): Promise<CampaignStats[]> {
    return [];
  }

  async getCampaignStats(orgId: string, campaignId: string, dateRange?: DateRange): Promise<CampaignStats> {
    throw new Error("Google Ads adapter not yet initialized");
  }

  async syncLead(conversion: AdConversion): Promise<ConversionResult> {
    throw new Error("Google Ads adapter not yet initialized");
  }
}

export { GoogleAdsAdapterStub as GoogleAdsAdapter };
