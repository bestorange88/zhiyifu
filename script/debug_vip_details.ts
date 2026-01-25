
import { db } from "../server/db";
import { users, userVipStatus, vipRequirements } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const targetPhone = "19207051377";
  
  // 1. Check Requirements Config
  const [reqV2] = await db.select().from(vipRequirements).where(eq(vipRequirements.level, 2));
  console.log("\n=== V2 REQUIREMENTS CONFIG ===");
  console.log(JSON.stringify(reqV2, null, 2));

  console.log(`\nAnalyzing VIP stats for ${targetPhone}...`);

  const [user] = await db.select().from(users).where(eq(users.phone, targetPhone)).limit(1);
  if (!user) { console.error("User not found"); process.exit(1); }

  console.log(`User ID: ${user.id}, Level: ${user.vipLevel}`);

  // Level 1
  const l1 = await db.select().from(users).where(eq(users.inviterId, user.id));
  const l1Ids = l1.map(u => u.id);
  console.log(`Generation 1: ${l1.length} users`);

  // Level 2
  let l2: typeof l1 = [];
  let l2Ids: number[] = [];
  if (l1Ids.length) {
    l2 = await db.select().from(users).where(inArray(users.inviterId, l1Ids));
    l2Ids = l2.map(u => u.id);
  }
  console.log(`Generation 2: ${l2.length} users`);

  // Level 3
  let l3: typeof l1 = [];
  let l3Ids: number[] = [];
  if (l2Ids.length) {
    l3 = await db.select().from(users).where(inArray(users.inviterId, l2Ids));
    l3Ids = l3.map(u => u.id);
  }
  console.log(`Generation 3: ${l3.length} users`);

  const allIds = [...l1Ids, ...l2Ids, ...l3Ids];
  if (allIds.length === 0) { console.log("No team members."); process.exit(0); }

  // Check VIP Status
  const vipStatuses = await db.select().from(userVipStatus).where(inArray(userVipStatus.userId, allIds));
  
  console.log("\n=== ALL TEAM MEMBERS STATUS ===");
  console.log("ID\tPhone\t\tGen\tUserTable\tStatusTable");
  
  const allUsers = [...l1, ...l2, ...l3];
  let count = 0;

  for (const u of allUsers) {
    const status = vipStatuses.find(s => s.userId === u.id);
    const statusLevel = status?.vipLevel ?? 0;
    const userLevel = u.vipLevel ?? 0;
    let gen = l1Ids.includes(u.id) ? 1 : l2Ids.includes(u.id) ? 2 : 3;

    if (userLevel >= 1 || statusLevel >= 1) {
       console.log(`${u.id}\t${u.phone}\t${gen}\t${userLevel}\t\t${statusLevel}`);
    }

    if (statusLevel >= 1) {
        count++;
    }
  }
  
  console.log(`\nTotal Qualified Found: ${count}`);
  console.log("------------------------------------------------");
  process.exit(0);
}

main();
