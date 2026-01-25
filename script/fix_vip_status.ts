
import { db } from "../server/db";
import { users, userVipStatus } from "../shared/schema";
import { eq, ne, gt } from "drizzle-orm";

async function main() {
  console.log("Starting VIP Status Fix...");
  
  // Find all users with vipLevel > 0
  // Note: ne(users.vipLevel, 0) might not work if null, so safely check > 0 if possible or filter in js
  const allUsers = await db.select().from(users);
  const vips = allUsers.filter(u => u.vipLevel && u.vipLevel > 0);
  
  console.log(`Found ${vips.length} VIP users in users table.`);
  
  let fixedCount = 0;

  for (const user of vips) {
    const [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, user.id));
    
    if (!status) {
       console.log(`Fixing User ${user.id} (${user.phone}): Missing status. Setting to V${user.vipLevel}`);
       await db.insert(userVipStatus).values({
         userId: user.id,
         vipLevel: user.vipLevel,
         upgradedAt: new Date(),
         qualified: true,
         directCount: 0, 
         team3Count: 0
       });
       fixedCount++;
    } else if (status.vipLevel !== user.vipLevel) {
       console.log(`Fixing User ${user.id} (${user.phone}): Status V${status.vipLevel} != User V${user.vipLevel}. Updating.`);
       await db.update(userVipStatus)
         .set({ vipLevel: user.vipLevel }) // Trust users table as source of truth for level
         .where(eq(userVipStatus.userId, user.id));
       fixedCount++;
    }
  }
  
  console.log(`Fix complete. Fixed ${fixedCount} records.`);
  process.exit(0);
}

main();
