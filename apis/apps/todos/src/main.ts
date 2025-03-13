import { Logger } from '@nestjs/common';
import { nestInit } from "./nest-init";

async function bootstrap() {
  Logger.log(`CWD: ${process.cwd()}`)
  const app = await nestInit();
  const port = process.env.PORT ?? 3000
  Logger.log(`Server started on port: ${port}`, "Main");
  await app.listen(port);
}
bootstrap();


