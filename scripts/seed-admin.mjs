import 'dotenv/config'
import bcrypt from 'bcryptjs'
import clientPromise from '../lib/mongodb.js'

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'change_me'
  const name = 'Admin'

  const client = await clientPromise
  const db = client.db()
  const users = db.collection('users')

  const existing = await users.findOne({ email })
  if (existing) {
    console.log('Admin user already exists:', email)
    return
  }

  const hash = await bcrypt.hash(password, 10)
  await users.insertOne({ email, name, password: hash, role: 'admin' })
  console.log('Admin user created:', email)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
