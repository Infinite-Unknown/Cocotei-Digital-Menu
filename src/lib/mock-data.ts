import type { Category, MenuItem, Order } from "./types";

export const categories: Category[] = [
  { id: "c1", name: "Sashimi", nameJa: "刺身", slug: "sashimi", icon: "🍣" },
  { id: "c2", name: "Sushi & Maki", nameJa: "寿司", slug: "sushi", icon: "🍱" },
  { id: "c3", name: "Rice Bowls", nameJa: "丼", slug: "donburi", icon: "🍚" },
  { id: "c4", name: "Ramen", nameJa: "拉麺", slug: "ramen", icon: "🍜" },
  { id: "c5", name: "Udon & Soba", nameJa: "うどん", slug: "noodles", icon: "🥢" },
  { id: "c6", name: "Tempura & Sides", nameJa: "天ぷら", slug: "sides", icon: "🍤" },
  { id: "c7", name: "Bento Sets", nameJa: "弁当", slug: "bento", icon: "🍱" },
  { id: "c8", name: "Drinks", nameJa: "飲み物", slug: "drinks", icon: "🍵" },
  { id: "c9", name: "Desserts", nameJa: "甘味", slug: "desserts", icon: "🍡" },
];

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?w=600&auto=format&fit=crop&q=70`;

export const menuItems: MenuItem[] = [
  // Sashimi
  { id: "m1", categoryId: "c1", name: "Salmon Sashimi", nameJa: "サーモン刺身", description: "Fresh Norwegian salmon, 8 slices, served with wasabi and soy.", price: 28, image: img("photo-1579871494447-9811cf80d66c"), available: true, tags: ["chef-pick"] },
  { id: "m2", categoryId: "c1", name: "Tuna Sashimi", nameJa: "マグロ刺身", description: "Premium maguro, 6 slices.", price: 32, image: img("photo-1617196034183-421b4917abe9"), available: true },
  { id: "m3", categoryId: "c1", name: "Chef's Sashimi Platter", nameJa: "お任せ盛り合わせ", description: "Daily selection of 5 fish, 20 slices total.", price: 88, image: img("photo-1582450871972-ab5ca641643d"), available: true, tags: ["signature"] },

  // Sushi & Maki
  { id: "m4", categoryId: "c2", name: "California Maki", nameJa: "カリフォルニア巻", description: "Crab stick, avocado, cucumber, tobiko (8 pcs).", price: 18, image: img("photo-1607301405390-d831c242f59b"), available: true },
  { id: "m5", categoryId: "c2", name: "Salmon Nigiri", nameJa: "サーモン握り", description: "Hand-pressed nigiri with fresh salmon (2 pcs).", price: 16, image: img("photo-1553621042-f6e147245754"), available: true },
  { id: "m6", categoryId: "c2", name: "Dragon Roll", nameJa: "ドラゴンロール", description: "Eel, cucumber, topped with avocado and unagi sauce.", price: 32, image: img("photo-1617196701537-7329482cc9fe"), available: true },
  { id: "m7", categoryId: "c2", name: "Spicy Tuna Roll", nameJa: "スパイシーマグロ", description: "Chopped tuna, spicy mayo, scallions.", price: 22, image: img("photo-1611143669185-af224c5e3252"), available: true, spicy: 2 },

  // Donburi
  { id: "m8", categoryId: "c3", name: "Unagi Don", nameJa: "鰻丼", description: "Grilled freshwater eel, tare sauce over rice.", price: 38, image: img("photo-1580822184713-fc5400e7fe10"), available: true, tags: ["chef-pick"] },
  { id: "m9", categoryId: "c3", name: "Chicken Teriyaki Don", nameJa: "鶏照焼丼", description: "Grilled chicken thigh glazed with house teriyaki.", price: 24, image: img("photo-1546069901-ba9599a7e63c"), available: true },
  { id: "m10", categoryId: "c3", name: "Salmon Don", nameJa: "サーモン丼", description: "Sliced salmon over sushi rice with ikura.", price: 32, image: img("photo-1562802378-063ec186a863"), available: true },
  { id: "m11", categoryId: "c3", name: "Gyudon", nameJa: "牛丼", description: "Thin-sliced beef simmered in sweet soy with onions.", price: 26, image: img("photo-1607330289024-1535c6b4e1c1"), available: true },

  // Ramen
  { id: "m12", categoryId: "c4", name: "Tonkotsu Ramen", nameJa: "豚骨拉麺", description: "12-hour pork bone broth, chashu, ajitama, nori.", price: 26, image: img("photo-1569718212165-3a8278d5f624"), available: true, tags: ["signature"] },
  { id: "m13", categoryId: "c4", name: "Miso Ramen", nameJa: "味噌拉麺", description: "Rich miso broth with corn, bamboo, and ground pork.", price: 24, image: img("photo-1552611052-33e04de081de"), available: true },
  { id: "m14", categoryId: "c4", name: "Spicy Miso Ramen", nameJa: "辛味噌拉麺", description: "Miso broth with chili oil.", price: 26, image: img("photo-1557872943-16a5ac26437e"), available: true, spicy: 3 },
  { id: "m15", categoryId: "c4", name: "Shoyu Ramen", nameJa: "醤油拉麺", description: "Classic soy-based chicken broth.", price: 22, image: img("photo-1591814468924-caf88d1232e1"), available: false },

  // Udon & Soba
  { id: "m16", categoryId: "c5", name: "Tempura Udon", nameJa: "天ぷらうどん", description: "Hot udon with 2 ebi tempura and kakiage.", price: 22, image: img("photo-1618889482923-38250401a84e"), available: true },
  { id: "m17", categoryId: "c5", name: "Zaru Soba", nameJa: "ざる蕎麦", description: "Cold buckwheat noodles with tsuyu dipping sauce.", price: 18, image: img("photo-1585032226651-759b368d7246"), available: true },
  { id: "m18", categoryId: "c5", name: "Yaki Udon", nameJa: "焼きうどん", description: "Stir-fried udon with vegetables and chicken.", price: 20, image: img("photo-1526318896980-cf78c088247c"), available: true },

  // Sides
  { id: "m19", categoryId: "c6", name: "Ebi Tempura", nameJa: "海老天ぷら", description: "Tiger prawns in light tempura batter (5 pcs).", price: 22, image: img("photo-1580822184713-fc5400e7fe10"), available: true },
  { id: "m20", categoryId: "c6", name: "Tori Karaage", nameJa: "鶏唐揚げ", description: "Japanese fried chicken with kewpie mayo.", price: 18, image: img("photo-1562967914-608f82629710"), available: true },
  { id: "m21", categoryId: "c6", name: "Gyoza (5 pcs)", nameJa: "餃子", description: "Pan-fried pork dumplings.", price: 14, image: img("photo-1541696432-82c6da8ce7bf"), available: true },
  { id: "m22", categoryId: "c6", name: "Agedashi Tofu", nameJa: "揚げ出し豆腐", description: "Lightly fried silken tofu in dashi broth.", price: 14, image: img("photo-1607330289024-1535c6b4e1c1"), available: true },
  { id: "m23", categoryId: "c6", name: "Edamame", nameJa: "枝豆", description: "Steamed soybeans with sea salt.", price: 8, image: img("photo-1623428187969-5da2dcea5ebf"), available: true },

  // Bento
  { id: "m24", categoryId: "c7", name: "Chef's Bento", nameJa: "特選弁当", description: "Sashimi, tempura, teriyaki chicken, rice, miso soup.", price: 42, image: img("photo-1569050467447-ce54b3bbc37d"), available: true, tags: ["signature"] },
  { id: "m25", categoryId: "c7", name: "Chicken Katsu Bento", nameJa: "鶏カツ弁当", description: "Breaded chicken cutlet, rice, salad, miso soup.", price: 32, image: img("photo-1607330289024-1535c6b4e1c1"), available: true },
  { id: "m26", categoryId: "c7", name: "Salmon Teriyaki Bento", nameJa: "サーモン照焼弁当", description: "Grilled salmon with teriyaki, rice, pickles.", price: 36, image: img("photo-1580822184713-fc5400e7fe10"), available: true },

  // Drinks
  { id: "m27", categoryId: "c8", name: "Ocha (Green Tea)", nameJa: "お茶", description: "Hot sencha green tea, unlimited refills.", price: 4, image: img("photo-1564890369478-c89ca6d9cde9"), available: true },
  { id: "m28", categoryId: "c8", name: "Ramune", nameJa: "ラムネ", description: "Japanese marble soda — original flavor.", price: 8, image: img("photo-1583064313643-4b3a4a2ed9b5"), available: true },
  { id: "m29", categoryId: "c8", name: "Sake (Hot, small)", nameJa: "日本酒", description: "House junmai, served warm.", price: 28, image: img("photo-1616146288608-55954e6a6fff"), available: true },
  { id: "m30", categoryId: "c8", name: "Asahi Super Dry", nameJa: "アサヒ", description: "330ml bottle.", price: 18, image: img("photo-1608270586620-248524c67de9"), available: true },

  // Desserts
  { id: "m31", categoryId: "c9", name: "Matcha Ice Cream", nameJa: "抹茶アイス", description: "House-made green tea ice cream (2 scoops).", price: 12, image: img("photo-1561845730-208ad5910553"), available: true },
  { id: "m32", categoryId: "c9", name: "Mochi Ice Cream (3 pcs)", nameJa: "餅アイス", description: "Assorted flavors: matcha, strawberry, mango.", price: 10, image: img("photo-1581798459219-306e0f89f5ce"), available: true },
  { id: "m33", categoryId: "c9", name: "Dorayaki", nameJa: "どら焼き", description: "Fluffy pancakes filled with sweet red bean paste.", price: 12, image: img("photo-1578985545062-69928b1d9587"), available: true },
];

export const mockOrders: Order[] = [
  {
    id: "ORD-1042",
    tableNumber: "T-07",
    items: [
      { itemId: "m12", name: "Tonkotsu Ramen", quantity: 2, priceAtOrder: 26 },
      { itemId: "m21", name: "Gyoza (5 pcs)", quantity: 1, priceAtOrder: 14 },
      { itemId: "m27", name: "Ocha", quantity: 2, priceAtOrder: 4 },
    ],
    subtotal: 74,
    serviceCharge: 7.4,
    tax: 4.44,
    total: 85.84,
    status: "preparing",
    paymentStatus: "paid",
    paymentMethod: "card",
    createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: "ORD-1043",
    tableNumber: "T-03",
    items: [
      { itemId: "m3", name: "Chef's Sashimi Platter", quantity: 1, priceAtOrder: 88 },
      { itemId: "m29", name: "Sake (Hot, small)", quantity: 1, priceAtOrder: 28 },
    ],
    subtotal: 116,
    serviceCharge: 11.6,
    tax: 6.96,
    total: 134.56,
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "grabpay",
    createdAt: new Date(Date.now() - 1 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60_000).toISOString(),
  },
  {
    id: "ORD-1044",
    tableNumber: "T-11",
    items: [
      { itemId: "m24", name: "Chef's Bento", quantity: 1, priceAtOrder: 42 },
      { itemId: "m26", name: "Salmon Teriyaki Bento", quantity: 1, priceAtOrder: 36 },
      { itemId: "m31", name: "Matcha Ice Cream", quantity: 2, priceAtOrder: 12 },
    ],
    subtotal: 102,
    serviceCharge: 10.2,
    tax: 6.12,
    total: 118.32,
    status: "ready",
    paymentStatus: "paid",
    paymentMethod: "card",
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 30_000).toISOString(),
  },
  {
    id: "ORD-1041",
    tableNumber: "T-02",
    items: [
      { itemId: "m9", name: "Chicken Teriyaki Don", quantity: 1, priceAtOrder: 24 },
      { itemId: "m4", name: "California Maki", quantity: 1, priceAtOrder: 18 },
    ],
    subtotal: 42,
    serviceCharge: 4.2,
    tax: 2.52,
    total: 48.72,
    status: "served",
    paymentStatus: "paid",
    paymentMethod: "fpx",
    createdAt: new Date(Date.now() - 28 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60_000).toISOString(),
  },
];

export function getItemById(id: string) {
  return menuItems.find((m) => m.id === id);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}
