CREATE TABLE users(
    username VARCHAR(50) NOT NULL PRIMARY KEY UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(150) NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);