import { Router } from 'express';
import { recipeController } from './recipe.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/menu-items/:menuItemId/recipe', recipeController.getRecipeByMenuItemId);
router.post('/menu-items/:menuItemId/recipe', requireRole('ADMIN'), recipeController.addIngredient);
router.patch('/recipe-ingredients/:id', requireRole('ADMIN'), recipeController.updateIngredient);
router.delete('/recipe-ingredients/:id', requireRole('ADMIN'), recipeController.removeIngredient);

export default router;
