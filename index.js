


const http = require('http');
const express = require('express')
const helmet = require("helmet")
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const enforce = require('express-sslify')




const app = express()

// const server = require('http').createServer(app);
// const options = { /* ... */ };
// const io = require("socket.io")(httpServer, {
// 	cors: {
// 	  origin: "http://localhost:3001",
// 	  methods: ["GET", "POST"]
// 	}
//   });

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
	app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const key = process.env.ACCU_WEATHER_KEY;

const knex = require('knex')

// const db = knex({
// // client: 'pg',
// //   connection: {
// //     host : '127.0.0.1',
// //     user : 'postgres',
// //     password : '7867',
// //     database : 'chatapp'
// //   }

const db = knex({
  client: 'pg',
  connection: {
 connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }}
});

app.use(helmet())
app.use(express.json());

app.use(bodyParser.json());

const whitelist = ['http://localhost:3000','https://aamir-proj.herokuapp.com/']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions))


// io.on('connection', socket => {  
// 	socket.emit('id', socket.id)
// 	socket.on("send message", body =>{
// 		console.log('response')
// 		io.emit("message", body)
// 	})
// })

// // 	socket.on('message', ({ recipients, message }) => {
// // 		recipients.forEach(recipient =>{
// // 			const newRecipients = recipients.filter(reciever => reciever !==
// // 				recipient)
// // 			newRecipients.push(id)
// // 			socket.broadcast.to(recipient).emit('message',{
// // 				recipients: newRecipients, sender: id, message
// // 			})
// // 		})
// // 	})
	                                   
// // })


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

  


  app.post('/weathering',(req,res)=>{ 
	
	const{location} = req.body;
	const url = 'http://dataservice.accuweather.com/locations/v1/cities/search'
    const params = `?apikey=${key}&q=${location}`
	fetch(url+params)
	.then(res => res.json())
	.then(data => res.json(data[0]) )
   
		})


app.post('/weatherdata',(req,res)=>{ 
	
	const{locationKey} = req.body;
	const url = 'http://dataservice.accuweather.com/currentconditions/v1/' 
	const  params = `${locationKey}?apikey=${key}`
	fetch(url+params)
	.then(res => res.json())
	.then(data => res.json(data[0]) )
	// .then(json => console.log(json));
	
	})


app.post('/addmessages',(req,res)=>{  // add messages to database
	const{message,userName, userId, messageId, image} = req.body;
	const regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");

	if(regex.test(!image)){
		return res.status(400).json('incorrect form submission')
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

	


	
 
app.listen( process.env.PORT|| 4000 , ()=>{
	console.log(`app is on port 4000`);
})




// login => post
// send messgae -> post 
// message box -> get message