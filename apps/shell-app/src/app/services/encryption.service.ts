import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

/**
 * Encryption Service
 * Legacy: EncryptDecrypt.cs functionality
 */
@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private readonly SECRET_KEY = 'YourSecretKey123!@#'; // Should match backend

  /**
   * Encrypt text
   */
  encrypt(text: string): string {
    if (!text) return '';

    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.SECRET_KEY);
      return encrypted.toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  }

  /**
   * Decrypt text
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.SECRET_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  }

  /**
   * Hash password
   */
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }
}
