import { db } from "../db";
import { orders, orderItems, cartItems, products, productVariants, userCoupons, coupons, stores } from "@shared/schema";
import { eq, inArray, and, isNull, sql } from "drizzle-orm";

// Helper to transform keys to snake_case for frontend compatibility
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

export async function createOrder(userId: number, data: any) {
  return await db.transaction(async (tx) => {
    // 1. Calculate totals and validate items
    const { items, address, couponId, paymentMethod, notes, storeId } = data;
    
    if (!items || items.length === 0) {
      throw new Error("购物车为空");
    }

    let subtotal = 0;
    const orderItemsData = [];
    const cartItemIds = [];

    for (const item of items) {
      // If coming from cart, we might have cart item id
      if (item.id) {
        cartItemIds.push(item.id);
      }

      // Fetch product and variant details to ensure price accuracy
      const product = await tx.query.products.findFirst({
        where: eq(products.id, item.product_id),
      });

      if (!product) {
        throw new Error(`商品 ID ${item.product_id} 不存在`);
      }

      // Stock check
      let availableStock = product.stock || 0;
      let price = Number(product.basePrice);
      let variantName = "";
      let sku = "";
      let image = product.mainImage;

      if (item.variant_id) {
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variant_id),
        });
        if (variant) {
          availableStock = variant.stock || 0;
          price += Number(variant.priceAdjustment);
          variantName = variant.name;
          sku = variant.sku || "";
          if (variant.image) image = variant.image;
          
          // Deduct variant stock
          if (availableStock < item.quantity) {
             throw new Error(`商品 ${product.name} (${variantName}) 库存不足`);
          }
          await tx.update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(eq(productVariants.id, item.variant_id));
        }
      } else {
        // Deduct product stock
        if (availableStock < item.quantity) {
            throw new Error(`商品 ${product.name} 库存不足`);
        }
        await tx.update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, item.product_id));
      }

      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        storeId: item.store_id || storeId, // Support multi-store or single store per order
        productId: item.product_id,
        variantId: item.variant_id,
        productSnapshot: JSON.stringify({
          name: product.name,
          image: image,
          sku: sku,
          attributes: variantName ? { variant: variantName } : {},
        }),
        quantity: item.quantity,
        unitPrice: price.toFixed(2),
        subtotal: itemSubtotal.toFixed(2),
        status: 'pending',
      });
    }

    // 2. Calculate shipping and discounts
    // Simplified shipping rule: Free shipping over 299, else 15
    const shippingFee = subtotal >= 299 ? 0 : 15;
    
    let discountAmount = 0;
    let finalCouponId = null;

    if (couponId) {
       // Check coupon logic
       // Assuming couponId passed is user_coupons.id
       const userCoupon = await tx.query.userCoupons.findFirst({
         where: and(
           eq(userCoupons.id, couponId),
           eq(userCoupons.userId, userId),
           isNull(userCoupons.usedAt)
         )
       });

       if (!userCoupon) {
         throw new Error("优惠券无效或已使用");
       }

       const coupon = await tx.query.coupons.findFirst({
         where: eq(coupons.id, userCoupon.couponId)
       });

       if (!coupon || !coupon.isActive) {
         throw new Error("优惠券已失效");
       }

       const now = new Date();
       if (now < coupon.startsAt || now > coupon.expiresAt) {
         throw new Error("优惠券不在有效期内");
       }

       if (subtotal < Number(coupon.minOrderAmount)) {
         throw new Error(`订单金额未满足优惠券使用条件 (需满 ${coupon.minOrderAmount})`);
       }

       if (coupon.discountType === 'fixed') {
         discountAmount = Number(coupon.discountValue);
       } else if (coupon.discountType === 'percentage') {
         // discountValue is percentage (e.g. 10 for 10% off? or 0.1? Usually 80 for 80% price (20% off) or 20 for 20% off)
         // Let's assume discountValue is the discount percentage amount (e.g. 20 means 20% off)
         discountAmount = subtotal * (Number(coupon.discountValue) / 100);
         if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
           discountAmount = Number(coupon.maxDiscountAmount);
         }
       }

       finalCouponId = coupon.id; // Store the actual coupon definition ID in orders table? Or user_coupon id? 
       // Schema orders.couponId refers to... usually the coupon definition or the specific usage.
       // Let's store userCoupon.id (the specific usage) in orders table if we want to track which ticket.
       // But orders table definition says couponId is integer.
       // Let's store userCoupon.id in orders.couponId for traceability.
       finalCouponId = userCoupon.id; 
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    // 3. Create Order
    // Generate simple order number: YYYYMMDDHHMMSS + Random
    const orderNo = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14) + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    const [newOrder] = await tx.insert(orders).values({
      userId,
      storeId: storeId || orderItemsData[0].storeId, // Assuming single store order for now
      orderNo,
      type: 'shop',
      amount: totalAmount.toFixed(2),
      subtotalAmount: subtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      status: 'pending_payment',
      paymentMethod,
      shippingAddress: JSON.stringify(address),
      notes,
      couponId: finalCouponId,
    }).returning();

    // 4. Create Order Items
    if (orderItemsData.length > 0) {
      await tx.insert(orderItems).values(
        orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id,
        }))
      );
    }

    // 5. Update User Coupon Status if used
    if (finalCouponId) {
      await tx.update(userCoupons)
        .set({ usedAt: new Date(), orderId: newOrder.id })
        .where(eq(userCoupons.id, finalCouponId));
    }

    // 6. Clear Cart Items if they were from cart
    if (cartItemIds.length > 0) {
      await tx.delete(cartItems).where(inArray(cartItems.id, cartItemIds));
    }
    
    return toSnakeCase(newOrder);
  });
}

