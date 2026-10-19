"use client";

export interface OrderRequestItem {
  code: string;
  size: string;
  quantity: string;
  color: string;
}

const STORAGE_KEY = "niche-order-request-items";
type Listener = () => void;

let items: OrderRequestItem[] = [];
let hydrated = false;
const listeners = new Set<Listener>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    items = raw ? JSON.parse(raw) : [];
  } catch {
    items = [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function notify() {
  listeners.forEach((l) => l());
}

export function getOrderRequestItems(): OrderRequestItem[] {
  hydrate();
  return items;
}

export function addOrderRequestItem(item: OrderRequestItem) {
  hydrate();
  const index = items.findIndex((i) => i.code === item.code);
  items = index >= 0 ? items.map((i, idx) => (idx === index ? item : i)) : [...items, item];
  persist();
  notify();
}

export function setOrderRequestItems(next: OrderRequestItem[]) {
  hydrate();
  items = next;
  persist();
  notify();
}

export function subscribeOrderRequest(listener: Listener): () => void {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
