// You can create a user for the application
CREATE USER IF NOT EXISTS watchdog WITH PASSWORD 'watchdog123' NOSUPERUSER;
// Create the keyspace
CREATE KEYSPACE IF NOT EXISTS watchdog WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true;
// Grant permissions
GRANT ALL PERMISSIONS ON KEYSPACE watchdog TO watchdog;