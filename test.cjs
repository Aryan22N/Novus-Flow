const { Redis } = require("@upstash/redis");
require("dotenv").config({ path: "d:/Final Projects/superman/superman_clone/.env" });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
async function run() {
  const keys = await redis.keys("nova:*");
  console.log("Keys:", keys);
}
run();
