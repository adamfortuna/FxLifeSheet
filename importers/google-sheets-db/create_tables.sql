-- DDL generated by Postico 1.5.8
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE raw_data (
    id SERIAL PRIMARY KEY,
    timestamp bigint,
    "YearMonth" int,
    "YearWeek" int,
    "Year" smallint,
    "Quarter" smallint,
    "Month" smallint,
    "Day" smallint,
    "Hour" smallint,
    "Minute" smallint,
    "Week" smallint,
    "Key" text,
    "Question" text,
    "type" text,
    "value" text
);

-- DDL generated by Postico 1.5.8
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE last_run (
    id SERIAL PRIMARY KEY,
    command text,
    last_run bigint,
    last_message bigint
);


-- View needed for metrics

create or replace function cast_to_int(text) returns integer as $$
begin
    -- Note the double casting to avoid infinite recursion.
    return cast($1::varchar as integer);
exception
    when invalid_text_representation then
        return 0;
end;
$$ language plpgsql immutable;

create or replace function cast_to_float(text) returns float as $$
begin
    -- Note the double casting to avoid infinite recursion.
    return cast($1::varchar as integer);
exception
    when invalid_text_representation then
        return 0;
end;
$$ language plpgsql immutable;

CREATE VIEW raw_data_for_metabase AS
  SELECT *,
  cast_to_int(value) AS valueAsInt,
  cast_to_float(value) AS valueAsFloat
  FROM raw_data
