import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface ProductResponse {
  id: string;
  name: string;
  netWeight: number;
  stock: number;
  sellingPrice: number;
  lineupName: string;
}

interface BundleResponse {
  id: string;
  name: string;
  customPrice: number;
  products: { id: string; name: string }[];
}

interface TransactionPayload {
  date: string;
  status: "sale" | "bonus";
  productId?: string;
  bundleId?: string;
  quantity: number;
  customerName?: string;
  description?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/pos-api", "");
  
  // Get authorization header
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");
  
  if (!authHeader && !apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header or API key" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT or API key
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authorization token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;
    } else if (apiKey) {
      // For API key authentication, verify against stored API keys
      // For now, we'll use a simple header-based approach
      // In production, you'd want to store API keys in the database
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", apiKey)
        .single();
      
      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "Invalid API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = profile.id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`POS API request: ${req.method} ${path} for user ${userId}`);

    // Route handling
    if (path === "/products" && req.method === "GET") {
      return await handleGetProducts(supabase, userId);
    }

    if (path === "/bundles" && req.method === "GET") {
      return await handleGetBundles(supabase, userId);
    }

    if (path === "/customers" && req.method === "GET") {
      return await handleGetCustomers(supabase, userId);
    }

    if (path === "/transactions" && req.method === "POST") {
      const body = await req.json();
      return await handleCreateTransaction(supabase, userId, body);
    }

    if (path === "/transactions" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      return await handleGetTransactions(supabase, userId, limit, offset);
    }

    if (path === "/stock" && req.method === "GET") {
      return await handleGetStock(supabase, userId);
    }

    return new Response(
      JSON.stringify({ error: "Not found", path }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("POS API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleGetProducts(supabase: any, userId: string) {
  // Get products with lineup info
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .gt("stock", 0);

  if (productsError) throw productsError;

  const { data: lineups, error: lineupsError } = await supabase
    .from("lineups")
    .select("id, name, green_beans_price, green_beans_shipping, roasting_service, roasting_transport, initial_weight")
    .eq("user_id", userId);

  if (lineupsError) throw lineupsError;

  // Calculate selling prices
  const result: ProductResponse[] = products.map((product: any) => {
    const lineup = lineups.find((l: any) => l.id === product.lineup_id);
    let sellingPrice = 0;

    if (lineup) {
      const totalCost = 
        Number(lineup.green_beans_price || 0) +
        Number(lineup.green_beans_shipping || 0) +
        Number(lineup.roasting_service || 0) +
        Number(lineup.roasting_transport || 0);
      
      const costPerGram = totalCost / Number(lineup.initial_weight || 1);
      const productionCost = costPerGram * Number(product.net_weight);
      const packagingCost = Number(product.packaging_cost || 0) + Number(product.label_cost || 0);
      const hpp = productionCost + packagingCost + Number(product.marketing_cost || 0);
      const marginMultiplier = 1 + (Number(product.margin_percentage || 0) / 100);
      sellingPrice = Math.round(hpp * marginMultiplier);
    }

    return {
      id: product.id,
      name: product.name,
      netWeight: Number(product.net_weight),
      stock: Number(product.stock),
      sellingPrice,
      lineupName: lineup?.name || "Unknown",
    };
  });

  return new Response(
    JSON.stringify({ products: result, count: result.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetBundles(supabase: any, userId: string) {
  const { data: bundles, error: bundlesError } = await supabase
    .from("bundles")
    .select("*")
    .eq("user_id", userId);

  if (bundlesError) throw bundlesError;

  const { data: bundleProducts, error: bpError } = await supabase
    .from("bundle_products")
    .select("bundle_id, product_id");

  if (bpError) throw bpError;

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", userId);

  if (productsError) throw productsError;

  const result: BundleResponse[] = bundles.map((bundle: any) => {
    const productIds = bundleProducts
      .filter((bp: any) => bp.bundle_id === bundle.id)
      .map((bp: any) => bp.product_id);
    
    const bundleProductsList = productIds.map((pid: string) => {
      const product = products.find((p: any) => p.id === pid);
      return { id: pid, name: product?.name || "Unknown" };
    });

    return {
      id: bundle.id,
      name: bundle.name,
      customPrice: Number(bundle.custom_price),
      products: bundleProductsList,
    };
  });

  return new Response(
    JSON.stringify({ bundles: result, count: result.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetCustomers(supabase: any, userId: string) {
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, phone, email, is_member")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;

  return new Response(
    JSON.stringify({ customers, count: customers.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCreateTransaction(supabase: any, userId: string, payload: TransactionPayload) {
  if (!payload.productId && !payload.bundleId) {
    return new Response(
      JSON.stringify({ error: "Either productId or bundleId is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!payload.quantity || payload.quantity <= 0) {
    return new Response(
      JSON.stringify({ error: "Quantity must be greater than 0" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let totalValue = 0;
  let lineupId: string | null = null;

  if (payload.productId) {
    // Get product and calculate price
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, lineups!inner(id, name, green_beans_price, green_beans_shipping, roasting_service, roasting_transport, initial_weight)")
      .eq("id", payload.productId)
      .eq("user_id", userId)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (product.stock < payload.quantity) {
      return new Response(
        JSON.stringify({ error: "Insufficient stock", available: product.stock }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    lineupId = product.lineup_id;

    // Calculate selling price
    const lineup = product.lineups;
    const totalCost = 
      Number(lineup.green_beans_price || 0) +
      Number(lineup.green_beans_shipping || 0) +
      Number(lineup.roasting_service || 0) +
      Number(lineup.roasting_transport || 0);
    
    const costPerGram = totalCost / Number(lineup.initial_weight || 1);
    const productionCost = costPerGram * Number(product.net_weight);
    const packagingCost = Number(product.packaging_cost || 0) + Number(product.label_cost || 0);
    const hpp = productionCost + packagingCost + Number(product.marketing_cost || 0);
    const marginMultiplier = 1 + (Number(product.margin_percentage || 0) / 100);
    const sellingPrice = Math.round(hpp * marginMultiplier);
    totalValue = sellingPrice * payload.quantity;

    // Update stock
    const newStock = product.stock - payload.quantity;
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", payload.productId);

    if (stockError) throw stockError;

    // Create stock adjustment
    await supabase.from("stock_adjustments").insert({
      user_id: userId,
      product_id: payload.productId,
      previous_stock: product.stock,
      new_stock: newStock,
      adjustment_type: "sale",
      reason: `POS Sale: ${payload.description || "Transaction"}`,
    });

  } else if (payload.bundleId) {
    // Get bundle and update stock for all products
    const { data: bundle, error: bundleError } = await supabase
      .from("bundles")
      .select("*")
      .eq("id", payload.bundleId)
      .eq("user_id", userId)
      .single();

    if (bundleError || !bundle) {
      return new Response(
        JSON.stringify({ error: "Bundle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    totalValue = Number(bundle.custom_price) * payload.quantity;

    // Get bundle products
    const { data: bundleProducts, error: bpError } = await supabase
      .from("bundle_products")
      .select("product_id")
      .eq("bundle_id", payload.bundleId);

    if (bpError) throw bpError;

    // Check and update stock for each product
    for (const bp of bundleProducts) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, stock, lineup_id")
        .eq("id", bp.product_id)
        .single();

      if (productError) continue;

      if (!lineupId) lineupId = product.lineup_id;

      if (product.stock < payload.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for product in bundle`, productId: bp.product_id }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newStock = product.stock - payload.quantity;
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", bp.product_id);

      await supabase.from("stock_adjustments").insert({
        user_id: userId,
        product_id: bp.product_id,
        previous_stock: product.stock,
        new_stock: newStock,
        adjustment_type: "sale",
        reason: `POS Bundle Sale (${bundle.name}): ${payload.description || "Transaction"}`,
      });
    }
  }

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      date: payload.date || new Date().toISOString().split("T")[0],
      status: payload.status || "sale",
      product_id: payload.productId || null,
      bundle_id: payload.bundleId || null,
      lineup_id: lineupId,
      quantity: payload.quantity,
      total_value: totalValue,
      customer_name: payload.customerName || null,
      description: payload.description || "POS Transaction",
    })
    .select()
    .single();

  if (txError) throw txError;

  console.log(`POS Transaction created: ${transaction.id}, total: ${totalValue}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      transaction: {
        id: transaction.id,
        date: transaction.date,
        status: transaction.status,
        quantity: transaction.quantity,
        totalValue: Number(transaction.total_value),
        customerName: transaction.customer_name,
      }
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetTransactions(supabase: any, userId: string, limit: number, offset: number) {
  const { data: transactions, error, count } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const result = transactions.map((t: any) => ({
    id: t.id,
    date: t.date,
    status: t.status,
    productId: t.product_id,
    bundleId: t.bundle_id,
    quantity: Number(t.quantity),
    totalValue: Number(t.total_value),
    customerName: t.customer_name,
    description: t.description,
  }));

  return new Response(
    JSON.stringify({ transactions: result, total: count }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetStock(supabase: any, userId: string) {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, stock, stock_threshold")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;

  const result = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    stock: Number(p.stock),
    stockThreshold: Number(p.stock_threshold),
    isLow: Number(p.stock) <= Number(p.stock_threshold),
  }));

  return new Response(
    JSON.stringify({ products: result, count: result.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
