import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catatan Kuliah",
  description: "Aplikasi pencatat materi kuliah - Knowledge Management & Task Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Script id="sanitize-bis-attributes" strategy="beforeInteractive">
          {`(() => {
  const ATTR = "bis_skin_checked";

  const sanitizeAll = () => {
    document.querySelectorAll(
      "[" + ATTR + "]"
    ).forEach((node) => {
      node.removeAttribute(ATTR);
    });
  };

  const sanitizeNode = (node) => {
    if (!(node instanceof Element)) return;

    if (node.hasAttribute(ATTR)) {
      node.removeAttribute(ATTR);
    }

    node.querySelectorAll("[" + ATTR + "]").forEach((child) => {
      child.removeAttribute(ATTR);
    });
  };

  sanitizeAll();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === ATTR &&
        mutation.target instanceof Element
      ) {
        mutation.target.removeAttribute(ATTR);
      }

      mutation.addedNodes.forEach((addedNode) => {
        sanitizeNode(addedNode);
      });
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [ATTR],
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sanitizeAll, { once: true });
  }
})();`}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
