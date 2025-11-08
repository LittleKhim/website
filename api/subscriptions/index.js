import { MongoClient } from 'mongodb';

// MongoDB connection string
const uri = process.env.STORAGE_URL || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-lazydata:0xyodbn9xOEDyhLo@lazydata.1zrhuoo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const subscriptionsCollection = db.collection('subscriptions');
            const usersCollection = db.collection('users');
            
            const { email, planPrice, autoPayment, startDate, nextPaymentDate } = req.body;
            
            if (!email || !planPrice) {
                return res.status(400).json({ error: 'Email and planPrice are required' });
            }
            
            // Check if user already has an active subscription
            const existingSubscription = await subscriptionsCollection.findOne({
                email: email,
                status: 'active'
            });
            
            if (existingSubscription) {
                return res.status(400).json({ error: 'User already has an active subscription' });
            }
            
            // Create subscription
            const subscription = {
                email: email,
                planPrice: planPrice,
                autoPayment: autoPayment || false,
                status: 'active',
                startDate: new Date(startDate),
                nextPaymentDate: new Date(nextPaymentDate),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await subscriptionsCollection.insertOne(subscription);
            
            res.status(200).json({ success: true, subscription: subscription });
        } catch (error) {
            console.error('Error creating subscription:', error);
            res.status(500).json({ error: 'Failed to create subscription' });
        } finally {
            await client.close();
        }
    } else if (req.method === 'GET') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const subscriptionsCollection = db.collection('subscriptions');
            
            const email = decodeURIComponent(req.query.email || '');
            
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            const subscription = await subscriptionsCollection.findOne({
                email: email,
                status: 'active'
            });
            
            res.status(200).json({ subscription: subscription || null });
        } catch (error) {
            console.error('Error getting subscription:', error);
            res.status(500).json({ error: 'Failed to get subscription' });
        } finally {
            await client.close();
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

