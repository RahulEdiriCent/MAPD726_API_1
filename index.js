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
        age: Number,
        gender: String,
        phoneNumber:String,
        address: String,
        salt: String,
        hash: String,
});

let UserModel = mongoose.model('Users', userSchema);


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

server.post('/login', function(req, res, next){
    console.log("Logging In....")
    if (!req.body.email || !req.body.password || req.body.email === undefined || req.body.password === undefined) {
        console.log("Email: " + req.body.email + ", Password: " + req.body.password)
        res.send(400, "Cannot LEave Fields Empty");
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
                        res.send(400, "Password is Incorrect");
                        return next();
                    }else{
                        console.log("Login Successful -> Logged In as:" + loggingInUser.firstName);
                        //res.send(loggingInUser);

                        let user = ({
                            firstName: loggingInUser.firstName,
                            lastName: loggingInUser.lastName,
                            email: loggingInUser.email,
                            age: loggingInUser.age,
                            gender:loggingInUser.gender,
                            phoneNumber: loggingInUser.phoneNumber,
                            address: loggingInUser.address,
                        });

                        res.send(200, user)
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

server.post('/register', function(req, res, next){
    console.log("Registering New User...")
    if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.age || !req.body.password || req.body.gender === undefined || !req.body.address) {
        res.send(400, 'Please provide all required fields.');
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
                    age: req.body.age,
                    gender:req.body.gender,
                    phoneNumber: req.body.phoneNumber,
                    address: req.body.address,
                    salt: salt,
                    hash: hash,
                });
        
                UserModel.findOne({email: req.body.email}).then((foundUser)=>{
                    if(foundUser){
                        console.log("Email Already in Use: " + foundUser.firstName);
                        res.send(400, "Email Already in Use");
                        return next();
                    }else{
                        toRegisterUser.save().then((registeredUser)=>{
                            console.log("Successfully Registered User:" + registeredUser);
                            res.send(201,"User Successfully Registered");
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
