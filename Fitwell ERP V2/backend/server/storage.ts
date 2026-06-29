import {
  products,
  parties,
  production,
  salesOrders,
  salesOrderItems,
  stockAdjustments,
  users,
  type Product,
  type InsertProduct,
  type Party,
  type InsertParty,
  type Production,
  type InsertProduction,
  type ProductionWithProduct,
  type SalesOrder,
  type InsertSalesOrder,
  type SalesOrderWithParty,
  type SalesOrderWithItems,
  type SalesOrderItem,
  type InsertSalesOrderItem,
  type StockAdjustment,
  type InsertStockAdjustment,
  type InventoryItem,
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, like, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth integration
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Parties
  getParties(): Promise<Party[]>;
  getParty(id: number): Promise<Party | undefined>;
  createParty(party: InsertParty): Promise<Party>;
  updateParty(id: number, party: Partial<InsertParty>): Promise<Party>;
  deleteParty(id: number): Promise<void>;

  // Production
  getProduction(): Promise<ProductionWithProduct[]>;
  getProductionRecord(id: number): Promise<ProductionWithProduct | undefined>;
  createProductionRecord(production: InsertProduction): Promise<Production>;
  updateProductionRecord(
    id: number,
    production: Partial<InsertProduction>
  ): Promise<Production>;
  deleteProductionRecord(id: number): Promise<void>;

  // Sales Orders
  getSalesOrders(): Promise<SalesOrderWithParty[]>;
  getSalesOrder(id: number): Promise<SalesOrderWithItems | undefined>;
  createSalesOrder(
    salesOrder: InsertSalesOrder,
    items: InsertSalesOrderItem[]
  ): Promise<SalesOrder>;
  updateSalesOrderStatus(id: number, status: string): Promise<SalesOrder>;
  fulfillSalesOrderItems(
    orderId: number,
    fulfillments: { itemId: number; quantity: number }[]
  ): Promise<void>;
  deleteSalesOrder(id: number): Promise<void>;
  cancelInvoice(id: number): Promise<SalesOrder>;

  // Stock Adjustments
  getStockAdjustments(): Promise<StockAdjustment[]>;
  createStockAdjustment(
    adjustment: InsertStockAdjustment
  ): Promise<StockAdjustment>;

  // Inventory
  getInventory(): Promise<InventoryItem[]>;

  // Dashboard
  getDashboardMetrics(): Promise<{
    todayProduction: number;
    yesterdayProduction: number;
    pendingOrders: number;
    urgentOrders: number;
    lowStockItems: number;
    monthlyExpense: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations - Required for Replit Auth integration
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(
    id: number,
    product: Partial<InsertProduct>
  ): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    // Check if product has related records
    const [productionCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(production)
      .where(eq(production.productId, id));

    const [salesCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(salesOrderItems)
      .where(eq(salesOrderItems.productId, id));

    const [adjustmentCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockAdjustments)
      .where(eq(stockAdjustments.productId, id));

    const totalRelated =
      Number(productionCount.count) +
      Number(salesCount.count) +
      Number(adjustmentCount.count);

    if (totalRelated > 0) {
      throw new Error(
        `Cannot delete product. It has ${totalRelated} related records (production, sales, or stock adjustments). Please remove those records first.`
      );
    }

    await db.delete(products).where(eq(products.id, id));
  }

  async getParties(): Promise<Party[]> {
    return await db.select().from(parties).orderBy(desc(parties.createdAt));
  }

  async getParty(id: number): Promise<Party | undefined> {
    const [party] = await db.select().from(parties).where(eq(parties.id, id));
    return party || undefined;
  }

  async createParty(party: InsertParty): Promise<Party> {
    const [newParty] = await db.insert(parties).values(party).returning();
    return newParty;
  }

  async updateParty(id: number, party: Partial<InsertParty>): Promise<Party> {
    const [updatedParty] = await db
      .update(parties)
      .set(party)
      .where(eq(parties.id, id))
      .returning();
    return updatedParty;
  }

  async deleteParty(id: number): Promise<void> {
    // Check if party has related sales orders
    const [salesOrderCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(salesOrders)
      .where(eq(salesOrders.partyId, id));

    const totalRelated = Number(salesOrderCount.count);

    if (totalRelated > 0) {
      throw new Error(
        `Cannot delete party. It has ${totalRelated} related sales orders. Please remove those orders first.`
      );
    }

    await db.delete(parties).where(eq(parties.id, id));
  }

  async getProduction(): Promise<ProductionWithProduct[]> {
    return await db
      .select()
      .from(production)
      .leftJoin(products, eq(production.productId, products.id))
      .orderBy(desc(production.createdAt))
      .then((rows) =>
        rows.map((row) => ({
          ...row.production,
          product: row.products ?? null,
        }))
      );
  }

  async getProductionRecord(
    id: number
  ): Promise<ProductionWithProduct | undefined> {
    const rows = await db
      .select()
      .from(production)
      .leftJoin(products, eq(production.productId, products.id))
      .where(eq(production.id, id));

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      ...row.production,
      product: row.products!,
    };
  }

  async createProductionRecord(
    productionData: InsertProduction
  ): Promise<Production> {
    // Get product to calculate pieces
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productionData.productId));
    if (!product) throw new Error("Product not found");

    // Use override weight if provided, otherwise use product master weight
    const weightGrams = productionData.weightGramsOverride || product.weightGrams;
    const pieces = Math.floor(
      (parseFloat(productionData.quantityKg) * 1000) /
        parseFloat(weightGrams)
    );

    const [newProduction] = await db
      .insert(production)
      .values({
        ...productionData,
        pieces,
      })
      .returning();

    return newProduction;
  }

  async updateProductionRecord(
    id: number,
    productionData: Partial<InsertProduction>
  ): Promise<Production> {
    let updateData: Partial<InsertProduction> & { pieces?: number } = {
      ...productionData,
    };

    // Recalculate pieces if quantity, product, or weight override changed
    if (productionData.quantityKg || productionData.productId || productionData.weightGramsOverride !== undefined) {
      const [existingRecord] = await db
        .select()
        .from(production)
        .where(eq(production.id, id));
      const productId = productionData.productId || existingRecord.productId;
      const quantityKg = productionData.quantityKg || existingRecord.quantityKg;
      const weightGramsOverride = productionData.weightGramsOverride !== undefined 
        ? productionData.weightGramsOverride 
        : existingRecord.weightGramsOverride;

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));
      if (product) {
        // Use override weight if provided, otherwise use product master weight
        const weightGrams = weightGramsOverride || product.weightGrams;
        const pieces = Math.floor(
          (parseFloat(quantityKg) * 1000) / parseFloat(weightGrams)
        );
        updateData = { ...updateData, pieces };
      }
    }

    const [updatedProduction] = await db
      .update(production)
      .set(updateData)
      .where(eq(production.id, id))
      .returning();

    return updatedProduction;
  }

  async deleteProductionRecord(id: number): Promise<void> {
    await db.delete(production).where(eq(production.id, id));
  }

  async getSalesOrders(): Promise<SalesOrderWithParty[]> {
    return await db
      .select()
      .from(salesOrders)
      .leftJoin(parties, eq(salesOrders.partyId, parties.id))
      .orderBy(desc(salesOrders.createdAt))
      .then((rows) =>
        rows.map((row) => ({
          ...row.sales_orders,
          party: row.parties ?? null,
        }))
      );
  }

  async getSalesOrder(id: number): Promise<SalesOrderWithItems | undefined> {
    const orderRows = await db
      .select()
      .from(salesOrders)
      .leftJoin(parties, eq(salesOrders.partyId, parties.id))
      .where(eq(salesOrders.id, id));

    if (orderRows.length === 0) return undefined;

    const itemRows = await db
      .select()
      .from(salesOrderItems)
      .leftJoin(products, eq(salesOrderItems.productId, products.id))
      .where(eq(salesOrderItems.salesOrderId, id));

    const orderRow = orderRows[0];
    return {
      ...orderRow.sales_orders,
      party: orderRow.parties!,
      items: itemRows.map((row) => ({
        ...row.sales_order_items,
        product: row.products!,
      })),
    };
  }

  async createSalesOrder(
    salesOrderData: InsertSalesOrder,
    items: InsertSalesOrderItem[]
  ): Promise<SalesOrder> {
    const [newOrder] = await db
      .insert(salesOrders)
      .values({
        ...salesOrderData,
        itemCount: items.length,
      })
      .returning();

    await db.insert(salesOrderItems).values(
      items.map((item) => ({
        ...item,
        salesOrderId: newOrder.id,
      }))
    );

    return newOrder;
  }

  async updateSalesOrderStatus(
    id: number,
    status: "pending" | "partial_invoice" | "fully_invoiced" | "cancelled"
  ): Promise<SalesOrder> {
    const [updatedOrder] = await db
      .update(salesOrders)
      .set({ status })
      .where(eq(salesOrders.id, id))
      .returning();

    return updatedOrder;
  }

  async fulfillSalesOrderItems(
    orderId: number,
    fulfillments: { itemId: number; quantity: number }[]
  ): Promise<void> {
    for (const fulfillment of fulfillments) {
      // Get current order item details
      const [orderItem] = await db
        .select()
        .from(salesOrderItems)
        .where(eq(salesOrderItems.id, fulfillment.itemId));

      if (!orderItem) {
        throw new Error(`Order item ${fulfillment.itemId} not found`);
      }

      // Calculate remaining quantity that can be fulfilled
      const remainingToFulfill = orderItem.quantity - orderItem.fulfilled;
      if (fulfillment.quantity > remainingToFulfill) {
        throw new Error(
          `Cannot fulfill ${fulfillment.quantity} pieces. Only ${remainingToFulfill} pieces remaining to fulfill.`
        );
      }

      // Get current inventory for this product
      const inventory = await this.getInventory();
      const productInventory = inventory.find(
        (item) => item.id === orderItem.productId
      );

      if (
        !productInventory ||
        productInventory.currentStock < fulfillment.quantity
      ) {
        const availableStock = productInventory?.currentStock || 0;
        throw new Error(
          `Insufficient stock. Available: ${availableStock} pieces, requested: ${fulfillment.quantity} pieces.`
        );
      }

      // Only fulfill if validation passes
      await db
        .update(salesOrderItems)
        .set({
          fulfilled: sql`${salesOrderItems.fulfilled} + ${fulfillment.quantity}`,
        })
        .where(eq(salesOrderItems.id, fulfillment.itemId));
    }

    // Update order status based on fulfillment
    const items = await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, orderId));

    const allFulfilled = items.every((item) => item.fulfilled >= item.quantity);
    const anyFulfilled = items.some((item) => item.fulfilled > 0);

    let newStatus:
      | "pending"
      | "partial_invoice"
      | "fully_invoiced"
      | "cancelled" = "pending";
    if (allFulfilled) {
      newStatus = "fully_invoiced";
    } else if (anyFulfilled) {
      newStatus = "partial_invoice";
    }

    await this.updateSalesOrderStatus(orderId, newStatus);
  }

  async deleteSalesOrder(id: number): Promise<void> {
    // Note: This deletion does NOT add stock back to inventory as per requirements
    // First delete related sales order items
    await db
      .delete(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, id));
    // Then delete the sales order
    await db.delete(salesOrders).where(eq(salesOrders.id, id));
  }

  async cancelInvoice(id: number): Promise<SalesOrder> {
    return await this.updateSalesOrderStatus(id, "cancelled");
  }

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return await db
      .select()
      .from(stockAdjustments)
      .orderBy(desc(stockAdjustments.createdAt));
  }

  async createStockAdjustment(
    adjustment: InsertStockAdjustment
  ): Promise<StockAdjustment> {
    const [newAdjustment] = await db
      .insert(stockAdjustments)
      .values(adjustment)
      .returning();
    return newAdjustment;
  }

  async getInventory(): Promise<InventoryItem[]> {
    const productsData = await db.select().from(products);

    const inventory: InventoryItem[] = [];

    for (const product of productsData) {
      // Get total production
      const productionResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${production.pieces}), 0)` })
        .from(production)
        .where(eq(production.productId, product.id));

      const totalProduced = Number(productionResult[0]?.total || 0);

      // Get total sold (fulfilled)
      const salesResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${salesOrderItems.fulfilled}), 0)`,
        })
        .from(salesOrderItems)
        .where(eq(salesOrderItems.productId, product.id));

      const totalSold = Number(salesResult[0]?.total || 0);

      // Get stock adjustments
      const adjustmentsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${stockAdjustments.quantity}), 0)`,
        })
        .from(stockAdjustments)
        .where(eq(stockAdjustments.productId, product.id));

      const adjustments = Number(adjustmentsResult[0]?.total || 0);

      const currentStock = totalProduced - totalSold + adjustments;

      inventory.push({
        ...product,
        currentStock,
        totalProduced,
        totalSold,
        adjustments,
      });
    }

    return inventory;
  }

  async getDashboardMetrics(): Promise<{
    todayProduction: number;
    yesterdayProduction: number;
    pendingOrders: number;
    partialOrders: number;
    urgentOrders: number;
    lowStockItems: number;
    monthlyExpense: number;
  }> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    
    const endOfLastWeek = new Date(endOfWeek);
    endOfLastWeek.setDate(endOfWeek.getDate() - 7);
    
    const thisWeekStart = startOfWeek.toISOString().split("T")[0];
    const thisWeekEnd = endOfWeek.toISOString().split("T")[0];
    const lastWeekStart = startOfLastWeek.toISOString().split("T")[0];
    const lastWeekEnd = endOfLastWeek.toISOString().split("T")[0];
    
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Weekly production (current week)
    const weeklyProductionResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${production.pieces}), 0)` })
      .from(production)
      .where(
        and(
          gte(production.date, thisWeekStart),
          lte(production.date, thisWeekEnd)
        )
      );

    const todayProduction = Number(weeklyProductionResult[0]?.total || 0);

    // Previous week's production
    const lastWeekProductionResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${production.pieces}), 0)` })
      .from(production)
      .where(
        and(
          gte(production.date, lastWeekStart),
          lte(production.date, lastWeekEnd)
        )
      );

    const yesterdayProduction = Number(
      lastWeekProductionResult[0]?.total || 0
    );

    // Pending orders
    const pendingOrdersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(salesOrders)
      .where(eq(salesOrders.status, "pending"));

    const pendingOrders = Number(pendingOrdersResult[0]?.count || 0);

    // Partial orders (partial_invoice status)
    const partialOrdersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(salesOrders)
      .where(eq(salesOrders.status, "partial_invoice"));

    const partialOrders = Number(partialOrdersResult[0]?.count || 0);

    // Urgent orders (pending orders from more than 7 days ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const urgentOrdersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.status, "pending"),
          sql`${salesOrders.date} <= ${sevenDaysAgo}`
        )
      );

    const urgentOrders = Number(urgentOrdersResult[0]?.count || 0);

    // Low stock items (less than 50 pieces)
    const inventory = await this.getInventory();
    const lowStockItems = inventory.filter(
      (item) => item.currentStock < 50
    ).length;

    // Monthly expenses (material costs from production)
    const monthlyProductionResult = await db
      .select({
        quantityKg: production.quantityKg,
        rawMaterialPricePerKg: products.rawMaterialPricePerKg,
      })
      .from(production)
      .innerJoin(products, eq(production.productId, products.id))
      .where(like(production.date, `${thisMonth}%`));

    const monthlyExpense = monthlyProductionResult.reduce((total, record) => {
      const cost =
        parseFloat(record.quantityKg) *
        parseFloat(record.rawMaterialPricePerKg);
      return total + cost;
    }, 0);

    return {
      todayProduction,
      yesterdayProduction,
      pendingOrders,
      partialOrders,
      urgentOrders,
      lowStockItems,
      monthlyExpense,
    };
  }
}

export const storage = new DatabaseStorage();
