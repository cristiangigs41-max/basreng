import MapPickerGoogle from './MapPickerGoogle'
import MapPickerEmbed from './MapPickerEmbed'
export { mapsLink } from './MapPickerGoogle'

// Ada VITE_GOOGLE_MAPS_KEY → peta Google interaktif penuh (pin bisa digeser). Kosong → embed Google Maps yang bisa dicari (tanpa key).
export default function MapPicker(props) {
  return import.meta.env.VITE_GOOGLE_MAPS_KEY ? <MapPickerGoogle {...props} /> : <MapPickerEmbed {...props} />
}
