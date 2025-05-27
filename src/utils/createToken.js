const jwt = require("jsonwebtoken");

const createToken = (user, statusCode, res, verify = false,isUser=true) => {
  // const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN_SECRET, {
  //   expiresIn: process.env.JWT_TOKEN_EXPIRY,
  // });

  const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN_SECRET);

  const cookieOptions = {
    httpOnly: true,
    // expires: new Date(
    //   Date.now() + process.env.JWT_COOKIE_EXPIRY * 24 * 60 * 60 * 1000
    // ),
  };

  if (!verify) {
    res.cookie("xcvbexamstons", token, cookieOptions);

    res.status(statusCode).json({
      status: true,
      token,
      data: {
        user,
      },
    });
  }

  if (verify) {
    res.cookie("sfvbexamstons", token, cookieOptions);
    if(isUser){
      res.status(statusCode).json({
      status: true,
      message: "Otp verify Successfully.",
      token,
      data: {
        user,
      },
    });
    }else{
      res.status(statusCode).json({
      status: true,
      message: "Otp verify Successfully.",
      token,
      data: {
        astrologer:user,
      },
    });
    }
  }
};

module.exports = createToken;
