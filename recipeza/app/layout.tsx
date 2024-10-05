import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipeza",
  description:
    "Discover delicious meals with AI, turning your ingredients into culinary creations!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
