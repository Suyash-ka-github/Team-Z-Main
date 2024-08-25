const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const usermodel = require('./model/user');
const postmodel =require("./model/post");
const commentmodel=require("./model/comment")
const game=require("./model/game")
const cookieParser = require('cookie-parser');
const { verify } = require('crypto');
const post = require('./model/post');

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
  res.render('index'); 
}
)
app.get('/create', (req, res) => {
  res.render('create');
}
)

app.get("/profile",isLoggedIn,async (req,res) => {
  let user=await usermodel.findOne({email:req.user.email}).populate("posts")
  let gamer=await game.find();
  let post=await postmodel.find()

  res.render('profile',{user,gamer,post}); 
}
) 
 
app.get('/logout', async (req, res) => {
  res.cookie("Token", "");
  res.redirect('/');
}
)

app.get('/home',async (req,res) => {
  res.render('home');
}
)

app.get('/createPost',isLoggedIn,async (req,res)=>{
  let gamelist = await game.find();
  res.render('createpost',{gamelist})
})
app.post('/createPost',isLoggedIn,async (req,res) => {
  let user=await usermodel.findOne({email:req.user.email});
  let {heading,content,gamename}=req.body;
  let post=await postmodel.create({
    userinfo:user._id,
    heading,
    content,
    gamename
  })

  user.posts.push(post._id)
  await user.save();
  res.redirect('/profile');
}
)

app.get('/post/:postid',async (req,res) => {
  let post=await postmodel.findOne({_id:req.params.postid});
  res.render('post',{post});
}
)


// app.post('/post/:postid',isLoggedIn,async (req,res) => {
//   let {comment}=req.body;
//   let comment1=await comment.create({
//     author:req.user._id,
//     comment,
//     parentId,

//   })

// }
// )

// app.post("/post",isLoggedIn,async(req,res) => {
//   let user=await usermodel.findOne({email:req.user.email});
//   let {content}=req.body;
//   let post=await postmodel.create({
//     userinfo:user._id,
//     content
//   })

//   user.posts.push(post._id)
//   await user.save();
//   res.redirect('/profile');
// }
// )


app.get('/creategame',isLoggedIn,async (req,res) => {
  res.render('creategame');
}
)


app.post('/creategame',isLoggedIn,async (req,res) => {
  let {content,name,img}=req.body;
  let makegame=await game.create({
      img,
      name,
      description:content
  })
   
  res.redirect('/profile');
}
)

app.post('/create', async (req, res) => {
  let { username, email, age, password } = req.body;

  let user = await usermodel.findOne({ email });
  if (user) {
    // res.send('<span>No such User Exists Create one ? .. <a href="/">Create</a></span>')
    res.send('<span>This Email Is already registered Log In Instead... <a href="/">Log In</a></span>');
    // res.redirect('/')
    // res.send('<span>This Email Is already registered Log In Instead ? .. <a href="/">Log In</a>')
  }
  else{

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        const newuserdata = await usermodel.create({
          username,
          name: username,
          age,
          email,
          password: hash
        })
        let token = jwt.sign({ email: email }, "shhh");
        res.cookie("Token", token);
        res.redirect('/profile');
      }
      )
    }
    ) 
  }
 

}
)

app.get("/like/:id",isLoggedIn,async (req,res) => {
  let post=await postmodel.findOne({_id:req.params.id}).populate("userinfo");
  if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid);
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
  }
  await post.save();
  res.redirect('/profile');
}
)



app.post('/login', async (req, res) => {
  let { email, password } = req.body;
  let user = await usermodel.findOne({ email });
  if (user) {
    let verify = bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        let token = jwt.sign({ email: email }, "shhh");
        res.cookie("Token", token);
        res.redirect('/profile')
      }
      else{
        res.send("Incorrect Credintials. Verify your email and password")
      }

    }
    );
  }
  else{
    res.send('<span>No such User Exists Create one ? .. <a href="/create">Create</a></span>')
  }
}
)

function isLoggedIn(req,res,next){
  if(req.cookies.Token===""){
    res.send('<span>You must be logged in first .. <a href="/">Log In</a></span>'); 
  }
  else{
    let data=jwt.verify(req.cookies.Token, "shhh")
    req.user=data;
    next();
  }
}
 
app.listen(5001);