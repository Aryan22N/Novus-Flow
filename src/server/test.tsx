// import { corsair } from "./corsair"

// // const main = async () => {
// //     const res = await corsair.withTenant('aryan').googlecalendar.api.calendar.getAvailability({
// //         timeMin: new Date().toISOString(),
// //         timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
// //         timeZone: "Asia/Kolkata",
// //         items: [{ id: "aryan" }]
// //     })
// //     console.log(res)
// // }
// // main()

// const events =
//     await corsair.withTenant('aryan').googlecalendar.api.events.getMany({
//         maxResults: 20,
//         singleEvents: true,
//         orderBy: "startTime",

//     });

// console.log(events.items);

// import express from 'express';
// import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
// import { corsair } from './corsair';

// const app = express();
// app.use(express.json());

// app.use('/mcp', createMcpRouter(() => createBaseMcpServer({ corsair })));

// app.listen(8000, () => console.log('MCP server running on :8000'));
