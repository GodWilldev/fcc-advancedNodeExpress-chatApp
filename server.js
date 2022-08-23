'use strict';
require('dotenv').config();

const routes = require('./routes.js');
const auth = require('./auth.js');

const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const passport = require('passport');        //dependencies nedd for
const session = require('express-session');  //authentification #2

//#20
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));
app.use(passport.initialize());
app.use(passport.session());

io.use( //#20
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

//#5
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  routes(app, myDataBase);
  auth(app, myDataBase);
  
  //handle connection
  let currentUsers = 0;
  io.on('connection', (socket) => {
    ++currentUsers;
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });
    
    socket.on('chat message', (message) => { //#22
      io.emit('chat message', { name: socket.request.user.name, message });
    });
    
    console.log('user ' + socket.request.user.username + ' connected');
    
    //#19-handle disconnection
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: true
      });
    });
  });
  
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render(process.cwd() + '/views/pug/index', { title: e, message: 'Unable to login' });
  });
});

//#20
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}
function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});



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