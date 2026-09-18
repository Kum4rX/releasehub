import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPaletteProvider } from "@/components/search/command-palette";
import { ReleaseStoreProvider } from "@/store/release-store";
import { ThemeProvider } from "@/store/theme";
import { Logo } from "@/components/brand/logo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <Logo />
      <div className="max-w-md text-center">
        <p className="text-label text-accent">404</p>
        <h1 className="mt-2 text-h1">Page not found</h1>
        <p className="mt-2 text-body text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/updates">View product updates</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-h2">This page didn't load</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ReleaseStoreProvider>
          <TooltipProvider delayDuration={200}>
            <CommandPaletteProvider>
              {/* Required: nested routes render here. */}
              <Outlet />
              <Toaster position="bottom-right" />
            </CommandPaletteProvider>
          </TooltipProvider>
        </ReleaseStoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
