var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ===== Performance Optimization: Font Loading Cache =====
let loadedFigtreeSemibold = "Semibold";
let fontsLoaded = false; // Cache flag to prevent redundant loads
export function loadFonts() {
    return __awaiter(this, void 0, void 0, function* () {
        // Skip if fonts already loaded (performance optimization)
        if (fontsLoaded)
            return;
        // Always load Inter Regular (default for new text nodes)
        yield figma.loadFontAsync({ family: "Inter", style: "Regular" }).catch(() => { });
        // Always load Figtree Regular
        yield figma.loadFontAsync({ family: "Figtree", style: "Regular" }).catch(() => { });
        // Try to load Semibold, fallback to Medium if not available
        try {
            yield figma.loadFontAsync({ family: "Figtree", style: "Semibold" });
            loadedFigtreeSemibold = "Semibold";
        }
        catch (_a) {
            yield figma.loadFontAsync({ family: "Figtree", style: "Medium" }).catch(() => { });
            loadedFigtreeSemibold = "Medium";
        }
        // Always load Figtree Bold
        yield figma.loadFontAsync({ family: "Figtree", style: "Bold" }).catch(() => { });
        yield figma.loadFontAsync({ family: "Roboto", style: "Regular" }).catch(() => { });
        yield figma.loadFontAsync({ family: "Roboto", style: "Bold" }).catch(() => { });
        fontsLoaded = true; // Mark as loaded
    });
}
export function getLoadedFigtreeSemibold() {
    return loadedFigtreeSemibold;
}
