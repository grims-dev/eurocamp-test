# Ciaran Grimshaw technical test

Thank you for reviewing my application :)

## Task 1

Created and seeded local DB instance with tables `bookings`, `parcs` and `users`, and checked out the local endpoints in Postman.

First red flag - Using varchar for all the columns. We can improve query performance and optimise storage by using the proper data types.

All of the `id` columns in each table appear to be UUIDs, which should easily use the Postgres builtin UUID type.

There are no indexes other than the default primary keys, I would consider indexes up front for the expected common query paths - These example tables don't have many data columns, but right now I would expect bookings by user and bookings by parcs to be good candidates.

Bookings table:
- Columns `user` and `parc` are assumedly for referencing the associated parc/user, these should also be UUID with foreign keys to the respective table and added constraints for data integrity, eg. automatic insert/delete validation. (Personal preference: I prefer names `user_id` and `park_id`)
- Column `bookingdate` should use a builtin date/time data type for efficient range querying and timezone handling at the DB level.

Users table:
- Column `email` could have a unique constraint for automatic duplicate prevention at DB level.

## Task 2

Back end - More focus on aggressive error handling as part of the design, and resiliency with idempotency keys on writes. Defining explicit schema management with libraries like class-validator or Zod. Also a shift away from cloud-based services serving everything by default, used more as useful tools to support primarily self hosted applications with Kubernetes and consolidation around Postgres on data side.

Front end - Lots of focus on the best ways of retrieving data from the server and managing state. Nextjs and Nuxt support server components for optimising client bundles, better SEO capabilities and speed of rendering. Other libraries like Tanstack Query are now very popular with clean data fetching and handling of staleness, cache, retries, etc.

## Task 3

NOTE: There was a fair bit of setup involved so I went way over the time limit, but I wanted to complete the task so I instructed Claude to finish some of the remaining TODO's (In the Git history, **I prepended commits with "`[AI assisted]`", everything else is me!**).

### Running it

```
docker compose up -d  # the provided API http://localhost:3001
npm install
npx nx serve api-client  # my api client http://localhost:3333/api
npx nx serve frontend  # my frontend http://localhost:4200
```

Tests and lint:

```
npx nx run-many --target=test --projects=api-client
npx nx run-many --target=lint --projects=api-client
```


### Backend

I decided to go with a HttpClient service in a new api-client app, as a single chokepoint for all HTTP requests for Booking/Parcs/Users and any future domains. Implemented some best practices around handling the flaky APIs - Backoffs (exponential + jitter), caching for gets, retries for idempotent methods. Went with standard fetch to implement some stuff myself/not install more dependencies.

Then added a module per resource with the full set of endpoints, each importing `HttpClientModule`.

What I would add next:

- Idempotency keys on writes, so creates could be retried safely instead of being left alone.
- Move the base url, timeouts and retry counts into `ConfigModule`. They are still read from `process.env` with a TODO on them.

### Frontend

Next.js with Tanstack Query, showing the same parcs twice, one with my api-client and the other from the flaky API.

- Each card fetches its own parc, so a failure is isolated to that card.
- Delete is optimistic and rolls back on failure, create is not.
- Server Components would have been the modern preference but I stuck to Next13 with the current version of NX.

One change to the provided API: no parc write was flaky, so I added `FlakeyApiInterceptor(0.5)` to `POST /parcs` to see the create failure path.

What I would add next:

- The other two domains. Only parcs is built, and bookings would want the parc and user names resolving rather than showing raw ids.
- Proper routing. Everything currently sits on the index page - the proper structur would be a route per resource (`/parcs`, `/bookings`, `/users`) with an individual page at `/parcs/[id]`.
- A shared types library so the api-client and frontend compile against the same models, instead of the frontend redeclaring them.
- Frontend tests, mocking components and network requests so we can test happy paths and 502s.

### Example

Screenshot of the front end, with api-client (left col) and flaky API (right col).

![Parc list comparison](docs\parcs-list.png)


### Other notes

Noticed the Docker was trying to transfer a ton of context over on the second load of the container. After a little look, the dockerignore had not specified the `eurocamp-data` DB volume and other build/install-related folders like `node_modules`, so the build context was roughly 700mb in total. Updated .dockerignore to ignore these and it now composes quickly.
