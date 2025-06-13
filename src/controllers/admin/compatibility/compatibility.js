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

// Create compatibility data
exports.createCompatibilityData = catchAsync(async (req, res, next) => {
  const { signPair, compatibility } = req.body;

  if (!signPair || !compatibility) {
    return next(new AppError("signPair and compatibility are required", 400));
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
    return next(
      new AppError("Invalid signPair format. Use e.g., Aries-Taurus", 400)
    );
  }

  // Validate compatibility structure
  const requiredFields = [
    "love",
    "sexual",
    "friendship",
    "communication",
    "relationshipTips",
  ];
  if (
    !requiredFields.every((field) =>
      compatibility[field] && typeof compatibility[field] === "object"
        ? "percentage" in compatibility[field] &&
          "description" in compatibility[field]
        : true
    )
  ) {
    return next(
      new AppError(
        "Invalid compatibility structure. Include love, sexual, friendship, communication with percentage and description, and relationshipTips",
        400
      )
    );
  }

  try {
    const existingData1 = await CompatibilityData.findOne({ signPair });
    if (existingData1) {
      return next(
        new AppError(`Compatibility data for ${signPair} already exists`, 409)
      );
    }

    const reverse = reverseSignPair(signPair);
    console.log(reverse);

    const existingData2 = await CompatibilityData.findOne({
      signPair: reverse,
    });
    if (existingData2) {
      return next(
        new AppError(`Compatibility data for ${signPair} already exists`, 409)
      );
    }

    const newData = await CompatibilityData.create({ signPair, compatibility });
    console.log(`Created compatibility data for ${signPair}`);
    res.status(201).json({
      status: true,
      message: "Compatibility data created successfully",
      data: newData,
    });
  } catch (error) {
    console.error("Create error:", error.message, error.stack);
    return next(
      new AppError("Failed to create compatibility data: " + error.message, 500)
    );
  }
});

// Read all compatibility data
exports.getAllCompatibilityData = catchAsync(async (req, res, next) => {
  try {
    const data = await CompatibilityData.find();
    console.log(`Retrieved ${data.length} compatibility pairs`);
    res.status(200).json({
      status: true,
      message: "Compatibility data retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Read all error:", error.message, error.stack);
    return next(
      new AppError(
        "Failed to retrieve compatibility data: " + error.message,
        500
      )
    );
  }
});

// Read specific compatibility data
exports.getCompatibilityData = catchAsync(async (req, res, next) => {
  try {
    const data = await CompatibilityData.findById(req.params.id);
    if (!data) {
      return next(new AppError(`No compatibility data found `, 404));
    }
    res.status(200).json({
      status: true,
      message: "Compatibility data retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Read error:", error.message, error.stack);
    return next(
      new AppError(
        "Failed to retrieve compatibility data: " + error.message,
        500
      )
    );
  }
});

// Update compatibility data
exports.updateCompatibilityData = catchAsync(async (req, res, next) => {
  const { compatibility } = req.body;

  if (!compatibility) {
    return next(new AppError("signPair and compatibility are required", 400));
  }

  try {
    const data = await CompatibilityData.findByIdAndUpdate(
      req.params.id,
      { compatibility },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Compatibility data updated successfully",
      data: data,
    });
  } catch (error) {
    console.error("Update error:", error.message, error.stack);
    return next(
      new AppError("Failed to update compatibility data: " + error.message, 500)
    );
  }
});

// Delete compatibility data
exports.deleteCompatibilityData = catchAsync(async (req, res, next) => {
  try {
    await CompatibilityData.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: true,
      message: "Compatibility data deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete error:", error.message, error.stack);
    return next(
      new AppError("Failed to delete compatibility data: " + error.message, 500)
    );
  }
});
