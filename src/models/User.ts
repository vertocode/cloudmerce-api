import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: false,
        default: 'user'
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    activeToken: {
        type: String,
        default: null,
        expireAfterSeconds: 86400
    },
    activeTokenExpires: {
        type: Date,
        default: null
    }
})

export default mongoose.model('User', userSchema)
