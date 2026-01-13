const mongoose = require('mongoose');
const logger = require('./logger');

const ensureIndexes = async () => {
    try {
        const User = require('../Models/User');
        const Capsule = require('../Models/Capsule');
        const Session = require('../Models/Session');
        
        logger.info('Creating database indexes...');
        
        await Promise.all([
            User.collection.createIndex({ email: 1 }, { unique: true, background: true }),
            User.collection.createIndex({ username: 1 }, { unique: true, background: true }),
            User.collection.createIndex({ lastLogin: -1 }, { background: true }),
            User.collection.createIndex({ accountTier: 1 }, { background: true }),
            
            Capsule.collection.createIndex({ creator: 1, status: 1 }, { background: true }),
            Capsule.collection.createIndex({ scheduleDate: 1, status: 1 }, { background: true }),
            Capsule.collection.createIndex({ category: 1 }, { background: true }),
            Capsule.collection.createIndex({ tags: 1 }, { background: true }),
            Capsule.collection.createIndex({ createdAt: -1 }, { background: true }),
            Capsule.collection.createIndex({ 
                title: 'text', 
                message: 'text' 
            }, { 
                background: true,
                weights: { title: 10, message: 5 }
            }),
            
            Session.collection.createIndex({ userId: 1, token: 1 }, { background: true }),
            Session.collection.createIndex({ token: 1 }, { unique: true, background: true }),
            Session.collection.createIndex({ createdAt: 1 }, { 
                expireAfterSeconds: 7 * 24 * 60 * 60,
                background: true 
            })
        ]);
        
        logger.info('Database indexes created successfully');
        return { success: true };
    } catch (error) {
        logger.error('Error creating indexes', { error: error.message, stack: error.stack });
        return { success: false, error: error.message };
    }
};

const getIndexInfo = async () => {
    try {
        const User = require('../Models/User');
        const Capsule = require('../Models/Capsule');
        const Session = require('../Models/Session');
        
        const [userIndexes, capsuleIndexes, sessionIndexes] = await Promise.all([
            User.collection.indexes(),
            Capsule.collection.indexes(),
            Session.collection.indexes()
        ]);
        
        return {
            User: userIndexes.map(idx => ({ name: idx.name, keys: idx.key })),
            Capsule: capsuleIndexes.map(idx => ({ name: idx.name, keys: idx.key })),
            Session: sessionIndexes.map(idx => ({ name: idx.name, keys: idx.key }))
        };
    } catch (error) {
        logger.error('Error fetching index info', { error: error.message });
        throw error;
    }
};

const analyzeQueryPerformance = async (model, query) => {
    try {
        const startTime = Date.now();
        const explainResult = await model.find(query).explain('executionStats');
        const duration = Date.now() - startTime;
        
        const stats = explainResult.executionStats;
        
        return {
            duration,
            executionTime: stats.executionTimeMillis,
            totalDocsExamined: stats.totalDocsExamined,
            totalKeysExamined: stats.totalKeysExamined,
            nReturned: stats.nReturned,
            indexUsed: stats.executionStages?.indexName || 'COLLSCAN',
            needsIndex: stats.totalDocsExamined > stats.nReturned * 10
        };
    } catch (error) {
        logger.error('Query analysis error', { error: error.message });
        throw error;
    }
};

module.exports = {
    ensureIndexes,
    getIndexInfo,
    analyzeQueryPerformance
};
