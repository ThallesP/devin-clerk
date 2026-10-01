import Link from "next/link";
import { appConfig } from "@/app.config";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function Header() {
  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>{appConfig.emoji}</span>
          {appConfig.name}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="hover:text-accent">
            Dashboard
          </Link>
          <Link href="/library" className="hover:text-accent">
            Library
          </Link>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="hover:text-accent">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-full bg-accent px-4 py-2 text-white hover:opacity-90">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
