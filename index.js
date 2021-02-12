const http2 = require(
	'http2')
const express = require('express')
const helmet = require("helmet")
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const isImageURL = require('image-url-validator').default;

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const knex = require('knex')

const db = knex({
client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '7867',
    database : 'chatapp'
  }
});

app.use(helmet())
app.use(express.json());

app.use(bodyParser.json());

const whitelist = ['http://localhost:4000']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors())

app.get('/', (req,res)=>{
res.send('success')
})

app.post('/payment', (req, res) => {
	const body = {
	  source: req.body.token.id,
	  amount: req.body.amount,
	  currency: 'gbp'
	};
  
	stripe.charges.create(body, (stripeErr, stripeRes) => {
	  if (stripeErr) {
		res.status(500).send({ error: stripeErr });
	  } else {
		res.status(200).send({ success: stripeRes });
	  }
	});
  });
  

  

app.post('/addmessages',(req,res)=>{  // add messages to database
	const{message,userName, userId, messageId, image} = req.body;
	
	if(image){
		var http = new XMLHttpRequest(); 
		http.open('HEAD', image, false); 
			http.send(); 
		return http.status != 404;
}
if (!message ||!userName || !userId || !messageId){
		return res.status(400).json('incorrect form submission')
    }
 db('messages').returning('*').insert({
		message: message,
		name: userName,
		userid: userId,
		messageid: messageId + Math.random(),
		image: image,
		likes: 0,
		date: new Date()
}) 	.then(data=>{
		res.json(data[0]);
	})
		.catch(err=> res.status(400).json(err))
})

app.post('/fetchmessages', (req,res)=>{  // fetch message data
	db.select('messageid','message','name','likes','date','image').from('messages')
	.orderByRaw('date DESC')
	.then(message=>{
		res.json(message);
	})
	.catch(err=> res.status(400).json(err))
	})



	app.put('/incrementlikes', (req, res) => { // imcrement message likes
		const{ messageid } = req.body;
	if (!messageid){
      return res.status(400).json('incorrect form submission')
    }
		db('messages').where('messageid', '=', messageid)
		.increment('likes', 1)
	 	.then(likes=>{
			res.json(likes[0]);
		})
		.catch(err=> res.status(400).json(err))
		
	})

	


	
 
app.listen( 3000 , ()=>{
	console.log(`'app is on 3000 '`);
})




// login => post
// send messgae -> post 
// message box -> get message