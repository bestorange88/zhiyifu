import { db } from "../db";
import { scheduledRedPackets, chatGroups } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { createMultipleRedPackets } from "./redPacket";

// 获取群组的定时红包列表
export async function getScheduledRedPackets(groupId: number) {
  const schedules = await db.select().from(scheduledRedPackets)
    .where(eq(scheduledRedPackets.groupId, groupId))
    .orderBy(desc(scheduledRedPackets.createdAt));
  
  return schedules;
}

// 获取所有定时红包
export async function getAllScheduledRedPackets() {
  const schedules = await db
    .select({
      id: scheduledRedPackets.id,
      groupId: scheduledRedPackets.groupId,
      groupName: chatGroups.name,
      scheduledTime: scheduledRedPackets.scheduledTime,
      packetCount: scheduledRedPackets.packetCount,
      amountPerPacket: scheduledRedPackets.amountPerPacket,
      claimCountPerPacket: scheduledRedPackets.claimCountPerPacket,
      greeting: scheduledRedPackets.greeting,
      isEnabled: scheduledRedPackets.isEnabled,
      lastExecutedAt: scheduledRedPackets.lastExecutedAt,
      createdAt: scheduledRedPackets.createdAt,
    })
    .from(scheduledRedPackets)
    .leftJoin(chatGroups, eq(scheduledRedPackets.groupId, chatGroups.id))
    .orderBy(desc(scheduledRedPackets.createdAt));
  
  return schedules;
}

// 创建定时红包
export async function createScheduledRedPacket(
  groupId: number,
  scheduledTime: string,
  packetCount: number,
  amountPerPacket: number,
  claimCountPerPacket: number,
  greeting: string = "恭喜发财，大吉大利",
  adminId: number
) {
  // 验证时间格式 HH:mm
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(scheduledTime)) {
    throw new Error("时间格式无效，请使用 HH:mm 格式");
  }
  
  if (packetCount < 1) {
    throw new Error("红包数量至少为1");
  }
  
  if (amountPerPacket < 0.01) {
    throw new Error("每个红包金额至少为0.01元");
  }
  
  if (claimCountPerPacket < 1) {
    throw new Error("每个红包可领取人数至少为1");
  }
  
  const [schedule] = await db.insert(scheduledRedPackets).values({
    groupId,
    scheduledTime,
    packetCount,
    amountPerPacket: String(amountPerPacket),
    claimCountPerPacket,
    greeting,
    isEnabled: true,
    createdBy: adminId,
  }).returning();
  
  return schedule;
}

// 更新定时红包
export async function updateScheduledRedPacket(
  id: number,
  data: {
    scheduledTime?: string;
    packetCount?: number;
    amountPerPacket?: number;
    claimCountPerPacket?: number;
    greeting?: string;
    isEnabled?: boolean;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  
  if (data.scheduledTime !== undefined) {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.scheduledTime)) {
      throw new Error("时间格式无效，请使用 HH:mm 格式");
    }
    updateData.scheduledTime = data.scheduledTime;
  }
  
  if (data.packetCount !== undefined) {
    if (data.packetCount < 1) {
      throw new Error("红包数量至少为1");
    }
    updateData.packetCount = data.packetCount;
  }
  
  if (data.amountPerPacket !== undefined) {
    if (data.amountPerPacket < 0.01) {
      throw new Error("每个红包金额至少为0.01元");
    }
    updateData.amountPerPacket = String(data.amountPerPacket);
  }
  
  if (data.claimCountPerPacket !== undefined) {
    if (data.claimCountPerPacket < 1) {
      throw new Error("每个红包可领取人数至少为1");
    }
    updateData.claimCountPerPacket = data.claimCountPerPacket;
  }
  
  if (data.greeting !== undefined) {
    updateData.greeting = data.greeting;
  }
  
  if (data.isEnabled !== undefined) {
    updateData.isEnabled = data.isEnabled;
  }
  
  const [updated] = await db.update(scheduledRedPackets)
    .set(updateData)
    .where(eq(scheduledRedPackets.id, id))
    .returning();
  
  return updated;
}

// 删除定时红包
export async function deleteScheduledRedPacket(id: number) {
  await db.delete(scheduledRedPackets).where(eq(scheduledRedPackets.id, id));
  return { success: true };
}

// 执行定时红包发送
export async function executeScheduledRedPackets() {
  // 获取当前北京时间 HH:mm
  // 服务器已设置为 Asia/Shanghai 时区，直接使用本地时间
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  
  // 查找所有启用的定时红包
  const allSchedules = await db.select().from(scheduledRedPackets)
    .where(eq(scheduledRedPackets.isEnabled, true));
  
  // 过滤匹配当前时间的定时红包
  const schedules = allSchedules.filter(s => s.scheduledTime === currentTime);
  
  // 调试日志：每5分钟输出一次当前时间和待执行的定时红包
  if (now.getMinutes() % 5 === 0) {
    console.log(`[定时红包] 当前北京时间: ${currentTime}, 今日: ${today}, 启用的定时红包数: ${allSchedules.length}, 匹配当前时间的: ${schedules.length}`);
    if (allSchedules.length > 0) {
      console.log(`[定时红包] 定时红包列表: ${allSchedules.map(s => `群组${s.groupId}@${s.scheduledTime}`).join(', ')}`);
    }
  }
  
  const results = [];
  
  for (const schedule of schedules) {
    // 检查今天是否已执行过
    if (schedule.lastExecutedAt) {
      const lastExecutedDate = new Date(schedule.lastExecutedAt);
      // 数据库存储的是北京时间，但Drizzle可能将其解释为UTC
      // 使用UTC方法获取日期组件，因为数据库存储的值就是我们想要的北京时间
      const lastExecutedDay = `${lastExecutedDate.getUTCFullYear()}-${(lastExecutedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${lastExecutedDate.getUTCDate().toString().padStart(2, '0')}`;
      
      console.log(`[定时红包] 检查执行记录: lastExecutedAt=${schedule.lastExecutedAt}, lastExecutedDay=${lastExecutedDay}, today=${today}`);
      
      if (lastExecutedDay === today) {
        // 今天已执行过，跳过
        console.log(`[定时红包] 群组 ${schedule.groupId} 今天已执行过，跳过`);
        continue;
      }
    }
    
    try {
      // 发送红包
      const packets = await createMultipleRedPackets(
        schedule.groupId,
        parseFloat(schedule.amountPerPacket as string),
        schedule.claimCountPerPacket,
        schedule.packetCount,
        schedule.greeting || "恭喜发财，大吉大利",
        schedule.createdBy || 1
      );
      
      // 更新最后执行时间
      await db.update(scheduledRedPackets)
        .set({ lastExecutedAt: new Date() })
        .where(eq(scheduledRedPackets.id, schedule.id));
      
      results.push({
        scheduleId: schedule.id,
        groupId: schedule.groupId,
        packetsCreated: packets.length,
        success: true,
      });
      
      console.log(`[定时红包] 群组 ${schedule.groupId} 发送 ${packets.length} 个红包成功`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[定时红包] 群组 ${schedule.groupId} 发送失败:`, errorMessage);
      results.push({
        scheduleId: schedule.id,
        groupId: schedule.groupId,
        success: false,
        error: errorMessage,
      });
    }
  }
  
  return results;
}
