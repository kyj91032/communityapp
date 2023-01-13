// express로 서버 열기
const express = require('express');
const MongoClient = require('mongodb').MongoClient; // mongodb 설치
const app = express();
app.set('view engine', 'ejs'); // ejs 사용. html에 db 넣기
app.use(express.urlencoded({extended: true})) // request.body 사용 (폼 입력 받기)
const methodOverride = require('method-override') // put 사용 위함
app.use(methodOverride('_method'))
const passport = require('passport'); // 로그인 라이브러리 설치
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const { response, request } = require('express');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
var db; // 전역 db
MongoClient.connect("mongodb+srv://admin:qwer1234@cluster0.oq7q8cw.mongodb.net/?retryWrites=true&w=majority", function(에러, client){ // db 연결 후 서버 열기
    if (에러) return console.log(에러);
    db = client.db('communityapp');

    app.listen('8080', function(){
      console.log('listening on 8080')
    });
  })
//


// 홈 화면(글 목록) 요청
app.get('/', (request, response)=>{
    // find
    db.collection('post').find().toArray((err, result)=>{
        response.render('index.ejs', { posts : result })
    })
});

// 글 작성 화면 요청
app.get('/write', (request, response)=>{
    response.render('write.ejs')
});

// 글 작성 post 요청
app.post('/add', (request, response)=>{
    // findOne
    db.collection('counter').findOne( { name : "게시물갯수" }, function(err, result){
        var totalPost = result.totalPost
        var posting = { _id : totalPost + 1, 제목 : request.body.title,
             내용 : request.body.content, 날짜 : new Date() }
        // insertOne
        db.collection('post').insertOne(posting, function(err, result){
            console.log('저장완료')
            response.redirect('/')
        })
        // updateOne
        db.collection('counter').updateOne( { name : '게시물갯수' }, { $inc : { totalPost : 1} }, (err, result)=>{
            if(err) return console.log(err)
        })
    })
})

// 글 상세 페이지 요청
app.get('/detail/:id', (request, response)=>{
    db.collection('post').findOne( { _id : parseInt(request.params.id) }, (err, result)=>{
        response.render('detail.ejs', { data : result })
    })
})

// 글 삭제 delete 요청
app.delete('/delete', function(request, response){
    request.body._id = parseInt(request.body._id)

    var 삭제할데이터 = { _id : request.body._id }

    db.collection('post').deleteOne(삭제할데이터, function(err, result){
        console.log('삭제완료');
        if(err) {console.log(err)}
        response.status(200).send({ message : '성공했습니다'});
    }) 
})

// 글 수정 페이지 요청
app.get('/edit/:id', (request, response)=>{
    db.collection('post').findOne({ _id : parseInt(request.params.id) }, (err, result)=> {
        response.render('edit.ejs', { post : result })
    })
})

// 글 수정 put 요청
app.put('/edit', (request, response)=>{
    db.collection('post').updateOne( { _id : parseInt(request.body.id) }, { $set : { 제목 : request.body.title , 내용 : request.body.content }}, (err, result)=>{
         response.redirect('/')
    })
})

// 로그인 페이지 요청
app.get('/login', (request, response)=>{
    response.render('login.ejs')
})

// 로그인 post 요청
app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), (request, response)=>{
    response.redirect('/')
})

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)

      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

passport.serializeUser(function (user, done) {
  done(null, user.id) // 세션데이터, 쿠키
});

passport.deserializeUser(function (sessionid, done) {
    db.collection('login').findOne( { id : sessionid }, (err, result)=>{
        done(null, result) // 마이페이지
    })
});

// 마이페이지 요청
app.get('/mypage', islogin, (request, response)=>{ // islogin으로 인해 request.user에 id : sessionid인 데이터가 꽂힘
    console.log(request.user)
    response.render('mypage.ejs', { 유저 : request.user })
})

function islogin(request, response, next) {
    if (request.user) {
        next() // 통과
    }
    else {
        response.send('로그인안함')
    }
}

// git config --global core.autocrlf true