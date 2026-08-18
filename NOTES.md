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
