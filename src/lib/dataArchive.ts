import { supabase } from "@/integrations/supabase/client";

export interface ArchiveData {
  version: string;
  exportedAt: string;
  profile: any;
  lineups: any[];
  roastLogs: any[];
  products: any[];
  transactions: any[];
  customers: any[];
  invoices: any[];
  bundles: any[];
  bundleProducts: any[];
  stockAdjustments: any[];
}

export async function exportAllData(): Promise<ArchiveData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Fetch all data in parallel
  const [
    profileResult,
    lineupsResult,
    roastLogsResult,
    productsResult,
    transactionsResult,
    customersResult,
    invoicesResult,
    bundlesResult,
    bundleProductsResult,
    stockAdjustmentsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("lineups").select("*").order("created_at", { ascending: true }),
    supabase.from("roast_logs").select("*").order("created_at", { ascending: true }),
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*").order("created_at", { ascending: true }),
    supabase.from("customers").select("*").order("created_at", { ascending: true }),
    supabase.from("invoices").select("*").order("created_at", { ascending: true }),
    supabase.from("bundles").select("*").order("created_at", { ascending: true }),
    supabase.from("bundle_products").select("*"),
    supabase.from("stock_adjustments").select("*").order("created_at", { ascending: true }),
  ]);

  // Check for errors
  const errors = [
    profileResult.error,
    lineupsResult.error,
    roastLogsResult.error,
    productsResult.error,
    transactionsResult.error,
    customersResult.error,
    invoicesResult.error,
    bundlesResult.error,
    bundleProductsResult.error,
    stockAdjustmentsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Export failed: ${errors.map(e => e?.message).join(", ")}`);
  }

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    profile: profileResult.data,
    lineups: lineupsResult.data || [],
    roastLogs: roastLogsResult.data || [],
    products: productsResult.data || [],
    transactions: transactionsResult.data || [],
    customers: customersResult.data || [],
    invoices: invoicesResult.data || [],
    bundles: bundlesResult.data || [],
    bundleProducts: bundleProductsResult.data || [],
    stockAdjustments: stockAdjustmentsResult.data || [],
  };
}

export function downloadAsJson(data: ArchiveData, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function clearAllData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Delete in correct order due to foreign key constraints
  // 1. Delete bundle_products (depends on bundles and products)
  await supabase.from("bundle_products").delete().neq("bundle_id", "00000000-0000-0000-0000-000000000000");
  
  // 2. Delete stock_adjustments (depends on products and transactions)
  await supabase.from("stock_adjustments").delete().eq("user_id", user.id);
  
  // 3. Delete transactions (depends on products, lineups, bundles)
  await supabase.from("transactions").delete().eq("user_id", user.id);
  
  // 4. Delete invoices (depends on customers)
  await supabase.from("invoices").delete().eq("user_id", user.id);
  
  // 5. Delete bundles
  await supabase.from("bundles").delete().eq("user_id", user.id);
  
  // 6. Delete products (depends on lineups)
  await supabase.from("products").delete().eq("user_id", user.id);
  
  // 7. Delete roast_logs (depends on lineups)
  await supabase.from("roast_logs").delete().neq("lineup_id", "00000000-0000-0000-0000-000000000000");
  
  // 8. Delete lineups
  await supabase.from("lineups").delete().eq("user_id", user.id);
  
  // 9. Delete customers
  await supabase.from("customers").delete().eq("user_id", user.id);
}

export async function importData(data: ArchiveData): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Validate version
  if (!data.version || !data.exportedAt) {
    throw new Error("Invalid archive file format");
  }

  try {
    // Clear existing data first
    await clearAllData();

    // Create ID mapping for foreign key relationships
    const lineupIdMap = new Map<string, string>();
    const productIdMap = new Map<string, string>();
    const customerIdMap = new Map<string, string>();
    const bundleIdMap = new Map<string, string>();
    const transactionIdMap = new Map<string, string>();

    // 1. Import customers
    for (const customer of data.customers) {
      const newId = crypto.randomUUID();
      customerIdMap.set(customer.id, newId);
      
      await supabase.from("customers").insert({
        id: newId,
        user_id: user.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        is_member: customer.is_member,
      });
    }

    // 2. Import lineups
    for (const lineup of data.lineups) {
      const newId = crypto.randomUUID();
      lineupIdMap.set(lineup.id, newId);
      
      await supabase.from("lineups").insert({
        id: newId,
        user_id: user.id,
        name: lineup.name,
        origin: lineup.origin,
        process: lineup.process,
        variety: lineup.variety,
        processor: lineup.processor,
        roaster: lineup.roaster,
        tasting_notes: lineup.tasting_notes,
        purchase_date: lineup.purchase_date,
        initial_weight: lineup.initial_weight,
        green_beans_price: lineup.green_beans_price,
        green_beans_shipping: lineup.green_beans_shipping,
        roasting_service: lineup.roasting_service,
        roasting_transport: lineup.roasting_transport,
        rnd_allocation: lineup.rnd_allocation,
        promo_allocation: lineup.promo_allocation,
        rnd_allocation_used: lineup.rnd_allocation_used,
        promo_allocation_used: lineup.promo_allocation_used,
      });
    }

    // 3. Import roast_logs
    for (const log of data.roastLogs) {
      const newLineupId = lineupIdMap.get(log.lineup_id);
      if (!newLineupId) continue;
      
      await supabase.from("roast_logs").insert({
        id: crypto.randomUUID(),
        lineup_id: newLineupId,
        date: log.date,
        input_weight: log.input_weight,
        output_weight: log.output_weight,
      });
    }

    // 4. Import products
    for (const product of data.products) {
      const newId = crypto.randomUUID();
      const newLineupId = lineupIdMap.get(product.lineup_id);
      if (!newLineupId) continue;
      
      productIdMap.set(product.id, newId);
      
      await supabase.from("products").insert({
        id: newId,
        user_id: user.id,
        lineup_id: newLineupId,
        name: product.name,
        net_weight: product.net_weight,
        packaging_cost: product.packaging_cost,
        label_cost: product.label_cost,
        marketing_cost: product.marketing_cost,
        margin_percentage: product.margin_percentage,
        stock: product.stock,
        stock_threshold: product.stock_threshold,
      });
    }

    // 5. Import bundles
    for (const bundle of data.bundles) {
      const newId = crypto.randomUUID();
      bundleIdMap.set(bundle.id, newId);
      
      await supabase.from("bundles").insert({
        id: newId,
        user_id: user.id,
        name: bundle.name,
        custom_price: bundle.custom_price,
      });
    }

    // 6. Import bundle_products
    for (const bp of data.bundleProducts) {
      const newBundleId = bundleIdMap.get(bp.bundle_id);
      const newProductId = productIdMap.get(bp.product_id);
      if (!newBundleId || !newProductId) continue;
      
      await supabase.from("bundle_products").insert({
        bundle_id: newBundleId,
        product_id: newProductId,
      });
    }

    // 7. Import transactions
    for (const transaction of data.transactions) {
      const newId = crypto.randomUUID();
      transactionIdMap.set(transaction.id, newId);
      
      const newProductId = transaction.product_id ? productIdMap.get(transaction.product_id) : null;
      const newLineupId = transaction.lineup_id ? lineupIdMap.get(transaction.lineup_id) : null;
      const newBundleId = transaction.bundle_id ? bundleIdMap.get(transaction.bundle_id) : null;
      
      await supabase.from("transactions").insert({
        id: newId,
        user_id: user.id,
        date: transaction.date,
        status: transaction.status,
        quantity: transaction.quantity,
        total_value: transaction.total_value,
        description: transaction.description,
        product_id: newProductId,
        lineup_id: newLineupId,
        bundle_id: newBundleId,
      });
    }

    // 8. Import invoices
    for (const invoice of data.invoices) {
      const newCustomerId = invoice.customer_id ? customerIdMap.get(invoice.customer_id) : null;
      const newTransactionIds = (invoice.transaction_ids || [])
        .map((id: string) => transactionIdMap.get(id))
        .filter(Boolean);
      
      await supabase.from("invoices").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        invoice_number: invoice.invoice_number,
        date: invoice.date,
        status: invoice.status,
        customer_id: newCustomerId,
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone,
        customer_address: invoice.customer_address,
        description: invoice.description,
        items: invoice.items,
        subtotal: invoice.subtotal,
        total: invoice.total,
        transaction_ids: newTransactionIds,
      });
    }

    // 9. Import stock_adjustments
    for (const adjustment of data.stockAdjustments) {
      const newProductId = productIdMap.get(adjustment.product_id);
      const newTransactionId = adjustment.transaction_id 
        ? transactionIdMap.get(adjustment.transaction_id) 
        : null;
      if (!newProductId) continue;
      
      await supabase.from("stock_adjustments").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        product_id: newProductId,
        transaction_id: newTransactionId,
        adjustment_type: adjustment.adjustment_type,
        previous_stock: adjustment.previous_stock,
        new_stock: adjustment.new_stock,
        reason: adjustment.reason,
      });
    }

    return {
      success: true,
      message: `Import berhasil: ${data.lineups.length} batch, ${data.products.length} produk, ${data.transactions.length} transaksi`,
    };
  } catch (error) {
    console.error("Import error:", error);
    throw error;
  }
}
