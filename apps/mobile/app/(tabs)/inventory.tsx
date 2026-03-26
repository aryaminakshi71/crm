import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EmptyState,
  HeaderBlock,
  Panel,
  Screen,
  SectionLabel,
} from "../../src/components/mobile-ui";
import { useCrmClient } from "../../src/lib/api";
import { useMobileConfig } from "../../src/lib/mobile-config";
import { theme } from "../../src/lib/theme";
import type { InventoryProduct } from "../../src/lib/types";

type FilterTab = "all" | "low-stock" | "out-of-stock";

function stockQty(product: InventoryProduct): number {
  return product.stockQuantity ?? 0;
}

function isOutOfStock(product: InventoryProduct) {
  return stockQty(product) === 0;
}

function isLowStock(product: InventoryProduct) {
  const qty = stockQty(product);
  return qty > 0 && qty < 10;
}

function stockColor(product: InventoryProduct) {
  if (isOutOfStock(product)) return theme.colors.danger;
  if (isLowStock(product)) return "#f97316";
  return "#22c55e";
}

function formatPrice(price?: number | string | null) {
  if (price == null) return null;
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function matchesFilter(product: InventoryProduct, filter: FilterTab) {
  if (filter === "all") return true;
  if (filter === "out-of-stock") return isOutOfStock(product);
  if (filter === "low-stock") return isLowStock(product);
  return true;
}

function matchesSearch(product: InventoryProduct, search: string) {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    product.name.toLowerCase().includes(q) ||
    (product.sku ?? "").toLowerCase().includes(q) ||
    (product.category ?? "").toLowerCase().includes(q)
  );
}

export default function InventoryScreen() {
  const client = useCrmClient();
  const { apiBaseUrl, demoMode, organizationId } = useMobileConfig();
  const cacheScope = [apiBaseUrl, demoMode, organizationId];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const productsQuery = useQuery({
    queryKey: ["mobile", "inventory-products", ...cacheScope],
    queryFn: () => client.inventoryProducts.list(),
  });

  const allProducts = productsQuery.data?.data ?? [];

  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter(isLowStock).length;
  const outOfStockCount = allProducts.filter(isOutOfStock).length;

  const filtered = allProducts.filter(
    (p) => matchesFilter(p, filter) && matchesSearch(p, search),
  );

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low-stock", label: "Low Stock" },
    { key: "out-of-stock", label: "Out of Stock" },
  ];

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={productsQuery.isRefetching}
            onRefresh={() => productsQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <HeaderBlock
              eyebrow="Warehouse"
              title="Inventory"
              subtitle="Track products, stock levels, and availability."
            />

            {/* Stats bar */}
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{totalProducts}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={[styles.statCell, styles.statCellBorder]}>
                <Text style={[styles.statValue, { color: "#f97316" }]}>
                  {lowStockCount}
                </Text>
                <Text style={styles.statLabel}>Low Stock</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.colors.danger }]}>
                  {outOfStockCount}
                </Text>
                <Text style={styles.statLabel}>Out of Stock</Text>
              </View>
            </View>

            {/* Search input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={theme.colors.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterTab,
                    filter === tab.key && styles.filterTabActive,
                  ]}
                  onPress={() => setFilter(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      filter === tab.key && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionLabel title={`${filtered.length} product${filtered.length !== 1 ? "s" : ""}`} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: InventoryProduct }) => {
          const qty = stockQty(item);
          const price = formatPrice(item.price);

          return (
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.sku ? (
                    <Text style={styles.sku}>{item.sku}</Text>
                  ) : null}
                </View>
                {price ? (
                  <Text style={styles.price}>{price}</Text>
                ) : null}
              </View>

              <View style={styles.cardFooter}>
                {item.category ? (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                ) : null}
                <View style={styles.stockWrap}>
                  <View
                    style={[
                      styles.stockDot,
                      { backgroundColor: stockColor(item) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stockText,
                      { color: stockColor(item) },
                    ]}
                  >
                    {qty} in stock
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          productsQuery.isLoading ? (
            <Panel accent={theme.colors.mint}>
              <Text style={styles.meta}>Loading products...</Text>
            </Panel>
          ) : (
            <EmptyState
              title="No products found"
              copy="Try adjusting your search or filter to find the product you need."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  statCellBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.ink,
    fontFamily: "Georgia",
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.paper,
  },
  filterTabActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  filterTabTextActive: {
    color: theme.colors.white,
  },
  productCard: {
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.ink,
    lineHeight: 21,
  },
  sku: {
    fontSize: 12,
    fontFamily: "Menlo",
    color: theme.colors.muted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.ink,
    flexShrink: 0,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  categoryBadge: {
    backgroundColor: theme.colors.ocean + "22",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.ocean,
  },
  stockWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    color: theme.colors.muted,
  },
});
