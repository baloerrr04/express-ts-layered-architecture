import { prisma } from '../db'
import express, { Response, Request, Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { accessValidation } from './auth.middleware'
import { google } from 'googleapis'

const router = express.Router()

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:8000/auth/google/callback"
)

const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]

const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
})


router.get('/',  async (req: Request, res: Response) => {
  try {
    const result = await prisma.user.findMany()
    return res.json(result)
  } catch (error) {
    console.error('Error during user registration:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Register User
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = req.body

    console.log(userData)

    if (
      !userData.username ||
      !userData.email ||
      !userData.phoneNumber ||
      !userData.password
    ) {
      return res
        .status(400)
        .json({ error: 'Incomplete data. Please provide all required fields.' })
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const result = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        photo: userData.photo,
        password: hashedPassword,
      },
    })

    res.json({
      message: 'User created',
      userId: result.id,
    })
  } catch (error) {
    console.error('Error during user registration:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Login User
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    if (!user.password) {
      return res.status(404).json({
        message: 'Password not set',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (isPasswordValid) {
      const payload = {
        id: user.id,
        name: user.username,
        phoneNumber: user.phoneNumber,
      }

      const secret = process.env.JWT_SECRET!

      const expiresIn = 60 * 60 * 1

      const token = jwt.sign(payload, secret, { expiresIn: expiresIn })

      return res.json({
        data: {
          id: user.id,
          name: user.username,
          phoneNumber: user.phoneNumber,
        },
        token: token,
      })
    } else {
      return res.status(403).json({
        message: 'Wrong password',
      })
    }
  } catch (error) {
    console.error('Error during user registration:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Google Login
router.get("/google", (req: Request, res: Response) => {
    res.redirect(authorizationUrl);
})

// Google Login Callback 
router.get("/google/callback", async (req: Request, res: Response) => {
    const {code} = req.query

    const {tokens} = await oauth2Client.getToken(code as string)

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
    })

    const {data} = await oauth2.userinfo.get();

    if(!data.email || !data.name){
        return res.json({
            data: data,
        })
    }

    let user = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })

    if(!user){
        user = await prisma.user.create({
            data: {
                username: data.name,
                email: data.email,
                photo: "-",
                phoneNumber: "-",
                password: "-"
            }
        })
    }

    const payload = {
        id: user.id,
        name: user.username,
        phoneNumber: user.phoneNumber,
      }

      const secret = process.env.JWT_SECRET!

      const expiresIn = 60 * 60 * 1

      const token = jwt.sign(payload, secret, { expiresIn: expiresIn })

      return res.json({
        data: {
          id: user.id,
          name: user.username,
          phoneNumber: user.phoneNumber,
        },
        token: token,
      })
})

export default router
