import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlags {
  requirePhoneVerification: boolean;
}

interface FeatureFlagsPayload {
  require_phone_verification: boolean;
}

export const FEATURE_FLAGS_CONFIG_INVALID = "FEATURE_FLAGS_CONFIG_INVALID";
const DEFAULT_FEATURE_FLAGS: FeatureFlags = { requirePhoneVerification: false };

const isFeatureFlagsPayload = (value: unknown): value is FeatureFlagsPayload => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return typeof (value as { require_phone_verification?: unknown }).require_phone_verification === "boolean";
};

export const parseFeatureFlagsPayload = (value: unknown): FeatureFlags => {
  if (!isFeatureFlagsPayload(value)) {
    throw new Error(FEATURE_FLAGS_CONFIG_INVALID);
  }

  return {
    requirePhoneVerification: value.require_phone_verification,
  };
};

export const fetchFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const { data, error } = await supabase.functions.invoke("get-feature-flags", {
      body: {},
    });

    if (error) {
      throw new Error(error.message || FEATURE_FLAGS_CONFIG_INVALID);
    }

    return parseFeatureFlagsPayload(data);
  } catch (error) {
    const detail = error instanceof Error ? error.message : FEATURE_FLAGS_CONFIG_INVALID;
    console.warn("[Verity] Feature flags unavailable; defaulting to fail-open policy.", detail);
    return DEFAULT_FEATURE_FLAGS;
  }
};
