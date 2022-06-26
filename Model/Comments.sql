CREATE TABLE comments(
    id BIGSERIAL PRIMARY KEY NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    author VARCHAR(50) REFERENCES users(username),
    anonymous BOOLEAN DEFAULT FALSE,
    upvotes text[],
    downvotes text[],
    postId BIGSERIAL REFERENCES posts(id)
);