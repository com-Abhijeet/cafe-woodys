import { businessProfileRepository } from './business-profile.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';

function formatProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    defaultGstPercent: Number(profile.defaultGstPercent)
  };
}

// In-Memory Cache (60-second TTL) for Business Profile
let cachedProfile = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60000;

export const businessProfileService = {
  async getProfile() {
    if (cachedProfile && Date.now() < cacheExpiry) {
      return cachedProfile;
    }

    let profile = await businessProfileRepository.findFirst();
    if (!profile) {
      profile = await businessProfileRepository.createDefault();
    }
    const formatted = formatProfile(profile);
    cachedProfile = formatted;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return formatted;
  },

  async updateProfile(data) {
    let profile = await businessProfileRepository.findFirst();
    if (!profile) {
      profile = await businessProfileRepository.createDefault();
    }
    const updated = await businessProfileRepository.update(profile.id, data);
    const formatted = formatProfile(updated);
    cachedProfile = formatted;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    broadcastSettingsUpdated('BUSINESS_PROFILE', formatted);
    return formatted;
  }
};
