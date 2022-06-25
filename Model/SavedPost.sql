CREATE TABLE savedPost (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    owner VARCHAR(50) NOT NULL REFERENCES users(username),
    post BIGINT REFERENCES posts(id)
);