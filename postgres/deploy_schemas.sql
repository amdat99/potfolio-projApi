-- Deploy fresh db tables 
\i '/docker-entrypoint-initdb.d/tables/messages.sql'


\i '/docker-entrypoint-initdb.d/tables/seed.sql'