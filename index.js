let SERVER_NAME = 'snapify-api' //server name
let PORT = process.env.PORT || 3500; //chosen server port
let HOST = '0.0.0.0'; //chosen server address (for this project)

//create reference objects for restify and restify-errors
//
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
//mongodb connector string:
const CONNECTER_STRING = "mongodb+srv://cente713User_1:4MmB74RofHDl9iY3@map713-712projectdb.jgu68kw.mongodb.net/snapify";

mongoose.connect(CONNECTER_STRING, {useNewUrlParser: true});
const mongodb_weCare = mongoose.connection;

mongodb_weCare.on('Error', console.error.bind(console, '!CONNECTION ERROR! ::'))
mongodb_weCare.once('open', ()=>{
    //if connected to MongoDB
    console.log('Connection to MongoDB established!')
});

const userSchema = new mongoose.Schema({
        firstName: String,
        lastName: String,
        // email: String,
        email: { 
            type: String,
            unique: true
        },
        gender: String,
        phoneNumber:String,
        address: String,
        userType: String,
        salt: String,
        hash: String,
});

const productSchema = new mongoose.Schema({
    productName: { 
        type: String,
        unique: true
    },
    brandName: String,
    shoeType: String,
    price: Number,
    details: String,
    imagesArray: [String],
    sizeArray: [Number],
    shoeSizeText: String,
});

let UserModel = mongoose.model('Users', userSchema);
let ProductModel = mongoose.model('Products', productSchema);


let errors = require('restify-errors');
let restify = require('restify')


  // Get a persistence engine for the products
  //, snapifyAPIDB = require('save')('Users')

  // Create the restify server
  , server = restify.createServer({ name: SERVER_NAME})

  server.listen(PORT, HOST, function () {
  console.log('Server %s listening at %s', server.name, server.url)
});

server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

server.post('/login', function(req, res, next){//LOGIN AS USER
    returnMessage = {
        success: false,
        message: ""
    }
    console.log("Logging In....")
    if (!req.body.email || !req.body.password || req.body.email === undefined || req.body.password === undefined) {
        console.log("Email: " + req.body.email + ", Password: " + req.body.password)
        returnMessage.message = "Please provide all required fields"
        res.send(200, returnMessage);
        return next();
    }else{
        console.log("Email: " + req.body.email + ", Password: " + req.body.password)
        UserModel.findOne({email: req.body.email}).then((loggingInUser)=>{
            if(loggingInUser){
                console.log("Found User " + loggingInUser.firstName + " -> Verify Password");
                //res.send(loggingInUser);
                //return next();
                bcrypt.compare(req.body.password, loggingInUser.hash).then(Result=>{
                    if(!Result){

                        returnMessage.message = "Password is Incorrect"
                        res.send(200, returnMessage);

                        return next();
                    }else{
                        console.log("Login Successful -> Logged In as:" + loggingInUser.firstName);
                        //res.send(loggingInUser);

                        let _user = {
                            _id: loggingInUser._id,
                            firstName: loggingInUser.firstName,
                            lastName: loggingInUser.lastName,
                            email: loggingInUser.email,
                            userType: loggingInUser.userType,
                            gender:loggingInUser.gender,
                            phoneNumber: loggingInUser.phoneNumber,
                            address: loggingInUser.address,
                        };

                        returnMessage = {
                            success: true,
                            user: _user
                        }

                        res.send(200, returnMessage)
                        //token Logic? 

                        return next();
                    }
                }).catch(compareError=>{
                    console.log('An Error occured while Logging in: ' + compareError);
                    return next(new Error(JSON.stringify("LOGIN ERROR!")));
                });
            }else{
                console.log("Unable to find User with That Information");
                res.send(404, "User Not Found");
            }
        }).catch((loginError)=> {  
            console.log('An Error occured while Logging in: ' + loginError);
            return next(new Error(JSON.stringify("ERROR! " + loginError.errors)));
        })
    }
})

