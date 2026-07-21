// Crea índices recomendados en MongoDB Atlas.
// Uso: mongosh "<MONGODB_URI>" db/mongo_init.js
const dbName = "methodya";
db = db.getSiblingDB(dbName);

db.forms.createIndex({ project_id: 1 });
db.subforms.createIndex({ created_at: -1 });
db.paragraphs.createIndex({ tags: 1 });
db.document_data.createIndex({ document_id: 1 }, { unique: true });

print("Índices creados en la base de datos: " + dbName);
