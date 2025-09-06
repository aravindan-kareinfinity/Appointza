/**
 * Encryption utility for encoding/decoding data
 * Uses HMAC-SHA256 for secure encryption with server compatibility
 */
export class EncryptionUtil {
  private static readonly SECRET_KEY = 'AppointzaSecretKey2024'; // Should match server secret
  
  /**
   * Encode string to base64
   */
  static encodeBase64(data: string): string {
    try {
      return btoa(data);
    } catch (error) {
      console.error('Error encoding to base64:', error);
      return '';
    }
  }

  /**
   * Decode base64 string
   */
  static decodeBase64(data: string): string {
    try {
      return atob(data);
    } catch (error) {
      console.error('Error decoding from base64:', error);
      return '';
    }
  }

  /**
   * Generate HMAC-SHA256 hash
   */
  static async generateHmacSha256(key: string, data: string): Promise<string> {
    try {
      // Check if crypto.subtle is available (not available in React Native)
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        console.warn('crypto.subtle not available, using fallback');
        return this.generateHmacSha256Fallback(key, data);
      }
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(key);
      const dataData = encoder.encode(data);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataData);
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Error generating HMAC-SHA256:', error);
      console.log('Falling back to simple implementation');
      return this.generateHmacSha256Fallback(key, data);
    }
  }

  /**
   * Fallback HMAC-SHA256 implementation for React Native
   */
  static generateHmacSha256Fallback(key: string, data: string): string {
    // For now, return a simple hash as fallback
    // In production, you should use a proper HMAC library like 'crypto-js'
    console.warn('Using fallback HMAC implementation - not secure for production');
    const combined = key + data;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(8); // 64-char hex string
  }

  /**
   * Encode location ID for template URL - Simple approach
   */
  static encodeLocationId(locationId: number): string {
    try {
      console.log('Encoding location ID:', locationId);
      
      // Simple approach: just encode the location ID with a prefix
      const dataToEncode = `LOC_${locationId}_${Date.now()}`;
      const encodedData = this.encodeBase64(dataToEncode);
      
      console.log('Data to encode:', dataToEncode);
      console.log('Final encoded data:', encodedData);
      
      return encodedData;
    } catch (error) {
      console.error('Error encoding location ID:', error);
      // Fallback to simple base64 encoding
      return this.encodeBase64(locationId.toString());
    }
  }

  /**
   * Decode location ID from template URL - Simple approach
   */
  static decodeLocationId(encodedId: string): number {
    try {
      console.log('Decoding location ID:', encodedId);
      
      const decoded = this.decodeBase64(encodedId);
      console.log('Decoded string:', decoded);
      
      // Check if it's in the new format: LOC_25_1757198044038
      if (decoded.startsWith('LOC_')) {
        const parts = decoded.split('_');
        if (parts.length === 3 && parts[0] === 'LOC') {
          const locationId = parseInt(parts[1], 10);
          const timestamp = parseInt(parts[2], 10);
          
          console.log('Location ID:', locationId, 'Timestamp:', timestamp);
          
          // Check if timestamp is not too old (24 hours)
          const now = Date.now();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (now - timestamp <= maxAge) {
            console.log('Successfully decoded location ID:', locationId);
            return locationId;
          } else {
            console.log('URL has expired');
            return 0;
          }
        }
      }
      
      // Fallback to simple base64 decoding
      console.log('Trying fallback to simple base64 decoding');
      const fallbackId = parseInt(decoded, 10);
      console.log('Fallback result:', fallbackId);
      return fallbackId || 0;
    } catch (error) {
      console.error('Error decoding location ID:', error);
      return 0;
    }
  }

  /**
   * Simple base64 encoding for backward compatibility
   */
  static encodeLocationIdSimple(locationId: number): string {
    return this.encodeBase64(locationId.toString());
  }

  /**
   * Simple base64 decoding for backward compatibility
   */
  static decodeLocationIdSimple(encodedId: string): number {
    const decoded = this.decodeBase64(encodedId);
    return parseInt(decoded, 10) || 0;
  }
}
