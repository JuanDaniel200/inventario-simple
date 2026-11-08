CREATE TABLE IF NOT EXISTS productos (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(80) NOT NULL CHECK (length(btrim(nombre)) > 0),
    cantidad integer NOT NULL CHECK (cantidad BETWEEN 0 AND 999999)
);
