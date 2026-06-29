import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import authRouter from "./routes/auth";
import {
  insertProductSchema,
  insertPartySchema,
  insertProductionSchema,
  insertSalesOrderSchema,
  insertSalesOrderItemSchema,
  insertStockAdjustmentSchema,
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (for Render and monitoring)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes - MUST be registered before other routes
  app.use("/api/auth", authRouter);

  // Products
  app.get("/api/products", async (_req, res) => {
    // try {
    //   const products = await storage.getProducts();
    //   res.json(products);
    // } catch (error) {
    //   res.status(500).json({ message: "Failed to fetch products" });
    // }
    const data = await storage.getProducts();
    res.json(data);
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Parties
  app.get("/api/parties", async (_req, res) => {
    // try {
    //   const parties = await storage.getParties();
    //   res.json(parties);
    // } catch (error) {
    //   res.status(500).json({ message: "Failed to fetch parties" });
    // }
    const data = await storage.getParties();
    res.json(data);
  });

  app.post("/api/parties", async (req, res) => {
    try {
      const validatedData = insertPartySchema.parse(req.body);
      const party = await storage.createParty(validatedData);
      res.status(201).json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid party data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create party" });
    }
  });

  app.put("/api/parties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPartySchema.partial().parse(req.body);
      const party = await storage.updateParty(id, validatedData);
      res.json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid party data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update party" });
    }
  });

  app.delete("/api/parties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteParty(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete party" });
    }
  });

  // Bulk upload endpoints
  app.post("/api/products/bulk", upload.single("excel"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      // Process each row
      for (let index = 0; index < data.length; index++) {
        const row = data[index] as any;
        try {
          // Map Excel columns to our schema
          const productData = {
            name: String(row["Product Name"] || row["name"] || ""),
            weightGrams: String(
              row["Weight (grams)"] || row["weightGrams"] || "0",
            ),
            rawMaterialType: String(
              row["Material Type"] || row["rawMaterialType"] || "Steel",
            ),
            rawMaterialPricePerKg: String(
              row["Material Price/KG"] || row["rawMaterialPricePerKg"] || "0",
            ),
          };

          // Validate data
          const validatedData = insertProductSchema.parse(productData);
          await storage.createProduct(validatedData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: index + 2, // Excel row number (starting from 2 due to header)
            data: row,
            error:
              error instanceof z.ZodError
                ? error.errors
                : (error as Error).message,
          });
        }
      }

      res.json({
        message: `Bulk upload completed. ${results.success} products added, ${results.failed} failed.`,
        results,
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  app.post("/api/parties/bulk", upload.single("excel"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      // Process each row
      for (let index = 0; index < data.length; index++) {
        const row = data[index] as any;
        try {
          // Map Excel columns to our schema
          const partyData = {
            name: String(row["Party Name"] || row["name"] || ""),
            address: String(row["Address"] || row["address"] || ""),
            pinCode: String(row["Pin Code"] || row["pinCode"] || ""),
            phoneNumber: String(
              row["Phone Number"] || row["phoneNumber"] || "",
            ),
            gstNumber: row["GST Number"] || row["gstNumber"] || null,
          };

          // Validate data
          const validatedData = insertPartySchema.parse(partyData);
          await storage.createParty(validatedData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: index + 2, // Excel row number (starting from 2 due to header)
            data: row,
            error:
              error instanceof z.ZodError
                ? error.errors
                : (error as Error).message,
          });
        }
      }

      res.json({
        message: `Bulk upload completed. ${results.success} parties added, ${results.failed} failed.`,
        results,
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  // Production
  app.get("/api/production", async (_req, res) => {
    // try {
    //   const production = await storage.getProduction();
    //   res.json(production);
    // } catch (error) {
    //   res.status(500).json({ message: "Failed to fetch production records" });
    // }

    const data = await storage.getProduction();
    res.json(data);
  });

  app.post("/api/production", async (req, res) => {
    try {
      const validatedData = insertProductionSchema.parse(req.body);
      const production = await storage.createProductionRecord(validatedData);
      res.status(201).json(production);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid production data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create production record" });
    }
  });

  app.put("/api/production/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductionSchema.partial().parse(req.body);
      const production = await storage.updateProductionRecord(
        id,
        validatedData,
      );
      res.json(production);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid production data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update production record" });
    }
  });

  app.delete("/api/production/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductionRecord(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete production record" });
    }
  });

  // Sales Orders
  app.get("/api/sales", async (_req, res) => {
    // try {
    //   const salesOrders = await storage.getSalesOrders();
    //   res.json(salesOrders);
    // } catch (error) {
    //   res.status(500).json({ message: "Failed to fetch sales orders" });
    // }
    const data = await storage.getSalesOrders();
    res.json(data);
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.getSalesOrder(id);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(salesOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales order" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { order, items } = req.body;
      const validatedOrder = insertSalesOrderSchema.parse(order);
      const validatedItems = z.array(insertSalesOrderItemSchema).parse(items);

      const salesOrder = await storage.createSalesOrder(
        validatedOrder,
        validatedItems,
      );
      res.status(201).json(salesOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid sales order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sales order" });
    }
  });

  app.post("/api/sales/:id/fulfill", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { fulfillments } = req.body;

      await storage.fulfillSalesOrderItems(orderId, fulfillments);
      res.json({ message: "Order fulfilled successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to fulfill order" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSalesOrder(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sales order" });
    }
  });

  app.put("/api/sales/:id/cancel", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.cancelInvoice(id);
      res.json(salesOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel invoice" });
    }
  });

  // Stock Adjustments
  app.get("/api/stock-adjustments", async (_req, res) => {
    try {
      const adjustments = await storage.getStockAdjustments();
      res.json(adjustments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock adjustments" });
    }
  });

  app.post("/api/stock-adjustments", async (req, res) => {
    try {
      const validatedData = insertStockAdjustmentSchema.parse(req.body);
      const adjustment = await storage.createStockAdjustment(validatedData);
      res.status(201).json(adjustment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid stock adjustment data",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to create stock adjustment" });
    }
  });

  // Inventory
  app.get("/api/inventory", async (_req, res) => {
    // try {
    //   const inventory = await storage.getInventory();
    //   res.json(inventory);
    // } catch (error) {
    //   res.status(500).json({ message: "Failed to fetch inventory" });
    // }
    console.time("Inventory API");

    const data = await storage.getInventory();
    res.json(data);
  });

  // Dashboard
  app.get("/api/dashboard/metrics", async (_req, res) => {
    // try {
    //   const metrics = await storage.getDashboardMetrics();
    //   res.json(metrics);
    // } catch (error) {
    //   console.error("Dashboard metrics error:", error);
    //   res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    // }
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  });

  const httpServer = createServer(app);
  return httpServer;
}
