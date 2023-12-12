CREATE TABLE IF NOT EXISTS banks (
       name VARCHAR(24) PRIMARY KEY not null,
       is_open BOOLEAN DEFAULT true,
       key INTEGER
);

CREATE TABLE IF NOT EXISTS pigs (
       id INTEGER PRIMARY KEY not null,
       bank VARCHAR(24) DEFAULT null,
       ready BOOLEAN DEFAULT false,
       dream TEXT,
       notes TEXT,
       FOREIGN KEY (bank) REFERENCES bank(name)
);

INSERT OR IGNORE INTO banks (name)
VALUES ('olivia');
