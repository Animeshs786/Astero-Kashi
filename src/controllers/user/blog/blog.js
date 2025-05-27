const Blog = require("../../../models/blog");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllBlogs = catchAsync(async (req, res) => {
    const { search, } = req.query;

    let query = {};

    if (search) {
        query.title = { $regex: search, $options: "i" };
    }


    const blogs = await Blog.find(query)
        .sort({ createdAt: -1 })
        
    res.status(200).json({
        status: true,
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