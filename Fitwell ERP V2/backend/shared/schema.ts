import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  decimal,
  integer,
  timestamp,
  serial,
  index,
  jsonb,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// import {
//   pgTable,

//   varchar,
//   timestamp,

// } from "drizzle-orm/pg-core";

export const adminUser = pgTable("admin_user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetToken = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  weightGrams: decimal("weight_grams", { precision: 10, scale: 2 }).notNull(),
  rawMaterialType: text("raw_material_type").notNull(),
  rawMaterialPricePerKg: decimal("raw_material_price_per_kg", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  pinCode: text("pin_code").notNull(),
  phoneNumber: text("phone_number").notNull(),
  gstNumber: text("gst_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const production = pgTable("production", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // ISO format string
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 3 }).notNull(),
  pieces: integer("pieces").notNull(),
  // Product property overrides (optional - only stored in production record, not in product master)
  weightGramsOverride: decimal("weight_grams_override", { precision: 10, scale: 2 }),
  rawMaterialTypeOverride: text("raw_material_type_override"),
  rawMaterialPricePerKgOverride: decimal("raw_material_price_per_kg_override", {
    precision: 10,
    scale: 2,
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  partyId: integer("party_id")
    .notNull()
    .references(() => parties.id),
  date: text("date").notNull(), // ISO format string
  status: text("status", {
    enum: ["pending", "partial_invoice", "fully_invoiced", "cancelled"],
  })
    .notNull()
    .default("pending"),
  itemCount: integer("item_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salesOrderItems = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  salesOrderId: integer("sales_order_id")
    .notNull()
    .references(() => salesOrders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(), // pieces ordered
  fulfilled: integer("fulfilled").notNull().default(0), // pieces shipped/invoiced
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // ISO format string
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(), // can be positive or negative
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Authentication tables - Required for Replit Auth integration
// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  production: many(production),
  salesOrderItems: many(salesOrderItems),
  stockAdjustments: many(stockAdjustments),
}));

export const partiesRelations = relations(parties, ({ many }) => ({
  salesOrders: many(salesOrders),
}));

export const productionRelations = relations(production, ({ one }) => ({
  product: one(products, {
    fields: [production.productId],
    references: [products.id],
  }),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  party: one(parties, {
    fields: [salesOrders.partyId],
    references: [parties.id],
  }),
  items: many(salesOrderItems),
}));

export const salesOrderItemsRelations = relations(
  salesOrderItems,
  ({ one }) => ({
    salesOrder: one(salesOrders, {
      fields: [salesOrderItems.salesOrderId],
      references: [salesOrders.id],
    }),
    product: one(products, {
      fields: [salesOrderItems.productId],
      references: [products.id],
    }),
  })
);

export const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ one }) => ({
    product: one(products, {
      fields: [stockAdjustments.productId],
      references: [products.id],
    }),
  })
);

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  createdAt: true,
});

export const insertProductionSchema = createInsertSchema(production).omit({
  id: true,
  pieces: true,
  createdAt: true,
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  itemCount: true,
  createdAt: true,
});

export const insertSalesOrderItemSchema = createInsertSchema(
  salesOrderItems
).omit({
  id: true,
  salesOrderId: true,
  fulfilled: true,
  createdAt: true,
});

export const insertStockAdjustmentSchema = createInsertSchema(
  stockAdjustments
).omit({
  id: true,
  createdAt: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Party = typeof parties.$inferSelect;
export type InsertParty = z.infer<typeof insertPartySchema>;

export type Production = typeof production.$inferSelect;
export type InsertProduction = z.infer<typeof insertProductionSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type InsertStockAdjustment = z.infer<typeof insertStockAdjustmentSchema>;

// Authentication types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Extended types for API responses
export type ProductionWithProduct = Production & {
  product: Product | null;
};

export type SalesOrderWithParty = SalesOrder & {
  party: Party | null;
};

export type SalesOrderWithItems = SalesOrder & {
  party: Party | null;
  items: (SalesOrderItem & { product: Product })[];
};

export type InventoryItem = Product & {
  currentStock: number;
  totalProduced: number;
  totalSold: number;
  adjustments: number;
};
