db = db.getSiblingDB('seattle_store');

db.createCollection('logs');

db.createUser({
  user: 'root',
  pwd: 'root',
  roles: [{ role: 'readWrite', db: 'seattle_scheduler' }],
});
