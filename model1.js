const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    userId:{
        type:Number,
    },
    id:{
        type:Number,
    },
    title:{
        type:String,
    },
    body:{
        type:String
    }
})

module.exports = new mongoose.model('parse',userschema);