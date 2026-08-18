import { businessProfileService } from './business-profile.service.mjs';

export async function getBusinessProfileHandler(req, res, next) {
  try {
    const profile = await businessProfileService.getProfile();
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateBusinessProfileHandler(req, res, next) {
  try {
    const updated = await businessProfileService.updateProfile(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
