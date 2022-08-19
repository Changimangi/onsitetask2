require("dotenv").config();
var express = require("express");
var app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
var multer = require("multer");
var bodyParser = require("body-parser" );
var path = require("path");
var alerting = require("alert");
var Cryptr = require("cryptr");
var cryptr = new Cryptr('ReallySecretKey');
var crypto = require("crypto");
var algorithm = 'aes-256-cbc'; 
var key = crypto.randomBytes(32);
var iv = crypto.randomBytes(16);
var mysql = require("mysql");
var nodemailer = require("nodemailer");
var bcrypt = require("bcrypt");
const { json } = require("body-parser");
var upload = multer();
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "passwordstorage"
})
var transporter = nodemailer.createTransport({
    service: "gmail",
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.USEREMAIL,
        pass: process.env.APP_PASSWORD
    }
})

var userdetails = [0,0,0,0];
var n = [0,0,0,0];
var l = [0,0];
var values = [0];
var newpassword;
var emailidforchangingpwd;
var toemailid;
var timeup  = "no";
var forgotpwdotp
var service;
var addedpass;
var encrypted;
var decrypted;
var domain;
var addres = " ";
var editres = " ";
var passcheck = "yes";
var servicesoffered = {"services":[]};
var passdetails = {"pass": " ","service": " ","date": " "};



