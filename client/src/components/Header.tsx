import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, User } from "lucide-react";
export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/forum", label: "Community" },
    { href: "/finds", label: "Finds Gallery" },
    { href: "/map", label: "Detecting Map" },
    { href: "/wellbeing", label: "Wellbeing" },
    { href: "/events", label: "Events" },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-2xl text-primary">
              DigQuest
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground/80 ${
                  location === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <span className="font-bold text-xl text-primary">DigQuest</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`transition-colors hover:text-foreground/80 ${
                      location === item.href
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="inline-block md:hidden">
              <span className="font-bold text-xl text-primary">DigQuest</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
