let express = require('express')
const multer = require('multer')
const sharp = require('sharp')
let server = require('./backendNode.js')

let upload = multer({ storage: multer.memoryStorage() })

let fileapp = express.Router()


fileapp.post('/postProduct/:key/:username', upload.single("productImage"), function (request, responce) {

  //processing/editing the images coming in as a buffer from multer memory storage upload

  let filename

  if (request.file?.buffer) {
    filename = `${request.params.username}-${Date.now()}.jpeg`
    sharp(request.file.buffer)
      .resize(1000, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`./public/gig-images/${filename}`)
  }

  let users = request.params.username
  let productToPost = request.body

  if (filename) productToPost.productImage = filename
  productToPost.tags = productToPost.tags.split(",")

  server.dbUsers.findOne({ userName: users }).then(function (data) {

    let newData = { ...data._doc }

    if (newData.userProducts.find(function (e, i) {
      return e.productName === productToPost.productName
    })) throw new Error()

    newData.userProducts.push(productToPost)

    server.dbUsers.findOneAndReplace({ userName: users }, newData).then(function () {

      server.dbProductPool.create(productToPost).then(function (data) {
        responce.status(202).header({
          "content-type": "application/json"
        }).send({
          status: "Product Posted Successful",
          product: data
        })
      }).catch(function (err) {
        responce.status(404).header({
          "content-type": "application/json"
        }).send({
          status: "Error",
          error: err
        })
      })
    })
  }).catch(function (err) {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Product Already Added"
    })
  })
})


//profilePic Route
fileapp.post("/photo/:key/:username", upload.single("photo"), function (req, res) {
  let filename = `profile-${req.params.username}-${Date.now()}.jpeg`
  if (req.file?.buffer) {
    sharp(req.file.buffer)
      .resize(400, 400)
      .toFormat("jpeg")
      .jpeg({ quality: 80 }).toFile(`./public/profile-img/${filename}`)

    server.dbUsers.findOneAndUpdate({ userName: req.params.username }, { photo: filename }, {
      runValidators: true
    }).then(function () {
      res.status(200).header({
        "content-type": "application/json"
      }).send({
        status: "User Profile Photo Updated"
      })
    }).catch(function (err) {
      res.status(404).send({
        status: "Missing File Image",
        error: err.message
      })
    })
  }
  else {
    res.status(404).send({
      status: "Missing File Image"
    })
  }
})


module.exports = { fileapp }