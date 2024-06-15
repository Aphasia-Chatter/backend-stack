import path from 'path'
import {dirname} from 'path'

const __dirname = dirname("");

/**
 * Returns the path to the top-level directory of the current module.
 * Useful if you want to navigate to top-level directory to access asset files.
 *
 * @return {string} The path to the top-level directory.
 */
export function getTopLevelDirectory(){
    return path.join(__dirname, '../../');
}