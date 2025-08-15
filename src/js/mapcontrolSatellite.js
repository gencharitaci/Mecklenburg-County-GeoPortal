export default class AerialToggle {
  constructor({ placeUnder = "water_name_line" }) {
    this._placeUnder = placeUnder;
  }

  /**
   * @param {{ getLayer: (arg0: string) => any; removeLayer: (arg0: string) => void; removeSource: (arg0: string) => void; addSource: (arg0: string, arg1: { type: string; tiles: string[]; tileSize: number; maxzoom: number; }) => void; addLayer: (arg0: { id: string; type: string; source: string; maxzoom: number; }, arg1: string) => void; }} map
   */
  onAdd(map) {
    this._map = map;
    let _this = this;

    this._btn = document.createElement("button");
    this._btn.className = "maplibregl-ctrl-icon maplibregl-ctrl-aerial";
    this._btn.type = "button";
    this._btn.setAttribute("aria-label", "toggle satellite imagery");
    this._btn.onclick = function() {
      if (map.getLayer('satellite')) {
        map.removeLayer('satellite')
        map.removeSource('satellite')
        _this._btn.classList.remove("maplibregl-ctrl-aerial-active")
      } else {
        map.addSource("satellite", {
          type: "raster",
          tiles: [
            `${import.meta.env.VITE_AERIALS}`
          ],
          tileSize: 256,
          maxzoom: 19
        })
        map.addLayer(
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
            maxzoom: 22
          },
          "Pavement marking/U-turn"
        )
        _this._btn.classList.add("maplibregl-ctrl-aerial-active")
      }

    };

    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
