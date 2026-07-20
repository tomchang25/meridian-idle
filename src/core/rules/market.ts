import { getPort, getProduct, getProductFamilyForProduct } from "@/content/core-content";
import type { CategoryId, MarketSession, V5GameState } from "@/core/models/game";
import { removedCostBasis, roundHalfUp, usedCargo, validQuantity, type RuleResult } from "@/core/rules/cargo";
import { portLevel } from "@/core/rules/progression";

export type PriceBreakdown = {
  reference: number;
  rawReference: number;
  modifier: number;
  unitPrice: number;
  label: string;
};
export function xorshift32(seed: number): number {
  const x = seed >>> 0 || 1;
  let next = x ^ (x << 13);
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}
export function createMarketSession(portId: string, level: number, seed: number): MarketSession {
  let current = seed >>> 0 || 1;
  const categoryFactors = {} as Record<CategoryId, number>;
  for (const category of ["food", "livestock", "luxury", "metal", "textile"] as CategoryId[]) {
    current = xorshift32(current);
    categoryFactors[category] = 0.85 + Math.floor((current / 2 ** 32) * 36) / 100;
  }
  return {
    id: `market-${portId}-${seed >>> 0 || 1}`,
    portId,
    categoryFactors,
    specialtySupply: level >= 75 ? 40 : level >= 50 ? 20 : 0,
    netTrade: {},
  };
}
function currentPort(state: V5GameState) {
  const port = getPort(state.fleet.locationPortId);
  return port && state.marketSession.portId === port.id ? port : undefined;
}
export function marketReference(state: V5GameState, productId: string): number | null {
  const family = getProductFamilyForProduct(productId);
  if (!family || !currentPort(state)) return null;
  const factor = state.marketSession.categoryFactors[family.category];
  if (!Number.isFinite(factor)) return null;
  return Math.max(1, roundHalfUp(family.basePrice * factor));
}
export function buyPrice(state: V5GameState, productId: string): PriceBreakdown | null {
  const family = getProductFamilyForProduct(productId);
  const port = currentPort(state);
  if (!family || !port) return null;
  const factor = state.marketSession.categoryFactors[family.category];
  if (!Number.isFinite(factor)) return null;
  const rawReference = family.basePrice * factor;
  const modifier = portLevel(state, port.id) >= 100 ? 0.9 : 1;
  return {
    rawReference,
    reference: Math.max(1, roundHalfUp(rawReference)),
    modifier: 0.8 * modifier,
    unitPrice: Math.max(1, roundHalfUp(rawReference * 0.8 * modifier)),
    label: modifier < 1 ? "Producer + Level 100" : "Producer",
  };
}
export function sellPrice(state: V5GameState, productId: string): PriceBreakdown | null {
  const product = getProduct(productId);
  const family = getProductFamilyForProduct(productId);
  const port = currentPort(state);
  if (!product || !family || !port) return null;
  const factor = state.marketSession.categoryFactors[family.category];
  if (!Number.isFinite(factor)) return null;
  const rawReference = family.basePrice * factor;
  const locallyProduced = port.catalog.some((entry) => entry.productId === productId);
  const origin = product.specialtyOriginPortId ? getPort(product.specialtyOriginPortId) : undefined;
  const modifier = locallyProduced ? 0.5 : origin?.regionId === port.regionId ? 1.5 : origin ? 3 : 1.2;
  const label = locallyProduced
    ? "Local production"
    : origin?.regionId === port.regionId
      ? "Same-region Specialty"
      : origin
        ? "Cross-region Specialty"
        : "Ordinary import";
  return {
    rawReference,
    reference: Math.max(1, roundHalfUp(rawReference)),
    modifier,
    unitPrice: Math.max(1, roundHalfUp(rawReference * modifier)),
    label,
  };
}
export function productPurchaseError(state: V5GameState, productId: string, quantity: number): string | null {
  const port = currentPort(state);
  const price = buyPrice(state, productId);
  const entry = port?.catalog.find((candidate) => candidate.productId === productId);
  if (state.voyage) return "Products cannot be bought during a Voyage.";
  if (!validQuantity(quantity)) return "Quantity must be a positive whole number.";
  if (!port || !price || !entry) return "This Product is not sold at the current Port.";
  if (portLevel(state, port.id) < entry.unlockLevel) return `Unlocks at Port Level ${entry.unlockLevel}.`;
  const product = getProduct(productId);
  if (!product) return "Product content is unavailable.";
  if (product.specialtyOriginPortId === port.id && quantity > state.marketSession.specialtySupply)
    return `Only ${state.marketSession.specialtySupply} Specialty units remain.`;
  const cost = price.unitPrice * quantity;
  if (cost > state.fleet.gold) return `Requires ${cost} Gold; only ${state.fleet.gold} is available.`;
  const remainingCapacity = state.fleet.cargoCapacity - usedCargo(state);
  if (quantity > remainingCapacity) return `Requires ${quantity} Cargo Capacity; only ${remainingCapacity} remains.`;
  return null;
}
export function maximumProductPurchaseQuantity(state: V5GameState, productId: string): number {
  if (productPurchaseError(state, productId, 1)) return 0;
  const port = currentPort(state)!;
  const price = buyPrice(state, productId)!;
  const product = getProduct(productId)!;
  const capacity = state.fleet.cargoCapacity - usedCargo(state);
  const specialtySupply = product.specialtyOriginPortId === port.id ? state.marketSession.specialtySupply : Infinity;
  return Math.max(0, Math.min(Math.floor(state.fleet.gold / price.unitPrice), capacity, specialtySupply));
}
export function buyProduct(state: V5GameState, productId: string, quantity: number, now = 0): RuleResult {
  const error = productPurchaseError(state, productId, quantity);
  if (error) return { state, error };
  const port = currentPort(state)!;
  const price = buyPrice(state, productId)!;
  const product = getProduct(productId)!;
  const cost = price.unitPrice * quantity;
  const stack = state.fleet.products[productId] ?? { quantity: 0, totalCostBasis: 0 };
  return {
    state: {
      ...state,
      fleet: {
        ...state.fleet,
        gold: state.fleet.gold - cost,
        products: {
          ...state.fleet.products,
          [productId]: { quantity: stack.quantity + quantity, totalCostBasis: stack.totalCostBasis + cost },
        },
      },
      marketSession: {
        ...state.marketSession,
        specialtySupply:
          product.specialtyOriginPortId === port.id
            ? state.marketSession.specialtySupply - quantity
            : state.marketSession.specialtySupply,
        netTrade: {
          ...state.marketSession.netTrade,
          [productId]: (state.marketSession.netTrade[productId] ?? 0) + quantity,
        },
      },
      activity: [
        {
          id: `buy-${productId}-${now}`,
          at: now,
          message: `Bought ${quantity} ${product.name} for ${cost} Gold.`,
          tone: "success" as const,
        },
        ...state.activity,
      ].slice(0, 24),
    },
  };
}
export function sellProduct(state: V5GameState, productId: string, quantity: number, now = 0): RuleResult {
  const price = sellPrice(state, productId);
  const stack = state.fleet.products[productId];
  if (state.voyage || !price || !stack || !validQuantity(quantity) || quantity > stack.quantity)
    return { state, error: "Not enough Product to sell." };
  const cost = removedCostBasis(stack, quantity);
  const revenue = price.unitPrice * quantity;
  const products = { ...state.fleet.products };
  if (quantity === stack.quantity) delete products[productId];
  else products[productId] = { quantity: stack.quantity - quantity, totalCostBasis: stack.totalCostBasis - cost };
  return {
    state: {
      ...state,
      fleet: { ...state.fleet, gold: state.fleet.gold + revenue, products },
      marketSession: {
        ...state.marketSession,
        netTrade: {
          ...state.marketSession.netTrade,
          [productId]: (state.marketSession.netTrade[productId] ?? 0) - quantity,
        },
      },
      activity: [
        {
          id: `sell-${productId}-${now}`,
          at: now,
          message: `Sold ${quantity} ${productId}: ${revenue} Gold, ${revenue - cost >= 0 ? "+" : ""}${revenue - cost} profit.`,
          tone: "success" as const,
        },
        ...state.activity,
      ].slice(0, 24),
    },
  };
}
