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
  console.log("Checking database data...\n");
  
  // Check users
  const [users] = await connection.execute("SELECT id, email FROM users LIMIT 5");
  console.log("Users in database:");
  console.log(users);
  console.log();
  
  // Check farms and their user IDs
  const [farms] = await connection.execute("SELECT id, name, farmerUserId FROM farms LIMIT 10");
  console.log("Farms in database:");
  console.log(farms);
  console.log();
  
  // Check farm count
  const [farmCount] = await connection.execute("SELECT COUNT(*) as count FROM farms");
  console.log("Total farms:", farmCount[0].count);
  console.log();
  
  // Check crops
  const [cropCount] = await connection.execute("SELECT COUNT(*) as count FROM crops");
  console.log("Total crops:", cropCount[0].count);
  console.log();
  
  // Check animals
  const [animalCount] = await connection.execute("SELECT COUNT(*) as count FROM animals");
  console.log("Total animals:", animalCount[0].count);
  console.log();
  
  // Check marketplace products
  const [productCount] = await connection.execute("SELECT COUNT(*) as count FROM marketplaceProducts");
  console.log("Total marketplace products:", productCount[0].count);
  
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await connection.end();
}
