// // utils/deleteOldFile.js
// const fs = require("fs");
// const path = require("path");
// const AppError = require("./AppError");

// const deleteOldFiles = (filePath) => {
//   return new Promise((resolve, reject) => {
//     if (!filePath) {
//       return reject(new AppError("File path is required", 400));
//     }

//     const absolutePath = path.resolve(filePath);

//     fs.unlink(absolutePath, (err) => {
//       if (err) {
//         console.error(err);
//         return reject(new AppError("Failed to delete file", 500));
//       }

//       console.log(`File deleted: ${absolutePath}`);
//       resolve(`File deleted: ${absolutePath}`);
//     });
//   });
// };

// module.exports = deleteOldFiles;

// utils/deleteOldFile.js
const fs = require("fs");
const path = require("path");
const AppError = require("./AppError");

const deleteOldFiles = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            return reject(new AppError("File path is required", 400));
        }

        const absolutePath = path.resolve(filePath);

        fs.access(absolutePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File doesn't exist, resolve without error
                console.log(`File does not exist: ${absolutePath}`);
                return resolve(`File does not exist: ${absolutePath}`);
            }

            // File exists, attempt to delete it
            fs.unlink(absolutePath, (err) => {
                if (err) {
                    console.error(err);
                    return reject(new AppError("Failed to delete file", 500));
                }

                console.log(`File deleted: ${absolutePath}`);
                resolve(`File deleted: ${absolutePath}`);
            });
        });
    });
};

module.exports = deleteOldFiles;
