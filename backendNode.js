let express = require('express')
let app = express()
app.listen(process.env.PORT, function () {
  console.log("byClass Server Started")
})

let bcrypt = require('bcryptjs')
let helmet = require('helmet')

app.use(helmet())

app.use(helmet.crossOriginResourcePolicy({
  policy: "cross-origin"
}))

let morgan = require('morgan')
app.use(morgan("dev"))

let dotenv = require('dotenv')
dotenv.config({ path: "./config.env" })

let cors = require('cors')
app.use(cors({
  methods: ["POST", "PUT", "PATCH", "GET", "DELETE"],
  credentials: true,
  origin: "*"
}))

app.use(express.json())

let mongoose = require('mongoose')
mongoose.connect("mongodb+srv://toxprex:ajmclean@cluster0.y6kxuhr.mongodb.net/byClass-App?retryWrites=true&w=majority", {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("byClass Database Connected")
})

app.param('key', function (req, res, next) {
  if (req.params.key === '1680') return next()
  else {
    res.status(400).send({
      "status": "unauthorized access!"
    })
  }
})

app.use('/users', function (req, res, next) {
  if (req.body && req.body.password) {
    bcrypt.hash(req.body.password, 12).then(function (pass) {
      req.body.password = pass
      next()
    })
  }
  else {
    next()
  }
})



let allSchemas = require('./allschemas.js')


let dbUsers = mongoose.model('Users', allSchemas.usersSchema)

let dbProductPool = mongoose.model('products-pool', allSchemas.productPoolSchema)

module.exports = { dbUsers, dbProductPool }





//Routes For Users Collection

app.route('/users/:key/:username?/:passwordToVerify?').get(function (request, responce) {
  let userNameRequest = request.params.username
  dbUsers.findOne({ userName: userNameRequest }).then(function (data) {
    if (data) {
      bcrypt.compare(String(request.params.passwordToVerify), data.password).then(function (verified) {
        if (verified) {
          responce.status(200).header({
            "content-type": "application/json"
          }).send({
            status: "Found One User",
            verification: "Password Verified",
            data: data
          })
        }
        else {
          responce.status(404).header({
            "content-type": "application/json"
          }).send({
            status: "Cannot Find User0"
          })
        }
      })
    }
    else {
      responce.status(404).header({
        "content-type": "application/json"
      }).send({
        status: "Cannot Find User"
      })
    }
  }).catch(function (err) {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Cannot Find User1",
      error: err
    })
  })
}).post(function (request, responce) {

  //Specifically for password change

  let postUserRequestBody = request.body

  dbUsers.create(postUserRequestBody).then(function (data) {
    responce.status(202).header({
      "content-type": "application/json"
    }).send({
      status: "User Creation Successful",
      dataCreated: data
    })
  }).catch(function (err) {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Cannot Create User",
      error: err
    })
  })
}).patch(function (request, responce) {
  let updateRequest = request.body
  let userFilter = request.params.username

  dbUsers.findOneAndUpdate({ userName: userFilter }, updateRequest, {
    new: true,
    runValidators: true
  }).then(function (data) {
    responce.status(202).header({
      "content-type": "application/json"
    }).send({
      status: "User Updated Successful",
      dataUpdated: data
    })
  }).catch(function (err) {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Error Updating Data",
      error: err
    })
  })
}).delete(function (request, responce) {
  let username = request.params.username
  dbUsers.findOneAndDelete({ userName: username }, {
    returnDocument: true
  }).then(function () {
    responce.send({
      status: "User Deleted"
    })
  }).catch(function (err) {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Error Deleting User"
    })
  })
})



let file = require('./fileUpload')

//Adding a product to a user. This should also put product in products pool

app.use("/file", file.fileapp)

app.use(express.static("./public"))






//Advanced Queries for product pool

app.get('/filter/:key', function (request, responce) {
  let queryObj = { ...request.query }

  let startFinding = dbProductPool.find()


  //sort by products result price. Ascending and Descending
  if (request.query.sort) startFinding.sort(request.query.sort.replaceAll(',', ` `))


  //Filter by price
  if (queryObj.price) {
    let excluded = ["sort", "limit", "fields", "page"]
    excluded.forEach(function (e, i) {
      delete queryObj[e]
    })

    let str = JSON.stringify(queryObj)
    str = JSON.parse(str.replace(/\b(lte|lt|gt|gte)\b/g, function (match) {
      return `$${match}`
    }))
    startFinding.find(str)
  }

  //Limit Result Gotten From Search
  if (request.query.limit)
    startFinding.limit(Number(request.query.limit))


  //Return only a particicular field/ppty
  if (request.query.field) {
    startFinding.select(request.query.field.replaceAll(",", ` `))
  }


  startFinding.then(function (data) {
    responce.status(202).header({
      "content-type": "application/json"
    }).send({
      status: "Successful",
      data: data
    })
  })
})


//get all products route and Individual Product

app.get('/allProducts/:key/:productName?', function (request, responce) {
  if (request.params.productName) {
    let findd = request.params.productName.replaceAll('-', ` `)
    dbProductPool.findOne({ productName: findd }).then(function (data) {
      if (data === null) {
        let startFinding = dbProductPool.find({ tags: findd })

        if (request.query.sort) {
          startFinding.sort(request.query.sort.replaceAll(',', ` `))
        }

        startFinding.then(function (data) {
          responce.status(200).header({
            "content-type": "application/json"
          }).send({
            status: "Products Found by Tag Names",
            data: data
          })
        }).catch(function (err) {
          responce.status(404).header({
            "content-type": "application/json"
          }).send({
            status: "Cannot Find Products Matching Tag Name",
            error: err
          })
        })

        return
      }

      responce.status(200).header({
        "content-type": "application/json"
      }).send({
        status: "Product Found",
        data: data
      })
    }).catch(function (err) {
      responce.status(404).header({
        "content-type": "application/json"
      }).send({
        status: "Cannot Find Product",
        error: err
      })
    })
  }
  else {
    dbProductPool.find().then(function (data) {
      responce.status(200).header({
        "content-type": "application/json"
      }).send({
        status: "All Products Found",
        data: data
      })
    }).catch(function (err) {
      responce.status(404).header({
        "content-type": "application/json"
      }).send({
        status: "Cannot Find Product",
        error: err
      })
    })
  }
})




//update User Saved Product
app.post("/bookmark/:key/:userName", function (request, responce) {
  let username = request.params.userName.replaceAll("-", ` `)
  console.log(username)
  if (request.body) {
    dbUsers.findOne({ userName: username }).then(function (data) {
      let newData = { ...data._doc }
      newData.savedProducts.push(request.body)
      dbUsers.findOneAndReplace({ userName: username }, newData, {
        new: true
      }).then(function (data) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "User Saved Products Updated",
          data: data
        })
      })
    })
  }
  else {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Wrong Request",
    })
  }
})






//delete a saved product

app.delete('/bookmark/:key/:userName', function (request, responce) {
  let username = request.params.userName

  if (request.body) {
    dbUsers.findOne({ userName: username }).then(function (data) {
      let newUser = { ...data._doc }
      newUser.savedProducts = newUser.savedProducts.filter(function (el, i) {
        return el.productName !== request.body.productName
      })

      dbUsers.findOneAndReplace({ userName: username }, newUser, {
        new: true
      }).then(function (data) {
        responce.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "User Saved Products Deleted",
          data: data
        })
      })
    })
  }

  else {
    responce.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Wrong Request",
    })
  }

})




















