const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());


const knex = require('knex')({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'bhimes',
        database: 'postgres',
        port: 5432
    }
});

async function findSubredditRelations(searchType, subredditName, hideBots, modsOver, subsOver, currentLayer, maxLayers, results = {}) {
    if (currentLayer > maxLayers) {
        return results;
    }

    let query = knex('userssubreddits as us1')
        .select('u.user_name', 's.subreddit_name')
        .join('users as u', 'u.user_id', 'us1.user_id')
        .join('userssubreddits as us2', 'u.user_id', 'us2.user_id')
        .join('subreddits as s', 's.subreddit_id', 'us2.subreddit_id')
        .whereIn('us1.subreddit_id', function() {
            this.select('subreddit_id')
                .from('subreddits')
                .where('subreddit_name', subredditName);
        });

    // TODO enable other filters
    if (hideBots) {
        query = query.where('u.bot', false);
    }

    const layerResults = await query;

    for (const { user_name, subreddit_name } of layerResults) {
        if (!results[user_name]) {
            results[user_name] = new Set();
        }
        results[user_name].add(subreddit_name);

        if (currentLayer < maxLayers) {
            await findSubredditRelations(searchType, subreddit_name, hideBots, modsOver, subsOver, currentLayer+1, maxLayers, results);
        }
    }
    if (currentLayer === 1) {
        // Convert Sets to Arrays only at the top level call
        return Object.fromEntries(
            Object.entries(results).map(([user, subreddits]) => [user, Array.from(subreddits)])
        );
    } else {
        return results;
    }
}


app.get('/api/data', async (req, res) => {
    const { searchType, query, hideBots, subsOver, modsOver, layers } = req.query;
    // default vals for params
    const layerCount = parseInt(layers, 10) || 1; // Default to 1 layer if not specified
    const hideBotsFlag = hideBots === 'true';
    const subsOverNumber = parseInt(subsOver, 10) || 0;
    const modsOverNumber = parseInt(modsOver, 10) || 0;

    try {
        let results;
        results = await findSubredditRelations(searchType, query, hideBotsFlag, modsOverNumber, subsOverNumber, 1, layerCount, {});
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
process.on('SIGINT', () => {
    console.log("Shutting down server...");
    knex.destroy().then(() => {
        console.log("Database connection closed.");
        process.exit(0);
    });
});
