
import { db } from "../server/db";
import * as authService from "../server/services/auth";
import * as cartService from "../server/services/cartService";
import * as orderService from "../server/services/orderService";
import { products, stores } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🚀 Starting E-commerce Flow Verification...");

  try {
    // 1. Create/Get User
    const phone = "1380000" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    console.log(`👤 Registering user: ${phone}`);
    const user = await authService.registerWithSms(phone, "123456", "password123");
    const userId = user.user.id;
    console.log(`✅ User created: ID ${userId}`);

    // 2. Get/Create Product & Store
    let store = await db.query.stores.findFirst();
    if (!store) {
      console.log("🏪 Creating test store...");
      const [newStore] = await db.insert(stores).values({
        userId: userId,
        name: "Test Store",
        description: "Test Store Description",
        logo: "https://example.com/logo.png",
        status: "active",
      }).returning();
      store = newStore;
    }
    console.log(`🏪 Store: ${store.name} (ID: ${store.id})`);

    let product = await db.query.products.findFirst({
        where: eq(products.storeId, store.id)
    });
    if (!product) {
      console.log("📦 Creating test product...");
      const [newProduct] = await db.insert(products).values({
        storeId: store.id,
        name: "Test Product",
        description: "Test Description",
        basePrice: "100.00",
        stock: 100,
        status: "active",
        categoryId: 1, // Assuming category 1 exists or is nullable? Schema says integer.
      }).returning();
      product = newProduct;
    }
    console.log(`📦 Product: ${product.name} (ID: ${product.id}, Price: ${product.basePrice})`);

    // 3. Add to Cart
    console.log("🛒 Adding to cart...");
    const cartItem = await cartService.addToCart(userId, {
      productId: product.id,
      storeId: store.id,
      quantity: 1,
      regionCode: "CN",
    });
    console.log(`✅ Cart Item added: ID ${cartItem.id}`);

    // 4. Create Order
    console.log("📝 Creating order...");
    const address = {
      name: "Test Buyer",
      phone: "13800000000",
      province: "Beijing",
      city: "Beijing",
      district: "Chaoyang",
      address: "Test Address 123",
      postal_code: "100000"
    };

    // Fetch cart again to simulate frontend passing items
    const cart = await cartService.getCart(userId);
    
    const order = await orderService.createOrder(userId, {
      items: cart,
      address,
      paymentMethod: "wechat",
      storeId: store.id,
    });
    console.log(`✅ Order created: ${order.order_no} (ID: ${order.id}, Status: ${order.status})`);

    // 5. Pay Order
    console.log("💰 Paying order...");
    const paidOrder = await orderService.payOrder(userId, order.id);
    console.log(`✅ Order Paid: Status ${paidOrder.status}`);

    // 6. Ship Order (Admin)
    console.log("🚚 Shipping order...");
    const shippedOrder = await orderService.shipOrder(order.id, {
      company: "SF Express",
      trackingNo: "SF1234567890"
    });
    console.log(`✅ Order Shipped: Status ${shippedOrder.status}`);

    // 7. Confirm Receipt
    console.log("📦 Confirming receipt...");
    const completedOrder = await orderService.confirmReceipt(userId, order.id);
    console.log(`✅ Order Completed: Status ${completedOrder.status}`);

    console.log("🎉 All verification steps passed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main();
