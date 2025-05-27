const Blog = require("../../../models/blog");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createBlog = catchAsync(async (req, res, next) => {
  const { title, description, status = true } = req.body;
  let thumbImagePath;
  let imagePaths = [];

  if (!title || !description) {
    return next(new AppError("Title and description are required", 400));
  }

  // Check if a blog with the same title already exists
  const existingBlog = await Blog.findOne({ title });
  if (existingBlog) {
    return next(new AppError("A blog with this title already exists", 400));
  }

  const blogData = {
    title,
    description,
    status,
  };

  try {
    if (req.files && req.files.thumbImage) {
      const thumbImage = req.files.thumbImage[0];
      const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
      blogData.thumbImage = thumbImageUrl;
      thumbImagePath = thumbImageUrl;
    } else {
      return next(new AppError("Thumbnail image is required", 400));
    }

    if (req.files && req.files.image) {
      blogData.image = req.files.image.map(
        (file) => `${file.destination}/${file.filename}`
      );
      imagePaths = blogData.image;
    }

    const newBlog = await Blog.create(blogData);

    res.status(201).json({
      status: true,
      message: "Blog created successfully",
      data: newBlog,
    });
  } catch (error) {
    // Clean up uploaded files if creation fails
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbnail image:", err);
      });
    }
    if (imagePaths.length > 0) {
      await Promise.all(
        imagePaths.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete image:", err);
          })
        )
      );
    }
    return next(error);
  }
});

exports.getAllBlogs = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Blog,
    null,
    query
  );

  const blogs = await Blog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Blogs fetched successfully",
    data: blogs,
  });
});

exports.getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Blog fetched successfully",
    data: blog,
  });
});

exports.updateBlog = catchAsync(async (req, res, next) => {
  const { title, description, status } = req.body;
  let thumbImagePath;
  let imagePaths = [];
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  const blogData = {};

  if (title) blogData.title = title;
  if (description) blogData.description = description;
  if (status !== undefined) blogData.status = status;

  try {
    // Check for duplicate title (exclude current blog)
    if (title && title !== blog.title) {
      const existingBlog = await Blog.findOne({ title });
      if (existingBlog && existingBlog._id.toString() !== req.params.id) {
        return next(new AppError("A blog with this title already exists", 400));
      }
    }

    if (req.files && req.files.thumbImage) {
      const thumbImage = req.files.thumbImage[0];
      const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
      blogData.thumbImage = thumbImageUrl;
      thumbImagePath = thumbImageUrl;

      // Delete old thumbnail if exists
      if (blog.thumbImage) {
        await deleteOldFiles(blog.thumbImage).catch((err) => {
          console.error("Failed to delete old thumbnail:", err);
        });
      }
    }

    if (req.files && req.files.image) {
      blogData.image = req.files.image.map(
        (file) => `${file.destination}/${file.filename}`
      );
      imagePaths = blogData.image;

      // Delete old images if exists
      if (blog.image && blog.image.length > 0) {
        await Promise.all(
          blog.image.map((path) =>
            deleteOldFiles(path).catch((err) => {
              console.error("Failed to delete old image:", err);
            })
          )
        );
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    // Clean up uploaded files if update fails
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbnail image:", err);
      });
    }
    if (imagePaths.length > 0) {
      await Promise.all(
        imagePaths.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete image:", err);
          })
        )
      );
    }
    return next(error);
  }
});

exports.deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  // Delete associated images
  if (blog.thumbImage) {
    await deleteOldFiles(blog.thumbImage).catch((err) => {
      console.error("Failed to delete thumbnail image:", err);
    });
  }
  if (blog.image && blog.image.length > 0) {
    await Promise.all(
      blog.image.map((path) =>
        deleteOldFiles(path).catch((err) => {
          console.error("Failed to delete image:", err);
        })
      )
    );
  }

  await Blog.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Blog deleted successfully",
    data: null,
  });
});
