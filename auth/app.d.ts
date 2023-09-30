// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("./auth.ts").Auth;
  type DatabaseUserAttributes = {
    email: string;
  };
  type DatabaseSessionAttributes = {};
}
