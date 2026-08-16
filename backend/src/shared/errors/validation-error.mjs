import { AppError } from './app-error.mjs';

export class ValidationError extends AppError {
  constructor(message = 'Invalid input data', code = 'VALIDATION_ERROR', details = null) {
    super(message, 400, code);
    this.details = details;
  }
}
