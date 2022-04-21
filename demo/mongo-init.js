db = db.getSiblingDB('seattle_demo');
db.createCollection('logs');

db.createUser({
  user: 'root',
  pwd: 'root',
  roles: [{ role: 'readWrite', db: 'seattle_demo' }],
});