server.post('/register', function(req, res, next){//REGISTER USER
    console.log("Registering New User...")
    returnMessage = {
        success: false,
        message: ""
    }

    if (!req.body.firstName || 
        !req.body.lastName || 
        !req.body.email || 
        !req.body.userType || 
        !req.body.password || 
        req.body.gender === undefined || 
        !req.body.address || 
        !req.body.userType) {

            returnMessage.message = "Please provide all required fields"
            res.send(200, returnMessage);
            return next();

    }else{

        var salt = ""; 
        var hash = ""; //bcrypt.hash(password, salt);
        bcrypt.genSalt(10).then(_salt =>{
            salt = _salt;
            bcrypt.hash(req.body.password, salt).then(_hash =>{
                hash = _hash;
                console.log("S: " + salt + ", H: " + hash);

                let toRegisterUser = new UserModel({
                    //userId: req.body.userId, //change later to be auto-number
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    gender:req.body.gender,
                    phoneNumber: req.body.phoneNumber,
                    address: req.body.address,
                    userType: req.body.userType,
                    salt: salt,
                    hash: hash,
                });
        
                UserModel.findOne({email: req.body.email}).then((foundUser)=>{
                    if(foundUser){
                        returnMessage.message = "Email Already in Use"
                        console.log("Email Already in Use: " + foundUser.firstName);
                        res.send(200,  returnMessage);
                        return next();
                    }else{
                        toRegisterUser.save().then((registeredUser)=>{
                            console.log("Successfully Registered User:" + registeredUser);

                            returnMessage.success = true
                            returnMessage.message = "User Successfully Registered"

                            res.send(200,returnMessage);
                            return next();

                        }).catch((registrationError)=>{
                            console.log('An Error occured while registering User: ' + registrationError);
                            return next(new Error(JSON.stringify("ERROR! " + registrationError.errors)));
                        });
                    }
                }).catch((findingUserError)=>{
                    console.log('An Error occured while trying to register User: ' + findingUserError);
                    return next(new Error(JSON.stringify("ERROR! " + findingUserError.errors)));
                });

            }).catch((saltError)=>{
                console.log('An Error occured while trying to register User: ' + saltError);
                return next(new Error(JSON.stringify("ERROR! " + saltError)));
            });
        }).catch(hashError=>{
            console.log('An Error occured while trying to register User: ' + hashError);
            return next(new Error(JSON.stringify("ERROR! " + hashError)));
        });
        
    }     
})

server.get('/user/:id', function(req,res,next){//GET USER BY ID
    
    console.log("Finding User by ID...")
    returnMessage = {
        success: false,
        message: ""
    }

    UserModel.findOne({_id: req.params.id}).then((foundUser)=>{
        if(foundUser){
            console.log("User Found -> Returning User:" + foundUser.firstName);

            let _user = {
                _id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                userType: foundUser.userType,
                gender:foundUser.gender,
                phoneNumber: foundUser.phoneNumber,
                address: foundUser.address,
            };

            returnMessage = {
                success: true,
                user: _user
            }
            res.send(200, returnMessage)
            return next();
        }else{
            returnMessage.message = "User not Found"
            res.send(200, returnMessage);
            return next();
        }
    }).catch((searchUserError)=>{
        console.log('An Error occured while trying to find User with ID: ' + searchUserError);
        return next(new Error(JSON.stringify("ERROR! " + searchUserError)));
    })
})

