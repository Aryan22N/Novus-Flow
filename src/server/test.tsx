import { corsair } from "./corsair"

const main = async () => {
    const res = await corsair.withTenant('aryan').gmail.db.threads.list({})
    console.log(res)
}
main()