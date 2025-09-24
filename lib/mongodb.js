import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to your environment variables.")
}

const client = new MongoClient(uri)

let clientPromise
const g = globalThis

if (process.env.NODE_ENV !== "production") {
  if (!g._mongoClientPromise) {
    g._mongoClientPromise = client.connect()
  }
  clientPromise = g._mongoClientPromise
} else {
  clientPromise = client.connect()
}

export default clientPromise
export { MongoClient }


