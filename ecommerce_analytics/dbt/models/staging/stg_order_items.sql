with source as (
    select * from {{ source('raw', 'order_items') }}
)

select
    cast(item_id as varchar) as item_id,
    cast(order_id as varchar) as order_id,
    cast(product_id as varchar) as product_id,
    cast(quantity as integer) as quantity,
    cast(price as double) as price
from source
