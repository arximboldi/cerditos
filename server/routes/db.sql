CREATE TABLE IF NOT EXISTS banks (
       name STRING PRIMARY KEY,
       is_open BOOLEAN DEFAULT true,
       [key] STRING
);

CREATE TABLE IF NOT EXISTS pigs (
       id STRING PRIMARY KEY,
       bank STRING DEFAULT null,
       ready BOOLEAN DEFAULT false,
       dream STRING,
       notes STRING,
       kind STRING,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (bank) REFERENCES bank(name)
);

IF NOT EXISTS(SELECT name FROM banks WHERE name='olivia')
INSERT INTO banks (name)
VALUES ('olivia');
