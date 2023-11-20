import { Hono } from "hono";

import { auth } from "./router/auth";
import { condominium } from "./router/condominium";
import { employee } from "./router/employee";
import { companies } from "./router/companies";

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono().basePath("/v1");

// Routes
auth.route("/auth", auth);
app.route("/condominiums", condominium);
app.route("employees", employee);
app.route("companies", companies)

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};
