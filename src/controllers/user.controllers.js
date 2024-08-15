import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  //get details from fronmtend
  const { fullName, email, username, password } = req.body;
  // console.log("req.body", req.body, fullName, email, username, password);

  // validation

  // if(!fullName==="" || !email || !username || !password){
  //   throw new apiError(400, "All fields are required");
  // }
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }
  //check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });
  // if (userExists) {
  //   throw new apiError(409, "User already exists");
  // }

  // check if any files  for avatar
  // console.log("File Data", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar  is required");
  }

  //upload on cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // const coverImage = await uploadOnCloudinary(coverLocalPath); //if undefined cause not required

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImageLocalPath) &&
    req.files.coverImageLocalPath.length > 0
  ) {
    coverImageLocalPath = req.files.coverImageLocalPath[0].path;
    //handles undefined error
  }

  if (!avatar) {
    throw new apiError(500, "Something went wrong");
  }

  //create user object in db (if doenst exist)

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImageLocalPath?.url || "",
    email,
    username,
    password,
  });

  //remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check user cretaed
  if (!createdUser) {
    throw new apiError(500, "Something went wrong");
  }
  //send back response
  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
  // get data from body
  //check if username /email and password are provided and matched
  //if matched, create token and send back
  //send cookies

  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new apiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new apiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPasswordMatch(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Wrong Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  console.log("accessToken", accessToken, refreshToken);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  //we get user from middleware
  //clear cookies
  //remove refresh token from databses but no refernce of user hence create middleware

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new apiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "invalid refresh tokewnt");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            newrefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Unauthorized request");
  }
});

const updatePassword = asyncHandler(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordMatch = await user.isPasswordMatch(oldPassword);
    if (!isPasswordMatch) {
      throw new apiError(401, "Invalid password");
    }
    user.password = newPassword;
    const isPasswordUpdated = await user.save({ validateBeforeSave: false });
    if (!isPasswordUpdated) {
      throw new apiError(500, "Something went wrong while updating password");
    }

    res
      .status(200)
      .json(new apiResponse(200, {}, "Password updated successfully"));
  } catch (error) {
    throw new apiError(500, error?.message || "Something went wrong");
  }
});

const getCurentUser = asyncHandler(async (req, res, next) => {
  res.status(200).json(200, req.user, "User fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullName, email } = req.body;
  if (!(fullName || email)) {
    throw new apiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken -createdAt -updatedAt");

  return res
    .status(200)
    .json(new apiResponse(200, user, "User details updated successfully"));
});

//file updation
const fileUpdate = asyncHandler(async (req, res, next) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new apiError(500, "Error while updating avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken -createdAt -updatedAt");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurentUser,
  updateAccountDetails,
  fileUpdate,
};
