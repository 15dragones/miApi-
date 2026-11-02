# Database schema

`schema.sql` recreates the MySQL database structure used by the inventory API.
It creates the five tables and their relationships, but intentionally contains
no users, passwords, JWT secrets, or real inventory records.

## Import with HeidiSQL

1. Open a connection to the local MySQL server.
2. Open `schema.sql` in the query editor and execute the whole file.
3. Confirm that `bdinventario` contains `Categorias`, `Proveedores`, `Usuarios`,
   `Productos`, and `Movimientos`.
4. Configure the matching database connection in `miApi/.env`.
5. Start the API. Register the first user in the application; the first account
   receives the Administrator role.

The script uses `CREATE TABLE IF NOT EXISTS` and does not delete or overwrite
existing rows. It is intended for creating a fresh database; it does not repair
or migrate the structure of an existing database.
