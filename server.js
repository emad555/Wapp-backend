//import
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

require('dotenv').config()


//app config
const app= express()
const port = process.env.PORT || 9000

const db = mongoose.connection



const pusher = new Pusher({
    appId: process.env.APPID,
    key: process.env.KEY,
    secret: process.env.SECRET,
    cluster:process.env.CLUSTER,
    useTLS: process.env.USETLS
  });

//middleware
app.use(express.json())
app.use(cors())

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*")
//     res.setHeader("Access-Control-Allow-Headers", "*")
//     next();
// })


//DB config
const dbURL = process.env.DB_URL;

mongoose.connect(dbURL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});


db.once('open', ()=> {
    console.log("db connected!")
    console.log()



const msgCollection = db.collection("messagecontents");
const changeStream = msgCollection.watch();

changeStream.on("change", (change) => {
  console.log(change);

  if(change.operationType === 'insert'){
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted',
      {
          name: messageDetails.name,
          message: messageDetails.message,
          timestamp: messageDetails.timestamp,
          received: messageDetails.received
      });
    }else{
        console.log('error pusher')
    }
})
})




//???


//APO routes
app.get('/', (req, res)=> res.status(200).send('hello world'))

app.get('/messages/sync', (req, res)=>{ 
    Messages.find((err, data)=> {
    if(err){
        res.status(500).send(err);
    } else {
        res.status(201).send(data);
    }
})
})



app.post('/messages/new', (req, res)=> {
    const dbMessage = req.body
    
    Messages.create(dbMessage, (err, data)=> {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})


//listener
app.listen(port, ()=> console.log(`listening on local host:${port}`))