app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.array());
var oneDay = 1000 * 60 * 60 * 24;
var session;
app.use(sessions({
    secret: process.env.SESSION_PASS,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use(cookieParser());
var logout = "";
app.get("/login",function(req,res){
    res.render("loginpage");

})
app.post("/login",function(req,res){
    l[0] = req.body.name;
    l[1] = req.body.password;
    session=req.session;
    session.userid=req.body.name;
    con.query("select * from logindetails where username = ?",[l[0]],function(err,result){
        if(result.length!=0){
        userdetails[0] = result[0].username;
        userdetails[1] = result[0].phoneno;
        userdetails[2] = result[0].email;
        
        
        if(err){
            return console.log(err);
        }
        
        if(result[0].password==l[1]){
            res.redirect("/welcome");
        }
        else{
            alerting("password is incorrect");
            return res.redirect("/login");
        }
    }
    else{
        alerting("You haven't registered yet");
        return res.redirect("/login");
    }
    })
    
})

app.get("/otpforgotpwd",function(req,res){
    timeup = "no";
    res.render("otpverification");
    forgotpwdotp = Math.floor(Math.random()*899999)+100000;
    var mailoption = {
        from: process.env.USEREMAIL,
        to: toemailid,
        subject: "setting new password",
        text: "Your otp for logging into the digital slambook is : "+forgotpwdotp
    }
    transporter.sendMail(mailoption,function(err,info){
        if(err){
            return console.log(err);
        }
        else{
            console.log("message sent");
            console.log(info);
        }
    })
    
    setTimeout(function(){
        timeup = "yes";
    },120000)
    
})
app.post("/otpforgotpwd", function(req,res){
    if(forgotpwdotp == req.body.otpforregistration && timeup == "no"){
        con.query("update logindetails set password = ? where email= ? ",[newpassword,emailidforchangingpwd],function(err,result){
            
            if(err){
                return console.log(err);
            }
        })
        alerting("password changed successfully");
        res.redirect("/login");
    }
    else if(timeup == "yes" ){
        timeup = "no";
        alerting("Time's up")
    }
    else{
        alerting("OTP is wrong");
        res.redirect("/login");
    }
    timeup = "no";
    
})
app.get("/forgotpwd",function(req,res){
    res.render("forgotpwd");
})
app.post("/forgotpwd", function(req,res){
    newpassword = req.body.password;
    toemailid = req.body.emailid;
    emailidforchangingpwd = req.body.emailid;
    con.query("select * from logindetails where email = ?",[toemailid],function(err,result){
        if(result.length==0){
            alerting("wrong username");
            return res.redirect("/forgotpwd")
        }
        else{
        userdetails[0] = result[0].username;
        userdetails[1] = result[0].phoneno
        userdetails[2] = result[0].email;
    return  res.redirect("/otpforgotpwd");}
        
    })
   
})
app.get("/registration", function(req,res){
    res.render("registration");
})
app.post("/registration",function(req,res) {
    n[0] = req.body.name;
    n[1] = req.body.phoneno;
    n[2] = req.body.emailid;
    n[3] = req.body.password;
    userdetails[0] = n[0];
    userdetails[1] = n[1];
    userdetails[2] = n[2];
    userdetails[3] = n[3];
    values[0] = n;
    con.query("select * from logindetails where username = '"+n[0]+"' || email = '"+n[2]+"';",function(err,result){
        if(err){
            return console.log(err);
        }
        if(result.length==0){
            con.query("insert into logindetails(username,phone,email,password) values ('"+n[0]+"',"+n[1]+",'"+n[2]+"','"+n[3]+"');", function(err,result){
                alerting(" Details added ");
                return res.redirect("/welcome");
            })
        }
        else{
            alerting("username or emailid already exists");
            return res.redirect("/registration");
        }
    })
    
})

app.get("/welcome",function(req,res){
    servicesoffered.gotores = " ";
    res.render("welcome",{name:userdetails[0]});
})
app.post("/welcome",function(req,res){
    req.session.destroy();
    res.redirect("/login")
})
app.get("/addrepo",function(req,res){
    res.render("addrepo")
    
    
})
app.post("/addrepo",function(req,res){
    service = req.body.service;
    addedpass = req.body.password;
    encrypted = cryptr.encrypt(addedpass);
    con.query("select * from repo where username = '"+userdetails[0]+"' && service = '"+service+"';",function(err,result){
        if(result.length!=0){
            alerting("repo already exists")
            return res.redirect("/welcome");
        }
        else{
            con.query("insert into repo(username,service,pass,createddate) values('"+userdetails[0]+"','"+service+"','"+encrypted+"',now());",function(err,result){
                if(err){
                    return console.log(err);
                }
                alerting("details added");
                res.redirect("/welcome")

            })
        }
    })
})
app.get("/gotorepo",function(req,res){
    return new Promise(function(resolve,reject){
        let k;
    con.query("select * from repo where username = '"+userdetails[0]+"';",function(err,result){
        for(let i = 0; i<result.length; i++){
            k = result[i].service;
            servicesoffered["services"].push({"s": k});
        }
        console.log(servicesoffered["services"]);
        resolve(servicesoffered["services"][result.length-1]);
    })}).then(function(){
    res.render("gotorepo",{detail:servicesoffered});
    servicesoffered["services"].splice(0,servicesoffered["services"].length);
})
    
})
app.post("/gotorepo",function(req,res){
    domain = req.body.service[1];
    console.log(domain);
    con.query("select * from repo where username = '"+userdetails[0]+"' && service = '"+domain+"';",function(err,result){
        if(result.length == 0){
            alerting("no service");
            return res.redirect("/gotorepo");
        }
            passdetails["pass"] = cryptr.decrypt(result[0].pass);
            passdetails["service"] = domain;
            passdetails["date"] = result[0].createddate;
            res.redirect("/passdisplay");
    })
})
app.get("/passdisplay",function(req,res){
    res.render("passdisplay",{detail: passdetails})
})
app.post("/passdisplay",function(req,res){
    res.redirect("/welcome")
})
app.get("/editrepo",function(req,res){
    return new Promise(function(resolve,reject){
        let k;
    con.query("select * from repo where username = '"+userdetails[0]+"';",function(err,result){
        for(let i = 0; i<result.length; i++){
            k = result[i].service;
            servicesoffered["services"].push({"s": k});
        }
        console.log(servicesoffered["services"]);
        resolve(servicesoffered["services"][result.length-1]);
    })}).then(function(){
    res.render("editrepo",{detail:servicesoffered});
    servicesoffered["services"].splice(0,servicesoffered["services"].length);
})
})
app.post("/editrepo",function(req,res){
    let newpassforservice = req.body.password;
    let newpassservice = req.body.service;
    con.query("select * from repo where service = '"+newpassservice+"' && username = '"+userdetails[0]+"';",function(err,result){
        if(result.length==0){
            alerting("service doesn't exist");
            return res.redirect("/editrepo");
        }
        else{
            con.query("update repo set pass = '"+cryptr.encrypt(newpassforservice)+"', createddate = now() where username = '"+ userdetails[0]+"' && service = '"+ newpassservice+"';",function(){
                alerting("details changed");
                return res.redirect("/welcome");
            })

        }
    })
})

















app.listen(1270,function(err){
    if(err){
        return console.log(err);
    }
    console.log("Server is running");
})
