with source as (
    select * from {{ source('raw', 'orders') }}
)

select
    cast(order_id as varchar) as order_id,
    cast(customer_id as varchar) as customer_id,
    cast(order_date as timestamp) as order_date,
    cast(total_amount as double) as total_amount,
    cast(status as varchar) as status
from source