export async function payOrder(userId: number, orderId: number) {
  return await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId))
    });

    if (!order) throw new Error("订单不存在");
    if (order.status !== 'pending_payment') throw new Error("订单状态不正确");

    // Mock payment success
    const [updatedOrder] = await tx.update(orders)
      .set({ 
        status: 'pending_shipment',
        paidAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    return toSnakeCase(updatedOrder);
  });
}

export async function shipOrder(orderId: number, logisticsInfo: { company: string, trackingNo: string }) {
  // Usually admin/seller operation, but allowing here for demo/testing
  const [updatedOrder] = await db.update(orders)
    .set({
      status: 'shipped',
      shippedAt: new Date(),
      logisticsCompany: logisticsInfo.company,
      logisticsTrackingNo: logisticsInfo.trackingNo
    })
    .where(eq(orders.id, orderId))
    .returning();
    
  return toSnakeCase(updatedOrder);
}

export async function confirmReceipt(userId: number, orderId: number) {
  return await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId))
    });

    if (!order) throw new Error("订单不存在");
    // Allow confirming receipt if shipped
    if (order.status !== 'shipped') throw new Error("订单尚未发货或已完成");

    const [updatedOrder] = await tx.update(orders)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    return toSnakeCase(updatedOrder);
  });
}

export async function cancelOrder(userId: number, orderId: number) {
  return await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId))
    });

    if (!order) throw new Error("订单不存在");
    if (order.status !== 'pending_payment' && order.status !== 'pending_shipment') {
        throw new Error("订单当前状态无法取消");
    }

    const [updatedOrder] = await tx.update(orders)
      .set({
        status: 'cancelled',
        cancelledAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Restore stock
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
        if (item.variantId) {
            await tx.update(productVariants)
                .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
                .where(eq(productVariants.id, item.variantId));
        } else {
            await tx.update(products)
                .set({ stock: sql`${products.stock} + ${item.quantity}` })
                .where(eq(products.id, item.productId));
        }
    }
    
    // Restore coupon if used
    if (order.couponId) {
         await tx.update(userCoupons)
            .set({ usedAt: null, orderId: null })
            .where(eq(userCoupons.id, order.couponId));
    }

    return toSnakeCase(updatedOrder);
  });
}


export async function getOrderList(userId: number, status?: string) {
  const whereConditions = [eq(orders.userId, userId)];
  if (status && status !== 'all') {
    whereConditions.push(eq(orders.status, status));
  }

  const userOrders = await db.query.orders.findMany({
    where: and(...whereConditions),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
  
  const orderIds = userOrders.map(o => o.id);
  let allItems: any[] = [];
  if (orderIds.length > 0) {
    allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    
    // Fetch stores for these items
    const storeIds = [...new Set(allItems.map(i => i.storeId).filter(Boolean))];
    let allStores: any[] = [];
    if (storeIds.length > 0) {
      allStores = await db.select({
        id: stores.id,
        name: stores.name,
        logo: stores.logo
      }).from(stores).where(inArray(stores.id, storeIds));
    }

    // Attach store info to items
    allItems = allItems.map(item => ({
      ...item,
      stores: allStores.find(s => s.id === item.storeId) || null
    }));
  }

  const result = userOrders.map(order => ({
    ...order,
    order_items: allItems.filter(item => item.orderId === order.id) // Use snake_case key for items
  }));

  return toSnakeCase(result);
}

export async function getOrderDetail(userId: number, orderId: number) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
  });

  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  
  // Fetch stores
  const storeIds = [...new Set(items.map(i => i.storeId).filter(Boolean))];
  let allStores: any[] = [];
  if (storeIds.length > 0) {
    allStores = await db.select({
      id: stores.id,
      name: stores.name,
      logo: stores.logo
    }).from(stores).where(inArray(stores.id, storeIds));
  }

  const itemsWithStores = items.map(item => ({
    ...item,
    stores: allStores.find(s => s.id === item.storeId) || null
  }));
  
  return toSnakeCase({
    ...order,
    order_items: itemsWithStores
  });
}




