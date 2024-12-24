import { User } from "./types";
import { Hono } from "hono";


export const apiUsers = new Hono<{ Bindings: Env }>()

apiUsers.get('/', async (c) => {
    const limit = parseInt(c.req.query("size") || '120')
    const offset = (parseInt(c.req.query("page") || '1') - 1) * limit   
    const email = c.req.query("email") || ''

    const db = c.env.DB;
    const q = `SELECT * FROM users LIMIT ?1 OFFSET ?2`
    const users = await db.prepare(q).bind(limit, offset).all<User>();
    return c.json(users.results)
})

apiUsers.post("/", async (c) => {
    const body = await c.req.json<User>();
    body.id = crypto.randomUUID();
    body.active_ts = Math.floor(Date.now() / 1000);
    if (body.expire_ts < 3600) {
        body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
    }
    const db = c.env.DB;
    // language=SQL format=false
    const q = `INSERT INTO users (id,email,available_kb,expire_ts,active_ts) VALUES (?,?,?,?,?)`
    await db.prepare(q).bind(body.id, body.email,  body.available_kb, body.expire_ts, body.active_ts).run();
    return c.json(body)
})


apiUsers.patch("/", async (c) => {
    const body = await c.req.json<User>();
    body.active_ts = Math.floor(Date.now() / 1000);
    if (body.expire_ts < 3600) {
        body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
    }
    const db = c.env.DB;

    // language=SQL format=false
    const q = `UPDATE users SET email=?,available_kb=?,expire_ts=? WHERE id=?`
    await db.prepare(q).bind(body.email, body.available_kb, body.expire_ts, body.id).run();
    return c.json(body)
})



apiUsers.delete("/", async (c) => {
    const body = await c.req.json<User>();
    const db = c.env.DB;

    // language=SQL format=false
    const q = `DELETE FROM users WHERE id=?`
    await db.prepare(q).bind(body.id).run();
    return c.json(body)
})
