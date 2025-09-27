/**
 * Validation utilities for the application
 */

/**
 * Validates Egyptian phone numbers
 * Egyptian phone numbers can be in formats:
 * - +20XXXXXXXXXX (international format)
 * - 01XXXXXXXXX (local format)
 * - 20XXXXXXXXXX (without +)
 */
export function validateEgyptianPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Egyptian phone number patterns
  const patterns = [
    /^\+20(10|11|12|15)\d{8}$/, // +20 followed by valid Egyptian mobile prefixes
    /^01(0|1|2|5)\d{8}$/,       // Local format starting with 01
    /^20(10|11|12|15)\d{8}$/    // Without + prefix
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Validates Egyptian National ID number
 * Egyptian National ID is 14 digits
 */
export function validateEgyptianNationalId(identityNumber: string): boolean {
  if (!identityNumber) return false;
  
  // Remove all non-digit characters
  const cleaned = identityNumber.replace(/\D/g, '');
  
  // Must be exactly 14 digits
  if (cleaned.length !== 14) return false;
  
  // Check if all characters are digits
  return /^\d{14}$/.test(cleaned);
}

/**
 * Formats Egyptian phone number to standard format
 */
export function formatEgyptianPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it starts with +20, return as is
  if (cleaned.startsWith('+20')) {
    return cleaned;
  }
  
  // If it starts with 20, add +
  if (cleaned.startsWith('20')) {
    return '+' + cleaned;
  }
  
  // If it starts with 01, convert to international format
  if (cleaned.startsWith('01')) {
    return '+20' + cleaned;
  }
  
  // If it's 10 digits and starts with 1, assume it's missing the 0
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return '+20' + cleaned;
  }
  
  return phoneNumber; // Return original if can't format
}
