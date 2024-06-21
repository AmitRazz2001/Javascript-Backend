import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js';
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
    
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token!");
    }
}

// User Registration
const userRegister = asyncHandler(async(req, res) => {
    
    // get request from body
    // check required fields are not empty
    // validate the fields --> already exits username or email
    // get files from middleware
    // upload them on cloudinary
    // check files are uploaded on cloudinary
    // create user object - new user entry in db
    // check for user creation
    // return resp

    const {fullName, username, email, password} = req.body;

    if(
        [fullName, username, email, password].some((field) =>field?.trim() === "")
    )
    {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}] 
    })

    if(existedUser){
        throw new ApiError(409, "Username with this email is already exist!");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw res.json(new ApiError(400, "Avatar file is required!"));
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required!");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully!")
    )
})

// User Login
const userLogin = asyncHandler(async(req, res) => {
    
    // get request from body
    // validate requests
    // find user by username or email
    // check request password is correct or not
    // generate access and refresh token for user
    // set access and refresh token in cookie
    // send back the data to user without password
    
    console.log(req.body);
    const {username, email, password} = req.body;
    if(!username && !email){
        throw new ApiError(400, "username or email is required!");
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    });

    if(!user){
        throw new ApiError(400, "User does not exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Credentials does not match!");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully!"
            )
        )
})

// User Logout
const userLogout = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken : 1 //this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
           .status(200)
           .clearCookie("accessToken", options)
           .clearCookie("refreshToken", options)
           .json(
                new ApiResponse(200, {}, "User Logged Out!")
           )
})

// Refresh Access Token
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomimgRefreshToken = req.cookie?.refreshToken || req.body?.refreshToken;

    if(!incomimgRefreshToken){
        throw new ApiError(401, "unauthorized request!");
    }

    const decodedToken = jwt.verify(incomimgRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(incomimgRefreshToken !== user.refreshToken){
        throw new ApiError(402, "Invalid refresh token!");
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user?._id);

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
            .status(200)
            .cookie("accessToken", accessToken, options) 
            .cookie("refreshToken", newRefreshToken, options) 
            .json(
                new ApiResponse(
                    200, 
                    {
                        user : user,
                        accessToken : accessToken,
                        refreshToken : newRefreshToken
                    }
                )
            )

})

export {

    userRegister, 
    userLogin, 
    userLogout,
    refreshAccessToken
}