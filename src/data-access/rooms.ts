import { db } from "@/db";
import { Room, room,roomCount } from "@/db/schema";
import { eq } from "drizzle-orm";
import {sql} from "drizzle-orm"
import { getSession } from "@/lib/auth";

export async function getRooms(search: string | undefined) {
  const where = search ? sql`${room.tags} ILIKE ${`%${search}%`}` : undefined;
  const rooms = await db.query.room.findMany({
    where
  });
  return rooms;
}

export async function getUserRooms() {
  const session = await getSession();
  if (!session) {
    throw new Error("User not authenticated");
  }
  const rooms = await db.query.room.findMany({
    where: eq(room.userId, session.user.id),
  });

  return rooms;
}

export async function getRoom(roomId: string) {
  return await db.query.room.findFirst({
    where: eq(room.id, roomId),
  });
}

export async function deleteRoom(roomId: string) {
  await db.delete(room).where(eq(room.id, roomId));
  await db.delete(roomCount).where(eq(roomCount.roomId,roomId));
}

export async function createRoom(
  roomData: Omit<Room, "id" | "userId">,
  userId: string
) {
  const inserted = await db
    .insert(room)
    .values({ ...roomData, userId })
    .returning();
  return inserted[0];
}

export async function editRoom(roomData: Room) {
  const updated = await db
    .update(room)
    .set(roomData)
    .where(eq(room.id, roomData.id))
    .returning();
  return updated[0];
}

export async function getRoomCount(roomId:string){
  const roomC = await db.query.roomCount.findFirst({
    where: eq(roomCount.roomId, roomId)
  })
  if(!roomC) return ;
  return roomC?.count
}
export async function increaseRoomCount(roomId:string) {
  let count=<number> await getRoomCount(roomId)
  if(count===0){
    await db.insert(roomCount).values({roomId,count:1})
    return;
  }
  count++;
  await db.update(roomCount).set({count}).where(eq(roomCount.roomId,roomId));
}

export async function decreaseRoomCount(roomId:string){
  let count=<number> await getRoomCount(roomId)
  if(count===1){
    await db.delete(roomCount).where(eq(roomCount.roomId,roomId))
    return;
  }
  count--;
  await db.update(roomCount).set({count}).where(eq(roomCount.roomId,roomId))
}