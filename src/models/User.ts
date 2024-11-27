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
        enum: ['admin', 'user'],
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
    phone: {
        type: String,
        required: false
    },
    cpf: {
        type: String,
        required: false
    },
    hasWhatsapp: {
        type: Boolean,
        default: false
    },
    birthday: {
        type: String,
        required: false
    },
    address: {
        type: {
            cep: String,
            neighborhood: String,
            street: String,
            number: String,
            city: String,
            state: String,
            country: {
                type: String,
                default: 'Brasil'
            }
        },
        default: {
            street: '',
            number: '',
            city: '',
            state: '',
            country: 'Brasil',
            neighborhood: '',
            cep: ''
        }
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
