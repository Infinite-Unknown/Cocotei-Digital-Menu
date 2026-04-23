import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-store";

export const metadata: Metadata = {
  title: "Cocotei — Tokyo Japanese Cuisine",
  description: "Scan. Order. Enjoy. — Digital menu for Cocotei 日本料理.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
