with source as (
    select * from read_csv_auto('../data/raw_customers.csv')
)

select
    cast(customer_id as varchar) as customer_id,
    cast(join_date as date) as join_date,
    cast(age as integer) as age,
    cast(gender as varchar) as gender,
    cast(country as varchar) as country,
    cast(acquisition_channel as varchar) as acquisition_channel
from source