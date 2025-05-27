const mongoose = require("mongoose");

const imageUploaderSchema = {
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
};

const ImageUploader = mongoose.model("ImageUploader", imageUploaderSchema);

module.exports = ImageUploader;
