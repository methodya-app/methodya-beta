import { MongoClient, ObjectId } from 'mongodb';

let _client = null;
let _db = null;

// Reutiliza la conexión entre invocaciones "warm" de la función serverless.
export async function getDb() {
  if (_db) return _db;
  _client = new MongoClient(process.env.MONGODB_URI);
  await _client.connect();
  _db = _client.db(process.env.MONGODB_DB || 'methodya');
  return _db;
}

export { ObjectId };

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}
