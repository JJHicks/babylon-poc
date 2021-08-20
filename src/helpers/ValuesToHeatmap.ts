
/**
 * 
 * @param minval - Min value of the range
 * @param maxval - Max value of the range
 * @param val - Value for color to be calculated
 * @param colors - Array of RGB tuples for color gradients
 */
export default function convertValuesToHeatmap(minval: number, maxval: number, val: number, colors: Array<[number, number, number]> = [[0, 0, 255], [0, 255, 0], [255, 0, 0]]) : [number, number, number]{

    if(val < minval || val > maxval){
        throw "Heatmap value out of range";
    }

    // Determine where the value falls proportionally, scaled by the number of colors given
    const p = (val - minval) / (maxval - minval) * (colors.length - 1);

    // Find lower index of the pair of color indices for the value
    // This is the fractional distance between lower and upper colors
    const whole = Math.floor(p);
    const frac = p % 1;

    // Return the color if it falls on a given color exactly
    if(frac < Number.EPSILON) return colors[whole];

    // Otherwise, linerally interpolate it between the whole color and the next one
    let r1,g1,b1,r2,g2,b2;
    [r1,g1,b1] = colors[whole];
    [r2,g2,b2] = colors[whole+1];

    return [r1 + frac*(r2-r1), g1 + frac*(g2-g1), b1 + frac*(b2-b1)];
}
