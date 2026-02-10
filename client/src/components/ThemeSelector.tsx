import { useTheme, COLOR_THEME_OPTIONS, type ColorTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSelector() {
  const { theme, toggleTheme, switchable, colorTheme, setColorTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Dark Mode Toggle */}
      {switchable && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
      )}

      {/* Color Theme Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-current"
              style={{
                backgroundColor: `var(--color-primary, #6366f1)`,
              }}
            />
            Theme
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={colorTheme} onValueChange={(value) => setColorTheme(value as ColorTheme)}>
            {COLOR_THEME_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{
                      backgroundColor: getThemeColor(option.value),
                    }}
                  />
                  {option.label}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getThemeColor(theme: ColorTheme): string {
  const colors: Record<ColorTheme, string> = {
    default: "#6366f1",
    blue: "#3b82f6",
    green: "#10b981",
    orange: "#f97316",
    red: "#ef4444",
    rose: "#f43f5e",
    violet: "#a855f7",
    yellow: "#eab308",
  };
  return colors[theme];
}
