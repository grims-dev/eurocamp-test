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

NOTE: There was a fair bit of setup involved so I went way over the time limit, but I wanted to put some stuff in so I instructed Claude to finish some of the remaining TODO's (**Commits prepended with `[AI assisted]`, everything else is me!**).

### Running it

```
npm install
npx nx serve api-client # http://localhost:3333/api
```

Tests and lint:

```
npx nx run-many --target=test --projects=api-client
npx nx run-many --target=lint --projects=api-client
```


### Backend

I decided to go with a HttpClient service in a new api-client app, as a single chokepoint for all HTTP requests for Booking/Parcs/Users and any future domains. Implemented some best practices around handling the flaky APIs - Backoffs (exponential + jitter), caching for gets, retries for idempotent methods. Went with standard fetch to implement some stuff myself/not install more dependencies.

Then added a module per resource with the full set of endpoints, each importing `HttpClientModule`.

### Frontend

Not built - I had already run over time. I would have done Next.js pointed at my api-client app, so the retries, caching and error handling already live server side and the browser only ever talks to something stable. Use Server Components for the initial read, Tanstack Query for interactive bits. Use the ApiError error form to help dictate the client's actions on what data is shown.
