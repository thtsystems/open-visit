import { relations } from "drizzle-orm";
import { pgTable, varchar, bigint, uuid, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

/**
 * Used to handle authentication.
 *
 * Represents the relationship between a user and a reference to that user
 * (eg. email, username)
 *
 * @see: https://lucia-auth.com/basics/keys
 */
export const userKey = pgTable("user_key", {
  id: varchar("id").primaryKey().notNull().unique(),
  password: varchar("hashed_password"),

  // Referential columns
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
});

export const userType = pgEnum("user_type", ["EMPLOYEE", "CONDOMINIUM"]);

/** Used to handle authentication.
 *
 * Allows the authentication helpers to keep track of requests made by users.
 * These are created on login, validated on each request, and deleted on signout
 * (or other account sensitive operations)
 *
 * @see: https://lucia-auth.com/basics/sessions
 */
export const userSession = pgTable("user_session", {
  id: varchar("id").primaryKey().notNull().unique(),
  activeExpires: bigint("active_expires", { mode: "number" }).notNull(),
  idleExpires: bigint("idle_expires", { mode: "number" }).notNull(),

  // Referential columns
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
});

/**
 * The primary entrypoint to the platform, the user can be an administrative user
 * from the condominium, or one of many company employees.
 *
 * The user will reference either a condominium, or an employee, based on the `user_type`.
 * This will be used by the client to correctly redirect the user to the correct parts
 * of the application based on the application type.
 */
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom().notNull().unique(),
  email: varchar("email").notNull(),
  userType: userType("user_type").notNull(),
});
export const usersRelations = relations(user, ({ one }) => ({
  condominium: one(condominium, {
    fields: [user.id],
    references: [condominium.userId],
  }),
  employee: one(employee, {
    fields: [user.id],
    references: [employee.userId],
  }),
}));

/**
 * The company is a direct descendent of the condominium (one condominium
 * can have many companies within).
 */
export const company = pgTable("company", {
  id: uuid("id").defaultRandom().primaryKey().notNull().unique(),
  name: varchar("name").notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull(),
  condominiumAddress: varchar("condominium_address"),
  active: boolean("active").notNull().default(true),

  condominiumId: uuid("condominium_id").references(() => condominium.id),
});
export const companyRelationships = relations(company, ({ one, many }) => ({
  condominium: one(condominium, {
    fields: [company.condominiumId],
    references: [condominium.id],
  }),
  employees: many(employee),
  departments: many(department),
  schedulings: many(scheduling),
}));

/**
 * The condominium is parent to companies, and the metadata here is
 * used when the `user.user_type = "CONDOMINIUM"`.
 */
export const condominium = pgTable("condominium", {
  id: uuid("id").defaultRandom().primaryKey().notNull().unique(),
  name: varchar("name").notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull().unique(),
  address: varchar("address").notNull(),
  city: varchar("city").notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  cep: varchar("cep", { length: 8 }).notNull(),

  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
});
export const condominiumRelationships = relations(condominium, ({ many, one }) => ({
  companies: many(company),
  schedulings: many(scheduling),
}));

/**
 * The employee is one of many collaborators that can be contained within
 * one company. The metadata here is used when the `user.user_type = "EMPLOYEE".
 */
export const employee = pgTable("employee", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phoneNumber: varchar("phone_number", { length: 14 }).notNull(),

  // Referential columns
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => department.id),
});
export const employeeRelationships = relations(employee, ({ one }) => ({
  company: one(company, {
    fields: [employee.companyId],
    references: [company.id],
  }),
  department: one(department, {
    fields: [employee.departmentId],
    references: [department.id],
  }),
}));

/** The department is an organizational unit within one company.
 *
 * The information in here is only used by the company administrators in order
 * to see which departments have schedulings.
 */
export const department = pgTable("department", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),

  // Referential columns
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id),
});
export const departmentRelationships = relations(department, ({ one, many }) => ({
  company: one(company, {
    fields: [department.companyId],
    references: [company.id],
  }),
  employee: many(employee),
}));

/**
 * Represents an scheduling event between a company and a condominium, and
 * contains metadata about the visitor and timeframe for that scheduling.
 */
export const scheduling = pgTable("scheduling", {
  id: uuid("id").defaultRandom().primaryKey(),
  startTime: timestamp("start_time", { withTimezone: false }).notNull(),
  endTime: timestamp("end_time", { withTimezone: false }).notNull(),
  visitorName: varchar("visitor_name").notNull(),
  subject: varchar("subject"),
  vehicleType: varchar("vehicle_type").notNull(),
  vehicleLicencePlate: varchar("vehicle_license_plate").notNull(),

  // Referential columns
  condominiumId: uuid("condominium_id")
    .notNull()
    .references(() => condominium.id),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id),
});
export const schedulingRelationshipts = relations(scheduling, ({ one }) => ({
  condominium: one(condominium, {
    fields: [scheduling.condominiumId],
    references: [condominium.id],
  }),
  company: one(company, {
    fields: [scheduling.companyId],
    references: [company.id],
  }),
}));
