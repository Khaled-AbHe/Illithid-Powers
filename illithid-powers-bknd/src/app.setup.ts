import { INestApplication, ValidationPipe } from "@nestjs/common";

/** Shared by main.ts and the e2e tests so both run with identical behaviour. */
export function configureApp(app: INestApplication) {
  const trust = process.env.TRUST_PROXY;
  if (trust) {
    app
      .getHttpAdapter()
      .getInstance()
      .set("trust proxy", /^\d+$/.test(trust) ? Number(trust) : trust);
  }
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type, Accept, Authorization",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
