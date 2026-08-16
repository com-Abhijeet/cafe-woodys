import { Router } from 'express';
import { gamingSessionController } from './gaming-session.controller.mjs';
import { requireAuth } from '../auth/auth.middleware.mjs';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', gamingSessionController.getActiveSessions);
router.post('/', gamingSessionController.startPlayerSession);
router.patch('/:id/close', gamingSessionController.closePlayerSession);

export default router;
