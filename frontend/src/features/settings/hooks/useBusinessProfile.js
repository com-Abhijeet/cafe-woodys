import { useSettingsContext } from '../../../context/SettingsContext';
import { updateBusinessProfileApi } from '../api/businessProfile.api';

export function useBusinessProfile() {
  const { settings, isLoading, refreshSettings, updateSettingModule } = useSettingsContext();
  const profile = settings?.businessProfile;

  const updateProfile = async (payload) => {
    const updated = await updateBusinessProfileApi(payload);
    updateSettingModule('businessProfile', updated);
    return updated;
  };

  return {
    profile,
    isLoading,
    refreshProfile: refreshSettings,
    updateProfile
  };
}

