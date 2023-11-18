import {database} from "./index";
import {company, condominium, employee, department, scheduling, user, userType} from "./schema"
import {fakerPT_BR as faker} from "@faker-js/faker";
import pg from "pg";

if (!("DATABASE_URL" in process.env))
    throw new Error("DATABASE_URL not found in .env")

function createData(){
    const generateForEach: number = 5;

    const employeeUserData: (typeof user.$inferSelect)[] = []
    const condominiumUserData: (typeof user.$inferSelect)[] = []
    const condominiumData: (typeof condominium.$inferSelect)[] = []
    const companyData: (typeof company.$inferSelect)[] = []
    const departmentData: (typeof department.$inferSelect)[] = []
    const employeeData: (typeof employee.$inferSelect)[] = []
    const schedulingData: (typeof scheduling.$inferSelect)[] = []

    // Create number of user entries for each condominium
    for (let i: number = 0; i < generateForEach; i++){
        condominiumUserData.push({
            id: faker.string.uuid(),
            email: faker.internet.email(),
            userType: userType.enumValues[1]
        })
    }

    // Create a predefined number of entries for each condominium
    condominiumUserData.map(condominiumUser => {
        condominiumData.push({
            id: faker.string.uuid(),
            cnpj: faker.string.numeric({length: 13}),
            name: faker.person.fullName(),
            address: faker.location.streetAddress(),
            cep: faker.location.zipCode({format: "########"}),
            uf: faker.location.state({abbreviated: true}),
            city: faker.location.city(),
            userId: condominiumUser.id
        })
    })

    // Create a predefined number of entries for each condominium
    condominiumData.map(condominium => {
        for(let i: number = 0; i < generateForEach; i++){
            companyData.push({
                id: faker.string.uuid(),
                name: faker.company.name(),
                cnpj: faker.string.numeric({length: 14}),
                active: true,
                cpf: faker.string.numeric({length: 11}),
                condominiumAddress: faker.location.streetAddress(),
                condominiumId: condominium.id
            })
        }
    })

    // Create a predefined number of departments for each company
    companyData.map(company => {
        for(let i: number = 0; i < generateForEach; i++) {
            departmentData.push({
                id: faker.string.uuid(),
                name: faker.commerce.department(),
                companyId: company.id
            })
        }
    })

    // create a predefine number of employees for each company for each department of this company
    companyData.map(company => {
        const departments = departmentData.filter(department => department.companyId === company.id)

        departments.map(department => {

            for(let i: number = 0; i < generateForEach; i++) {
                const employeeUser = {
                    id: faker.string.uuid(),
                    userType: userType.enumValues[0],
                    email: faker.internet.email()
                }
                employeeUserData.push(employeeUser)

                employeeData.push({
                    id: faker.string.uuid(),
                    companyId: company.id,
                    departmentId: department.id,
                    name: faker.person.fullName(),
                    email: faker.internet.email(),
                    phoneNumber: `559${faker.string.numeric(8)}`,
                    userId: employeeUser.id
                })
            }
        })
    })

    // create a scheduling data for each company in a condominium
    condominiumData.map(condominium => {
        const companies = companyData.filter(company => company.condominiumId === condominium.id)

        companies.map(company => {
            const startTime = faker.date.anytime()
            const endTime = new Date(startTime.getSeconds() + 7200)

            for(let i: number = 0; i < generateForEach; i++){
                schedulingData.push({
                    id: faker.string.uuid(),
                    companyId: company.id,
                    condominiumId: condominium.id,
                    visitorName: faker.person.fullName(),
                    vehicleLicencePlate: faker.vehicle.vrm(),
                    vehicleType: faker.vehicle.type(),
                    startTime: startTime,
                    endTime: endTime,
                    subject: "Talk about " + faker.science.chemicalElement().name
                })
            }
        })
    })

    return {
        condominiumData,
        companyData,
        departmentData,
        employeeData,
        schedulingData,
        employeeUserData,
        condominiumUserData
    }
}

async function main() {
    const client = new pg.Client({connectionString: process.env.DATABASE_URL as string})
    await client.connect()

    const db = database(client)

    const {
        condominiumData,
        companyData,
        departmentData,
        employeeData,
        schedulingData,
        employeeUserData,
        condominiumUserData
    } = createData()

    console.log("Start seeding")

    console.log("Condominium users seed - Start")
    await db.insert(user).values(condominiumUserData)
    console.log("Condominium users seed - End")

    console.log("Employees users seed - Start")
    await db.insert(user).values(employeeUserData)
    console.log("Employees users seed - End")

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

    await client.end()
}

main()