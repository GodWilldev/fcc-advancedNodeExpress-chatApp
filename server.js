'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const passport = require('passport');        //dependencies nedd for
const session = require('express-session');  //authentification #2
const LocalStrategy = require('passport-local'); //#6local auth: goggle github... 

const ObjectID = require('mongodb').ObjectID; //#3
const bcrypt = require('bcrypt'); //#12 to encrypt(hash) password before save it

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug'); //#1Express needs to know which template engine we are using


//#3
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());



//#5
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  // Be sure to change the title
  app.route('/').get((req, res) => {
    //Change the response to render the Pug template
    res.render(process.cwd() + '/views/pug/index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });
  
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  })
  //#6
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) { 
          return done(null, false);
        }
        return done(null, user);
      });
    }
  ));
  
  //#7 Login
  app.route('/login').post(
    passport.authenticate('local', { failureRedirect: '/' }), //middleware to athentificate
    (req, res) => {
      res.redirect('/profile');
  });
  app.route('/profile')
  .get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
  });
  
  //#10 Logout
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });
  
  
  //#11 Handle registration
  app.route('/register').post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) { //user already registered
        res.redirect('/');
      } else { //create the new user
        const hashedPass = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne({
          username: req.body.username,
          //password: req.body.password
          password: hashedPass
        },
          (err, doc) => {//callback for insertion
            if (err) {
              res.redirect('/'); //insertion failed
            } else {
              // The inserted document is held within the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );
  
  app.use((req, res, next) => { //#10error if page not found
    res.status(404).type('text').send('Not Found');
  });
  
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render(process.cwd() + '/views/pug/index', { title: e, message: 'Unable to login' });
  });
});



//#8 Middlware to prevent access to profile by typing in the url
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};




//#4
/*
passport.serializeUser((user, done) => {
  done(null, user._id);
});
/*
passport.deserializeUser((id, done) => {
  myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
    done(null, null);
  });
});*/

/*
//#1 #2
app.set('view engine', 'pug'); //Express needs to know which template engine we are using
app.route('/').get((req, res) => {
  res.render(process.cwd() + '/views/pug/index', {title: 'Hello', message: 'Please login'});
});
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
