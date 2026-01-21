import { db } from "../db";
import { chatGroups, groupMembers, groupMessages, users } from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function createGroup(name: string, description?: string, ownerId?: number) {
  const [group] = await db.insert(chatGroups).values({
    name,
    description,
    ownerId,
    isActive: true,
  }).returning();
  return group;
}

export async function updateGroup(groupId: number, data: { name?: string; description?: string; isActive?: boolean }) {
  const [group] = await db.update(chatGroups)
    .set(data)
    .where(eq(chatGroups.id, groupId))
    .returning();
  return group;
}

export async function deleteGroup(groupId: number) {
  const [group] = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId));
  if (!group) {
    throw new Error("群组不存在");
  }
  if (group.isSystem) {
    throw new Error("系统默认群组不可删除");
  }
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  await db.delete(groupMessages).where(eq(groupMessages.groupId, groupId));
  await db.delete(chatGroups).where(eq(chatGroups.id, groupId));
  return { success: true };
}

export async function getGroupList() {
  const groups = await db.select().from(chatGroups).orderBy(desc(chatGroups.createdAt));
  const groupsWithMembers = await Promise.all(
    groups.map(async (group) => {
      const members = await db
        .select({
          id: groupMembers.id,
          userId: groupMembers.userId,
          role: groupMembers.role,
          phone: users.phone,
        })
        .from(groupMembers)
        .leftJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, group.id));
      return { ...group, members };
    })
  );
  return groupsWithMembers;
}

export async function getGroupById(groupId: number) {
  const [group] = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId));
  if (!group) return null;
  
  const members = await db
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
      role: groupMembers.role,
      phone: users.phone,
    })
    .from(groupMembers)
    .leftJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
  
  return { ...group, members };
}

export async function addGroupMember(groupId: number, userId: number, role: string = "member") {
  const existing = await db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  
  if (existing.length > 0) {
    throw new Error("用户已在群组中");
  }
  
  const [member] = await db.insert(groupMembers).values({
    groupId,
    userId,
    role,
  }).returning();
  return member;
}

export async function removeGroupMember(groupId: number, userId: number) {
  await db.delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  return { success: true };
}

export async function setGroupMembers(groupId: number, userIds: number[]) {
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  
  if (userIds.length > 0) {
    await db.insert(groupMembers).values(
      userIds.map(userId => ({ groupId, userId, role: "member" }))
    );
  }
  
  return { success: true };
}

export async function getUserGroups(userId: number) {
  const memberRecords = await db.select()
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  
  if (memberRecords.length === 0) return [];
  
  const groupIds = memberRecords.map(m => m.groupId);
  const groups = await db.select()
    .from(chatGroups)
    .where(and(inArray(chatGroups.id, groupIds), eq(chatGroups.isActive, true)));
  
  return groups;
}

export async function getSystemGroups() {
  const groups = await db.select()
    .from(chatGroups)
    .where(and(eq(chatGroups.isSystem, true), eq(chatGroups.isActive, true)));
  return groups;
}

export async function sendGroupMessage(groupId: number, userId: number, content: string, messageType: string = "text", mediaUrl?: string) {
  const isMember = await db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  
  if (isMember.length === 0) {
    throw new Error("您不是该群组成员");
  }
  
  const [message] = await db.insert(groupMessages).values({
    groupId,
    userId,
    senderType: "user",
    messageType,
    content,
    mediaUrl,
  }).returning();
  
  return message;
}

export async function getGroupMessages(groupId: number, userId: number, limit: number = 50) {
  const isMember = await db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  
  if (isMember.length === 0) {
    throw new Error("您不是该群组成员");
  }
  
  const messages = await db
    .select({
      id: groupMessages.id,
      groupId: groupMessages.groupId,
      userId: groupMessages.userId,
      senderType: groupMessages.senderType,
      senderName: groupMessages.senderName,
      messageType: groupMessages.messageType,
      content: groupMessages.content,
      mediaUrl: groupMessages.mediaUrl,
      createdAt: groupMessages.createdAt,
      phone: users.phone,
    })
    .from(groupMessages)
    .leftJoin(users, eq(groupMessages.userId, users.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit);
  
  return messages.reverse();
}

export async function getAllUsersForGroupSelection() {
  const usersList = await db.select({
    id: users.id,
    phone: users.phone,
    status: users.status,
  }).from(users).where(eq(users.status, "active"));
  return usersList;
}

export async function getAdminGroupMessages(groupId: number, limit: number = 50) {
  const [group] = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId));
  if (!group) {
    throw new Error("群组不存在");
  }

  const messages = await db
    .select({
      id: groupMessages.id,
      groupId: groupMessages.groupId,
      userId: groupMessages.userId,
      senderType: groupMessages.senderType,
      senderName: groupMessages.senderName,
      messageType: groupMessages.messageType,
      content: groupMessages.content,
      mediaUrl: groupMessages.mediaUrl,
      createdAt: groupMessages.createdAt,
      phone: users.phone,
    })
    .from(groupMessages)
    .leftJoin(users, eq(groupMessages.userId, users.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit);
  
  return messages.reverse();
}

export async function sendAdminGroupMessage(groupId: number, adminId: number, content: string, messageType: string = "text", mediaUrl?: string) {
  const [group] = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId));
  if (!group) {
    throw new Error("群组不存在");
  }

  const [message] = await db.insert(groupMessages).values({
    groupId,
    userId: null,
    senderType: "admin",
    senderName: "管理员",
    messageType,
    content,
    mediaUrl,
  }).returning();
  
  return message;
}
