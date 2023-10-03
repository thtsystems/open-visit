import {pgTable, varchar, bigint, uuid, timestamp} from "drizzle-orm/pg-core";

/**
 * Used to handle authentication.
 *
 * Represents the relationship between a user and a reference to that user
 * (eg. email, username)
 *
 * @see: https://lucia-auth.com/basics/keys
 */
export const userKey = pgTable("user_key", {
  id: varchar("id").primaryKey().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  password: varchar("hashed_password"),
});

/** Used to handle authentication.
 *
 * Allows the authentication helpers to keep track of requests made by users.
 * These are created on login, validated on each request, and deleted on signout
 * (or other account sensitive operations)
 *
 * @see: https://lucia-auth.com/basics/sessions
 */
export const userSession = pgTable("user_session", {
  id: varchar("id").primaryKey().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  activeExpires: bigint("active_expires", {mode: "number"}).notNull(),
  idleExpires: bigint("idle_expires", {mode: "number"}).notNull(),
});

export const users = pgTable("user", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull(),
  user_type: varchar('user_type').notNull(),
  condominiumId: uuid('condominium_id').notNull().references(() => condominium.id),
  employeeId: uuid('employee_id').notNull().references(() => employee.id)
});


/* Public table schemas */
export const company = pgTable('company', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(),
  cnpj: varchar('cnpj', {length: 14}),
  cpf: varchar('cpf', {length: 11}),
  condominiumAddress: varchar('condominium_address')
})

export const condominium = pgTable('condominium', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(),
  cnpj: varchar('cnpj', {length: 14}).notNull(),
  address: varchar('address').notNull(),
  city: varchar('city').notNull(),
  uf: varchar('uf', {length: 2}).notNull(),
  cep: varchar('cep', {length: 8}).notNull()
})

export const department = pgTable('department', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(),
  companyId: uuid('company_id').notNull().references(() => company.id),
})

export const employee = pgTable('employee', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email'),
  phoneNumber: varchar('phone_number', {length: 14}).notNull(),
  companyId: uuid('company_id').notNull().references(() => company.id),
  departmentId: uuid('department_id').notNull().references(() => department.id)
})

export const scheduling = pgTable('scheduling', {
  id: uuid('id').defaultRandom().primaryKey(),
  startTime: timestamp('start_time', {withTimezone: false}).notNull(),
  endTime: timestamp('end_time', {withTimezone: false}).notNull(),
  visitorName: varchar('visitor_name').notNull(),
  subject: varchar('subject'),
  vehicleType: varchar('vehicle_type').notNull(),
  vehicleLicencePlate: varchar('vehicle_license_plate').notNull(),
  condominiumId: uuid('condominium_id').notNull().references(() => condominium.id),
  companyId: uuid('company_id').notNull().references(() => company.id)
})