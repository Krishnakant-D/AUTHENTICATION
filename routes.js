const express = require('express');
// const app = express();
const routes = express.Router();
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const user = require('./models');
const passport = require('passport');
const session = require('express-session');
const cookieparser = require('cookie-parser');
const flash = require('connect-flash');
const parses = require('./model1');


routes.use(bodyparser.urlencoded({ extended: true }));
routes.use(cookieparser('secret'));
routes.use(session({
    secret:'secret',
    maxAge:360000,
    resave:true,
    saveUninitialized:true
}));
routes.use(passport.initialize());
routes.use(passport.session());

routes.use(flash());


//global variable setting
routes.use(function(req,res,next){
    res.locals.success_message = req.flash('success_message');
    res.locals.err_message = req.flash('err_message');
    res.locals.error = req.flash('error');
    next();
});

const checkAuthenticated = function(req,res,next){
    if(req.isAuthenticated()){
        res.set('Cache-Control','no-cache,private,no-Store,must-revalidate,post-check=0,pre-check=0');
        return next();
    }else{
        res.redirect('/login');
    }
}

mongoose.connect('mongodb://localhost:27017/kk', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(() => console.log("database connected"));

routes.get("/", (req, res) => {
    res.render("index");
})

routes.post("/register", (req, res) => {
    var { email, username, password, confirmpassword } = req.body;
    var err;
    if (!email || !username || !password || !confirmpassword) {
        err = "please fill all the fields..";
        res.render('index', { 'err': err });
    }
    if (password != confirmpassword) {
        err = "passwords donot match";
        res.render('index', { 'err': err, 'email': email, 'username': username });
    }
    if (typeof err == 'undefined') {
        user.findOne({ email: email }, function (err, data) {
            if (err) throw err;
            if (data) {
                console.log("user already exits");
                err = "user already exits with this name";
                res.render('index', { 'err': err, 'email': email, 'username': username });
            }
            else {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        password = hash;
                        user({
                            email,
                            username,
                            password,
                        }).save((err, data) => {
                            if (err) throw err;
                            req.flash('success_message','Registered successfully! login to continue')
                            res.redirect('/login');
                        });
                    })
                })
            }
        })
    }
})


//authentication strategy
var localstrategy = require('passport-local').Strategy;
const { Store } = require('express-session');
passport.use(new localstrategy({ usernameField :'email'},(email,password,done)=>{
    user.findOne({email:email},(err,data)=>{
        if (err) throw err;
        if(!data){
            return done(null,false,{message:"User doesnot exist.."});
        }
        bcrypt.compare(password,data.password,(err,match)=>{
            if(err){
                return done(null,false);
            }
            if(!match){
                return done(null,false,{message:"Wrong user credentials"});
            }
            if(match){
                return done (null,data);
            }
        })
    })
}));

passport.serializeUser(function(user,cb){
    cb(null,user.id);
});

passport.deserializeUser(function(id,cb){
    user.findById(id,function(err,user){
        cb(err,user)
    });
})

//end of authentication strategy

routes.get('/login', (req, res) => {
    res.render('login');
});

routes.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        failureRedirect:'/login',
        successRedirect:'/success',
        failureFlash:true,
    })(req,res,next);
})



routes.get('/success',checkAuthenticated,(req,res)=>{
    res.render('success',{'user':req.user});
});

routes.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('login');
})

routes.get("/getdetails", checkAuthenticated, function (req, res) {   
    parse.find({}, function (err, allDetails) {
        if (err) {
            console.log(err);
        } else {
            res.render('getdetails', { details: allDetails })
        }
    })
    })


module.exports = routes;