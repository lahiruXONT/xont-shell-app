import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
/**
 * Encryption Service
 *
 * IMPORTANT: Do NOT use this for password encryption!
 * Passwords should ONLY be hashed on the backend using bcrypt/PBKDF2.
 *
 * This service is ONLY for encrypting sensitive data in sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class EncryptionService {
  private sessionKey: string | null = null;
  initializeSession(): void {
    this.sessionKey = this.generateRandomKey();
  }
  clearSession(): void {
    this.sessionKey = null;
  }
  /**
   * Encrypt data for sessionStorage
   * Use this ONLY for client-side data encryption, NOT passwords
   */
  encryptData(data: any): string {
    if (!this.sessionKey) {
      throw new Error('Session not initialized');
    }
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.sessionKey
    );
    return encrypted.toString();
  }
  decryptData<T>(encrypted: string): T {
    if (!this.sessionKey) {
      throw new Error('Session not initialized');
    }
    const decrypted = CryptoJS.AES.decrypt(encrypted, this.sessionKey);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString) as T;
  }
  private generateRandomKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }
}
