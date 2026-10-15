/**
 * Sajtens utseende ur Directus-singletonen Meta: färgtemat. Redaktörerna
 * ändrar det i admin; ändringen syns inom en minut tack vare cachen.
 *
 * Går Directus inte att läsa, eller saknas singletonen, används standard-
 * temat. Utseendet får aldrig hindra en sida från att visas.
 */
import { DEFAULT_THEME, validTheme } from '~/assets/themes'

export default defineEventHandler(async () => {
    try {
        const meta = await cached('meta', async () => {
            const response = await directusRequest('/items/Meta', { fields: 'Theme' })
            return response?.data ?? null
        })
        return { theme: validTheme(meta?.Theme) || DEFAULT_THEME }
    } catch (error) {
        console.warn('Meta kunde inte läsas, standardtemat används:', error?.message)
        return { theme: DEFAULT_THEME }
    }
})
