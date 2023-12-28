namespace App {
  //Validation
  export interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  }

  export function validate(validatableInput: Validatable) {
    const { value, required, minLength, maxLength, min, max } = validatableInput;

    if (required) {
      if (value.toString().trim().length === 0) return false;
    }

    if (minLength != null && typeof value === 'string') {
      if (value.length < minLength) return false;
    }

    if (maxLength != null && typeof value === 'string') {
      if (value.length > maxLength) return false;
    }

    if (min != null && typeof value === 'number') {
      if (value < min) return false;
    }

    if (max != null && typeof value === 'number') {
      if (value > max) return false;
    }

    return true;
  }
}
