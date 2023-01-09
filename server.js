// express로 서버 열기
const express = require('express');
const MongoClient = require('mongodb').MongoClient; // mongodb 설치
const app = express();
app.set('view engine', 'ejs'); // ejs 사용. html에 db 넣기
app.use(express.urlencoded({extended: true})) // request.body 사용 (폼 입력 받기)
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

