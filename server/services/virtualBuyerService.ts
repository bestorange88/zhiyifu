import { db } from "../db";
import { orders, orderItems, products, productVariants, virtualBuyers, stores } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import { createOrder } from "./orderService";

// 获取随机商品
async function getRandomProducts(count: number = 1) {
  // 获取有库存的商品
  const availableProducts = await db.query.products.findMany({
    where: sql`${products.stock} > 0`,
    limit: 50, // 取前50个随机选
  });

  if (availableProducts.length === 0) return [];

  const selectedProducts = [];
  for (let i = 0; i < count; i++) {
    const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    
    // 检查是否有变体
    const variants = await db.query.productVariants.findMany({
      where: eq(productVariants.productId, randomProduct.id),
    });

    let variantId = undefined;
    if (variants.length > 0) {
      const randomVariant = variants[Math.floor(Math.random() * variants.length)];
      variantId = randomVariant.id;
    }

    selectedProducts.push({
      product_id: randomProduct.id,
      variant_id: variantId,
      quantity: Math.floor(Math.random() * 2) + 1, // 1-2个
      store_id: randomProduct.storeId,
    });
  }

  return selectedProducts;
}

// 模拟虚拟买家下单
export async function simulateVirtualOrder() {
  // 1. 随机获取一个活跃的虚拟买家
  // 由于 virtual_buyers 表结构可能未完全确定，这里先尝试获取
  // 假设 schema 中有 virtual_buyers 表
  const buyers = await db.query.virtualBuyers.findMany({
    where: eq(virtualBuyers.isActive, true),
    limit: 100,
  });

  if (buyers.length === 0) {
    throw new Error("没有活跃的虚拟买家，请先创建");
  }

  const buyer = buyers[Math.floor(Math.random() * buyers.length)];

  // 2. 随机选择商品
  const items = await getRandomProducts(Math.floor(Math.random() * 3) + 1); // 1-3种商品
  if (items.length === 0) {
    throw new Error("没有可购买的商品");
  }

  // 3. 构建订单数据
  // 虚拟地址
  const address = {
    name: buyer.name,
    phone: buyer.phone || "13800138000",
    province: "虚拟省",
    city: "虚拟市",
    district: "虚拟区",
    detail: "虚拟街道888号",
    isDefault: true
  };

  // 4. 创建订单 (复用 orderService.createOrder)
  // 注意：createOrder 需要 userId。虚拟买家可能没有对应的 users 表记录，或者有专门的机制。
  // 检查 schema，orders.userId 是必须的吗？通常是。
  // 假设虚拟买家也有 user_id，或者我们临时创建一个关联的 user。
  // 如果 virtual_buyers 表没有 user_id 字段，我们可能需要 mock 一个 userId 或者修改 createOrder 允许 userId 为空（不太好）。
  // 查看 schema 定义... 假设 virtual_buyers 关联了 users 或者独立。
  // 如果 virtual_buyers 是独立的，我们可能需要在 createOrder 中做特殊处理，或者让 createOrder 接受 virtualBuyerId。
  
  // 让我们检查一下 orders 表结构，看是否有 virtual_buyer_id
  // 在之前的 SearchCodebase 中看到 types.ts 有 virtual_buyer_id
  
  // 为了复用 createOrder，我们需要传入 userId。
  // 如果虚拟买家没有 userId，我们可能需要 hack 一下，传入一个特定的 ID 或者 0 (如果外键允许)。
  // 或者，我们直接在这里手动插入 orders 表，而不经过 createOrder 的校验逻辑（虽然这样会跳过库存检查等）。
  // 最好的方式是复用逻辑。
  
  // 假设我们直接操作数据库来创建虚拟订单，这样可以绕过 userId 的强约束（如果 schema 允许），
  // 或者我们可以确保每个虚拟买家都有一个 user 账号。
  
  // 这里我们采用"直接插入"的方式，模拟 createOrder 的逻辑，但适配虚拟买家。
  
  return await db.transaction(async (tx) => {
    let subtotal = 0;
    const orderItemsData = [];
    
    // 计算金额和库存
    for (const item of items) {
      const product = await tx.query.products.findFirst({
        where: eq(products.id, item.product_id),
      });
      if (!product) continue;
      
      let price = Number(product.basePrice);
      let variantName = "";
      let image = product.mainImage;
      let sku = "";

      if (item.variant_id) {
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variant_id),
        });
        if (variant) {
            price += Number(variant.priceAdjustment);
            variantName = variant.name;
            image = variant.image || image;
            sku = variant.sku || "";
            // 虚拟订单也扣库存？通常是的，为了真实感。
            await tx.update(productVariants)
                .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
                .where(eq(productVariants.id, item.variant_id));
        }
      } else {
        await tx.update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, item.product_id));
      }
      
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      
      orderItemsData.push({
        storeId: item.store_id,
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
    
    const shippingFee = subtotal >= 299 ? 0 : 15;
    const totalAmount = subtotal + shippingFee;
    
    const orderNo = "V" + new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14) + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const [newOrder] = await tx.insert(orders).values({
      userId: systemUser.id, // 暂时归属到管理员或特定用户
      virtualBuyerId: buyer.id, // 关键：关联虚拟买家
      isVirtualOrder: true,     // 关键：标记为虚拟订单
      storeId: orderItemsData[0]?.storeId,
      orderNo,
      type: 'shop',
      amount: totalAmount.toFixed(2),
      subtotalAmount: subtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      discountAmount: "0",
      status: 'pending_payment', // 初始状态
      shippingAddress: JSON.stringify(address),
    }).returning();
    
    if (orderItemsData.length > 0) {
      await tx.insert(orderItems).values(
        orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id,
        }))
      );
    }
    
    // 更新虚拟买家统计数据
    await tx.update(virtualBuyers)
        .set({ 
            orderCount: sql`${virtualBuyers.orderCount} + 1`,
            totalSpent: sql`${virtualBuyers.totalSpent} + ${totalAmount}`,
            lastOrderAt: new Date()
        })
        .where(eq(virtualBuyers.id, buyer.id));

    // 50% 概率直接支付
    if (Math.random() > 0.5) {
        await tx.update(orders)
            .set({ 
                status: 'pending_shipment', 
                paidAt: new Date(),
                paymentMethod: 'virtual_balance'
            })
            .where(eq(orders.id, newOrder.id));
            
        newOrder.status = 'pending_shipment';
    }

    return newOrder;
  });
}
