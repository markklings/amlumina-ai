import app from './app'
import { env } from './config/env'

app.listen(env.PORT, () => console.log(`Amlumina (Lumi) AI API running on :${env.PORT}`))
