import mysql from "mysql2/promise";
import { URL } from "url";

const dbUrl = new URL(process.env.DATABASE_URL);
const connectionConfig = {
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
};

const connection = await mysql.createConnection(connectionConfig);

try {
  console.log("Checking farms table...\n");
  
  // Check farms count
  const [farmCount] = await connection.execute("SELECT COUNT(*) as count FROM farms");
  console.log("Total farms:", farmCount[0].count);
  console.log();
  
  // Get farms
  const [farms] = await connection.execute("SELECT * FROM farms LIMIT 5");
  console.log("Sample farms:");
  console.log(farms);
  
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await connection.end();
}
