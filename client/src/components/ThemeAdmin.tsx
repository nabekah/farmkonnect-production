import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RotateCcw } from "lucide-react";

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontFamily: string;
  fontSize: string;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  borderColor: "#e5e7eb",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
};

export default function ThemeAdmin() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [isSaving, setIsSaving] = useState(false);

  const handleColorChange = (key: keyof ThemeConfig, value: string) => {
    setTheme({ ...theme, [key]: value });
    applyTheme({ ...theme, [key]: value });
  };

  const handleTextChange = (key: keyof ThemeConfig, value: string) => {
    setTheme({ ...theme, [key]: value });
    applyTheme({ ...theme, [key]: value });
  };

  const applyTheme = (newTheme: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", newTheme.primaryColor);
    root.style.setProperty("--color-secondary", newTheme.secondaryColor);
    root.style.setProperty("--color-accent", newTheme.accentColor);
    root.style.setProperty("--color-background", newTheme.backgroundColor);
    root.style.setProperty("--color-text", newTheme.textColor);
    root.style.setProperty("--color-border", newTheme.borderColor);
    root.style.setProperty("--font-family", newTheme.fontFamily);
    root.style.setProperty("--font-size", newTheme.fontSize);
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem("farmkonnect-theme", JSON.stringify(theme));
      // In a real app, you'd call a tRPC mutation here to save to the database
      console.log("Theme saved:", theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTheme = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    localStorage.removeItem("farmkonnect-theme");
  };

  const loadTheme = () => {
    const saved = localStorage.getItem("farmkonnect-theme");
    if (saved) {
      const loadedTheme = JSON.parse(saved);
      setTheme(loadedTheme);
      applyTheme(loadedTheme);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Theme Customization</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetTheme}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSaveTheme} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Theme
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Primary Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
                <p className="text-xs text-gray-500">Used for buttons, links, and primary elements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Secondary Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    placeholder="#10b981"
                  />
                </div>
                <p className="text-xs text-gray-500">Used for success states and secondary actions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Accent Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.accentColor}
                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                    placeholder="#f59e0b"
                  />
                </div>
                <p className="text-xs text-gray-500">Used for warnings and highlights</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Background Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.backgroundColor}
                    onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
                <p className="text-xs text-gray-500">Main background color</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => handleColorChange("textColor", e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.textColor}
                    onChange={(e) => handleColorChange("textColor", e.target.value)}
                    placeholder="#1f2937"
                  />
                </div>
                <p className="text-xs text-gray-500">Primary text color</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Border Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.borderColor}
                    onChange={(e) => handleColorChange("borderColor", e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={theme.borderColor}
                    onChange={(e) => handleColorChange("borderColor", e.target.value)}
                    placeholder="#e5e7eb"
                  />
                </div>
                <p className="text-xs text-gray-500">Borders and dividers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Font Family</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <select
                  value={theme.fontFamily}
                  onChange={(e) => handleTextChange("fontFamily", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                  <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
                  <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
                <p className="text-xs text-gray-500">Choose the primary font for the application</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Base Font Size</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={parseInt(theme.fontSize)}
                    onChange={(e) => handleTextChange("fontSize", `${e.target.value}px`)}
                    min="12"
                    max="20"
                    step="1"
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
                <p className="text-xs text-gray-500">Base font size for the application</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  borderColor: theme.borderColor,
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontSize,
                }}
              >
                <h3 className="text-xl font-bold mb-2">Preview Heading</h3>
                <p className="mb-4">This is how your application text will look with the current theme settings.</p>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded font-medium text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded font-medium text-white"
                    style={{ backgroundColor: theme.secondaryColor }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded font-medium text-white"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>

              <Card style={{ borderColor: theme.borderColor }}>
                <CardHeader>
                  <CardTitle style={{ color: theme.primaryColor }}>Card Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>This card demonstrates how your theme colors will appear in the application interface.</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
