CREATE TABLE posts(
    id BIGSERIAL PRIMARY KEY NOT NULL,
    media text[] NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    author VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    anonymous BOOLEAN DEFAULT FALSE,
    tags text[],
    ratings BIGINT NOT NULL DEFAULT 0,
    timestamp VARCHAR(50) NOT NULL,
    edited BOOLEAN DEFAULT FALSE,
    search_document_with_weights tsvector
);