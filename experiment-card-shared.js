import { TOKENS } from "./design-tokens";
import { hexToRgb } from "./layout-utils";
export const EXPERIMENT_STATUS_STYLES = {
    draft: {
        label: "Draft",
        bgColor: TOKENS.azure50,
        textColor: TOKENS.azure500,
    },
    running: {
        label: "Running",
        bgColor: TOKENS.azure100,
        textColor: TOKENS.azure700,
    },
    paused: {
        label: "Paused",
        bgColor: TOKENS.azure100,
        textColor: TOKENS.azure700,
    },
    completed: {
        label: "Concluded",
        bgColor: TOKENS.azure100,
        textColor: TOKENS.azure700,
    },
    rolled_out: {
        label: "Rolled out",
        bgColor: "#FFF420",
        textColor: TOKENS.textPrimary,
    },
};
export function formatDateForDisplay(dateString) {
    if (!dateString) {
        dateString = new Date().toISOString().split("T")[0];
    }
    try {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    }
    catch (_a) {
        return dateString;
    }
}
export function getExperimentTypeLabel(type) {
    const labels = {
        ab_test: "A/B Test",
        multivariate: "Multivariate",
        feature_flag: "Feature Flag",
        holdout: "Holdout",
        rollout: "Rollout",
    };
    return labels[type] || type;
}
const LUCIDE_STAR_FILLED_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>
</svg>`;
export function createLucideStarFilledIcon(size = 12, color = hexToRgb(TOKENS.azure700)) {
    try {
        const svgNode = figma.createNodeFromSvg(LUCIDE_STAR_FILLED_SVG);
        svgNode.name = "Star Icon";
        const updateFillColors = (node) => {
            if (node.type === "VECTOR" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR" || node.type === "RECTANGLE") {
                const fills = node.fills;
                if (Array.isArray(fills) && fills.length > 0) {
                    node.fills = [{ type: "SOLID", color }];
                }
            }
            else if ("children" in node) {
                for (const child of node.children) {
                    updateFillColors(child);
                }
            }
        };
        updateFillColors(svgNode);
        svgNode.resize(size, size);
        svgNode.fills = [];
        return svgNode;
    }
    catch (e) {
        console.error("Failed to create star icon:", e);
        const fallback = figma.createFrame();
        fallback.name = "Star Icon (fallback)";
        fallback.resize(size, size);
        fallback.fills = [];
        return fallback;
    }
}
