BEGIN TRANSACTION;

CREATE TABLE messages (
    messageid INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    message VARCHAR  NOT NULL,
    userid VARCHAR  NOT NULL,
    likes BIGINT ,
    image VARCHAR,
    date TIMESTAMP 
);

COMMIT; 