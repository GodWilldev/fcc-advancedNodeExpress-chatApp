const passport = require('passport');        //dependencies nedd for
const bcrypt = require('bcrypt'); //#12 to encrypt(hash) password before save it


module.exports = function (app, myDataBase) {
  app.route('/').get((req, res) => {
    //Change the response to render the Pug template
    res.render(process.cwd() + '/views/pug/index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });
  
  
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
  
  //#14 Social registration
  app.route('/auth/github').get(passport.authenticate('github'));
  app.route('/auth/github/callback')
  .get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
    req.session.user_id = req.user.id
    res.redirect('/chat');
  });
  
  //#17 Set up environnement
  app.route('/chat')
  .get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/chat', {user: req.user});
  });
  
  app.use((req, res, next) => { //#10error if page not found
    res.status(404).type('text').send('Not Found');
  });
  
}

//#8 Middlware to prevent access to profile by typing in the url
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};