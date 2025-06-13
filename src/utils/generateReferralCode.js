const Astrologer = require("../models/asteroLogerSchema");


// Generate a unique referral code based on astrologer name
const generateReferralCode = async (name) => {
  // Fallback for empty or invalid name
  const baseName = name && name.trim() ? name.trim() : "ASTRO";

  // Clean name: remove spaces, special characters, convert to uppercase
  let codeBase = baseName
    .replace(/[^a-zA-Z0-9]/g, "") // Remove non-alphanumeric
    .toUpperCase()
    .slice(0, 8); // Take first 8 characters

  // Ensure minimum length (pad with random letters if too short)
  if (codeBase.length < 4) {
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    while (codeBase.length < 4) {
      codeBase += randomChars[Math.floor(Math.random() * randomChars.length)];
    }
  }

  // Max retries to avoid infinite loops
  const maxRetries = 10;
  let referralCode;
  let isUnique = false;
  let retryCount = 0;

  while (!isUnique && retryCount < maxRetries) {
    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    referralCode = `${codeBase}${randomNum}`;

    // Check if code exists in database
    const existingAstrologer = await Astrologer.findOne({ referralCode });
    if (!existingAstrologer) {
      isUnique = true;
    }
    retryCount++;
  }

  if (!isUnique) {
    throw new Error("Unable to generate unique referral code after maximum retries");
  }

  return referralCode;
};

module.exports = generateReferralCode;