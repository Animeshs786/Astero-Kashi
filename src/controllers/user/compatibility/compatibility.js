const CompatibilityData = require("../../../models/compatibility");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

const reverseSignPair = (signPair) => {
  // Validate signPair is a string
  if (!signPair || typeof signPair !== "string") {
    throw new AppError("signPair must be a non-empty string", 400);
  }

  // Validate signPair format (e.g., 'Aries-Taurus')
  const signs = signPair.split("-");
  const validSigns = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  if (
    signs.length !== 2 ||
    !validSigns.includes(signs[0]) ||
    !validSigns.includes(signs[1])
  ) {
    throw new AppError("Invalid signPair format. Use e.g., Aries-Taurus", 400);
  }

  // Reverse the signs and join with hyphen
  return `${signs[1]}-${signs[0]}`;
};

exports.getCompatibility = catchAsync(async (req, res, next) => {
  const { yourSign, partnerSign, language = "en" } = req.body;

  // Validate inputs
  if (!yourSign || !partnerSign) {
    return next(new AppError("Your sign and partner sign are required", 400));
  }

  // Validate signs
  const validSigns = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  const yourSignCapitalized =
    yourSign.charAt(0).toUpperCase() + yourSign.slice(1).toLowerCase();
  const partnerSignCapitalized =
    partnerSign.charAt(0).toUpperCase() + partnerSign.slice(1).toLowerCase();
  if (
    !validSigns.includes(yourSignCapitalized) ||
    !validSigns.includes(partnerSignCapitalized)
  ) {
    return next(
      new AppError("Invalid zodiac sign. Use Aries, Taurus, etc.", 400)
    );
  }

  // Validate language
  const validLanguages = ["en", "hi"];
  if (!validLanguages.includes(language.toLowerCase())) {
    return next(new AppError("Invalid language. Use en or hi", 400));
  }

  // Normalize sign pair (order-independent)
  const signPair = [yourSignCapitalized, partnerSignCapitalized]
    .sort()
    .join("-");
  let compatibilityData = "";
  try {
    const reverse = reverseSignPair(signPair);
    compatibilityData = await CompatibilityData.findOne({ signPair });
    if (!compatibilityData) {
      compatibilityData = await CompatibilityData.findOne({
        signPair: reverse,
      });
    }
    if (!compatibilityData) {
      return next(
        new AppError(`No compatibility data found for ${signPair}`, 404)
      );
    }

    console.log(`Retrieved compatibility for ${signPair}`);
    res.status(200).json({
      status: true,
      message: "Compatibility analysis completed successfully",
      data: {
        yourSign: yourSignCapitalized,
        partnerSign: partnerSignCapitalized,
        compatibilityResult: compatibilityData.compatibility,
      },
    });
  } catch (error) {
    console.error("Compatibility API error:", error.message, error.stack);
    return next(
      new AppError(
        "Failed to perform compatibility analysis: " + error.message,
        500
      )
    );
  }
});
