import { recipeService } from './recipe.service.mjs';
import { addIngredientSchema, updateIngredientSchema } from './recipe.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const recipeController = {
  async getRecipeByMenuItemId(req, res, next) {
    try {
      const { menuItemId } = req.params;
      const ingredients = await recipeService.getRecipeByMenuItemId(menuItemId);
      return res.json({ data: ingredients });
    } catch (err) {
      next(err);
    }
  },

  async addIngredient(req, res, next) {
    try {
      const { menuItemId } = req.params;
      const parseResult = addIngredientSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid recipe ingredient input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const newIngredient = await recipeService.addIngredient(menuItemId, parseResult.data);
      return res.status(201).json({ data: newIngredient });
    } catch (err) {
      next(err);
    }
  },

  async updateIngredient(req, res, next) {
    try {
      const { id } = req.params;
      const parseResult = updateIngredientSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid recipe update input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const updated = await recipeService.updateIngredient(id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async removeIngredient(req, res, next) {
    try {
      const { id } = req.params;
      await recipeService.removeIngredient(id);
      return res.json({ data: { message: 'Recipe ingredient line removed successfully' } });
    } catch (err) {
      next(err);
    }
  }
};
