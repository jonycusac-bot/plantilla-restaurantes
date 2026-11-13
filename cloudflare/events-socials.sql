
CREATE TABLE IF NOT EXISTS restaurant_events (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL DEFAULT 1,payload TEXT NOT NULL);
INSERT OR IGNORE INTO restaurant_events(id,revision,payload) VALUES(1,1,'[]');
CREATE TABLE IF NOT EXISTS restaurant_socials (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL DEFAULT 1,payload TEXT NOT NULL);
INSERT OR IGNORE INTO restaurant_socials(id,revision,payload) VALUES(1,1,'{"instagram":"","facebook":""}');
