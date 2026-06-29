import bcrypt from "bcrypt";
import { db } from "../db";
import { adminUser } from "../../shared/schema";
import { eq } from "drizzle-orm";

// run this if u want to create or update admin

async function run() {
  const email = "er.vishaalsingh@gmail.com"; // Use lowercase to match what you want
  const password = "Webcon@1234$";
  
  // Check if admin already exists
  const existingAdmin = await db.query.adminUser.findFirst();
  
  if (existingAdmin) {
    console.log(`⚠️  Admin already exists with email: ${existingAdmin.email}`);
    
    // Update email and password
    const hash = await bcrypt.hash(password, 10);
    await db
      .update(adminUser)
      .set({ 
        email: email.toLowerCase(), // Store in lowercase for consistency
        passwordHash: hash,
        updatedAt: new Date(),
      })
      .where(eq(adminUser.id, existingAdmin.id));
    
    console.log(`✅ Admin updated!`);
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Password: ${password}`);
  } else {
    // Create new admin
    const hash = await bcrypt.hash(password, 10);
    await db.insert(adminUser).values({
      email: email.toLowerCase(), // Store in lowercase for consistency
      passwordHash: hash,
    });
    
    console.log(`✅ Admin created successfully!`);
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Password: ${password}`);
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });

//command to run the script: npx tsx server/scripts/createAdmin.ts