"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * @param minval - Min value of the range
 * @param maxval - Max value of the range
 * @param val - Value for color to be calculated
 * @param colors - Array of RGB tuples for color gradients
 */
function convertValuesToHeatmap(minval, maxval, val, colors = [[0, 0, 255], [0, 255, 0], [255, 165, 0], [255, 0, 0]]) {
    if (val < minval || val > maxval) {
        throw `Heatmap value out of range: ${val} - Min: ${minval} Max: ${maxval}`;
    }
    // Determine where the value falls proportionally, scaled by the number of colors given
    const p = (val - minval) / (maxval - minval) * (colors.length - 1);
    // Find lower index of the pair of color indices for the value
    // This is the fractional distance between lower and upper colors
    const whole = ~~p;
    const frac = p % 1;
    // Return the color if it falls on a given color exactly
    if (frac < Number.EPSILON)
        return colors[whole];
    // Otherwise, linerally interpolate it between the whole color and the next one
    let r1, g1, b1, r2, g2, b2;
    [r1, g1, b1] = colors[whole];
    [r2, g2, b2] = colors[whole + 1];
    return [r1 + frac * (r2 - r1), g1 + frac * (g2 - g1), b1 + frac * (b2 - b1)];
}
exports.default = convertValuesToHeatmap;
//# sourceMappingURL=ValuesToHeatmap.js.map