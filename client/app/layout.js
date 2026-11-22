import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const font = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700", "800"] });

export const metadata = { title: "Mock Interviewer", description: "Practice interviews with AI feedback" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
