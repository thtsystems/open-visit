// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("./auth").Auth;
  type DatabaseUserAttributes = {
    email: string;
    user_type: string;
  };
  type DatabaseSessionAttributes = {};
}
