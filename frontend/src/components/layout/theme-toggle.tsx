import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/store/theme";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} theme`}
        >
          {resolved === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{resolved === "dark" ? "Light theme" : "Dark theme"}</TooltipContent>
    </Tooltip>
  );
}

export const themeIcons = { light: Sun, dark: Moon, system: Monitor };
