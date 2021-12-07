//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
//const Web3 = require('web3');
const hash = require('object-hash');
const blockChain = require("./blockchain/blockchain");
const blockchain = new blockChain();
//const Provider = require('@truffle/hdwallet-provider');
//const MyContract = require('./build/contracts/MyContract.json');
//const address = '';
//const privateKey = '';
//const infuraUrl = '';
function makeid(length) {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}
const previoushash = makeid(41);
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: String,
  dob: Date,
  password: String,
  secret: String,
  eacc: String,
  balance: Number

  // history: String,

});
const transactionSchema=new mongoose.Schema({
  sender:String,
  receiver:String,
  amount:Number,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Transaction=mongoose.model("Transaction",transactionSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

/////////////////////////////////////////////////// blockChain//////////////////////////////////////////////////////////////////
// const PROOF = 1560;
// const validProof = (proof)=>{
//   let guessHash = hash(proof);
//   //console.log("hashing: ",guessHash);
//   return guessHash == hash(PROOF);
// };

// let proofOfWork = () => {
//   let proof = 0;
//   while(true){
//     if(!validProof(proof)){
//       proof++;
//     }else{
//       break
//     }
//   }
//   return proof;
// }

// if(proofOfWork() == PROOF){
//   blockchain.addNewTransaction("Sender","Subhrato",1000);
//   let prevHash = blockchain.lastBlock() ? blockchain.lastBlock().hash:null;
//   blockchain.addNewBlock(prevHash);
// }
// console.log("Chain:",blockchain.chain)
;



///////////////////////////////////////////////////get methods//////////////////////////////////////////////////////////////////
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  User.find({
    "secret": {
      $ne: null
    }
  }, function(err, foundUsers) {
    console.log(req.query.id);
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {
          usersWithSecrets: foundUsers,
          userid:req.query.id
        });
      }
    }
  });
});
app.get("/history", function(req, res) {
  console.log("Chain:",blockchain.chain)
  // console.log("helo");
  console.log(req.query.sid+" "+req.query.rid);
  const PROOF = 1560;
const validProof = (proof)=>{
  let guessHash = hash(proof);
  console.log("hashing: ",guessHash);
  return guessHash == hash(PROOF);
};

let proofOfWork = () => {
  let proof = 0;
  while(true){
    if(!validProof(proof)){
      proof++;
    }else{
      break
    }
  }
  return proof;
}

if(proofOfWork() == PROOF){
  blockchain.addNewTransaction(req.query.sid);
  let prevHash = previoushash;
  blockchain.addNewBlock(prevHash);
}
  console.log("Chain:",blockchain.chain)
  Transaction.find({sender:req.query.sid},function(err,foundUsers){
    if(err){
    console.log(err); }
    else{
      res.render("history",{
        users:foundUsers
      });
    }
  })
 });
//User.find({$or:[{region: "NA"},{sector:"Some Sector"}]}, function(err, user)
app.get("/account", function(req, res) {
  const userid=req.query.id;
  User.find({username:userid}
  , function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("account", {
          usersWithdata: foundUsers
        });
      }
    }
  });
});
app.get("/transaction", function(req, res) {
  const userid=req.query.id;
  res.render("transaction",{
    userfound:userid
  });
});
app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.get("/balance", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("balance");
  } else {
    res.redirect("/login");
  }
});
app.get("/money", function(req, res) {
  const userid=req.query.id;
  User.find({username:userid}
    , function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("money", {
          usersWithbalance: foundUsers
        });
      }
    }
  });
});

///////////////////////////////////////////////////post methods//////////////////////////////////////////////////////////////////

app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.post("/balance", function(req, res) {
  const submittedbalance=parseInt(req.body.balance);
  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        $inc:{foundUser.balance = submittedbalance};
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});


app.post("/maketransaction",function(req,res){
  const userid=req.query.id;
  const email=req.body.username;
  const addedbalance=parseInt(req.body.balance);
  const tranobj=new Transaction({
    sender:userid,
    receiver:email,
    amount:addedbalance
  });
  tranobj.save();
  console.log(req.user);
  User.findOneAndUpdate({username:email},{$inc:{balance:addedbalance}},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      // res.redirect("/secrets");
    }
  });
  User.findOneAndUpdate({username:userid},{$inc:{balance:-addedbalance}},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      console.log("history else");
      res.redirect("/history?sid="+userid);
    }
  });
});



app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {

  User.register({
    fname: req.body.fname,
    lname: req.body.lname,
    username: req.body.username,
    dob: req.body.dob,
    balance:0

  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets?id="+user.username);
      });
    }
  });

});







app.listen(3000, function() {
  console.log("Server started on port 3000.");
});

module.exports=mongoose.model("Transaction",transactionSchema);
