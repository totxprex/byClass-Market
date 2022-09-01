let mongoose = require('mongoose')
let bcrypt = require('bcryptjs')

let usersSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "No Name In Document"]
  },
  email: {
    type: String,
    trim: true,
    required: [true, "No Email In Document"]
  },
  mobileNumber: String,
  userName: {
    type: String,
    trim: true,
    required: [true, "No Username In Document"]
  },
  password: {
    type: String,
    trim: true,
    required: [true, "No Password In Document"]
  },
  userProducts: [
    Object
  ],
  savedProducts: [Object],
  photo: {
    type: String,
    
  }
})



let productPoolSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product Must Have a Name"]
  },
  price: {
    type: Number,
    required: [true, "Product Must Have a Price"]
  },
  rating: {
    type: Number,
    default: 1,
    max: 6
  },
  shortDescription: {
    type: String,
    maxLength: 200,
    required: [true, "Product Must Have a Short Description"]
  },
  longDescription: {
    type: String,
    required: [true, "Product Must Have a Long Description"]
  },
  externalStoreName: {
    type: String,
    trim: true
  },
  website: {
    type: String
  },
  tags: [String],
  productImage: {
    type: String,
    default: "http://127.0.0.1/gig-images/homePage.jpg"
  },
  sellerName: String,
  sellerEmail: String,
  sellerMobileNumber: String
})





module.exports = { usersSchema, productPoolSchema }