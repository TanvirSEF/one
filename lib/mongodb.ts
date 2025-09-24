import { MongoClient } from "mongodb"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to your environment variables.")
}

const client = new MongoClient(uri)

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV !== "production") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = client.connect()
}

export default clientPromise
export { MongoClient }


