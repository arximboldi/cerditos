CREATE TABLE IF NOT EXISTS banks (
       name TEXT PRIMARY KEY not null,
       is_open BOOLEAN DEFAULT true,
       key INTEGER
);

CREATE TABLE IF NOT EXISTS pigs (
       id TEXT PRIMARY KEY not null,
       bank TEXT DEFAULT null,
       ready BOOLEAN DEFAULT false,
       dream TEXT,
       notes TEXT,
       FOREIGN KEY (bank) REFERENCES bank(name)
);

INSERT OR IGNORE INTO banks (name)
VALUES ('olivia');
