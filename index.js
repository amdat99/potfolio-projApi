

// if using docker the fetch path needs to be changed to localhost:4000 in the front-end messages.sagas.js
// and weatherbox.js files. You also need to use the third db const below

const http = require('http');
const express = require('express')
const helmet = require("helmet")
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const socket = require('socket.io')
const enforce = require('express-sslify')

const app = express()

const server = app.listen( process.env.PORT|| 4000 , ()=>{
	console.log(`app  on port 4000`);
})



const io = socket(server)



if (process.env.NODE_ENV !== 'production') require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
	app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const key = process.env.ACCU_WEATHER_KEY;
const geoKey = process.env.GEO_KEY

const knex = require('knex')

// const db = knex({
// client: 'pg',
//   connection: {
//     host : '127.0.0.1',
//     user : 'postgres',
//     password : '7867',
//     database : 'chatapp'
//   }
// })

const db = knex({           //comment this if using docker // uncomment for heroku
  client: 'pg',
  connection: {
 connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }}
});

// const db = knex({               // uncomment this if using docker
// 	client: 'pg',
// 	connection: {
// 	  host : 'localhost',
// 	  user : 'postgres',
// 	  password : '7867',
// 	  database : 'chatapp'
// 	},
// 	connection: process.env.POSTGRES_URI
//   });



app.use(helmet())
app.use(express.json());

app.use(bodyParser.json());

const whitelist = ['http://localhost:3000','https://aamir-proj.herokuapp.com/','https://quiet-inlet-52952.herokuapp.com/','https://aamirproject-api.herokuapp.com/']
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

  app.post('/geodata',(req,res)=>{  // weatherApi routes
	
	const{longitude, latitude} = req.body;

	const url = `http://api.positionstack.com/v1/reverse?access_key=${geoKey}&query=${latitude},${longitude}`

	fetch(url)
	.then(res => res.json())
	.then(data => res.json(data) )
   
		})

  
app.post('/weathering',(req,res)=>{  // weatherApi routes
	
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
	const{message,userName, userId, messageId, image,video} = req.body;
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
		video: video,
		likes: 0,
		date: new Date().toLocaleString()
}) 	.then(data=>{
		res.json(data[0]);
	})
		.catch(err=> res.status(400).json(err))
})