server.put('/user/:id', function (req,res,next){//UPDATE USER BY ID
    
    console.log("Updating User....")
    returnMessage = {
            success: false,
            message: ""
    }

    
    if (!req.body.firstName || 
        !req.body.lastName || 
        !req.body.email || 
        !req.body.userType || 
        //!req.body.password || 
        req.body.gender === undefined || 
        !req.body.address || 
        !req.body.userType) {

            //console.log("Email: " + req.body.email + ", Password: " + req.body.password)
            returnMessage.message = "Please provide all required fields"
            res.send(200, returnMessage);
            return next();

    }else{

        // var salt = ""; 
        // var hash = ""; //bcrypt.hash(password, salt);
        // bcrypt.genSalt(10).then(_salt =>{
        //     salt = _salt;
        //     bcrypt.hash(req.body.password, salt).then(_hash =>{
        //         hash = _hash;
        //         console.log("S: " + salt + ", H: " + hash);

                let toEditUser = {
                    //userId: req.body.userId, //change later to be auto-number
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    gender:req.body.gender,
                    phoneNumber: req.body.phoneNumber,
                    address: req.body.address,
                    userType: req.body.userType,
                    // salt: salt,
                    // hash: hash,
                };

                UserModel.findOneAndUpdate({_id: req.params.id}, toEditUser, {new:true}).then((toUpdateUser)=>{
                    if(toUpdateUser){
                        returnMessage.message = "User Found and Updated"
                        returnMessage.success = true
                        res.send(200, returnMessage);
                        return next();
                    }else{
                        returnMessage.message = "Update Failed: User not Found"
                        res.send(200, returnMessage);
                        return next();
                    }

                }).catch((updateError)=>{
                    console.log("An Error occurred while trying to update User" + updateError);
                    return next(new Error(JSON.stringify("ERROR! " + updateError.errors)))
                });

        //     }).catch((saltError)=>{
        //         console.log('An Error occured while trying to update User: ' + saltError);
        //         return next(new Error(JSON.stringify("ERROR! " + saltError)));
        //     });

        // }).catch(hashError=>{
        //     console.log('An Error occured while trying to update User: ' + hashError);
        //     return next(new Error(JSON.stringify("ERROR! " + hashError)));
        // });
    }
})

server.get('/user/name/:name', function(req,res,next){//GET USER BY NAME
    
    console.log("Finding User by ID...")
    returnMessage = {
        success: false,
        message: ""
    }

    UserModel.findOne({firstName: req.params.name}).then((foundUser)=>{
        if(foundUser){
            console.log("User Found -> Returning User:" + foundUser.firstName);

            let _user = {
                _id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                userType: foundUser.userType,
                gender:foundUser.gender,
                phoneNumber: foundUser.phoneNumber,
                address: foundUser.address,
            };

            returnMessage = {
                success: true,
                user: _user
            }
            res.send(200, foundUser)
            return next();
        }else{
            returnMessage.message = "User not Found"
            res.send(200, returnMessage);
            return next();
        }
    }).catch((searchUserError)=>{
        console.log('An Error occured while trying to find User with ID: ' + searchUserError);
        return next(new Error(JSON.stringify("ERROR! " + searchUserError)));
    })
})

//===========================PRODUCTS==================================

server.post('/products', function(req,res,next){//ADD PRODUCT
    
    console.log("Adding Product....")
    returnMessage = {
            success: false,
            message: ""
    }

    
    if (!req.body.productName || 
        !req.body.brandName || 
        !req.body.price || 
        !req.body.shoeType || 
        !req.body.details || 
        req.body.imagesArray === undefined || 
        req.body.sizeArray === undefined || 
        !req.body.shoeSizeText) {            
            returnMessage.message = "Please provide all required fields "
            res.send(200, returnMessage);
            return next();

    }else{

        let toAddProduct = new ProductModel({
            productName: req.body.productName, 
            brandName: req.body.brandName, 
            shoeType: req.body.shoeType,
            price: req.body.price, 
            details: req.body.details,
            imagesArray: req.body.imagesArray, 
            sizeArray: req.body.sizeArray, 
            shoeSizeText: req.body.shoeSizeText,
        });

        ProductModel.findOne({productName: req.body.productName}).then((foundProduct)=>{
            if(foundProduct){
                returnMessage.message = "Product Name Already in Use"
                console.log("Product Name Already in Use: " + foundProduct.productName);
                res.send(200,  returnMessage);
                return next();
            }else{
                toAddProduct.save().then((addedProduct)=>{
                    console.log("Successfully Added Product:" + addedProduct);

                    returnMessage.success = true
                    returnMessage.message = "Product Successfully Added"

                    res.send(200,returnMessage);
                    return next();

                }).catch((addProductError)=>{
                    console.log('An Error occured while added Product: ' + addProductError);
                    return next(new Error(JSON.stringify("ERROR! " + addProductError.errors)));
                });
            }
        }).catch((findingProductError)=>{
            console.log('An Error occured while trying to add Product User: ' + findingProductError);
            return next(new Error(JSON.stringify("ERROR! " + findingProductError.errors)));
        });
    }
})


