import { Router } from 'express';
import multer from 'multer';
import { menuItemController } from './menu-item.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(requireAuth);

router.get('/', menuItemController.listMenuItems);
router.get('/:id', menuItemController.getMenuItemById);

router.post('/', requireRole('ADMIN'), menuItemController.createMenuItem);
router.patch('/:id', requireRole('ADMIN'), menuItemController.updateMenuItem);
router.delete('/:id', requireRole('ADMIN'), menuItemController.deleteMenuItem);

// Image Upload
router.post('/:id/image', requireRole('ADMIN'), upload.single('image'), menuItemController.uploadImage);

export default router;
