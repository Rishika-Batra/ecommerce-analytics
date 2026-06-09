with source as (
    select * from {{ source('raw', 'web_events') }}
)

select
    cast(event_id as varchar) as event_id,
    cast(customer_id as varchar) as customer_id,
    cast(session_id as varchar) as session_id,
    cast(event_timestamp as timestamp) as event_timestamp,
    cast(event_type as varchar) as event_type,
    cast(product_id as varchar) as product_id
from source
