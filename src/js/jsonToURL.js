// convert key:value pairs to GET argument
/**
 * @param {{ [x: string]: string | number | boolean; geom_column?: string; columns?: string; limit?: string | number; filter?: string; sort?: string; geom_column_from?: string; geom_column_to?: string; group?: string; }} obj
 */
export default function jsonToURL(obj) {
  return Object.keys(obj)
    .map(i => i + '=' + encodeURIComponent(obj[i]))
    .join('&')
}
