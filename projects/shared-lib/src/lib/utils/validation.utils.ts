export class ValidationUtils {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  static isPhoneNumber(phone: string): boolean {
    const phoneRegex =
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }

  static hasMinLength(value: string, minLength: number): boolean {
    return !!value && value.length >= minLength;
  }

  static isNumeric(value: string): boolean {
    return /^\d+$/.test(value);
  }
  static isAlphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(value);
  }
}
