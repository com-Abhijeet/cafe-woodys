import { Router } from 'express';
import { zoneController } from './zone.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', zoneController.listZones);
router.get('/:id', zoneController.getZoneById);

router.post('/', requireRole('ADMIN'), zoneController.createZone);
router.patch('/:id', requireRole('ADMIN'), zoneController.updateZone);
router.delete('/:id', requireRole('ADMIN'), zoneController.deleteZone);

export default router;
