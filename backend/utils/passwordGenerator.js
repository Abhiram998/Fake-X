import crypto from 'crypto';

/**
 * Generates a random alphabet-only password
 * Contains only A-Z and a-z
 * Explicitly excludes numbers and special characters
 * @param {number} length - Length of the password (default 12)
 * @returns {string} - Generated password
 */
export const generateSecureAlphabetPassword = (length = 12) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let password = '';

    // Use crypto.randomBytes for better security than Math.random
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        // Map the random byte to our charset
        password += charset[randomBytes[i] % charset.length];
    }

    return password;
};
