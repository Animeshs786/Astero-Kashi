const AssignAstrologer = require("../../../models/assingAstrologer");
const Astrologer = require("../../../models/asteroLogerSchema");
const Pooja = require("../../../models/pooja"); // Adjust path to your Pooja model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createPooja = catchAsync(async (req, res, next) => {
  const { name, shortDescription, about, purpose, benefits, status } = req.body;
  let imagePath;

  console.log(req.body, "body");

  // Validate required fields
  if (!name || !about || !purpose) {
    return next(new AppError("Name, about, purpose, e are required", 400));
  }

  // Check for duplicate pooja name
  const existingPooja = await Pooja.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
  if (existingPooja) {
    return next(new AppError("Pooja name must be unique", 400));
  }

  const poojaData = {
    name,
    shortDescription: shortDescription || "",
    about,
    purpose,
    benefits: benefits ? JSON.parse(benefits) : [],
    status: status !== undefined ? status : true,
  };

  try {
    // Handle image upload (required)
    if (!req.files || !req.files.image || req.files.image.length !== 1) {
      return next(new AppError("Exactly one image is required", 400));
    }
    const image = req.files.image[0];
    const imageUrl = `${image.destination}/${image.filename}`;
    poojaData.image = imageUrl;
    imagePath = imageUrl;

    const newPooja = await Pooja.create(poojaData);

    res.status(201).json({
      status: true,
      message: "Pooja created successfully",
      data: newPooja,
    });
  } catch (error) {
    // Clean up uploaded image if creation fails
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllPoojas = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  // Search by name (case-insensitive)
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Pooja,
    null,
    query
  );

  const poojas = await Pooja.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Poojas fetched successfully",
    data: poojas,
  });
});

exports.getPooja = catchAsync(async (req, res, next) => {
  const pooja = await Pooja.findById(req.params.id);

  if (!pooja) {
    return next(new AppError("Pooja not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Pooja fetched successfully",
    data: pooja,
  });
});

exports.updatePooja = catchAsync(async (req, res, next) => {
  const { name, shortDescription, about, purpose, benefits, status } = req.body;
  let imagePath;

  console.log(req.body, "body");
  const pooja = await Pooja.findById(req.params.id);

  if (!pooja) {
    return next(new AppError("Pooja not found", 404));
  }

  // Check for duplicate pooja name (excluding current pooja)
  if (name && name !== pooja.name) {
    const existingPooja = await Pooja.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingPooja) {
      return next(new AppError("Pooja name must be unique", 400));
    }
  }

  const poojaData = {};

  if (name) poojaData.name = name;
  if (shortDescription !== undefined)
    poojaData.shortDescription = shortDescription;
  if (about) poojaData.about = about;
  if (purpose) poojaData.purpose = purpose;
  if (benefits !== undefined) poojaData.benefits = JSON.parse(benefits) || [];
  if (status !== undefined) poojaData.status = status;

  try {
    // Handle image update
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      poojaData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (pooja.image) {
        await deleteOldFiles(pooja.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedPooja = await Pooja.findByIdAndUpdate(
      req.params.id,
      poojaData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Pooja updated successfully",
      data: updatedPooja,
    });
  } catch (error) {
    // Clean up uploaded image if update fails
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.deletePooja = catchAsync(async (req, res, next) => {
  const pooja = await Pooja.findById(req.params.id);

  if (!pooja) {
    return next(new AppError("Pooja not found", 404));
  }

  // Delete associated image if exists
  if (pooja.image) {
    await deleteOldFiles(pooja.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await Pooja.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Pooja deleted successfully",
    data: null,
  });
});

exports.createAssignAstrologer = catchAsync(async (req, res, next) => {
  const { astrologerId, poojaId, price, sellPrice } = req.body;

  // Validate input
  if (!astrologerId || !poojaId) {
    return next(new AppError("Astrologer ID and Pooja ID are required", 400));
  }

  // Validate astrologer
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Validate pooja
  const pooja = await Pooja.findById(poojaId);
  if (!pooja) {
    return next(new AppError("Pooja not found", 404));
  }

  // Validate price and sellPrice
  if (price < 0 || sellPrice < 0) {
    return next(new AppError("Price and sellPrice cannot be negative", 400));
  }

  const isExist = await AssignAstrologer.findOne({
    astrologer: astrologerId,
    pooja: poojaId,
  });
  if (isExist) {
    return next(
      new AppError("This astrologer is already assigned to the pooja", 400)
    );
  }
  try {
    // Create assignment
    const assignment = await AssignAstrologer.create({
      astrologer: astrologerId,
      pooja: poojaId,
      price: price || 0,
      sellPrice: sellPrice || 0,
    });

    // Update Pooja's assignAstrologer array
    pooja.assignAstrologer.push(assignment._id);
    await pooja.save({ validateBeforeSave: false });

    // Populate astrologer and pooja details
    const populatedAssignment = await AssignAstrologer.findById(assignment._id)
      .populate("astrologer", "name email mobile")
      .populate("pooja", "name shortDescription");

    res.status(201).json({
      status: true,
      message: "Astrologer assigned to pooja successfully",
      data: populatedAssignment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError("This astrologer is already assigned to the pooja", 400)
      );
    }
    return next(
      new AppError(`Failed to assign astrologer: ${error.message}`, 500)
    );
  }
});

exports.deleteAssignAstrologer = catchAsync(async (req, res, next) => {
  const assignmentId = req.params.id;

  // Find assignment
  const assignment = await AssignAstrologer.findById(assignmentId);
  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  // Remove assignment from Pooja's assignAstrologer array
  await Pooja.updateOne(
    { _id: assignment.pooja },
    { $pull: { assignAstrologer: assignmentId } }
  );

  // Delete assignment
  await AssignAstrologer.findByIdAndDelete(assignmentId);

  res.status(200).json({
    status: true,
    message: "Astrologer removed from pooja successfully",
    data: null,
  });
});

exports.getAstrologersByPooja = catchAsync(async (req, res, next) => {
  const poojaId = req.params.poojaId;

  // Validate pooja
  const pooja = await Pooja.findById(poojaId);
  if (!pooja) {
    return next(new AppError("Pooja not found", 404));
  }

  // Fetch assignments for the pooja
  const assignments = await AssignAstrologer.find({ pooja: poojaId })
    .populate("astrologer", "name email mobile profileImage experience")
    .populate("pooja", "name shortDescription");

  res.status(200).json({
    status: true,
    message: "Astrologers fetched successfully",
    data: assignments,
  });
});
