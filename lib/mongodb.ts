import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://amoke:teTpxVCHboIOB0Ss@belong-chivent-app.dhqgjmr.mongodb.net/?retryWrites=true&w=majority&appName=Belong-chivent-app';
import { Db, MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

class Mongo {
  private static instance: Mongo | null;
  private client: MongoClient;
  public clientPromise: MongoClient;

  private constructor() {
    if (process.env.NODE_ENV === 'development') {
      if (!(global as any)._mongoClientPromise) {
        this.client = new MongoClient(String(uri), {
          readPreference: 'primary',
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
          ssl: true,
          connectTimeoutMS: 50000,
        });
      }
      else {
        this.client = (global as any)._mongoClientPromise;
      }
    } else {
      this.client = new MongoClient(String(uri), {
        readPreference: 'primary',
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        ssl: true,
        connectTimeoutMS: 50000,
      });
    }

    (global as any)._mongoClientPromise = this.client;
    this.clientPromise = this.client;
  }

  public static async getInstance(): Promise<Mongo> {
    if (!Mongo.instance) {
      try {
        Mongo.instance = new Mongo();
        await Mongo.instance.connect();
      } catch (err) {
        Mongo.instance = null;
        throw Error('Cannot connect to Mongo');
      }
    } 
    return Mongo.instance;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log('Disconnected from Mongo.');
    } catch (err) {
      console.error('Disconnection error');
    }
  }
private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      console.log(err);
      throw Error('Cannot connect to Mongo');
    }
  }

  
}


export default Mongo;