CREATE TABLE Subreddits (
    subreddit_id SERIAL PRIMARY KEY,
    subreddit_name TEXT UNIQUE,
    subreddit_members INTEGER,
    bot BOOLEAN DEFAULT false
);

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    user_name TEXT UNIQUE
);

CREATE TABLE UsersSubreddits (
    subreddit_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (subreddit_id) REFERENCES Subreddits(subreddit_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
