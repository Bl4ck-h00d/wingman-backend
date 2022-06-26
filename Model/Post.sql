-- CREATE TABLE posts(
--     id BIGSERIAL PRIMARY KEY NOT NULL,
--     media text[] NOT NULL,
--     title VARCHAR(100) NOT NULL,
--     description VARCHAR(1000) NOT NULL,
--     author VARCHAR(50) REFERENCES users(username),
--     anonymous BOOLEAN DEFAULT FALSE,
--     tags text[],
--     upvotes text[],
--     downvotes text[]
-- );

CREATE TABLE posts(
    id BIGSERIAL PRIMARY KEY NOT NULL,
    media text[] NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    author VARCHAR(50) REFERENCES users(username),
    anonymous BOOLEAN DEFAULT FALSE,
    tags text[],
    ratings BIGINT DEFAULT 0
);