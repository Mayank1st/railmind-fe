import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "access_token";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RailMind — AI Railway Reservation",
  description: "Book trains with AI-powered waitlist predictions",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialAuthed = Boolean(cookieStore.get(AUTH_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${ibmPlexSans.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <AuthProvider initialAuthed={initialAuthed}>
            <Navbar />
            {children}
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
