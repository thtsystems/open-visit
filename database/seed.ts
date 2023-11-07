import {Client} from "pg"
import {database} from "./index";
import {company, condominium, employee, department, scheduling} from "./schema"
import {fakerPT_BR as faker} from "@faker-js/faker";

if (!("DATABASE_URL" in process.env))
    throw new Error("DATABASE_URL not found in .env")

async function main() {
    const client = new Client({connectionString: process.env.DATABASE_URL})
    await client.connect()

    const db = database(client)

    const condominiumData: (typeof condominium.$inferInsert)[] = []
    const companyData: (typeof company.$inferInsert)[] = []
    const departmentData: (typeof department.$inferInsert)[] = []
    const employeeData: (typeof employee.$inferInsert)[] = []
    const schedulingData: (typeof scheduling.$inferInsert)[] = []

    // TODO - create a better data structure and seeds for each company
    for (let i = 0; i < 20; i++) {
        const condominiumId = faker.string.uuid()
        condominiumData.push({
            id: condominiumId,
            cnpj: faker.string.numeric({length: 14}),
            name: faker.person.fullName(),
            address: faker.location.streetAddress(),
            cep: faker.location.zipCode(),
            uf: faker.location.state(),
            city: faker.location.city(),
            userId: faker.string.uuid() // TODO - create a user of type condominium for each condominium
        })

        // TODO - Add more companies in a condominium
        const companyId = faker.string.uuid()
        companyData.push({
            id: companyId,
            name: faker.company.name(),
            cnpj: faker.string.numeric({length: 14}),
            active: true,
            cpf: faker.string.numeric({length: 11}),
            condominiumAddress: faker.location.streetAddress(),
            condominiumId: condominiumId
        })

        // TODO - Add more departments for companies
        const departmentId = faker.string.uuid()
        departmentData.push({
            id: departmentId,
            name: faker.commerce.department(),
            companyId: companyId
        })

        // TODO - Add more employees to companies
        employeeData.push({
            id: faker.string.uuid(),
            companyId: companyId,
            departmentId: departmentId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phoneNumber: faker.phone.number(),
            userId: faker.string.uuid() // TODO - create a user of type employee for each employee
        })

        // TODO - Add more schedules into for employees and companies
        schedulingData.push({
            id: faker.string.uuid(),
            companyId: companyId,
            condominiumId: condominiumId,
            visitorName: faker.person.fullName(),
            vehicleLicencePlate: faker.vehicle.vrm(),
            vehicleType: faker.vehicle.type(),
            startTime: faker.date.anytime(), // TODO - Better startTIme and endTime timestamps
            endTime: faker.date.anytime(),
            subject: "Talk about " + faker.science.chemicalElement()
        })
    }

    console.log("Start seeding")

    console.log("Condominium seed - Start")
    await db.insert(condominium).values(condominiumData)
    console.log("Condominium seed - End")

    console.log("Company seed - Start")
    await db.insert(company).values(companyData)
    console.log("Company seed - End")

    console.log("Departments seed - Start")
    await db.insert(department).values(departmentData)
    console.log("Departments seed - End")

    console.log("Employees seed - Start")
    await db.insert(employee).values(employeeData)
    console.log("Employees seed - End")

    console.log("Schedules seed - Start")
    await db.insert(scheduling).values(schedulingData)
    console.log("Schedules seed - End")

    console.log("Seeding finished")
}

main();