import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { 
  cartItems, 
  products, 
  productVariants, 
  stores 
} from "../../shared/schema";

function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

export async function getCart(userId: number) {
  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    with: {
      product: true,
      variant: true,
      store: true,
    },
    orderBy: [desc(cartItems.createdAt)],
  });
  
  return toSnakeCase(items);
}

export async function addToCart(userId: number, data: { 
  productId: number; 
  variantId?: number; 
  quantity: number; 
  storeId?: number 
}) {
  const { productId, variantId, quantity, storeId } = data;

  // Check if item already exists in cart
  const existingItem = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.userId, userId),
      eq(cartItems.productId, productId),
      variantId ? eq(cartItems.variantId, variantId) : undefined
    ),
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    const [updated] = await db.update(cartItems)
      .set({ quantity: newQuantity })
      .where(eq(cartItems.id, existingItem.id))
      .returning();
    return toSnakeCase(updated);
  } else {
    // If storeId is not provided, try to find it from product
    let finalStoreId = storeId;
    if (!finalStoreId) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: { storeId: true }
      });
      if (product) finalStoreId = product.storeId;
    }

    const [newItem] = await db.insert(cartItems)
      .values({
        userId,
        productId,
        variantId,
        quantity,
        storeId: finalStoreId,
        checked: true,
      })
      .returning();
    return toSnakeCase(newItem);
  }
}

export async function updateCartItem(userId: number, itemId: number, updates: { quantity?: number; checked?: boolean }) {
  const [updated] = await db.update(cartItems)
    .set(updates)
    .where(and(
      eq(cartItems.id, itemId),
      eq(cartItems.userId, userId)
    ))
    .returning();
  
  if (!updated) {
    throw new Error("购物车商品不存在或无权修改");
  }
  
  return toSnakeCase(updated);
}

export async function removeFromCart(userId: number, itemId: number) {
  const [deleted] = await db.delete(cartItems)
    .where(and(
      eq(cartItems.id, itemId),
      eq(cartItems.userId, userId)
    ))
    .returning();
    
  return toSnakeCase(deleted);
}

export async function clearCart(userId: number) {
  const deleted = await db.delete(cartItems)
    .where(eq(cartItems.userId, userId))
    .returning();
    
  return toSnakeCase(deleted);
}
