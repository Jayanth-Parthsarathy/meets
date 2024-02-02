export const corsOptions = {
  origin: process.env.FRONTEND_URL!,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