app.post('/fetchmessages', (req,res)=>{  // fetch message data
	db.select('messageid','message','name','likes','date','image','userid','video').from('messages')
	.orderByRaw('date DESC')
	.then(message=>{
		res.json(message);
	})
	.catch(err=> res.status(400).json(err))
	})


	app.post('/addgroupmessages',(req,res)=>{  // add messages to database
		const{message,userName, userId, messageId, image,video,groupId} = req.body;
		const regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
	
		if(regex.test(!image)){
			return res.status(400).json('incorrect form submission')
		}
	if (!message ||!userName || !userId || !messageId || groupId){
			return res.status(400).json('incorrect form submission')
		}
	 db('groupmessages').returning('*').insert({
			message: message,
			groupid: groupId,
			name: userName,
			userid: userId,
			messageid: messageId + Math.random(),
			image: image,
			video: video,
			likes: 0,
			date: new Date().toLocaleString()
	}) 	.then(data=>{
			res.json(data[0]);
		})
			.catch(err=> res.status(400).json(err))
	})

	app.post('/fetchgroupmessages', (req,res)=>{  // fetch message data
		const {groupid} = req.body;
		db.select('messageid','message','name','likes','date','image','userid','video').from('messages')
		.where('groupid', '=' ,groupid)
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
	app.post('/addgroupchat',(req,res)=>{  // add messages to database
		const{groupName, creatorId, groupId, name, userId} = req.body;
	
	if ( groupId|| groupName || userId){
			return res.status(400).json('incorrect form submission')
		}
	 db('groupchats').returning('*').insert({
			groupid: groupId,
			groupname: groupName,
			userid: userId,
			name: name,
			creatorid: creatorId,
			date: new Date().toLocaleString()
	}) 	.then(data=>{
			res.json(data[0]);
		})
			.catch(err=> res.status(400).json(err))
	})

	app.post('/fetchgroupchats', (req,res)=>{  // fetch message data
		const {userId} = req.body;
		db.select('groupid','groupname','date','name','userid').from('messages')
		.where('userid', '=' ,userId)
		.orderByRaw('date DESC')
		.then(message=>{
			res.json(message);
		})
		.catch(err=> res.status(400).json(err))
		})

	app.post('/addvideoinfo',(req,res)=>{  // add video data to database
		const{videoId,senderId, receiverId, sender, receiver, receiverJoined, candidate,senderSDP} = req.body;


	 db('videochat').returning('*').insert({
		videoid: videoId,
		senderid: senderId,
		receiverid: receiverId,
		sender: sender,
		receiver: receiver,
		receiverjoined: receiverJoined,
		senderstatus: 'calling',
		date: new Date().toLocaleString()
	}) 	.then(data=>{
			res.json(data[0]);
		})
			.catch(err=> res.status(400).json(err))
	})


	
	app.post('/fetchcallinfo', (req,res)=>{  // fetch message data
		const { userId } = req.body;

		db.select('videoid','senderid','sender','receiverjoined','senderstatus','date').from('videochat')
		.where('receiverid', '=' ,userId)
		.orderByRaw('date DESC')
		.then(message=>{
			res.json(message);
		})
		.catch(err=> res.status(400).json(err))
		})



		app.put('/setmissedcall', (req, res) => { // imcrement message likes
			const{ videoId, } = req.body;
		if (!videoId){
		  return res.status(400).json('incorrect form submission')
		
		}
			console.log(videoId)
	 db('videochat').returning('*').where('videoid','=',videoId)
			.update({ 'senderstatus': 'missedcall'})
			.then(data=>{
				console.log(data)
				res.json(data);
				
			})
			 
			.catch(err=> res.status(400).json(err))
			})

			app.put('/setAnsweredcall', (req, res) => { // imcrement message likes
				const{ videoId, } = req.body;
			if (!videoId){
			  return res.status(400).json('incorrect form submission')
			}
				db('messages').where('videoid', '=', videoId)
				.update('receiverjoined', 'yes')
				 
				.catch(err=> res.status(400).json(err))
				})




	
	let rooms = [1,2,3]
    // websockets
	

	app.post('/fetchrooms', (req,res)=>{  // fetch room data
		  res.json(rooms);
		})
		
	app.post('/addroom',(req,res)=>{  
	   let room = req.body.room
	   if(room === 555){
		return res.status(400).json('room 555 not allowed')  
	   }
	   rooms.push(room)
	  
	   })

	   const peers = io.of('videosockets')

	   let connectedPeers = new Map()


	 io.on('connection', (socket) => {   // socket connection
	   let socketRoom;
	   connectedPeers.set(socket.id,socket)
	   console.log(`Connected ${socket.id}`);
	   
		socket.emit('success','works')

	   socket.on('disconnect', () =>
			
		  console.log(`Disconnected ${socket.id}`),
		  connectedPeers.delete(socket.id)
		  );
	   
		  socket.on('join', (room) => {     
				  
			// chat room sockets
		  console.log(` ${socket.id} joined ${room}`);
		  socket.join(room);
		  socketRoom = room;
		  })
	// 	  socket.on('videojoin',(videoRoom) => {
	// 	  console.log(` ${socket.id} joined ${videoRoom}`);
	// 	  socket.join(room);
	// 	  videoRoom = videoRoom;
	//    });
	
	   socket.on('switch', (data) => {
		  const { prevRoom, nextRoom } = data;
		  if (prevRoom) socket.leave(prevRoom);
		  if (nextRoom) socket.join(nextRoom);
		  socketRoom = nextRoom;
		});

		socket.on('onmessage', () => {
			
			console.log(`message sent room: ${socketRoom}`);
			socket.broadcast.emit('onmessage', "message" );
		 });
	   
	   socket.on('chat', (data) => {
		   if(socketRoom === 555){
			   return
		   }
		  const { message } = data;
		  console.log(`message: ${message}, room: ${socketRoom}`);
		  io.to(socketRoom).emit('chat', {message: message, room: socketRoom} );
	   });
	
	   socket.on('onroom', () => {
		console.log(` new room created room: ${socketRoom}`);
		socket.broadcast.emit('onroom', 'room' );
	 });

	 socket.on('profilechange', () => {
		
		console.log(` profile change detected`);
		socket.broadcast.emit('profilechange','profile');
	 });
  
	   
	   socket.on('begincall', (data) => {
		const { profileId } = data;
		console.log(`calling user: ${profileId}`)
		socket.broadcast.emit('begincall', profileId, );
	 });

	 socket.on('checkjoined', (data) => {
		const { videoId } = data;
		console.log(`room: ${videoId}`)
		socket.broadcast.emit('checkjoined', videoId, );
	 });

	 socket.on('offer', (data) => {
		// send to the other peer(s) if any

		const {sdp,videoId} = data;
		console.log('offer sdp:'+ {sdp} +'rooM : ' + videoId)
		socket.to(socketRoom).emit('offer',sdp)
	
	  })

	  socket.on('oncandidate', (data) => {
		const { candidate,videoId } = data;
		console.log(`candidate: ${candidate} room ${socketRoom}`)
		socket.broadcast.emit('oncandidate',candidate,videoId );
	 });



	  
	  });



// send messge -> post 
// message box -> get message