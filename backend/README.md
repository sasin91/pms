<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

NestJS patient API with Passport local login, Passport JWT bearer
authentication, and role-based authorization.

Set a strong signing secret before running in production:

```bash
export JWT_SECRET='replace-with-a-long-random-secret'
export JWT_EXPIRES_IN='1h'
```

For local development only, the application uses a built-in development
secret when `JWT_SECRET` is absent. Startup fails if it is absent while
`NODE_ENV=production`. `JWT_EXPIRES_IN` accepts durations supported by
`jsonwebtoken`, such as `15m`, `1h`, or `7d`, and defaults to `1h`.

### Seeded accounts

| Email | Password | Role | Associated patient |
| --- | --- | --- | --- |
| `admin@example.com` | `admin-password` | `admin` | none |
| `alice@example.com` | `user-password` | `user` | `patient-1` |
| `bob@example.com` | `user-password` | `user` | `patient-2` |

Users and patients are persisted in PostgreSQL through Prisma.

### API

Interactive Swagger documentation is available at `/docs`; the OpenAPI JSON
document is available at `/docs-json`.

Request DTOs use `class-validator`. Unknown properties and invalid field
formats return `400 Bad Request`.

Log in with `POST /auth/login`:

```json
{
  "email": "alice@example.com",
  "password": "user-password"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "email": "alice@example.com",
    "role": "user"
  }
}
```

Send the token on protected requests:

```text
Authorization: Bearer <token>
```

| Method | Route | Request | Response | Access |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | `{ email, password }` | `{ token, user: { email, role } }` | Any |
| `GET` | `/patients?page=1&limit=10` | — | `{ data: Patient[], page, limit, total }` | Admin/User |
| `GET` | `/patients/:id` | — | `Patient` | Admin/User |
| `POST` | `/patients` | `Patient` fields | `Patient` | Admin only |
| `PUT` | `/patients/:id` | Complete `Patient` fields | `Patient` | Admin only |
| `DELETE` | `/patients/:id` | — | `{ ok: true }` | Admin only |

Users can only read their associated patient. Missing or invalid authentication
returns `401`; insufficient role or patient access returns `403`.

### Resilience simulation

Latency and transient failures are opt-in so normal development and tests stay
deterministic:

```bash
export API_SIMULATION_ENABLED=true
export API_MIN_LATENCY_MS=100
export API_MAX_LATENCY_MS=500
export API_FAILURE_RATE=0.05
```

Each request waits for a random duration in the configured range. The failure
rate is a value from `0` to `1`; simulated failures return `503 Service
Unavailable`.

## Project setup

```bash
$ npm install
```

### Database schema

The PostgreSQL schema is defined in `prisma/schema.prisma`. It contains:

- `User`, with a unique email, bcrypt password hash, and `admin | user`
  role.
- `Patient`, matching the patient API fields.
- An optional one-to-one association from a user to a patient.

Generate the Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
