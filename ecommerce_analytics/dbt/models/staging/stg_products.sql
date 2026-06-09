with source as (
    select * from {{ source('raw', 'products') }}
)

select
    cast(product_id as varchar) as product_id,
    cast(product_name as varchar) as product_name,
    cast(category as varchar) as category,
    cast(price as double) as price,
    cast(stock_quantity as integer) as stock_quantity
from source