server.put('/products/:id', function(req,res,next){//UPDATE PRODUCT
    
    console.log("Updating Product....")
    returnMessage = {
            success: false,
            message: ""
    }

    
    if (!req.body.productName || 
        !req.body.brandName || 
        !req.body.price || 
        !req.body.shoeType || 
        !req.body.details || 
        req.body.imagesArray === undefined || 
        req.body.sizeArray === undefined || 
        !req.body.shoeSizeText) {            
            returnMessage.message = "Please provide all required fields "
            res.send(200, returnMessage);
            return next();

    }else{

        let toEditProduct = {
            productName: req.body.productName, 
            brandName: req.body.brandName, 
            shoeType: req.body.shoeType,
            price: req.body.price, 
            details: req.body.details,
            imagesArray: req.body.imagesArray, 
            sizeArray: req.body.sizeArray, 
            shoeSizeText: req.body.shoeSizeText,
        };

                ProductModel.findOneAndUpdate({_id: req.params.id}, toEditProduct, {new:true}).then((toUpdateProduct)=>{
                    if(toUpdateProduct){
                        returnMessage.message = "Product Found and Updated"
                        returnMessage.success = true
                        res.send(200, returnMessage);
                        return next();
                    }else{
                        returnMessage.message = "Update Failed: Product not Found"
                        res.send(200, returnMessage);
                        return next();
                    }

                }).catch((updateProductError)=>{
                    console.log("An Error occurred while trying to update Product" + updateProductError);
                    return next(new Error(JSON.stringify("ERROR! " + updateProductError.errors)))
                });
    }
})

server.get('/products/brand/:brand', function(req,res,next){//FIND PRODUCTS BY CATEGORY
    
    console.log("Finding Product by Brand/Category...")
    returnMessage = {
        success: false,
        message: ""
    }
 
    if (!req.params.brand) {            
            returnMessage.message = "Please provide required field"
            res.send(200, returnMessage);
            return next();

    }else{
        ProductModel.find({brandName: req.params.brand}).then((filteredProducts)=>{
            if(filteredProducts){
                console.log("Products Found -> Returning Products");
                returnMessage = {
                    success: true,
                    products: filteredProducts
                }
                res.send(200, returnMessage)
                return next();
            }else{
                returnMessage.message = "No Products Found For Brand/Category"
                res.send(200, returnMessage);
                return next();
            }
        }).catch((searchProductsError)=>{
            console.log('An Error occured while trying to find Product with ID: ' + searchProductsError);
            return next(new Error(JSON.stringify("ERROR! " + searchProductsError)));
        })
    }
})

server.get('/products/:id', function(req,res,next){//GET PRODUCT BY ID
    
    console.log("Finding Product by ID...")
    returnMessage = {
        success: false,
        message: ""
    }

    ProductModel.find({_id: req.params.id}).then((foundProduct)=>{
        if(foundProduct){
            console.log("Product Found -> Returning Product:" + foundProduct.productName);

            let _product = {
                _id: foundProduct._id,
                productName: foundProduct.productName,
                brandName: foundProduct.brandName,
                shoeType: foundProduct.shoeType,
                price: foundProduct.price,
                details: foundProduct.details,
                imagesArray: foundProduct.imagesArray,
                sizeArray: foundProduct.sizeArray,
                shoeSizeText: foundProduct.shoeSizeText,
            };

            returnMessage = {
                success: true,
                user: _product
            }
            res.send(200, returnMessage)
            return next();
        }else{
            returnMessage.message = "Product not Found"
            res.send(200, returnMessage);
            return next();
        }
    }).catch((searchProductError)=>{
        console.log('An Error occured while trying to find Product with ID: ' + searchProductError);
        return next(new Error(JSON.stringify("ERROR! " + searchProductError)));
    })
})