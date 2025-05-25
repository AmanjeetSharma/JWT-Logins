import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;
    // console.log({ email, password, username, fullName });
    // res.send("User registered successfully!");

    if ([fullName, username, email, password].some(field => !field?.trim())) {
        throw new ApiError(400, "Please provide all the required fields");
    }

    const existedUser = await User.findOne({  //existedUser holds either null or the user object
        $or: [{ username }, { email }]   // used $ or for checking for multiple conditions
    });

    if (existedUser) {  // if user object is not null, then user exists, and then the error is thrown

        // Cleanup uploaded files if user already exists
        if (req?.files?.avatar?.[0]?.path) {
            fs.unlinkSync(req.files.avatar[0].path);
            console.log("🗑️  Removed avatar image from localServer due to → existing user.");
        }
        if (req?.files?.coverImage?.[0]?.path) {
            fs.unlinkSync(req.files.coverImage[0].path);
            console.log("🗑️  Removed cover image from localServer due to → existing user.");
        }

        if (existedUser.username === username) {
            throw new ApiError(409, "User already exists with this username");
        }
        if (existedUser.email === email) {
            throw new ApiError(409, "User already exists with this email");
        }
    }

    const avatarLocalPath = req?.files?.avatar[0]?.path;
    const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Missing required field: avatar image");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath, "EchoStream/users/avatars");
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath, "EchoStream/users/coverImages");
    if (!avatar) {
        throw new ApiError(500, "⚠️ Error uploading Avatar-image");
    }
    let coverImage = null;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath, "EchoStream/users/coverImages");
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    //by default all the fields are selected, so we write those fields which we don't want
    const isUserCreated = await User.findById(user._id).select("-password -refreshToken");

    if (!isUserCreated) {
        throw new ApiError(500, "Error while registering the user");
    }

    return res.status(201).send(new ApiResponse(201, isUserCreated, "✅  User registered successfully"));

});



const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "Either username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(401, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "❌ Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }
    console.log(`✅  ${user.fullName} logged in successfully`);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser
                },
                "✅  User logged in successfully"
            )
        )
});



const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    console.log(`➡️  ${req.user.fullName} logged out successfully`);
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out successfully"))
})


export { registerUser, loginUser, logoutUser };


























// Logic building:


// Register User:

// get user details from frontend
// validate the data
// check if user already exists- username or email
// check for images and cover image, check for avatar
// upload images to cloudinary, avatar
// create a user object- create an entry in the database
// remove password and refresh token from the response
// check for user creation
// return response







//Login User:

// req body ->data
// username or email is required
// find the user
// password check
// access token and refresh token generation
// send cookies